# Cost Optimization — Audit for Efficiency and Cost Savings

Comprehensive audit of the project's AI usage, agent workflows, and code patterns to minimize costs while maintaining quality.

## Phase 1: Agent Usage Audit

Review how agents are being used across the project:

1. **Model selection**: Check if any agent definitions in `.claude/agents/` are using `model: opus` where `model: sonnet` would suffice
   - Opus should only be used for: architecture decisions, complex debugging, security review, principal-level decisions
   - Sonnet is sufficient for: code generation, formatting, simple reviews, scaffolding, documentation
   - Haiku is sufficient for: file searches, simple Q&A, status checks, formatting tasks
2. **Agent sprawl**: Identify if multiple agents are doing overlapping work
3. **Unnecessary agent calls**: Check if simple tasks are being delegated to agents when direct tool calls would work

## Phase 2: Context Window Efficiency

Audit context usage:

1. **`.claudeignore` review**: Ensure build artifacts, deps, and generated files are excluded
2. **Large file reads**: Check if agents are reading entire files when they only need specific sections
3. **Redundant reads**: Check if the same files are being read multiple times across agents
4. **CLAUDE.md size**: Ensure it uses `@imports` and stays under 200 lines
5. **Prompt bloat**: Check command/skill files for unnecessary verbosity

## Phase 3: Workflow Efficiency

Audit command workflows for waste:

1. **Parallel vs sequential**: Ensure independent agent tasks run in parallel, not sequentially
2. **Infinite loops**: Check for any patterns that could cause unbounded retries or polling
3. **Redundant verification**: Check if the same checks are running multiple times in a workflow
4. **Over-testing**: Check if trivial changes trigger full test suites when targeted tests would suffice
5. **Batch opportunities**: Identify repetitive operations that could be batched (e.g., multiple file edits, multiple similar agent tasks)

## Phase 4: Code-Level Cost Patterns

If the project uses AI APIs (OpenAI, Anthropic, etc.):

1. **Model selection in code**: Check if expensive models are used where cheaper ones work
2. **Prompt efficiency**: Check for verbose system prompts that could be trimmed
3. **Caching**: Check if identical API calls are being cached
4. **Streaming**: Check if streaming is used where appropriate (better UX, same cost)
5. **Token counting**: Check if there's any token counting/budgeting in place
6. **Retry logic**: Check for exponential backoff vs. aggressive retries

## Phase 5: Infrastructure Cost

1. **Bundle size**: Large bundles = more bandwidth = more cost
2. **Database queries**: N+1 queries, missing indexes, unoptimized joins
3. **Caching strategy**: Are cacheable responses being cached?
4. **CDN usage**: Are static assets served from CDN?
5. **Serverless cold starts**: Are functions optimized for cold start time?

## Phase 6: Report

```
## Cost Optimization Report

### Agent Configuration
| Agent | Current Model | Recommended | Savings |
|-------|--------------|-------------|---------|

### Context Savings
| Issue | Current | Recommended | Token Savings |
|-------|---------|-------------|---------------|

### Workflow Improvements
| Workflow | Issue | Fix | Impact |
|----------|-------|-----|--------|

### Code-Level Findings
| File | Issue | Fix | Impact |
|------|-------|-----|--------|

### Priority Actions (highest savings first)
1. [Action] — [estimated savings]
2. ...

### Total Estimated Impact
- Agent cost reduction: [estimate]
- Context efficiency gain: [estimate]
- Infrastructure savings: [estimate]
```

## Phase 7: Apply Quick Wins

With user approval, apply changes that are:
- Low risk (model downgrades on non-critical agents, .claudeignore additions)
- High impact (loop fixes, caching additions)
- Easy to revert
