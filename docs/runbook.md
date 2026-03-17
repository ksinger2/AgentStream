# {{PROJECT_NAME}} — Operational Runbook

Exact procedures for common production operations. No ambiguity — follow the steps.

## Service Management

### Restart Application
```bash
# Option 1: Process manager (PM2)
pm2 restart <app-name>

# Option 2: Systemd
sudo systemctl restart <service-name>

# Option 3: Docker
docker compose restart <service-name>

# Option 4: Kubernetes
kubectl rollout restart deployment/<deployment-name> -n <namespace>
```

### Check Application Status
```bash
# Health endpoint
curl -sf <BASE_URL>/health | jq .

# Process status
ps aux | grep <process-name>
systemctl status <service-name>
docker ps --filter name=<container>

# Resource usage
top -bn1 | head -20
free -m
df -h
```

### View Logs
```bash
# Application logs
tail -f logs/app.log
docker logs -f <container-name> --tail 100
journalctl -u <service-name> -f --since "1 hour ago"

# Filter errors only
grep -i "error\|fatal\|exception\|panic" logs/app.log | tail -50

# Kubernetes
kubectl logs -f deployment/<name> -n <namespace> --tail 100
```

## Database Operations

### Check Database Connection
```bash
# PostgreSQL
psql -h <host> -U <user> -d <database> -c "SELECT 1;"

# MySQL
mysql -h <host> -u <user> -p<password> -e "SELECT 1;"

# Check connection count
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### Emergency Read-Only Mode
```sql
-- PostgreSQL: set database to read-only
ALTER DATABASE <dbname> SET default_transaction_read_only = on;

-- Revert
ALTER DATABASE <dbname> SET default_transaction_read_only = off;
```

### Slow Query Investigation
```sql
-- PostgreSQL: find active slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Kill a specific query
SELECT pg_cancel_backend(<pid>);
```

## Cache Operations

### Clear Application Cache
```bash
# Redis: flush specific database
redis-cli -n <db-number> FLUSHDB

# Redis: flush all (CAUTION)
redis-cli FLUSHALL

# Redis: delete by pattern
redis-cli --scan --pattern "cache:users:*" | xargs redis-cli DEL
```

### Check Cache Health
```bash
redis-cli PING
redis-cli INFO memory
redis-cli INFO stats | grep hit
```

## Queue Operations

### Check Queue Status
```bash
# Bull (Node.js)
# Check via API or Bull Board UI

# Celery (Python)
celery -A <app> inspect active
celery -A <app> inspect reserved

# RabbitMQ
rabbitmqctl list_queues name messages consumers
```

### Drain/Purge Queue
```bash
# RabbitMQ: purge a specific queue
rabbitmqctl purge_queue <queue-name>

# Redis-based (Bull): use Bull Board or programmatic purge
```

## Incident Response Quick Reference

### Step 1: Assess
- Is the service up? `curl -sf <BASE_URL>/health`
- When did it start? Check monitoring/logs
- What changed? `git log --oneline -5`
- How many users affected? Check error rates

### Step 2: Mitigate
- Can you restart the service? (fixes most transient issues)
- Can you rollback? See [Rollback Procedure](#rollback-procedure)
- Can you enable maintenance mode?
- Can you route traffic away?

### Step 3: Fix or Escalate
- Clear root cause → fix and deploy
- Unclear → escalate (see `docs/oncall-setup.md` for contacts)

### Step 4: Communicate
- Update status page
- Notify stakeholders
- Log incident in `docs/incidents.log`

## Rollback Procedure

```bash
# 1. Find last known good version
git tag --sort=-v:refname | head -5

# 2. Deploy previous version
# Use /rollback command or:
git checkout <previous-tag>
# Run deploy workflow

# 3. Verify
curl -sf <BASE_URL>/health
# Check error rates in monitoring

# 4. If database migration needs rollback
# Run DOWN migration for the most recent migration
# WARNING: Data migrations may not be fully reversible
```

## SSL Certificate Renewal

```bash
# Check certificate expiry
echo | openssl s_client -connect <domain>:443 2>/dev/null | openssl x509 -noout -enddate

# Auto-renew with certbot
sudo certbot renew --dry-run  # Test first
sudo certbot renew            # Actual renewal
```

## Backup & Restore

### Create Backup
```bash
# PostgreSQL
pg_dump -h <host> -U <user> -d <database> -F c -f backup_$(date +%Y%m%d).dump

# MySQL
mysqldump -h <host> -u <user> -p <database> > backup_$(date +%Y%m%d).sql
```

### Restore Backup
```bash
# PostgreSQL
pg_restore -h <host> -U <user> -d <database> -F c backup.dump

# MySQL
mysql -h <host> -u <user> -p <database> < backup.sql
```

### Verify Backup
```bash
# Restore to a test database and verify row counts
pg_restore -h localhost -U test -d test_restore backup.dump
psql -d test_restore -c "SELECT count(*) FROM users;"
```

## Common Issues & Fixes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 502 Bad Gateway | App process crashed | Restart application |
| 503 Service Unavailable | Deploy in progress or overloaded | Wait or scale up |
| Connection refused | Process not running | Start/restart service |
| OOM killed | Memory leak or undersized | Restart + investigate leak |
| Disk full | Logs or temp files | Clean logs, extend disk |
| SSL error | Certificate expired | Renew certificate |
| Slow responses | DB queries or external API | Check slow query log, check dependencies |
