# Klaviyo API - oficjalny katalog endpointow (zweryfikowany) - 2026-02-05

Ten dokument zawiera endpointy, ktore zostaly potwierdzone w oficjalnych zrodlach Klaviyo (developers.klaviyo.com lub oficjalne Postman collections Klaviyo). 
Pozycje oznaczone jako "DO POTWIERDZENIA" nie maja jeszcze jednoznacznie potwierdzonej sciezki w docs i wymagaja doprecyzowania przed implementacja.

## Globalne zasady (zweryfikowane)
- Wersjonowanie przez naglowek `revision` (daty ISO), polityka 2 lat wsparcia.
- /api (server-side) wymaga prywatnego klucza `Authorization: Klaviyo-API-Key <private>`.
- /client (client-side) wymaga publicznego `company_id` w query.

## Campaigns API (GA)
Zweryfikowane endpointy (Postman - official):
- `GET /api/campaigns?filter=...`
- `POST /api/campaigns`
- `GET /api/campaigns/:id`
- `PATCH /api/campaigns/:id`
- `GET /api/campaign-messages/:id`
- `GET /api/campaign-messages/:id/campaign`
- `GET /api/campaign-messages/:id/relationships/campaign`
- `POST /api/campaign-send-jobs`
- `GET /api/campaign-send-jobs/:id`
- `POST /api/campaign-recipient-estimation-jobs`
- `GET /api/campaign-recipient-estimations/:id`

DO POTWIERDZENIA:
- `DELETE /api/campaigns/:id` (brak jednoznacznego potwierdzenia w zrodlach)
- `GET /api/campaigns/:id/campaign-messages` (brak jednoznacznego potwierdzenia w zrodlach)

## Lists API (GA)
Zweryfikowane (developers.klaviyo.com):
- `GET /api/lists`
- `POST /api/lists`
- `GET /api/lists/:id`
- `GET /api/lists/:id/tags`
- `GET /api/lists/:id/relationships/tags`

DO POTWIERDZENIA:
- `PATCH /api/lists/:id`
- `DELETE /api/lists/:id`
- `GET /api/lists/:id/profiles`
- `POST /api/lists/:id/relationships/profiles`
- `DELETE /api/lists/:id/relationships/profiles`
- `GET /api/lists/:id/flow-triggers`

## Segments API (GA)
Zweryfikowane (developers.klaviyo.com - comparison chart):
- `GET /api/segments`
- `GET /api/segments/:id`
- `PATCH /api/segments/:id`
- `GET /api/segments/:id/relationships/{related_resource}`

Zweryfikowane (Postman):
- `GET /api/segments/:id/tags`

DO POTWIERDZENIA:
- `POST /api/segments`
- `DELETE /api/segments/:id`
- `GET /api/segments/:id/profiles`
- `GET /api/segments/:id/relationships/tags`

## Profiles API (GA)
Zweryfikowane (developers.klaviyo.com):
- `GET /api/profiles`

DO POTWIERDZENIA (wymaga potwierdzenia w reference/Postman):
- `POST /api/profiles`
- `PATCH /api/profiles/:id`
- `POST /api/profiles/merge`
- `POST /api/profiles-bulk-imports`

## Subscriptions / Suppressions (GA)
Zweryfikowane (developers.klaviyo.com - auth + scopes):
- Client subscriptions endpoint exists: `POST /client/subscriptions/?company_id=...`

DO POTWIERDZENIA (sciezki server-side w reference):
- subscribe / unsubscribe (bulk)
- suppress / unsuppress (bulk)

## Events API (GA)
Zweryfikowane (developers.klaviyo.com + migration doc):
- `POST /api/events`
- `GET /api/events`
- `GET /api/events/:id`
- relacje: `/api/events/:id/profile`, `/api/events/:id/metric`
- client-side: `POST /client/events?company_id=...`

## Metrics API (GA)
Zweryfikowane (developers.klaviyo.com):
- `GET /api/metrics`
- `POST /api/metric-aggregates/`

DO POTWIERDZENIA:
- `GET /api/metrics/:id`

## Flows API (GA)
Zweryfikowane (developers.klaviyo.com):
- relacje: `/api/flows/:id/flow-actions`
- relacje: `/api/flows/:id/relationships/flow-actions`
- relacje: `/api/flows/:id/tags`
- relacje: `/api/flows/:id/relationships/tags`
- relacje z metrics: `/api/metrics/:metric_id/relationships/flow-triggers`

