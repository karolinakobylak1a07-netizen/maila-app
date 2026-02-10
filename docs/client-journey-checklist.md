# 🎯 CLIENT JOURNEY CHECKLIST

> **Step-by-step guide for managing clients from creation to retention**

---

## 📋 PHASE 1: CLIENT CREATION

> **Goal:** Create a new client profile in the platform

- [ ] **1.1** Navigate to `/clients` page
- [ ] **1.2** Click "Create New Client"
- [ ] **1.3** Enter client name (2-120 characters)
- [ ] **1.4** Verify client is created with ACTIVE status
- [ ] **1.5** Confirm you have OWNER role assigned

**Agent to use:** `pm`
**Client action:** None

---

## 🔌 PHASE 2: SYNC SETUP & ONBOARDING

> **Goal:** Connect Klaviyo and validate the integration

### Client Must Provide:
- [ ] **2.1** Platform type (Shopify/WooCommerce/Magento/BigCommerce/PrestaShop/Custom)
- [ ] **2.2** Shopify store domain
- [ ] **2.3** Klaviyo Private API Key
- [ ] **2.4** Klaviyo Public API Key
- [ ] **2.5** Client email address

### Your Actions:
- [ ] **2.6** Navigate to `/clients/connect`
- [ ] **2.7** Enter all client-provided information
- [ ] **2.8** Run sync validation
- [ ] **2.9** Review authentication status (should pass)
- [ ] **2.10** Verify event coverage:
  - [ ] Placed Order ✅
  - [ ] Added to Cart ✅
  - [ ] Checkout Started ✅
  - [ ] Viewed Product ✅
- [ ] **2.11** Check integration health status
- [ ] **2.12** Review revenue analysis (email vs total)

**Agent to use:** `ceo` → delegates to `integration-engineer`
**Client action:** Provide API keys and platform info

---

## 🌐 PHASE 3: DOMAIN CONFIGURATION

> **Goal:** Set up DNS records for email deliverability

### Your Actions:
- [ ] **3.1** Navigate to `/clients/connect/klaviyo-domain-setup`
- [ ] **3.2** Generate DNS setup guide
- [ ] **3.3** Send pre-formatted email to client IT team

### Client/IT Actions:
- [ ] **3.4** Client IT adds DKIM record
- [ ] **3.5** Client IT adds Return-Path record
- [ ] **3.6** Client IT adds Tracking record

### Validation:
- [ ] **3.7** Validate DKIM configuration
- [ ] **3.8** Validate Return-Path configuration
- [ ] **3.9** Validate Tracking record
- [ ] **3.10** Confirm all DNS records are active

**Agent to use:** `ceo` → delegates to `deliverability-expert`
**Client action:** Forward DNS instructions to IT team

---

## 🔍 PHASE 4: DISCOVERY & AUDIT

> **Goal:** Gather business context and audit current setup

### Required Discovery Questions (Client Must Answer):
- [ ] **4.1** What are your primary marketing goals?
- [ ] **4.2** Who are your key customer segments?
- [ ] **4.3** What is your seasonality pattern?
- [ ] **4.4** What is your core offer/value proposition?

### Optional Discovery Questions:
- [ ] **4.5** Target audience details
- [ ] **4.6** Brand tone and voice
- [ ] **4.7** Key products/services
- [ ] **4.8** Current marketing challenges
- [ ] **4.9** Active email flows
- [ ] **4.10** Current KPIs and benchmarks

### Your Actions:
- [ ] **4.11** Run Klaviyo audit
- [ ] **4.12** Generate audit report
- [ ] **4.13** Review gap analysis (missing flows/segments)
- [ ] **4.14** Identify optimization priorities
- [ ] **4.15** Save discovery as complete

**Agent to use:** `ceo` → delegates to `analyst`
**Client action:** Answer discovery questions

---

## 📊 PHASE 5: STRATEGY & PLANNING

> **Goal:** Create comprehensive marketing strategy

### Strategy Development:
- [ ] **5.1** Define overall marketing strategy
- [ ] **5.2** Set campaign calendar and timeline
- [ ] **5.3** Identify target segments
- [ ] **5.4** Design customer journey flows
- [ ] **5.5** Establish KPIs and targets

