# WILLUP

> **Human-in-the-Loop Agentic AI Platform for Institutional Service Delivery**

WILLUP is a platform engineered to streamline and automate institutional workflows using autonomous AI agents with human-in-the-loop oversight, strict guardrails, and auditability.

---

## Project Structure

```text
.
├── client/              # React + Vite + TypeScript Frontend
│   ├── src/             # Application source code
│   ├── index.html       # HTML entrypoint
│   ├── package.json     # Frontend dependencies & scripts
│   ├── tsconfig.json    # TypeScript configuration
│   └── vite.config.ts   # Vite bundler configuration
│
├── server/              # Node.js + Express + TypeScript Backend
│   ├── src/             # Backend server code
│   │   └── index.ts     # Express application entrypoint
│   ├── .env.example     # Environment variable template
│   ├── package.json     # Backend dependencies & scripts
│   └── tsconfig.json    # TypeScript configuration
│
├── package.json         # Workspace root scripts & configuration
└── README.md            # Platform overview and documentation
```

---

## Getting Started

### Prerequisites
- **Node.js**: >= 18.x
- **npm**: >= 9.x

### Installation

Install dependencies across all workspaces:

```bash
npm install
```

Or install individually:

```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

### Environment Configuration

Configure backend environment variables:

```bash
cp server/.env.example server/.env
```

Ensure the following variables are configured in `server/.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`

### Development

Run backend and frontend development servers:

```bash
# Run backend (from root or /server)
npm run dev:server

# Run frontend (from root or /client)
npm run dev:client
```
