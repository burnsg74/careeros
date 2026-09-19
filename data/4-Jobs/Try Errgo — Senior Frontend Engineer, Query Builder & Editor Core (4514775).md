---
note_type: Job
name: Senior Frontend Engineer, Query Builder & Editor Core
company: Try Errgo
source: Wellfound
source_id: "4514775"
url: https://wellfound.com/jobs/4514775-data-engineer-ingestion-change-data-capture-clone
company_url: https://wellfound.com/company/try-errgo
compensation: $160k – $200k • No equity
equity: No equity
job_type: full_time
remote: true
locations: San Francisco
remote_locations: 
experience_min: 5
skills: TypeScript, Algorithms & Data Structures, Unit Testing
posted_at: 2026-07-25T05:14:44.000Z
captured_at: 2026-09-19T15:17:09.174Z
status: new
fit_score: 10
fit_recommendation: PASS
fit_required_match: 1.00
fit_overall_match: 1.00
fit_primary_stack: TypeScript, React
fit_missing_skills: 
fit_have_skills: TypeScript, React, Unit & integration testing, Data structures, JSON & data serialization
fit_familiar_skills: 
fit_dont_have_skills: 
fit_summary: "You have strong ownership of a focused, high-leverage problem—building the immutable state engine for a query builder—with a clear scope and no equity dilution. The biggest gap is that remote eligibility from Oregon is ambiguous despite the 'remote: true' flag; you'll need to confirm the company allows US-wide remote work. Your 25+ years of experience and deep TypeScript/React expertise make you overqualified for the seniority level, but the problem itself (immutable data structures, undo/redo, command patterns) is exactly in your wheelhouse."
fit_early_exit: false
fit_model: claude-haiku-4-5
fit_evaluated_at: 2026-09-19T15:17:16.981Z
---

Analysts using our product build audiences by stacking up nested filters, things like "country is US and (plan is Scale or seats over 10)", and they expect to undo and redo freely as they go. We're hiring a senior frontend engineer to own the engine behind that builder. It's pure TypeScript, and the React UI just renders and dispatches, so all the real logic is yours.

What you'll do:

* Build immutable operations on a nested AND/OR condition tree: add, remove, duplicate, move, group, validate, and serialize to a stable format
* Build undo and redo as a proper command history, with a bounded stack, coalescing of rapid edits, and a redo stack that clears once a new edit lands
* Make the judgment calls on how aggressively to coalesce edits and how to normalize groups
* Never mutate a caller's tree, and keep ids and time injected so behavior stays predictable

What we're looking for:

* Strong TypeScript and real comfort with immutable, recursive data structures
* Experience implementing undo/redo or a command pattern, plus validation
* Careful, well-typed code and good test habits

Nice to have:

Built a query or segment builder before, and comfortable with serialization and canonical forms
