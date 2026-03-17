# Security Review — Comprehensive Security Audit

Full security audit of the codebase using the security-reviewer agent and engineering team.

## Phase 1: Automated Scanning

Run available security tools:
1. **Dependency audit**: `npm audit` / `pip audit` / equivalent for the stack
2. **Secret scanning**: Search for hardcoded secrets, API keys, passwords, tokens in the codebase
   - Search patterns: `password`, `secret`, `api_key`, `apikey`, `token`, `private_key`, `AWS_`, `sk-`, `pk_`
   - Check `.env` files are in `.gitignore`
   - Check no `.env` files are committed in git history
3. **Lint security rules**: Run security-focused lint rules if configured (eslint-plugin-security, bandit, etc.)

## Phase 2: Security Agent Review

Launch the **security-reviewer** agent to audit:
1. OWASP Top 10 vulnerabilities across the entire codebase
2. Authentication and authorization implementation
3. Input validation and sanitization
4. Data encryption (at rest and in transit)
5. Session management
6. Error handling (no sensitive data in error messages)
7. API security (rate limiting, CORS, CSP headers)
8. File upload handling (if applicable)
9. SQL injection / NoSQL injection vectors
10. XSS vectors (stored, reflected, DOM-based)

## Phase 3: Backend Security Review

Launch the **backend-lead-engineer** agent to review:
1. Database security (parameterized queries, no raw SQL, proper permissions)
2. API endpoint authentication — every endpoint checked
3. Authorization — proper permission checks, no IDOR vulnerabilities
4. Rate limiting on sensitive endpoints
5. Request validation and sanitization
6. Secure headers (HSTS, X-Frame-Options, X-Content-Type-Options, CSP)
7. CORS configuration
8. Cookie security (httpOnly, secure, sameSite)

## Phase 4: Frontend Security Review

Launch the **frontend-lead-engineer** agent to review:
1. XSS prevention (no dangerouslySetInnerHTML without sanitization, proper escaping)
2. CSRF protection
3. Sensitive data handling (no tokens in localStorage, no PII in console.log)
4. Third-party script security (SRI, CSP)
5. Secure form handling (autocomplete attributes, input types)
6. Content Security Policy headers
7. Clickjacking protection

## Phase 5: Infrastructure Security

Review deployment and infrastructure:
1. Environment variables — all secrets in env vars, not in code
2. HTTPS enforcement
3. Database connection security (SSL, connection pooling)
4. Docker security (if applicable) — no root user, minimal base image
5. CI/CD security — no secrets in workflow files, proper secret management
6. Dependency pinning — lock files committed, no floating versions

## Phase 6: Security Report

```
## Security Audit Report

### Scan Date: [date]
### Severity Summary
- 🔴 Critical: X
- 🟠 High: X
- 🟡 Medium: X
- 🔵 Low: X
- ℹ️ Informational: X

### Dependency Vulnerabilities
| Package | Severity | CVE | Fix Available |
|---------|----------|-----|---------------|

### Code Vulnerabilities
| # | Severity | Category | File:Line | Description | Remediation |
|---|----------|----------|-----------|-------------|-------------|

### Security Headers
| Header | Status | Recommendation |
|--------|--------|---------------|

### Authentication & Authorization
- [ ] All endpoints require auth (or explicitly marked public)
- [ ] Password hashing uses bcrypt/argon2
- [ ] JWT tokens have reasonable expiry
- [ ] Refresh token rotation implemented
- [ ] Rate limiting on auth endpoints

### Data Protection
- [ ] No secrets in code or git history
- [ ] .env files gitignored
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced
- [ ] No PII in logs

### Verdict: PASS / FAIL / NEEDS REMEDIATION
[Summary and priority actions]
```

## Phase 7: Remediation

For CRITICAL and HIGH findings:
1. Create fix plan for each
2. Implement fixes with security-reviewer agent oversight
3. Re-scan after fixes to verify
4. Only mark complete when re-scan is clean
