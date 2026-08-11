# Disaster Recovery & Incident Response

Date: 2026-08-05  
Branch: `cursor/disaster-recovery-35b3`  
Constraints: no business-logic / existing success JSON shape changes. Render liveness `GET /api/v1/health` remains always-200.

---

## 1. Added DR capabilities

| Area | What |
|------|------|
| Health probes | Root `GET /health` (200 healthy / 503 unhealthy) with server/DB/Supabase/storage/memory/CPU/uptime/version |
| Readiness | `GET /ready` and `GET /api/v1/ready` — DB + storage |
| Liveness | `GET /live` and `GET /api/v1/liveness` — process only (`/live` under API reserved for live dashboard) |
| Meta | `GET /api/v1/meta` — DEV/STAGE/PROD, version, commit, buildTime |
| Request ID | `X-Request-ID` on every request/response; logged on errors |
| Timeouts | Soft Express deadline (`REQUEST_TIMEOUT_MS`, default 30s); DB statement 30s; pool connect timeout |
| Retry | `withRetry` exponential backoff (max 5); storage listBuckets + DR probes |
| Graceful shutdown | SIGTERM/SIGINT → drain → close pool → exit |
| Process errors | `unhandledRejection` / `uncaughtException` → structured log + ops ingest → exit for restart |
| Logger | DEBUG/INFO/WARN/ERROR; production default WARN+ERROR only |
| Alerts | Existing ops channels + `DR_ALERT_WEBHOOK_URL` + `SENTRY_DSN` hook structure |
| FE outage UI | `ServiceUnavailableScreen` after 3 consecutive network/5xx failures |
| DB reconnect | `resetPool()` on failed probes / ops sampling |

---

## 2. API list (additive)

| Method | Path | Purpose | Status codes |
|--------|------|---------|--------------|
| GET | `/health` | Detailed DR health | 200 / 503 |
| GET | `/ready` | Readiness | 200 / 503 |
| GET | `/live` | Process liveness | 200 |
| GET | `/api/v1/health` | **Unchanged** Render liveness | 200 |
| GET | `/api/v1/warmup` | Unchanged pool warm | 200 |
| GET | `/api/v1/ready` | Readiness under API prefix | 200 / 503 |
| GET | `/api/v1/liveness` | Process liveness (no clash with `/live/*`) | 200 |
| GET | `/api/v1/meta` | Env / version / commit | 200 |

### Example `/health` (healthy)

```json
{
  "status": "healthy",
  "server": "ok",
  "database": "ok",
  "supabase": "ok",
  "storage": "ok",
  "memory": { "usedMb": 412, "totalMb": 512, "pct": 80.5 },
  "cpu": { "pct": 22.1, "load1": 0.4 },
  "uptimeSec": 3600,
  "version": "abc1234",
  "commit": "…",
  "buildTime": "…",
  "env": "PROD",
  "acceptingTraffic": true,
  "timestamp": "…"
}
```

---

## 3. Log structure

JSON lines via `backend/server/utils/logger.ts`:

```json
{
  "level": "error",
  "message": "Unhandled API error",
  "ts": "ISO8601",
  "requestId": "uuid",
  "method": "GET",
  "url": "/api/v1/…",
  "userId": null,
  "ip": "…",
  "stack": "…",
  "durationMs": 123
}
```

| Env | Default levels |
|-----|----------------|
| production | WARN, ERROR |
| development | DEBUG+ |
| Override | `LOG_LEVEL=info` |

---

## 4. Recovery procedures

| Incident | Automatic | Operator |
|----------|-----------|----------|
| Process crash | Render restart via healthCheckPath `/api/v1/health` | Check logs / Admin Ops |
| DB blip | `resetPool` + retry on probe / sampling | Verify Transaction pooler `:6543`, `DATABASE_POOL_MAX` |
| Deploy | SIGTERM graceful drain (`SHUTDOWN_GRACE_MS`) | Wait for new instance healthy |
| Storage blip | `withRetry` on listBuckets; `/ready` 503 until OK | Check Supabase keys / bucket |
| FE API outage | ServiceUnavailableScreen + refresh | Check Render + `/health` |

---

## 5. Ops checklist

1. Admin → Ops dashboard (`/admin/ops`) — CPU/memory/API/errors/alerts  
2. `curl https://HOST/health` and `/ready`  
3. `curl https://HOST/api/v1/meta`  
4. Confirm `X-Request-ID` on any API response  
5. Render healthCheckPath stays **`/api/v1/health`** (not root `/health`)

---

## 6. Sentry / Slack wiring

### Slack / Discord (existing)

Insert into `ops_alert_channels`:

```sql
INSERT INTO ops_alert_channels (channel_type, enabled, config)
VALUES ('slack', TRUE, '{"url":"https://hooks.slack.com/services/…"}');
```

### Env webhook (new)

```
DR_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/…
```

### Sentry (structure ready)

```
SENTRY_DSN=https://…@o….ingest.sentry.io/…
```

Then add `@sentry/node` / `@sentry/react` and call `Sentry.captureException` from `ops/dr-alerts.ts` / FE `chunkLoadRecovery` (stub already logs when DSN set).

---

## 7. Env vars (optional)

| Var | Default | Purpose |
|-----|---------|---------|
| `REQUEST_TIMEOUT_MS` | 30000 | Soft request deadline (0=off) |
| `SHUTDOWN_GRACE_MS` | 15000 | SIGTERM drain window |
| `LOG_LEVEL` | prod=warn | Logger floor |
| `MF_DEPLOY_ENV` | derived | DEV / STAGE / PROD |
| `DR_ALERT_WEBHOOK_URL` | — | Extra alert webhook |
| `SENTRY_DSN` | — | Future SDK |

---

## 8. Postgres PITR drill

See `docs/BACKUP_RESTORE.md` §11. Logical ZIP backups do not replace Supabase Point-in-Time Recovery. Enable PITR on the production project and restore into a **separate** project before attaching Render.

## 9. Further improvements

- Install `@sentry/node` + `@sentry/react` when DSN is live  
- Redis-backed circuit breaker for multi-instance  
- Synthetic uptime checks from outside Render region  
- Chaos tests in CI (DB kill / timeout injection)  

---

## 10. Files touched (high level)

- `backend/server/lifecycle/*`, `middlewares/request-id|timeout|drain-guard`, `utils/logger|with-retry`
- `backend/server/services/dr-health.service.ts`, `routes/probe.routes.ts`
- `frontend/.../ServiceUnavailableScreen`, `apiHealth.store`, axios correlation + outage tracking
- `docs/DISASTER_RECOVERY.md` (this file)
