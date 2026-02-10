# Klaviyo Integration Knowledge Base

Last updated: 2026-02-04

## Purpose

This document is the internal reference for how we design and validate Klaviyo integrations in the client card workflow.

It focuses on production-critical mechanics:
- data flow integrity (events, catalog, profiles),
- sending readiness (domain auth),
- platform-specific integration requirements,
- remediation order (next best actions).

## Klaviyo Core Model (Operational View)

1. Data enters Klaviyo from:
   - native e-commerce integrations (Shopify, WooCommerce, Magento, BigCommerce, PrestaShop),
   - custom API pipelines.
2. Profiles and events power:
   - segmentation,
   - flow triggers,
   - attribution and revenue reporting.
3. Catalog quality impacts:
   - product blocks,
   - personalization,
   - recommendation quality.
4. Sending setup (DKIM + tracking domain) impacts:
   - deliverability and inbox placement.

## Minimal Required Inputs in Client Card

For all platforms:
- `clientName`
- `platform`
- `storeDomain`
- `klaviyoPrivateApiKey`

Additional hard requirement:
- `custom_api` also requires `klaviyoPublicApiKey` (Site ID).

Recommended (not always hard-required):
- `clientEmail` for profile dedupe checks,
- `klaviyoPublicApiKey` for full onsite tracking.

## Platform-Specific Requirements (Checklist Sources)

- Shopify:
  - app connected + app embed enabled
  - docs: https://help.klaviyo.com/hc/en-us/articles/115005080407
- WooCommerce:
  - plugin authorized and connected
  - docs: https://help.klaviyo.com/hc/en-us/articles/115005255808
- Magento:
  - extension installed and OAuth active
  - docs: https://help.klaviyo.com/hc/en-us/articles/115005254348
- BigCommerce:
  - app connected using permanent store URL
  - docs: https://help.klaviyo.com/hc/en-us/articles/115005082547
- PrestaShop:
  - supported module/version and correct admin/store config
  - docs: https://help.klaviyo.com/hc/en-us/articles/360054551492
- Custom API:
  - event contract mapping + idempotency + retries for 429
  - docs:
    - https://developers.klaviyo.com/en/reference/api_overview
    - https://developers.klaviyo.com/en/docs/rate_limits_and_error_handling
    - https://developers.klaviyo.com/en/docs/authenticate_

Shared sending requirement:
- DKIM verified + tracking domain active
- docs: https://help.klaviyo.com/hc/en-us/articles/360001550392

## Validation Model Used in App

The sync route validates:
1. Preflight (hard blockers):
   - required input fields,
   - platform-specific hard requirements.
2. Runtime quality checks:
   - required event metrics,
   - profile dedupe signal,
   - catalog health,
   - sending domain status,
   - placed order payload quality.
3. Next best actions:
   - generated from failed/warning checks,
   - capped to highest-impact actions first.

## Design Rule for Future Changes

When adding a new platform or requirement:
1. Add checklist item with official Klaviyo doc URL.
2. Decide if it is:
   - hard preflight blocker, or
   - runtime quality check.
3. Add corresponding remediation action so users get concrete fixes, not just errors.

