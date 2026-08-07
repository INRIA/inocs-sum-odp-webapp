# SUM ODP — V2 public website roadmap

**Input document for specification writing.** Each task below is scoped to be turned into a specification independently. Tasks are ordered **highest to lowest impact**; dependencies are stated explicitly where sequence matters.

**Author:** Rebeca Murillo (INRIA) — WP5 / T5.1
**Date:** 7 August 2026
**Target structure:** Version C — two experiences (*Decision maker insights* / *Data & scientific tools*) behind a switch, with one shared landing page.
**Companion documents:** `ODP_V2_structure_proposal.md` (rationale, PO traceability), `ODP_V2_sitemaps.html` (IA comparison), `ODP_V3_homepage_sketch.html` (homepage wireframes).

---

## 0. How to read this document

### 0.1 Governing rules — apply to every task

| # | Rule | Consequence for specs |
|---|---|---|
| **G1** | **One page URL = one experience.** Each route declares which experience it belongs to. Arriving at a route sets the active experience. | No redirect logic, no "wrong mode" state, no mode-lost bug. A spec never needs to describe a page rendering two ways. |
| **G2** | **No page is deleted.** Pages may be split, retitled, re-parented or relabelled. | If a task appears to remove something, it is re-homing it. Say where it went. |
| **G3** | **Existing deep pages are not rebuilt.** The Data experience is today's pages, reached from a new menu. | Tasks touching `/data/*` and `/tools/*` are content and display-rule changes, not rewrites. |
| **G4** | **Out of scope:** data structure, data classes, backend functions, the Living Lab editor space (`/lab-admin/*`), the administration back-office (`odp-admin.*`). | A task that cannot be done without breaching this is marked ⛔ and moved to §5. |
| **G5** | **Data mapping functions are in scope.** Regrouping, filtering and re-presenting existing data is allowed. | The Insights experience is built this way — no new model, no new table. |

### 0.2 Task record format

Every task carries: **Impact** (why it ranks here) · **Answers** (PO comment reference) · **Scope** · **Affects** (routes/components — starting points, to be confirmed against the codebase) · **Behaviour** · **Acceptance criteria** · **Depends on** · **Decision needed from** · **Effort** (S ≤ 1 day · M 2–5 days · L 1–2 weeks, relative not absolute) · **Owner**.

### 0.3 Waves

| Wave | Contents | Version-dependent? |
|---|---|---|
| **A — Corrections** | T01–T09. Fix what the PO flagged. | **No.** Ship these whichever structure the consortium chooses. |
| **B — Experience split** | T10–T13. The switch, the menus, the landing page, the Insights home. | Version C only |
| **C — Insights pages** | T14–T18. The curated decision-maker surface. | Version C only |
| **D — Data pages** | T19–T22. Console, downloads, methods track. | Mostly version-independent |
| **E — Deferred** | §5. Out of scope or blocked on a decision. | — |

> **Sequencing note for planning.** Wave A is independent of Wave B and can start immediately, in parallel, by a different person. Wave A alone answers eleven of the sixteen PO comments. If the calendar collapses, Wave A is the deliverable and Wave B is the commitment.

---

## 1. Wave A — Corrections (ship regardless of chosen structure)

### T01 · Fix the KPI results CSV export
**Impact** — Highest impact per unit of effort in the entire roadmap. The PO personally hit `Download failed: status=400`. A reviewer who finds a broken download discounts everything else on the page; a reviewer who finds it *still* broken after a redesign discounts the redesign.
**Answers** — PO p. 10 (second half).
**Scope** — Defect fix. ⚠️ **Scope flag:** this touches an API route, which the agreed boundary lists as out of scope. It is a defect, not a redesign. Confirm explicitly with the consortium that defect fixes are permitted before speccing; if not, route to the endpoint owner as a bug report.
**Affects** — `src/pages/api/v1/csv/kpiresults.ts`; the download buttons on `/data/kpis`, `/tools/impact_analysis` and the city pages that call it.
**Behaviour** — Reproduce the 400 across every entry point that offers the download (per-KPI card, per-domain in the impact tool, per-city). Establish whether the failure is parameter validation, an empty result set, or payload size. An empty result set must return a valid CSV with headers and a zero-row body, not an error.
**Acceptance criteria**
- Every CSV button on the public site returns a well-formed file, for every city and every KPI, including combinations with no data.
- A request with no matching rows returns HTTP 200 and a header-only CSV.
- A regression test covers at least one previously-failing parameter combination.
**Depends on** — nothing. **Decision needed from** — consortium, on the scope flag above. **Effort** — S. **Owner** — WP5 / INRIA.

