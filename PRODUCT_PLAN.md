# Numismatist Collection Platform - Product Plan

## 1) Product vision

Build the best place for numismatists to:
- explore coin catalogs,
- manage personal collections and wish lists,
- and safely trade coins with other collectors.

The platform starts with one country dataset and is designed to scale to many countries over time.

## 2) Core idea from project owner

This plan is based on your concept:
- all users can view the catalog,
- users can add coins to their personal collection or wish list,
- users can report bugs to admin by email,
- paid Pro users get advanced ownership and market features.

## 3) Target users

1. Casual collector
   - wants a clean catalog and simple collection tracking.
2. Active collector
   - tracks goals, value, and missing coins.
3. Advanced numismatist (Pro)
   - wants custom details, photos, and trading tools.

## 4) Product scope

### Free plan (MVP + growth)

1. Public catalog browsing
   - browse by country -> period -> ruler/type -> coin
   - search and filters (year, denomination, metal, rarity)
   - coin detail page (specs, default photos, notes)

2. Personal account
   - sign up / login
   - profile basics (name, language, country)

3. Personal collection
   - add coin from catalog to collection
   - set quantity and basic metadata (condition, date added, notes)
   - remove/edit owned entry

4. Wish list
   - add/remove coins to wish list
   - mark wish item as acquired (move to collection)

5. Bug reporting
   - "Report a bug" form
   - sends email to admin with app version, device/platform, and user text

### Pro plan (paid option)

1. Custom coin data (owned coins only)
   - override details for personal copy of coin when real item differs from catalog data
   - keep official catalog data unchanged for other users

2. Photo uploads
   - upload obverse + reverse photos
   - optional extra photos (edge, certificate, defects)

3. Marketplace for exchanges
   - publish owned coin to market
   - choose: trade only / sale / both
   - contact flow between users

4. Ideas and feedback channel
   - "Send idea to admin" form (feature requests)
   - priority queue for Pro feedback

## 5) Functional requirements

### Catalog module
- hierarchical data model: country -> period -> ruler/type -> coin
- scalable import pipeline for adding new countries
- admin ability to update catalog entries

### Collection module
- many-to-many relation between user and catalog coin
- per-user fields (condition, paid price, notes, quantity)
- collection stats (count, completion percent, estimated value)

### Wish list module
- separate list linked to catalog entries
- quick actions: add to collection, set priority, add target price

### Marketplace module (Pro)
- listing status (active, reserved, closed)
- listing metadata (location, shipping options, desired exchange)
- basic anti-spam and abuse reporting

### Communication module
- bug report email flow
- idea submission flow
- admin mailbox rules and auto-tagging

## 6) Non-functional requirements

- Security: private user data protected; strict access control per user record
- Performance: fast catalog browsing and search
- Reliability: backups for user data and uploaded photos
- Moderation: report and block flows for market misuse
- Compliance: clear terms for user-generated content and trading behavior

## 7) Suggested milestones

## Phase 1 - MVP (4-6 weeks)
- auth + profile
- read-only catalog
- collection + wish list basics
- bug report email

Success criteria:
- users can browse catalog and maintain personal lists without errors

## Phase 2 - Catalog expansion and quality (3-4 weeks)
- country-ready catalog structure
- import tools for new countries
- improved filters and search
- admin content update tools

Success criteria:
- add a new country dataset with minimal engineering work

## Phase 3 - Pro subscription (4-6 weeks)
- subscription paywall
- custom owned-coin fields
- obverse/reverse upload
- idea-to-admin channel

Success criteria:
- Pro users can fully document real coins they own

## Phase 4 - Marketplace (6-8 weeks)
- create/manage listings
- trade/sale intent
- user contact and status workflow
- moderation and abuse reporting

Success criteria:
- successful user-to-user exchange flow with basic trust controls

## 8) Metrics (KPIs)

- activation: percent of new users adding first coin in first session
- engagement: weekly active collectors
- retention: D30 retention
- conversion: free -> Pro conversion rate
- marketplace health: listings created, completed exchanges
- quality: bug reports resolved per month, crash-free sessions

## 9) Risks and mitigations

1. Incorrect catalog data
   - mitigation: source references, admin review workflow, user correction reports

2. Marketplace trust issues
   - mitigation: ratings, report/block tools, identity indicators, moderation logs

3. Storage cost growth (photos)
   - mitigation: image compression, quotas by plan, lifecycle policies

4. Multi-country complexity
   - mitigation: strict import schema and validation tools

## 10) New options worth adding

Below are high-value additions beyond the current idea:

1. Collection value tracker
   - track estimated value over time
   - show profit/loss and portfolio charts

2. Duplicate and gap detector
   - identify duplicates in collection
   - show missing years/types for completion goals

3. Smart trade matching
   - match "my duplicates" with "their wish list"
   - suggest best exchange candidates automatically

4. Collector reputation system
   - ratings after trades
   - trust badge for verified good behavior

5. Import/export tools
   - CSV/Excel import and export for backups and migration

6. Notifications
   - wish list coin appears in market
   - trade offer updates
   - new country catalog released

7. Grading and certification support
   - grading scale fields (VG/F/VF/XF/etc.)
   - certificate number and grading company

8. Community knowledge layer (optional)
   - comments on coin types
   - historical notes and mint marks from experts

## 11) Recommended priority for new options

Priority 1 (strong immediate impact):
- collection value tracker
- notifications
- import/export tools

Priority 2 (supports marketplace quality):
- smart trade matching
- collector reputation system
- grading/certification support

Priority 3 (community growth):
- community knowledge layer

---

If you want, the next step is a technical implementation plan mapped to your existing codebase (screens, database schema, APIs, and subscription logic).
