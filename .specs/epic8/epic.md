# Epic 8: Insights Goal Experience

**Tasks:** T13 (L) → T15 (L) — sequential
**Wave:** B + C
**Total effort:** 2×L
**Dependencies:** After **Epics 2, 3, 4, 6**

---

## Scope

The "what do you want to achieve?" flow — the single most visible expression of the redesign. Built entirely from data mapping over existing impact-analysis output. No new model, no new data class (rule G5).

### T13 — Insights homepage — goal-led entry (first)

New route under the Insights experience.

Page structure:
- Hero: *"What do you want to achieve in your city?"*
- Goal cards — each showing count of associated measures and contributing cities
- **Top findings** block — three plain-language findings with evidence-strength badges (T05)
- Map of cities with evidence (reusing T06 classification)
- Cross-link to Data experience

**Goal → KPI-group mapping (confirmed — no changes to data):**

| Goal | KPI groups |
|---|---|
| Reduce private car use | Modal split — private car; all private modes |
| Increase public transport use | Modal split — public transport; PT with NSM |
| Cut emissions | Environment |
| Improve accessibility | Travel time |
| Improve safety & comfort | Safety & comfort |
| Reduce travel cost | Cost of travel |

Orphaned groups (Social outcomes, Local economy, sustainable private modes/NSM) → **Data-experience only**. No 7th goal.

No goal card is rendered for a goal with no qualifying evidence.

### T15 — Goal pages (second, depends on T13)

One template, six instances — one per goal.

For each goal:
- List of measures associated with its KPI groups, ranked by evidence strength
- Each measure card: description, how many cities implemented it, what happened, evidence-strength badge (T05), contributing city links
- Cross-link to the same domain in the full impact analysis

Rankings derive from the **existing impact-analysis output — no recomputation**.

## Acceptance criteria

- Every goal card links to its page with live measure/city counts from live data
- No goal card renders for a goal with no qualifying evidence
- Top findings are sentences carrying a strength badge and city count; none below T05 threshold
- No implementation-record indicator, no single-estimation series, no untranslated technical term
- Rankings derive from existing output without recomputation
- Every measure name is a plain-language name (T04)
- Counterpart link on each goal page opens the corresponding domain in the Data experience

## PR validation

One PR. Navigate the full goal flow: Insights home → each goal page → cross-link to Data experience.