---

### T02 · Split the implementation record from the impact evidence
**Impact** — This is **the** task. It is the only change that answers the PO's central objection that the platform *"attempts to play multiple roles at once"*. No navigation change answers that comment; this one does. Everything else in the roadmap is worth less if this is not done.
**Answers** — PO p. 3 ("these do not need to be graphically represented"); covering note, roles A vs B.
**Scope** — Display rule + data mapping. Front-end only.
**Affects** — City page KPI rendering; `/data/kpis`; the KPI-group grouping used by `src/components/react/KPIsDashboard/*`.
**Behaviour** — Four indicators — *level of completion of SUMP measures*, *community involvement*, *balance of planned/implemented pull–push measures*, *number of NSM integrated in the system* — move out of the charted KPI set into a separate **Implementation record** block presented as a table of values. No trend lines, no sparklines, no delta arrows. The block sits below the outcome KPIs and is labelled to make clear it describes project delivery, not measured outcomes. The data is unchanged and still downloadable.
**Acceptance criteria**
- The four indicators render nowhere as a chart, on any public page.
- They appear in an Implementation-record table with value, unit, reporting date and city.
- The table carries a one-line explanation of what the block is for and how it differs from the outcome indicators.
- Outcome KPI charts on a city page contain none of the four.
- Their CSV download still works from the new location.
**Depends on** — nothing. **Decision needed from** — WP1 leader, to confirm the exact indicator list and the block's explanatory sentence. **Effort** — M. **Owner** — WP1 (content) + WP5 (implementation).

---

### T03 · Data-sufficiency display rule
**Impact** — Answers three comments directly and underpins the credibility of every chart on the platform. Also the precondition for the Insights experience: without it, curated pages cannot be trusted to exclude thin data.
**Answers** — PO pp. 5, 6 (no data beyond 2023); supports p. 9.
**Scope** — Display rule + data mapping. Front-end only.
**Affects** — All KPI chart components (city page, `/data/kpis`, `/data/modal-split`); the series-building logic feeding them.
**Behaviour** — A KPI renders as a **chart** only where the city has **two or more validated estimations** for it. With exactly one, it renders as a **value** in a table, tagged *"Baseline only — no follow-up yet"*, with the reporting date. With none, it does not render (see T06 for the empty state). A one-point chart must not be produceable anywhere.
**Acceptance criteria**
- No chart on the public site renders from a single data point.
- Single-estimation KPIs appear as tagged values with their reporting date.
- The rule is implemented once, in a shared helper, not repeated per component.
- The rule is stated in plain language on the Methods & quality page (T21) and on the coverage matrix (T19).
**Depends on** — nothing. **Decision needed from** — WP1 leader, to confirm "validated" is the correct gate and what makes an estimation validated. **Effort** — M. **Owner** — WP1 (rule) + WP5 (implementation).

---

### T04 · Public vocabulary rename
**Impact** — Answers four comments for a very low cost, and every subsequent page inherits the new vocabulary. Doing it late means redoing labels across the Insights pages.
**Answers** — PO pp. 3, 8, 11, 12.
**Scope** — Labels and copy. Front-end only. No identifier, key or data value changes.
**Affects** — KPI group labels; impact-analysis domain and result headings; MCDA result labels; city catalogue labels.
**Behaviour** — Apply the mapping below across all public surfaces. Technical terms are retained in tooltips where they carry meaning for the Data experience.

