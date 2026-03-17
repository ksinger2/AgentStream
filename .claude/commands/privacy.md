# Privacy Review — Data Protection & Compliance Audit

Comprehensive privacy audit to ensure the application properly handles user data, meets compliance requirements, and follows data protection best practices.

## Phase 1: Data Inventory

Map all user data in the system:

1. **Data collection points**: Identify every place the app collects user data
   - Registration forms
   - Profile pages
   - Payment flows
   - Analytics/tracking
   - Third-party integrations
   - Cookies and local storage

2. **Data types collected**: Categorize all data
   - PII (name, email, phone, address)
   - Financial (payment info, billing)
   - Behavioral (analytics, usage patterns)
   - Technical (IP, device info, browser fingerprint)
   - Sensitive (health, biometric, location)

3. **Data storage locations**: Where is each data type stored?
   - Database tables/collections
   - Cache layers
   - Local storage / cookies
   - Third-party services
   - Logs and monitoring

## Phase 2: Data Flow Analysis

Launch the **backend-lead-engineer** and **security-reviewer** agents to trace:

1. **Collection → Storage**: How does data get from the user to storage?
2. **Storage → Processing**: How is stored data used?
3. **Storage → Display**: Where is user data shown back to users?
4. **Storage → Third parties**: What data is shared externally?
5. **Storage → Deletion**: How is data removed when requested?

For each flow, verify:
- Is the data encrypted in transit (HTTPS)?
- Is the data encrypted at rest?
- Is access properly authenticated/authorized?
- Is the minimum necessary data being collected?
- Are there audit logs for data access?

## Phase 3: Compliance Checklist

### GDPR (if serving EU users)
- [ ] Privacy policy exists and is accessible
- [ ] Cookie consent banner implemented
- [ ] User can view all their data (data portability)
- [ ] User can delete their account and all data (right to erasure)
- [ ] User can export their data (right to access)
- [ ] Consent is collected before non-essential data processing
- [ ] Data processing has a legal basis documented
- [ ] Data retention periods defined
- [ ] Third-party data processors documented
- [ ] Data breach notification process defined

### CCPA (if serving California users)
- [ ] "Do Not Sell My Personal Information" option
- [ ] Privacy policy discloses data collection categories
- [ ] User can request data deletion
- [ ] User can opt out of data sale
- [ ] No discrimination for exercising privacy rights

### General Best Practices
- [ ] Data minimization — only collect what's needed
- [ ] Purpose limitation — only use data for stated purpose
- [ ] Storage limitation — delete data when no longer needed
- [ ] Accuracy — users can update their data
- [ ] Integrity — data is protected from unauthorized changes
- [ ] Accountability — data handling is documented

## Phase 4: Code Audit

Search the codebase for privacy concerns:

1. **Logging audit**: Search for `console.log`, `logger`, `print` — ensure no PII is logged
2. **Analytics audit**: Check analytics events for PII leakage
3. **Error reporting**: Ensure error reports don't include user data
4. **Comments/TODOs**: Check for user data in code comments
5. **Test fixtures**: Ensure test data doesn't contain real user data
6. **Local storage**: Audit what's stored in localStorage/sessionStorage/cookies
7. **API responses**: Check for over-fetching (returning more user data than needed)
8. **Search/filtering**: Ensure user data isn't exposed in URL parameters

## Phase 5: Third-Party Audit

Review all external services:

| Service | Data Shared | Purpose | DPA Signed | Privacy Policy |
|---------|------------|---------|------------|---------------|

Check:
- [ ] Data Processing Agreements (DPAs) in place
- [ ] Third parties comply with same privacy standards
- [ ] Data sharing is documented in privacy policy
- [ ] Minimum necessary data shared with each service

## Phase 6: Privacy Report

```
## Privacy Audit Report

### Data Inventory
| Data Type | Collection Point | Storage | Retention | Encrypted |
|-----------|-----------------|---------|-----------|-----------|

### Compliance Status
| Requirement | Status | Gap | Remediation |
|-------------|--------|-----|-------------|

### Code Findings
| # | Severity | File:Line | Issue | Fix |
|---|----------|-----------|-------|-----|

### Third-Party Assessment
| Service | Risk Level | Issues | Action |
|---------|-----------|--------|--------|

### Privacy Risk Score: LOW / MEDIUM / HIGH / CRITICAL

### Priority Actions
1. [Highest priority action]
2. ...

### Recommendations
[Strategic privacy improvements]
```

## Phase 7: Remediation

For each finding:
1. Implement the fix
2. Verify PII is removed/protected
3. Update privacy policy if needed
4. Document the change
