---
artifactType: ux-structure
project: fisrt project
date: '2026-02-01'
---

# Minimal UX Structure Artifact

## Navigation Model
- Primary nav (desktop sidebar): Clients, Discovery, Audit, Strategy, Content, Implementation, Reporting, Settings.
- Context switcher (top bar): Active Client + Active Project.
- Secondary actions: Sync, Generate, Export, Approve.

## Main Views and Purpose
1. Clients Workspace
   - Client list, create/edit/archive, context switch, quick status.
2. Discovery View
   - Structured questionnaire, required fields validation, completeness progress.
3. Klaviyo Audit View
   - Sync status, account/flow/email/form inventory, gap report, priority flags.
4. Strategy Planner View
   - Strategy generation, flow plan, campaign calendar, segment proposals.
5. Content Studio View
   - Brief builder, draft generation, review queue, approve/reject actions.
6. Implementation View
   - Deployment checklists, dependency map, conflict validator, export package.
7. Reporting & Optimization View
   - KPI report, trends, recommendations, A/B test proposals.
8. Governance & History View
   - Version history, audit log, approval gates, retention/deletion actions.

## View-Level States (applies to every main view)
- Loading: skeleton/progress with operation label.
- Empty: no data yet + clear next action.
- Error: requestId-visible error message + retry action.
- Forbidden: RBAC message + allowed fallback navigation.
- Stale Data Warning: informs that sync refresh is required.

## Core User Flows
- Flow A (Owner): Client -> Discovery -> Audit -> Strategy -> Content Approval -> Implementation -> Report.
- Flow B (Strategy): Client -> Audit -> Insights -> Strategy/Segmentation -> Recommendations.
- Flow C (Operations): Client -> Implementation Checklist -> Conflict Validation -> Export.

## Routing Skeleton (example)
- /clients
- /clients/:clientId/discovery
- /clients/:clientId/audit
- /clients/:clientId/strategy
- /clients/:clientId/content
- /clients/:clientId/implementation
- /clients/:clientId/reporting
- /clients/:clientId/governance

## Notes
- Desktop-first structure; mobile supports read-only preview for key reports/status.
- UX artifact is intentionally structural only (no visual design decisions).