| Current | New |
|---|---|
| Transport System – Time | Travel time |
| Transport System – Safety/Comfort | Safety & comfort |
| Transport System – Cost | Cost of travel |
| Impact – Environment / Society / Economy | Environment / Social outcomes / Local economy |
| "Policy measures driving improvements for KPIs in group X" | "Measures linked to better <plain-language X>" |
| Net flow / positive flow / negative flow | Overall score / strengths / weaknesses (PROMETHEE terms in tooltip) |
| Score matrix | Your ratings |
| "Living Lab" applied to any registered city | "SUM Living Lab" (the 9 project cities) vs "Contributing city" |
| SUM measures / SUMP measures | Disambiguated explicitly on every label where either appears |

**Acceptance criteria**
- No public page displays any left-column string.
- The SUM/SUMP distinction is unambiguous on every label, chart title and tooltip where either word appears.
- Underlying identifiers and CSV column names are unchanged (this is a presentation change only).
- A glossary entry exists for each retained technical term (feeds T21).
**Depends on** — nothing. **Decision needed from** — WP1 (KPI group names) + WP5/T5.2 (MCDA terms). **Effort** — S. **Owner** — WP1 + WP5.

---

### T05 · Evidence-strength badge and "association, not cause" wording
**Impact** — Answers the most intellectually serious comment — the PO's suggestion that a counter-intuitive result means the underlying data is erroneous. The honest answer is to qualify the result at the point it is read, not to remove it. Also the gate that lets the Insights experience show model output at all.
**Answers** — PO p. 9.
**Scope** — Display rule + copy. Front-end only. **No model change.**
**Affects** — `src/components/react/ImpactAnalysis/*` (MeasuresImpact, KpiVariations, KpiGroupVariationDataTable).
**Behaviour** — Every model-derived figure carries an **evidence-strength badge** derived from the number of cities and KPI observations behind it, plus a short qualifier naming the number of cities. Replace "impact" and "contribution" with **"statistical association"** wherever the figure comes from the regression. The existing page-bottom disclaimer stays but is no longer the only caveat.
**Acceptance criteria**
- Every coefficient, ranking position and impact figure on the public site displays a strength badge and the supporting city count.
- The badge has at least three levels with a documented, reproducible threshold.
- The words "impact" and "contribution" no longer describe a regression output in public copy.
- Badge levels and their thresholds are documented on the Methods & quality page (T21).
**Depends on** — T04 (vocabulary). **Decision needed from** — WP5 / T5.2, on the threshold definition. **Effort** — M. **Owner** — WP5 / T5.2.

---

### T06 · City status, map legend and data-pending empty state
**Impact** — Answers the PO's very first comment, and is the reconciliation the consortium needs between "remove cities without data" and "attract more contributing cities". Also unblocks the Insights city list.
**Answers** — PO p. 1.
**Scope** — Display rule + labels. Front-end only. No city record is deleted.
**Affects** — `src/components/react/LivingLabsMapSection.tsx`; city catalogue; `/living-lab-city/[labId]`.
**Behaviour** — Two independent visual dimensions on the map and in every city listing: **symbol** distinguishes *SUM Living Lab* from *contributing city*; **colour** distinguishes *has before/after data* from *data pending*. A city with no published data opens on a **"Registered — no data published yet"** panel stating its registration date, instead of an empty dashboard. A legend is always visible, and status is never carried by colour alone.
**Acceptance criteria**
- The map legend names all four combinations and is visible without interaction.
- Every city listing states the city's type and data status in text, not only by colour or symbol.
- A city with zero published KPIs renders the data-pending panel and no empty charts.
- No city page returns a 404 or an empty shell.
**Depends on** — T03 (data status is derived from the same rule). **Decision needed from** — consortium (T1.4 leader), to confirm the terminology. **Effort** — M. **Owner** — WP5.

---

