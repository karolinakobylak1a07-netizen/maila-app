# Smoke Test Checklist - v1 freeze (real client data)

## 0) Preconditions
- [ ] Environment points to production-like DB and integrations.
- [ ] API keys/secrets configured (Klaviyo, Notion/Google Docs if used).
- [ ] Test client selected and active context set in workspace.
- [ ] Backup/snapshot of test client records completed.

## 1) Workspace & access control
- [ ] Switching active client preserves context and does not leak data between clients.
- [ ] RBAC limits are respected for Owner/Strategy/Content/Operations roles.
- [ ] Discovery form save/complete works with required field validation.

## 2) Data sync and audit readiness
- [ ] Manual sync starts and completes with visible status/counts.
- [ ] Gap report is generated and references latest sync requestId.
- [ ] Optimization priorities and context insights render without runtime errors.

## 3) Strategy and planning artifacts
- [ ] Generate email strategy returns structured output and version metadata.
- [ ] Generate flow plan and campaign calendar succeeds and persists.
- [ ] Segment proposal is generated and can be reloaded.

## 4) Content generation and feedback loop
- [ ] Communication brief generates with expected goal/segment.
- [ ] Email draft and personalized draft generate with valid fields.
- [ ] Feedback submission (rating+comment) works for draft and recommendation.

## 5) Implementation execution
- [ ] Implementation checklist can be generated and step status updated.
- [ ] Implementation alerts load and match known blockers/config gaps.
- [ ] Implementation report and documentation download as markdown.
- [ ] Documentation export to Notion/Google Docs returns usable URL.

## 6) Analytics and continuous improvement
- [ ] Campaign effectiveness analysis returns KPI + feedback scores.
- [ ] Strategy KPI analysis returns segment/recommendation summaries.
- [ ] Recommendation update flow creates a new active version when below threshold.
- [ ] AI achievements report loads and export links open.

## 7) Operational checks
- [ ] `npm test` passes in deployment branch.
- [ ] `npm run typecheck` passes in deployment branch.
- [ ] `npm run lint` passes (or only pre-existing accepted warnings).
- [ ] No unexpected errors in server logs during above flows.

## 8) Sign-off
- [ ] Product owner sign-off
- [ ] Strategy lead sign-off
- [ ] Operations lead sign-off
- [ ] Freeze accepted for real-client pilot
