# @automation-engineer

**Type**: Orchestrator Agent
**Version**: 1.0.0

## Overview

The Automation Engineer is the primary orchestrator agent that analyzes tasks, delegates to specialist agents, and builds automation solutions. It combines development capabilities with workflow coordination.

## How to Invoke

```
Use: @automation-engineer
Context: [Your task description]
```

## Agent Location

```
agents/automation-engineer/
├── skills.md      # Capabilities and tools
├── knowledge.md   # Technical knowledge base
└── logs/          # Session logs (in repo root)
```

## Core Responsibilities

1. **Task Analysis**: Break down complex tasks into subtasks
2. **Orchestration**: Delegate to specialist agents appropriately
3. **Development**: Write scripts, glue code, and tools
4. **Validation**: Test and verify solutions work end-to-end

## When to Use

- Building automation scripts
- Coordinating multi-step workflows
- Integrating multiple systems
- Creating new tools or utilities
- Debugging complex issues

## Example Usage

```
@automation-engineer
Create a script that syncs new Klaviyo profiles to Shopify customers
every hour and logs the results to the database.
```

## Specialist Agents

The Automation Engineer delegates to:
- `@klaviyo-specialist` - Klaviyo API operations
- `@shopify-specialist` - Shopify development
- `@data-specialist` - Data processing and ETL
- `@integration-specialist` - Third-party integrations

## Logging

Each session creates a log file:
```
logs/automation-engineer/session-YYYY-MM-DD-HH-MM-{n}.md
```

---

*Invoke this agent with `@automation-engineer` followed by your task.*