### T07 · Plain-language reading, period and freshness on every KPI
**Impact** — Answers two comments and is what makes the Insights experience possible at all — a curated page is worthless if its cards are as opaque as today's. The cost here is writing, not code.
**Answers** — PO pp. 2, 4.
**Scope** — Content + display. Front-end only.
**Affects** — Every KPI card component; the KPI definition catalogue as rendered publicly.
**Behaviour** — Each KPI card carries, in addition to its existing definition tooltip: a **one-line plain-language reading** stating what a rise or fall means (e.g. *"higher means more trips shifted away from private car"*), the unit, the reporting period, the city, and a **"last updated"** date. Direction of "good" is stated where one exists, and explicitly stated as not applicable where it does not.
**Acceptance criteria**
- All 28 KPI definitions have an approved one-line reading; none is auto-generated from the definition text.
- Every card on every public page displays reading, unit, period, city and last-updated.
- Where a KPI has no meaningful "good" direction, the card says so rather than omitting it.
**Depends on** — T04. **Decision needed from** — WP1, to author and approve the 28 readings. **Effort** — M (writing-dominated). **Owner** — WP1 (content) + WP5 (rendering).

---

### T08 · Curated default domain set in the impact analysis
**Impact** — Answers the PO's explicit request to simplify the analysis entry point, and defines the domain subset the Insights goal pages will reuse.
**Answers** — PO p. 7.
**Scope** — Display default + data mapping. Front-end only. No domain is removed from the model.
**Affects** — `/tools/impact_analysis` domain selection panel.
**Behaviour** — The page opens on a curated set of domains relevant to NSM uptake. The remaining domains — including those dominated by private-car modes — stay available behind an explicit **"Show all domains"** control. The curated set is defined once and reused by the Insights goal pages (T15).
**Acceptance criteria**
- Default view shows only the curated set; the count of hidden domains is stated on the control.
- Every domain remains reachable in one click.
- The curated list is defined in one place and consumed by both the tool and the goal pages.
**Depends on** — T04. **Decision needed from** — WP1 + WP5, jointly, on the membership of the curated set. **Effort** — S. **Owner** — WP5.

---

### T09 · Split and correct the platform counters
**Impact** — Small task, disproportionate credibility cost if skipped. The site currently states 11 Living Labs on the homepage, 9 on the measures page and shows 8 with data. That single inconsistency generated the PO's first comment.
**Answers** — PO p. 1; covering note ("document how many cities have signed up and contributed").
**Scope** — Display + data mapping. Front-end only.
**Affects** — Homepage counters; `/data/measures` summary; `/data/kpis` header; impact-analysis intro text.
**Behaviour** — Replace every ambiguous "Living Labs" count with three separately-labelled figures — *SUM Living Labs*, *contributing cities*, *cities with before/after data* — computed from one shared source and consistent on every page that displays any of them. Add a *last data update* value.
**Acceptance criteria**
- No public page displays a city count without saying which of the three it is.
- All three figures derive from a single helper; no hard-coded numbers remain.
- The same figures appear in the trust strip (T12) and the coverage matrix (T19) without divergence.
**Depends on** — T03, T06. **Decision needed from** — WP1 (T1.4), to confirm the definitions for the D1.4 / D6.3 report. **Effort** — S. **Owner** — WP5.

---

## 2. Wave B — The experience split

### T10 · Experience mechanism: route ownership, menus, switch
**Impact** — Foundation for Wave B, C and D. Nothing else in the experience split can be specced until this is settled. Low effort, high leverage.
**Answers** — Covering note ("the website needs to be simplified"); enables T11–T18.
**Scope** — Front-end routing and layout. No route is moved or renamed.
**Affects** — `src/layouts/Layout.astro` (`menuItems`, `footerMenuItems`); `src/components/react/ui/SiteNavBar.tsx`.
**Behaviour** — Per rule **G1**, every public route declares the experience it belongs to. Arriving at a route sets the active experience and renders that experience's menu. The switch is a segmented control, present in the header on every public page, naming both experiences and marking the active one. Activating the switch navigates to the counterpart route where one is defined, and to the other experience's home where none is. Experience is also expressible in the URL (`?view=…`) so links and screenshots are reproducible for D1.4. Shared surfaces — Resources, FAQ, legal, add-your-city, login — belong to no experience and keep whichever menu the visitor arrived with.

**Route ownership table — to be confirmed and completed during speccing:**