### Client Review:
- [ ] **5.6** Present strategy to client
- [ ] **5.7** Client reviews and approves strategy
- [ ] **5.8** Client provides promotion calendar
- [ ] **5.9** Client confirms target audience

**Agent to use:** `ceo` → orchestrates strategy team
**Specialists involved:** `chief-strategist`, `campaign-planner`, `segmentation-specialist`, `journey-architect`

---

## 🚀 PHASE 6: EXECUTION & OPTIMIZATION

> **Goal:** Create, test, and launch marketing campaigns

### Content Creation:
- [ ] **6.1** Write email copy
- [ ] **6.2** Design email templates
- [ ] **6.3** Create personalized content
- [ ] **6.4** Generate SMS campaigns (if applicable)

### Quality Assurance:
- [ ] **6.5** QA test all campaigns
- [ ] **6.6** Compliance review (GDPR, CAN-SPAM)
- [ ] **6.7** Deliverability check
- [ ] **6.8** Client reviews content
- [ ] **6.9** Client approves final version

### Launch:
- [ ] **6.10** Schedule campaigns
- [ ] **6.11** Monitor send performance
- [ ] **6.12** Track real-time metrics

**Agent to use:** `ceo` → orchestrates content team
**Specialists involved:** `copywriting-lead`, `design-specialist`, `personalization-expert`, `qa-specialist`, `compliance-officer`, `deliverability-expert`

---

## 📈 PHASE 7: REPORTING & REVIEW

> **Goal:** Analyze performance and present results

### Analysis:
- [ ] **7.1** Generate performance reports
- [ ] **7.2** Calculate ROI and attribution
- [ ] **7.3** Compare KPIs vs targets
- [ ] **7.4** Identify top performing campaigns
- [ ] **7.5** Identify underperforming areas

### Presentation:
- [ ] **7.6** Prepare client report
- [ ] **7.7** Export to PDF/Notion/Google Docs
- [ ] **7.8** Present findings to client
- [ ] **7.9** Document key insights
- [ ] **7.10** Get client feedback

**Agent to use:** `ceo` → delegates to `data-analyst` and `attribution-specialist`

---

## 🔄 PHASE 8: RETENTION & GROWTH

> **Goal:** Continuous improvement and client success

### Ongoing Activities:
- [ ] **8.1** Identify new optimization opportunities
- [ ] **8.2** Plan next campaign cycle
- [ ] **8.3** Test new variations (A/B testing)
- [ ] **8.4** Update flows based on performance
- [ ] **8.5** Expand successful campaigns
- [ ] **8.6** Document lessons learned

### Client Growth:
- [ ] **8.7** Propose new strategies
- [ ] **8.8** Upsell additional services
- [ ] **8.9** Request testimonials/referrals
- [ ] **8.10** Schedule quarterly business reviews

**Agent to use:** `ceo` → ongoing orchestration of all specialists

---

## 🎯 QUICK REFERENCE: AGENT COMMANDS

| Goal | Command | Delegates To |
|------|---------|--------------|
| Create client | `pm` | PM agent |
| Setup sync | `ceo` | integration-engineer |
| Domain setup | `ceo` | deliverability-expert |
| Run audit | `ceo` | analyst |
| Create strategy | `ceo` | chief-strategist |
| Create campaign | `ceo` | copywriting-lead |
| Fix performance | `ceo` | performance-optimizer |
| Get report | `ceo` | data-analyst |

---

## 📝 NOTES

- **Always use `ceo`** for complex tasks requiring multiple specialists
- **Client must provide** API keys, business info, and approvals
- **You approve** all work before client sees it
- **Client approves** before campaigns go live

---

## ⚡ DAILY CHECKLIST

### Morning:
- [ ] Check dashboard for alerts
- [ ] Review sync status for all clients
- [ ] Review optimization priorities

### During Day:
- [ ] Process client requests
- [ ] Execute planned campaigns
- [ ] Monitor active campaigns

### Evening:
- [ ] Review daily performance
- [ ] Update task lists
- [ ] Plan tomorrow's priorities

---

*Last updated: 2026-02-10*
