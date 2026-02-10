# Project Initialization & Setup

## Project Overview

**Project Name:** First Project - OpenCode
**Type:** Next.js SaaS Application
**Purpose:** Client management platform with Klaviyo integration for email marketing automation

## Technology Stack

- **Framework:** Next.js 15.2.3 (React 19)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v4
- **API:** tRPC + Next.js API routes
- **Styling:** Tailwind CSS v4
- **State:** React Query v5
- **Language:** TypeScript
- **Primary UI Language:** Polish

## MCP Servers (All Connected ✓)

### 1. web-search-prime
- **Type:** HTTP
- **URL:** https://api.z.ai/api/mcp/web_search_prime/mcp
- **Purpose:** Web search capabilities
- **Status:** ✓ Connected

### 2. web-reader
- **Type:** HTTP
- **URL:** https://api.z.ai/api/mcp/web_reader/mcp
- **Purpose:** Fetch and convert web content to markdown
- **Status:** ✓ Connected

### 3. zread
- **Type:** HTTP
- **URL:** https://api.z.ai/api/mcp/zread/mcp
- **Purpose:** GitHub repository reading (structure, files, search)
- **Status:** ✓ Connected

### 4. zai-mcp-server
- **Type:** stdio (npx)
- **Package:** @z_ai/mcp-server
- **Purpose:** Image/video analysis, text extraction, UI analysis
- **Status:** ✓ Connected

## Available Tools

### Core Development Tools
- **Bash:** Command execution (git, npm, etc.)
- **Read/Write/Edit:** File operations
- **Glob/Grep:** File search and content search
- **Task/TaskCreate/TaskUpdate:** Task management
- **AskUserQuestion:** User interaction

### MCP-Provided Tools
- `mcp__ide__executeCode`: Jupyter code execution
- `mcp__ide__getDiagnostics`: VS Code language diagnostics
- `mcp__web-reader__webReader`: Web content fetching
- `mcp__web-search-prime__webSearchPrime`: Web search
- `mcp__zread__*`: GitHub repository tools
- `mcp__zai-mcp-server__*`: Image/video analysis tools

### BMad Skills (Development Workflow)
- Project management workflows
- Agent-based development
- Sprint planning and tracking
- Documentation generation

## Environment Variables Required

```bash
# Core
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/app"

# Integrations
KLAVIYO_API_KEY=""
DISCORD_CLIENT_ID=""        # Optional
DISCORD_CLIENT_SECRET=""     # Optional
SERPAPI_API_KEY=""           # Optional
CLIENT_KEYS_ENCRYPTION_SECRET=""
CRON_SHARED_SECRET=""
```

## Setup Commands

```bash
# Navigate to app directory
cd app

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Database setup
npm run db:push    # or npm run db:migrate

# Start development
npm run dev
```

## Project Structure

```
├── app/                    # Main Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── features/      # Feature modules
│   │   ├── server/        # Server-side logic
│   │   └── env.js         # Environment config
│   ├── prisma/            # Database schema
│   └── package.json
├── docs/                  # Project documentation
├── init/                  # Initialization files (this directory)
└── _bmad/                 # BMad dev workflow (not part of app)
```

## Key Integrations

1. **Klaviyo:** Email marketing automation
   - API synchronization
   - List audits
   - Flow management
   - Domain verification

2. **PostgreSQL:** Data persistence
   - Prisma ORM
   - Multi-tenant client data
   - Audit trails

3. **Discord OAuth:** Optional authentication

## Git Status Summary

- **Branch:** main
- **Recent work:** SMS campaign features, internal contacts, sender domains
- **Modified files:** Various feature files and migrations

## Notes

- BMad framework is for development workflow only, not part of production app
- UI primarily in Polish language
- Role-based access control: OWNER, STRATEGY, CONTENT, OPERATIONS
- Multi-tenant client workspace system