| Route | Experience |
|---|---|
| `/` | Landing — neither |
| `/data/kpis`, `/data/modal-split`, `/data/measures` | Data |
| `/tools/impact_analysis` | Data |
| `/tools/mcda_analysis/*_qualitative/*`, `*_quantitative/*`, `user_personalized/*` | Data |
| `/living-lab-city/[labId]` | Data (full series) |
| `/data/collection-plan` | Data (Methods) |
| new Insights routes (T13–T18) | Insights |
| `/tools/resources/*`, `/faq`, `/legal-notice`, `/privacy-policy` | Shared |

**Acceptance criteria**
- Every public route resolves to exactly one experience or is explicitly shared.
- Landing on any route directly, with no prior state, renders a coherent menu — never an empty or default-wrong one.
- The switch is present and correctly marked on every public page.
- No route changes path as a result of this task.
- Counterpart mapping is data, not hard-coded conditionals scattered through components.
**Depends on** — nothing. **Decision needed from** — consortium, to confirm Version C. **Effort** — M. **Owner** — WP5.

---

### T11 · Main landing homepage
**Impact** — The page that sets a reviewer's first impression and the only page carrying the "what is this platform" job. Also where the curation and sign-up answers become visible.
**Answers** — Covering note (simplification; who curates; how many cities contributed).
**Scope** — New page composition from existing content. Front-end only.
**Affects** — `src/pages/index.astro`.
**Behaviour** — One landing page belonging to neither experience. Blocks, in order: hero stating what a visitor can do; the **two experience doors** as the primary content; the **trust strip** (T09 counters + last update + named curator); a map teaser linking to the city catalogue; add-your-city; a shared footer strip. The current 6-tile "Platform features" grid is replaced by the two doors. The mobility-types illustration row becomes hero decoration rather than a standalone section. See `ODP_V3_homepage_sketch.html` screen ①.
**Acceptance criteria**
- The two doors are the largest element below the hero and each names its audience and its three entry pages.
- The trust strip shows six labelled figures and a named curating role.
- No content currently on the homepage is lost — each block is either retained, merged or re-homed, and the spec states where.
**Depends on** — T09, T10. **Decision needed from** — consortium, on the curator role (blocking — see §5.3). **Effort** — M. **Owner** — WP5.

---

### T12 · Insights menu and experience shell
**Impact** — Defines the decision-maker surface. Deliberately four items; the constraint is the design.
**Answers** — Covering note (simplification).
**Scope** — Front-end. **Affects** — `Layout.astro` menu definitions.
**Behaviour** — Insights menu: **What works · Cities · Plan for my city · Join & resources**. No sub-menus deeper than one level. The experience's footer carries the persistent cross-link to Data & scientific tools.
**Acceptance criteria** — Menu renders on every Insights route; no item leads to a Data-experience route without the switch changing state; the cross-link is present on every Insights page.
**Depends on** — T10. **Effort** — S. **Owner** — WP5.

---

### T13 · Insights homepage — goal-led entry
**Impact** — The single most visible expression of the whole redesign, and the direct answer to the PO's demand for a logical relationship between measures and impacts. The relationship becomes the organising principle of the page.
**Answers** — PO p. 9 (framing); covering note (simplification).
**Scope** — New page. Data mapping only — **no new model, no new data class** (rule G5).
**Affects** — New route under the Insights experience.
**Behaviour** — Hero asks *"What do you want to achieve in your city?"* followed by goal cards, each showing the count of associated measures and contributing cities. Below: a **Top findings** block of three plain-language findings with evidence-strength badges (T05), a map of cities that have evidence (T06), and the cross-link to the Data experience. See sketch screen ②.

**Proposed goal → KPI-group mapping — to be confirmed by WP1 during speccing:**

| Goal | KPI groups |
|---|---|
| Reduce private car use | Modal split — private car; all private modes |
| Increase public transport use | Modal split — public transport; PT with NSM |
| Cut emissions | Environment |
| Improve accessibility | Travel time |
| Improve safety & comfort | Safety & comfort |
| Reduce travel cost | Cost of travel |

> ⚠️ **Open mapping question for the analyst to resolve with WP1.** Three groups have no home in the six goals above: *Social outcomes*, *Local economy*, and the *sustainable private modes* / *NSM* modal-split groups. Either a seventh goal is added, or they fold into an existing goal, or they remain Data-experience only. This must be decided before the goal pages (T15) are specced — it changes the template's input.

