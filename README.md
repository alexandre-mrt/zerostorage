# ZeroStore

[![CI](https://github.com/alexandre-mrt/zerostorage/actions/workflows/ci.yml/badge.svg)](https://github.com/alexandre-mrt/zerostorage/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The fastest way to store files on 0G decentralized storage.**

ZeroStore provides a production-ready REST API, TypeScript SDK, and dashboard for uploading and managing files on [0G Storage](https://0g.ai) - the decentralized storage layer of the 0G AI operating system.

Think **Pinata for 0G**.

## Features

- **REST API** - Simple HTTP endpoints for upload, download, list, and manage files
- **TypeScript SDK** - `npm install zerostorage` and start storing in 3 lines of code
- **Dashboard** - Web UI for file management, API key management, and usage analytics
- **API Key Auth** - Secure access with rate limiting per tier
- **Usage Tracking** - Monitor storage, bandwidth, and API calls

## Quick Start

### 1. Install the SDK

```bash
bun add zerostorage
# or
npm install zerostorage
```

### 2. Upload a file

```typescript
import { ZeroStore } from 'zerostorage';

const store = new ZeroStore({
  apiKey: 'zs_your_api_key',
  baseUrl: 'https://api.zerostorage.dev',
});

// Upload
const file = new File(['Hello 0G!'], 'hello.txt');
const { rootHash } = await store.upload(file);

// Download
const blob = await store.download(rootHash);

// List
const { files } = await store.list({ page: 1, limit: 20 });
```

### 3. Or use cURL

```bash
# Upload
curl -X POST https://api.zerostorage.dev/api/v1/files/upload \
  -H "Authorization: Bearer zs_your_api_key" \
  -F "file=@./myfile.pdf"

# Download
curl https://api.zerostorage.dev/api/v1/files/{rootHash} \
  -H "Authorization: Bearer zs_your_api_key" \
  -o downloaded.pdf
```

## Self-Host

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- A 0G wallet with testnet/mainnet tokens

### Setup

```bash
git clone https://github.com/yourusername/zerostorage.git
cd zerostorage
cp .env.example .env
# Edit .env with your 0G private key and config
bun install
```

### Run

```bash
# API server
bun run dev:api

# Dashboard (separate terminal)
bun run dev:dashboard

# Bootstrap first user
curl -X POST http://localhost:3000/admin/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: zerostorage-admin-dev" \
  -d '{"email": "you@example.com", "tier": "pro"}'
```

### Docker

```bash
docker compose up -d
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/files/upload` | Upload file (multipart/form-data) |
| `GET` | `/api/v1/files/:rootHash` | Download file |
| `GET` | `/api/v1/files` | List files (paginated) |
| `DELETE` | `/api/v1/files/:rootHash` | Unpin file |
| `GET` | `/api/v1/files/:rootHash/status` | File status |
| `POST` | `/api/v1/keys` | Create API key |
| `GET` | `/api/v1/keys` | List API keys |
| `DELETE` | `/api/v1/keys/:keyId` | Revoke API key |
| `GET` | `/api/v1/usage` | Usage statistics |

All authenticated endpoints require `Authorization: Bearer zs_xxx` header.

## Architecture

```
zerostorage/
  packages/
    api/        # Hono REST API (Bun, SQLite, Drizzle)
    sdk/        # TypeScript SDK (npm: zerostorage)
    dashboard/  # React + Vite + TailwindCSS
```

**Built on:**
- [0G Storage](https://0g.ai) - Decentralized storage network
- [Hono](https://hono.dev) - Ultrafast web framework
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM for SQLite
- [Bun](https://bun.sh) - Fast JavaScript runtime

## Pricing Tiers

| Tier | Storage | API Calls/day | API Keys | Price |
|------|---------|---------------|----------|-------|
| Free | 1 GB | 100 | 2 | $0 |
| Starter | 10 GB | 1,000 | 5 | $9/mo |
| Pro | 100 GB | 10,000 | 20 | $49/mo |
| Enterprise | 1 TB | 100,000 | 20 | $199/mo |

## 0G Network

- **Testnet (Galileo):** RPC `https://evmrpc-testnet.0g.ai` | Chain ID `16602`
- **Mainnet (Aristotle):** RPC `https://evmrpc.0g.ai` | Chain ID `16661`

## License

MIT
