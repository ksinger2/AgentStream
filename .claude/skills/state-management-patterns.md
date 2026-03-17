---
name: state-management-patterns
description: State management decision framework — local vs global vs server state, when to use each pattern
---

# State Management Patterns

Decision framework for choosing the right state management approach in frontend applications.

## State Categories

| Category | Description | Examples | Lifetime |
|----------|-------------|----------|----------|
| **Local state** | Single component only | Form inputs, toggle visibility, hover | Component mount/unmount |
| **Shared state** | Multiple components need it | Shopping cart, selected filters | Session or page |
| **Server state** | Data from API, may be stale | User list, product data | Cache TTL |
| **URL state** | Reflected in the URL | Search query, pagination, active tab | Navigation |
| **Persistent state** | Survives page refresh | Auth token, theme, preferences | localStorage/cookie |

## Decision Tree

```
Where does the data come from?
├── Server/API → Use SERVER STATE (React Query, SWR, Apollo)
└── Client-only → How many components need it?
    ├── Just one → LOCAL STATE (useState, useReducer)
    └── Multiple → Should it be in the URL?
        ├── YES → URL STATE (search params, router)
        └── NO → Should it survive refresh?
            ├── YES → PERSISTENT STATE (localStorage + context)
            └── NO → SHARED STATE (context, Zustand, Redux)
```

## Pattern Details

### Local State (useState / useReducer)
```typescript
// Simple toggles, form inputs, component-internal state
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '', email: '' });

// Use useReducer for complex state transitions
const [state, dispatch] = useReducer(reducer, initialState);
```
**Use when**: Only one component cares about this data.
**Don't use when**: You're prop-drilling more than 2 levels.

### Server State (React Query / SWR)
```typescript
// Data fetching with caching, revalidation, optimistic updates
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.getUsers(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: api.createUser,
  onSuccess: () => queryClient.invalidateQueries(['users']),
});
```
**Use when**: Data comes from an API and may be fetched by multiple components.
**Key insight**: Server state is NOT your state — it's a cache of someone else's state.

### URL State
```typescript
// Search, pagination, filters — anything the user should be able to bookmark/share
const [searchParams, setSearchParams] = useSearchParams();
const query = searchParams.get('q') || '';
const page = parseInt(searchParams.get('page') || '1');
```
**Use when**: The state should be shareable via URL or preserved on back/forward navigation.

### Shared State (Context + useReducer)
```typescript
// Good for: theme, auth status, locale — low-frequency changes
const ThemeContext = createContext<ThemeContextType>(defaultTheme);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```
**Use when**: Multiple components need the same data and it changes infrequently.
**Warning**: Context re-renders ALL consumers on every change. Not suitable for frequently-changing data.

### Global State Store (Zustand / Redux / Jotai)
```typescript
// Use when context re-renders are a performance problem
// or state logic is complex with many actions
const useStore = create((set) => ({
  cart: [],
  addItem: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeItem: (id) => set((state) => ({
    cart: state.cart.filter(i => i.id !== id)
  })),
  total: () => get().cart.reduce((sum, item) => sum + item.price, 0),
}));
```
**Use when**: Complex shared state with many actions, performance-sensitive updates.

## Anti-Patterns

### Putting server data in Redux/global store
```typescript
// BAD — duplicating server state in client store
dispatch(setUsers(await fetchUsers())); // Now you have stale data management to build

// GOOD — let React Query manage it
const { data: users } = useQuery(['users'], fetchUsers);
```

### Global state for local concerns
```typescript
// BAD — modal open state in Redux
dispatch(openModal('confirm-delete'));

// GOOD — local state
const [isModalOpen, setIsModalOpen] = useState(false);
```

### Derived state stored separately
```typescript
// BAD — storing computed values
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]); // Derived!
const [totalPrice, setTotalPrice] = useState(0); // Derived!

// GOOD — compute on render
const [items, setItems] = useState([]);
const filteredItems = useMemo(() => items.filter(i => i.active), [items]);
const totalPrice = useMemo(() => items.reduce((s, i) => s + i.price, 0), [items]);
```

## Choosing a Library

| Need | Recommendation |
|------|---------------|
| Just server data | React Query or SWR (no global store needed) |
| Simple shared state | Context + useReducer |
| Complex shared state | Zustand (simplest API) |
| Very complex with middleware | Redux Toolkit (most ecosystem) |
| Atomic/granular updates | Jotai or Recoil |
| Forms | React Hook Form or Formik (don't use global state for forms) |