**Acceptance criteria**
- Every goal card links to a goal page and states its measure and city counts from live data.
- No goal card is rendered for a goal with no qualifying evidence.
- Top findings are sentences, each carrying a strength badge and city count; none falls below the T05 threshold.
- The page contains no implementation-record indicator, no single-estimation series, and no untranslated technical term.
**Depends on** — T03, T04, T05, T08, T10, T12. **Decision needed from** — WP1, on the mapping and the open question above. **Effort** — L. **Owner** — WP5 (build) + WP1 (mapping).

---

## 3. Wave C — Insights pages

### T14 · Insights city profile
**Impact** — The page a planner will actually send to a colleague. Also resolves the one genuinely contested surface between the two experiences.
**Answers** — PO pp. 1, 2, 4.
**Scope** — New curated page. The existing `/living-lab-city/[labId]` is **unchanged** and remains the Data-experience view (rule G3).
**Behaviour** — Four sections: **Overview** (context, what the city did in three sentences, headline result, last updated), **What they did** (push/pull measures with local description and start date), **Results at a glance** (outcome KPIs only, under T03 and T02), **Lessons & documents** (T17). Cities without data show the T06 panel. Counterpart-linked to the Data city page.
**Acceptance criteria** — Contains no implementation-record indicator and no single-estimation chart; every figure carries its T07 reading; the counterpart link resolves to the same city in the Data experience.
**Depends on** — T02, T03, T06, T07, T10. **Effort** — L. **Owner** — WP5.

---

### T15 · Goal pages
**Impact** — Where the evidence actually lives for a decision maker. One template, six instances.
**Answers** — PO pp. 8, 9, 12, 13.
**Scope** — New page template. Data mapping over existing impact-analysis output.
**Behaviour** — For a goal, list the measures associated with progress on its KPI groups, ranked by strength of evidence. Each measure card: what it is, how many cities implemented it, what happened, evidence-strength badge, contributing cities linking to their profiles. Cross-link to the same domain in the full impact analysis.
**Acceptance criteria** — Rankings derive from the existing impact-analysis output with no recomputation; nothing below the T05 threshold appears; every measure name is a plain-language name (T04); the counterpart link opens the corresponding domain in the Data experience.
**Depends on** — T05, T08, T13. **Decision needed from** — WP1 (mapping, per T13). **Effort** — L. **Owner** — WP5.

---

### T16 · Plan for my city — guided decision tool
**Impact** — Answers the two MCDA comprehension comments by never showing a decision maker a raw score matrix. The expert routes already exist and are untouched.
**Answers** — PO pp. 11, 12, 13.
**Scope** — New guided entry. Existing MCDA routes unchanged.
**Behaviour** — Three questions (city context, priority, constraints) produce a ranked shortlist with plain-language reasons. An "open in expert mode" control carries the same configuration into the existing tool in the Data experience. No PROMETHEE vocabulary in the guided path; a worked example is shown before any empty input.
**Acceptance criteria** — A visitor reaches a shortlist without encountering an empty matrix or an untranslated term; the expert hand-off preserves the configuration; guided results and expert results for the same inputs agree.
**Depends on** — T04, T05, T10. **Effort** — L. **Owner** — WP5 / T5.2.

---

### T17 · Lessons & documents from the Resources library
**Impact** — Answers the "why is this trending in the wrong direction" comment **without a data-model change**, by using a link type the Resources library already supports.
**Answers** — PO p. 4.
**Scope** — Rendering only. Uses the existing resource→Living-Lab / measure / KPI-definition association (D1.4 §4.3.8). **No new field, no migration.**
**Behaviour** — Resources associated with a city, a measure or a KPI definition render on the Insights city profile as *Lessons & documents*, and beside the relevant chart where the association is to a KPI. Each entry shows its date. Absence renders as nothing, not as an empty section.
**Acceptance criteria** — No schema change is required to ship this; entries appear in both locations from a single association; a city with no associated resources shows no empty block.
**Depends on** — T14. **Decision needed from** — WP1, on who authors the first set of notes. **Effort** — M. **Owner** — WP5 (render) + WP1 (content).

