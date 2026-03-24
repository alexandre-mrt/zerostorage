# ZeroStore

## Overview
REST API gateway + dashboard + SDK for 0G decentralized storage. "Pinata for 0G."

## Structure
```
packages/
  api/       - Hono REST API (Bun runtime, Bun SQLite)
  dashboard/ - React + Vite + TailwindCSS dashboard
  sdk/       - TypeScript SDK (npm: zerostorage)
```

## Stack
- Runtime: Bun
- API: Hono with middleware (auth, rate limit, request ID, security headers)
- DB: Bun SQLite (built-in, no native deps)
- Frontend: React 19, Vite, TailwindCSS
- Storage: 0G Storage via @0gfoundation/0g-ts-sdk + ethers v6
- CI: GitHub Actions
- Tests: 141 tests via bun test

## Commands
- `bun install` - Install all dependencies
- `bun run dev:api` - Start API dev server (port 3000)
- `bun run dev:dashboard` - Start dashboard dev server (port 5173)
- `bun run build` - Build all packages
- `bun test` - Run all tests

## Environment
Copy `.env.example` to `.env` and fill in:
- `ZG_PRIVATE_KEY` - 0G wallet private key (required)
- `ZG_EVM_RPC` - 0G EVM RPC endpoint
- `ZG_INDEXER_RPC` - 0G storage indexer endpoint
- `API_SECRET` - Secret for hashing API keys
- `ADMIN_SECRET` - Admin bootstrap endpoint secret

## Key APIs
- `POST /admin/bootstrap` - Create user + first API key (admin secret required)
- `GET /admin/health` - Health check with version
- `POST /api/v1/files/upload` - Upload file (multipart)
- `GET /api/v1/files/:rootHash` - Download file
- `GET /api/v1/files` - List files (paginated)
- `GET /api/v1/files/stats/summary` - File count and total size
- `DELETE /api/v1/files/:rootHash` - Unpin file
- `GET /api/v1/files/:rootHash/status` - File status
- `POST /api/v1/keys` - Create API key
- `GET /api/v1/keys` - List API keys
- `DELETE /api/v1/keys/:keyId` - Revoke API key
- `GET /api/v1/usage` - Usage stats

## SDK
```typescript
import { ZeroStore } from 'zerostorage';
const store = new ZeroStore({ apiKey: 'zs_xxx' });
await store.upload(file);
await store.list();
await store.ping(); // health check
```
