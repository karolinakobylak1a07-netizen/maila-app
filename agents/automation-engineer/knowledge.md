# Automation Engineer - Knowledge

## Project Context

This is a **Next.js SaaS application** for client management with Klaviyo integration for email marketing automation.

**Tech Stack:**
- Framework: Next.js 15.2.3 (React 19)
- Database: PostgreSQL + Prisma ORM
- Auth: NextAuth.js v4
- API: tRPC + Next.js API routes
- Styling: Tailwind CSS v4
- State: React Query v5
- Language: TypeScript

**Project Structure:**
```
├── app/                    # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── features/      # Feature modules
│   │   ├── server/        # Server-side logic
│   │   └── env.js         # Environment config
│   ├── prisma/            # Database schema
│   └── package.json
├── agents/                 # Agent definitions
├── init/                   # Project setup docs
└── logs/                   # Agent session logs
```

## MCP Servers Available

All servers configured in `~/.claude.json`:

1. **klaviyo** - Email marketing automation
   - Profiles, campaigns, flows, events
   - API Key: `pk_1cdb81598464b55f235e3d16a8ecc7d8d6`

2. **shopify** - E-commerce development
   - API docs, GraphQL schemas, validation
   - No auth required (dev resources only)

3. **web-search-prime** - Web search
4. **web-reader** - Fetch web content
5. **zread** - GitHub repository reading
6. **zai-mcp-server** - Image/video analysis

## Code Patterns

### API Integration
```typescript
// Prisma for database
import { prisma } from './server/db';

// tRPC for type-safe APIs
import { router, procedure } from './server/trpc';

// Environment variables
import { env } from './env';
```

### Error Handling
```typescript
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return { success: false, error: error.message };
}
```

### Logging
```typescript
// Use structured logging
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  operation: 'sync_profiles',
  status: 'success',
  count: profiles.length
}));
```

## Environment Variables

```bash
# Core
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Klaviyo
KLAVIYO_API_KEY="pk_1cdb81598464b55f235e3d16a8ecc7d8d6"

# Optional
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
SERPAPI_API_KEY=""
CLIENT_KEYS_ENCRYPTION_SECRET=""
CRON_SHARED_SECRET=""
```

## Common Commands

```bash
# Development
cd app && npm run dev

# Database
npm run db:push     # Push schema
npm run db:migrate  # Run migrations
npm run db:studio   # Prisma Studio

# Testing
npm test

# Build
npm run build
```

## Klaviyo API Reference

**Key Endpoints:**
- `GET /api/profiles/` - List profiles
- `POST /api/profiles/` - Create profile
- `PUT /api/profiles/{id}/` - Update profile
- `GET /api/campaigns/` - List campaigns
- `POST /api/campaigns/` - Create campaign
- `GET /api/metrics/` - List metrics
- `POST /api/events/` - Track event

**Rate Limits:** Refer to Klaviyo docs (varies by plan)

## Shopify API Reference

**Admin GraphQL API:** `https://{shop}.myshopify.com/admin/api/{version}/graphql`

**Common Operations:**
- `customerCreate` - Create customer
- `productCreate` - Create product
- `orderCreate` - Create order
- `webhookSubscriptionCreate` - Create webhook

## Best Practices

1. **Always validate** - Input data, API responses
2. **Use transactions** - For multi-step database operations
3. **Handle rate limits** - Implement backoff
4. **Log everything** - Structured logs for debugging
5. **Idempotency** - Use external_id to prevent duplicates
6. **Security** - Never hardcode secrets

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| MCP not connected | Run `claude mcp list` |
| Database connection | Check `DATABASE_URL` |
| Klaviyo auth fail | Verify API key |
| Rate limit errors | Add delays between batches |

### Debug Mode

```bash
# Enable debug logs
DEBUG=* npm run dev

# Check MCP logs
tail -f ~/.claude/debug/*.log
```