---

### T18 · Join & resources
**Impact** — The contribution path is currently a homepage section with no page of its own; the PO's covering note treats growing the contributor base as the platform's main value.
**Scope** — New page composed from existing homepage content + the Resources library + FAQ links.
**Behaviour** — Contribution steps condensed from the current five, the Resources library, and the FAQ entry point.
**Acceptance criteria** — Every step currently on the homepage is present or explicitly merged; the page is reachable from both experiences.
**Depends on** — T10, T11. **Effort** — S. **Owner** — WP5.

---

## 4. Wave D — Data experience

### T19 · Data homepage and coverage matrix
**Impact** — The coverage matrix answers *"why are there no new data beyond 2023?"* once and honestly, instead of letting a reviewer rediscover it city by city. Highest-value item in this wave.
**Answers** — PO pp. 5, 6; covering note (how many cities contributed).
**Scope** — New page. Data mapping over existing KPI results.
**Behaviour** — A console rather than a brochure: status tiles (observations, cities with before/after, model quality, last model run, KPI definitions), the **coverage matrix** of cities × KPI groups × periods, quick links to the existing dashboards and tools, downloads and methods entry, and the cross-link to Insights. Matrix cells are labelled in text — colour never carries the meaning alone. See sketch screen ③.
**Acceptance criteria**
- Matrix states three distinct states per cell (before & after / baseline only / none) in text as well as colour, with a visible key.
- Figures agree with T09 counters and with the T03 rule — a cell marked chartable is chartable everywhere.
- Every existing dashboard and tool is reachable from this page.
**Depends on** — T03, T09, T10. **Effort** — L. **Owner** — WP5.

---

### T20 · Downloads page
**Impact** — Converts the PO's *"what is the intent of these downloads?"* from a complaint into a documented offer. Pairs with T01 — the fix without the explanation only half-answers the comment.
**Answers** — PO p. 10 (first half).
**Scope** — New page. Existing in-page CSV buttons retained.
**Behaviour** — One page listing every downloadable file with its content, schema, coverage, period and licence, and exposing the underlying KPI series rather than only analysis output.
**Acceptance criteria** — Every download offered anywhere on the site appears here with its schema; each file's description states what it does *not* contain; existing per-card buttons still work.
**Depends on** — T01, T10. **Effort** — M. **Owner** — WP5.

---

### T21 · Methods & quality section
**Impact** — Contains the page that answers the PO's direct question about data curation — a question that currently has no page to point at. Also removes the long preambles that today sit between a visitor and the data.
**Answers** — Covering note (who curates and reviews the data); PO pp. 11, 12.
**Scope** — New pages, composed by splitting existing in-page content. Nothing is deleted.
**Behaviour** — Six entries: **Evaluation framework (SIEF)** — split from the `/data/kpis` intro; **How the data is collected** — the existing `/data/collection-plan`; **Data quality & curation** — new, stating the validation workflow of D1.4 §4.3.4–4.3.5, the named curating role, the review cadence, and the display rules T02/T03/T05; **How the models work** — split from the impact-analysis and MCDA preambles; **Limitations** — likewise; **Glossary** — the retained technical terms from T04. FAQ is promoted out of the footer into this section.
**Acceptance criteria**
- Each new page's source content is identified, and the page it came from links to it rather than repeating it.
- Data quality & curation names a role and a cadence — not a placeholder.
- Every term retained in a tooltip by T04 has a glossary entry.
- The FAQ is reachable from a menu, not only the footer.
**Depends on** — T02, T03, T04, T05, T10. **Decision needed from** — consortium, on the curator role and cadence (blocking — see §5.3). **Effort** — L. **Owner** — WP5 (build) + consortium (governance content).

---

### T22 · MCDA perspective comparison
**Impact** — Answers the comment by making the convergence between perspectives an explicit finding rather than an unexplained redundancy. Lowest impact of the in-scope tasks; the feature is retained either way.
**Answers** — PO p. 13.
**Scope** — New view over existing results.
**Behaviour** — Default to one perspective. Add a comparison view that surfaces where the three perspectives **disagree**, and states explicitly when they converge.
**Acceptance criteria** — All three perspectives remain individually reachable; the comparison states convergence in words when rankings agree within a documented tolerance.
**Depends on** — T04. **Effort** — M. **Owner** — WP5 / T5.2.

