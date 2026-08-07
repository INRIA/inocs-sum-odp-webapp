# Epic 10: Guided Decision Tool

**Tasks:** T16 (L)
**Wave:** C
**Total effort:** L
**Dependencies:** After **Epics 3, 4, 6**

---

## Scope

New guided entry to the MCDA tool for the Insights experience. Three questions (city context, priority, constraints) produce a ranked shortlist with plain-language reasons. "Open in expert mode" carries the same configuration into the existing expert tool in the Data experience.

Existing MCDA routes are **untouched** (rule G3).

### Key behaviour

- No PROMETHEE vocabulary in the guided path
- A worked example is shown before any empty input — visitor never faces a blank form
- Expert hand-off: "open in expert mode" preserves the full configuration entered in the guided flow
- Guided results and expert results for the same inputs agree

### Open question for architect

⚠️ The three guided questions (city context, priority, constraints) are defined in the analysis data. **Architect must investigate the data structure and determine the exact question flow when this task starts** before handing to dev.

## Acceptance criteria

- A visitor reaches a ranked shortlist without encountering an empty matrix or untranslated PROMETHEE term
- Expert hand-off preserves the configuration
- Guided results and expert results for the same inputs agree
- A worked example is visible before any input is required

## PR validation

One PR. Walk through the guided flow end-to-end, verify shortlist, then click "open in expert mode" and confirm the configuration is preserved and results match.
