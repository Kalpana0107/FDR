# FDRGuard API Contract

Base path: `/api`. JSON in, JSON out. Auth: `Authorization: Bearer <token>`.
The backend must return the same JSON shapes as `frontend/src/mocks/*.js`. When an endpoint is ready, add its key (e.g. `'GET /fdrs'`) to `REAL_ENDPOINTS` in `frontend/src/api/client.js`, or set `VITE_USE_MOCK=false` once all are done.

Errors: `{ "detail": "message" }` with a proper HTTP status.

## Health
`GET /api/health` returns `{ "status": "ok", "service": "...", "version": "..." }` (implemented).

## Auth
`POST /api/auth/login`
- body: `{ "email": "...", "password": "..." }`
- 200: `{ "access_token": "...", "user": { "id", "name", "role", "email" } }`
- roles: `College`, `AICTE Officer`, `Bank Verifier`, `Approver`, `Management/Admin`

## FDRs
`GET /api/fdrs` returns `{ "items": [FDR], "total": n }`. Query: `status`, `institution_id`, `q` (search).

`POST /api/fdrs` (multipart: file + fields) creates an FDR in `Submitted`. Returns FDR plus OCR result and smart-check flags.

`GET /api/fdrs/{id}` returns FDR with documents, history, remarks and checks.

FDR shape:
```json
{
  "id": "fdr_001",
  "fdr_number": "FDR-2025-000101",
  "institution_id": "inst_01",
  "institution_name": "...",
  "bank": "...",
  "amount": 1500000,
  "start_date": "2025-04-01",
  "maturity_date": "2026-04-01",
  "status": "Active",
  "parent_fdr_id": null,
  "verification": { "state": "Verified", "simulated": true }
}
```

`POST /api/fdrs/{id}/transition`
- body: `{ "to_status": "Verified", "remark": "..." }`
- Allowed moves come from the transitions table. Any other jump returns 409.

`POST /api/fdrs/{id}/verify` runs the simulated bank check. If the bank is unreachable it returns `Verification Pending`, never a fake pass.

## Releases (two-person rule)
- `POST /api/releases` College requests release
- `POST /api/releases/{id}/review` reviewer
- `POST /api/releases/{id}/approve` approver (must differ from reviewer; OTP required; no auto-release)

## Dashboard
`GET /api/dashboard/summary` returns totals (renewals counted once), `verification_amounts` (verified / pending / failed), `by_status`, `upcoming_maturities`.

## Duplicates
`GET /api/duplicates` returns cross-college duplicate matches.

## Audit
`GET /api/audit/verify` verifies the hash chain and returns `{ "valid": true, "length": n, "broken_at": null }`.

## Reports
`GET /api/reports/{type}` returns CSV or PDF (pandas / ReportLab).