---

## 5. Deferred, blocked and out of scope

### 5.1 ⛔ Out of scope — record as recommendations in D1.4

| Item | Why it is out | Where it goes |
|---|---|---|
| Per-KPI comment field for Living Lab editors, with date (WP1 leader's "Lessons learned" proposal) | Changes the data structure and the editor space (G4) | D1.4 recommendation. T17 delivers the front-end-only phase 1. |
| Any change to the regression or PROMETHEE-GAIA models | Model change, not presentation | Documented as a limitation via T05 and T21 |
| Changes to the Living Lab editor space or admin back-office | G4 | — |
| Deleting any city, page or KPI | G2 | Replaced by status, labelling and curation (T02, T06) |

### 5.2 Content debt that no task can absorb
Filling the gaps the coverage matrix (T19) will expose — cities with baseline-only data — is a **data-collection** activity for WP1 and the Living Labs, not a website task. The roadmap makes the gaps visible; it cannot close them. State this explicitly in the PO response.

### 5.3 🚧 Blocking decisions — needed before speccing the tasks listed

| Decision | Blocks | Owner |
|---|---|---|
| Confirm Version C | T10–T22 | Consortium |
| Name the data curator and review cadence | T11, T21 | Consortium |
| Confirm "SUM Living Lab" vs "contributing city" terminology | T04, T06 | T1.4 leader |
| Resolve the goal → KPI-group mapping gap (§T13) | T13, T15 | WP1 |
| Confirm defect fixes are permitted despite the backend scope boundary | T01 | Consortium |
| Confirm the evidence-strength threshold definition | T05, T13, T15 | WP5 / T5.2 |

---

## 6. Summary table

| ID | Task | Wave | Effort | Answers | Depends on |
|---|---|---|---|---|---|
| T01 | Fix KPI results CSV export | A | S | p.10 | — |
| T02 | Split implementation record from impact evidence | A | M | p.3, covering note | — |
| T03 | Data-sufficiency display rule | A | M | pp.5,6,9 | — |
| T04 | Public vocabulary rename | A | S | pp.3,8,11,12 | — |
| T05 | Evidence-strength badge & wording | A | M | p.9 | T04 |
| T06 | City status, map legend, empty state | A | M | p.1 | T03 |
| T07 | Plain-language reading & freshness | A | M | pp.2,4 | T04 |
| T08 | Curated default domain set | A | S | p.7 | T04 |
| T09 | Split and correct the counters | A | S | p.1, covering note | T03, T06 |
| T10 | Experience mechanism | B | M | simplification | — |
| T11 | Main landing homepage | B | M | covering note | T09, T10 |
| T12 | Insights menu and shell | B | S | simplification | T10 |
| T13 | Insights homepage — goal-led | B | L | p.9, simplification | T03,04,05,08,10,12 |
| T14 | Insights city profile | C | L | pp.1,2,4 | T02,03,06,07,10 |
| T15 | Goal pages | C | L | pp.8,9,12,13 | T05, T08, T13 |
| T16 | Plan for my city — guided tool | C | L | pp.11,12,13 | T04, T05, T10 |
| T17 | Lessons & documents | C | M | p.4 | T14 |
| T18 | Join & resources | C | S | covering note | T10, T11 |
| T19 | Data homepage & coverage matrix | D | L | pp.5,6, covering note | T03, T09, T10 |
| T20 | Downloads page | D | M | p.10 | T01, T10 |
| T21 | Methods & quality section | D | L | covering note, pp.11,12 | T02,03,04,05,10 |
| T22 | MCDA perspective comparison | D | M | p.13 | T04 |

**Minimum credible response to the PO:** T01 through T09 (Wave A). These are version-independent, answer eleven of the sixteen comments, and require no consortium decision beyond the terminology and the T01 scope flag. Everything from T10 onward is the structural response and depends on Version C being confirmed.