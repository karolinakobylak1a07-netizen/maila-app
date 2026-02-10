# Marketing Agent Team

Complete Klaviyo email marketing operation agent system. You are the CEO and orchestrate all operations.

## Quick Start

Invoke the CEO to start:
```
ceo
```

## Agent Structure

Each agent follows the BMAD method:
```
agents/
├── agent-name.md          # Entry point (invoke with this name)
├── skills.md              # Agent capabilities
├── knowledge.md           # Technical knowledge base
└── logs/                  # Session logs (in repo root)
    └── agent-name/
        └── session-YYYY-MM-DD-HH-MM-{n}.md
```

## Complete Agent Team

### Executive (Orchestrator)
| Agent | Role | File |
|-------|------|------|
| **ceo** | Executive orchestrator | `ceo.md` |

### Strategy & Planning Department
| Agent | Role | File |
|-------|------|------|
| **chief-strategist** | Marketing strategy & KPIs | `chief-strategist.md` |
| **campaign-planner** | Campaign calendar & coordination | `campaign-planner.md` |
| **segmentation-specialist** | Audience segmentation | `segmentation-specialist.md` |

### Content Creation Department
| Agent | Role | File |
|-------|------|------|
| **copywriting-lead** | Email content & copy | `copywriting-lead.md` |
| **design-specialist** | Email templates & visuals | `design-specialist.md` |
| **personalization-expert** | Dynamic content & journeys | `personalization-expert.md` |

### Technical & Operations Department
| Agent | Role | File |
|-------|------|------|
| **integration-engineer** | API & platform integrations | `integration-engineer.md` |
| **data-analyst** | Performance reporting & insights | `data-analyst.md` |
| **qa-specialist** | Testing & quality assurance | `qa-specialist.md` |

### Growth & Optimization Department
| Agent | Role | File |
|-------|------|------|
| **performance-optimizer** | Campaign optimization | `performance-optimizer.md` |
| **journey-architect** | Customer flows & automation | `journey-architect.md` |
| **attribution-specialist** | ROI & revenue tracking | `attribution-specialist.md` |

### Quality & Compliance Department
| Agent | Role | File |
|-------|------|------|
| **compliance-officer** | Legal & compliance | `compliance-officer.md` |
| **deliverability-expert** | Email deliverability | `deliverability-expert.md` |

## How to Use

### As CEO (Orchestrator)
```
ceo
Create a Q1 marketing strategy for our e-commerce client focused on customer retention.
```

### Direct Agent Invocation
```
copywriting-lead
Write an email for our summer sale with 20% off everything.
```

### Multi-Agent Workflow
```
ceo
Launch a new product campaign:
1. chief-strategist: Define strategy
2. campaign-planner: Schedule sends
3. copywriting-lead: Create content
4. design-specialist: Design templates
5. qa-specialist: Test everything
```

## Campaign Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                         CEO                                  │
│                    (Orchestrator)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼─────┐     ┌────▼─────┐     ┌────▼─────┐
    │ Strategy │     │ Content  │     │Technical │
    │          │     │          │     │          │
    │Strategist│     │Copywriter│     │Integration│
    │Planner   │     │Designer  │     │Data Analyst│
    │Segment   │     │Personaliz│     │QA        │
    └────┬─────┘     └────┬─────┘     └────┬─────┘
         │                │                │
         └─────────────────┼─────────────────┘
                           │
                  ┌────────▼─────────┐
                  │   Growth &       │
                  │  Optimization   │
                  │                 │
                  │Performance      │
                  │Journey          │
                  │Attribution      │
                  └──────────────────┘
                           │
                  ┌────────▼─────────┐
                  │ Quality &       │
                  │ Compliance     │
                  │                 │
                  │Compliance       │
                  │Deliverability   │
                  └──────────────────┘
```

## MCP Tools Available

| Server | Purpose | Key Tools |
|--------|---------|-----------|
| **Klaviyo** | Email marketing | Profiles, campaigns, flows, events |
| **Shopify** | E-commerce | API docs, GraphQL, validation |
| **Web Search** | Research | Search web for information |
| **Web Reader** | Documentation | Fetch and parse web content |
| **zread** | GitHub | Read repositories, search code |
| **IDE** | Code execution | Run Python/TypeScript in Jupyter |

## Logging

Every agent session creates a log:
```
logs/{agent-name}/session-YYYY-MM-DD-HH-MM-{n}.md
```

Logs include:
- Session timestamp
- Tasks completed
- Decisions made
- Delegations performed
- Results achieved

## Project Context

**This is a multi-client Klaviyo management platform:**

- Multi-tenant workspaces with RBAC
- Campaign and flow optimization
- AI-powered content generation
- Comprehensive analytics and reporting
- Domain authentication (SPF, DKIM, DMARC)
- Automated sync and audit capabilities

## Best Practices

1. **Start with CEO** - Let CEO determine which agents to use
2. **Be specific** - Clear context = better results
3. **Trust specialists** - Let experts handle their domain
4. **Review logs** - Track what's been done
5. **Iterate** - Use feedback to improve

## Example Sessions

**New Campaign:**
```
ceo: Launch spring sale campaign
  → chief-strategist: Define goals and KPIs
  → campaign-planner: Schedule timeline
  → segmentation-specialist: Target audience
  → copywriting-lead: Write emails
  → design-specialist: Create templates
  → qa-specialist: Test everything
  → compliance-officer: Legal review
```

**Performance Issue:**
```
ceo: Open rates dropped 10% last week
  → data-analyst: Analyze the data
  → deliverability-expert: Check deliverability
  → performance-optimizer: Identify issues
  → integration-engineer: Fix technical problems
```

---

**You are the CEO. Direct your marketing team to achieve exceptional results.**