DO POTWIERDZENIA:
- `GET /api/flows`
- `GET /api/flows/:id`
- `POST /api/flows`
- `PATCH /api/flows/:id`
- `PATCH /api/flows/:id/status`

## Forms API (BETA)
Zweryfikowane (developers.klaviyo.com):
- Forms API jest w becie i wymaga revision z sufiksem `.pre` (nie do produkcji)

DO POTWIERDZENIA:
- `/api/forms`
- `/api/form-versions`

## Templates API (GA)
Zweryfikowane (developers.klaviyo.com + changelog):
- `GET /api/templates`
- `POST /api/templates`
- `GET /api/templates/:id`
- `PATCH /api/templates/:id`
- `DELETE /api/templates/:id`
- `POST /api/template-render` (nowa sciezka)
- `POST /api/template-clone` (nowa sciezka)

## Catalogs API (GA)
Zweryfikowane (developers.klaviyo.com):
- `GET /api/catalog-items`
- `POST /api/catalog-items`
- `GET /api/catalog-items/:id`
- `PATCH /api/catalog-items/:id`
- `DELETE /api/catalog-items/:id`
- `GET /api/catalog-variants`
- `POST /api/catalog-variants`
- `GET /api/catalog-variants/:id`
- `PATCH /api/catalog-variants/:id`
- `DELETE /api/catalog-variants/:id`
- `GET /api/catalog-categories`
- `POST /api/catalog-categories`
- `GET /api/catalog-categories/:id`
- `PATCH /api/catalog-categories/:id`
- `DELETE /api/catalog-categories/:id`

DO POTWIERDZENIA:
- Bulk jobs: `/api/catalog-item-bulk-create-jobs/:id` i analogiczne
- Back in stock (server-side)
- Client BIS: `/client/back-in-stock-subscriptions?company_id=...` (wskazane w guide)

## Webhooks API (GA / ograniczone dla Advanced KDP)
Zweryfikowane (Postman + overview):
- `GET /api/webhooks`
- `GET /api/webhooks/:id`
- `GET /api/webhook-topics/:id`

DO POTWIERDZENIA:
- `POST /api/webhooks`
- `PATCH /api/webhooks/:id`
- `DELETE /api/webhooks/:id`
- `GET /api/webhook-topics`

## Coupons API (GA)
Zweryfikowane (Postman + guide):
- `GET /api/coupons`
- `POST /api/coupons`
- `GET /api/coupons/:id`
- `GET /api/coupons/:id/coupon-codes`
- `GET /api/coupon-codes?filter=...`
- `POST /api/coupon-codes`
- `GET /api/coupon-codes/:id`
- `POST /api/coupon-code-bulk-create-jobs`
- `GET /api/coupon-codes/:id/coupon`

DO POTWIERDZENIA:
- `PATCH /api/coupons/:id`
- `DELETE /api/coupons/:id`
- `PATCH /api/coupon-codes/:id`
- `DELETE /api/coupon-codes/:id`
- Bulk job status endpoint

## Tags API (GA)
Zweryfikowane (Postman + list/segment docs):
- `GET /api/tags`
- `GET /api/tags/:id`
- `POST /api/tags/:id/relationships/campaigns`
- `POST /api/tags/:id/relationships/lists`
- `GET /api/lists/:id/tags`
- `GET /api/lists/:id/relationships/tags`
- `GET /api/segments/:id/tags`

Zweryfikowane (Postman - tag groups, starsze revisiony, sciezki stabilne):
- `GET /api/tag-groups`
- `GET /api/tag-groups/:id`
- `GET /api/tags/:id/tag-group`

DO POTWIERDZENIA:
- `POST /api/tags`
- `PATCH /api/tags/:id`
- `DELETE /api/tags/:id`
- `POST /api/tag-groups`
- `PATCH /api/tag-groups/:id`
- `DELETE /api/tag-groups/:id`

## Client API (client-side)
Zweryfikowane (developers.klaviyo.com):
- `POST /client/events?company_id=...`
- `POST /client/subscriptions?company_id=...`
- `POST /client/back-in-stock-subscriptions?company_id=...`

DO POTWIERDZENIA:
- Client profile endpoints (create/update) oraz ewentualne inne client-side zasoby
