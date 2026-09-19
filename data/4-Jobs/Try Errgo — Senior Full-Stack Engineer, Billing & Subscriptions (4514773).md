---
note_type: Job
name: Senior Full-Stack Engineer, Billing & Subscriptions
company: Try Errgo
source: Wellfound
source_id: "4514773"
url: https://wellfound.com/jobs/4514773-data-engineer-ingestion-change-data-capture-clone
company_url: https://wellfound.com/company/try-errgo
compensation: $160k – $200k • No equity
equity: No equity
job_type: full_time
remote: true
locations: San Francisco
remote_locations: 
experience_min: 5
skills: .NET, C#, xunit
posted_at: 2026-07-25T05:08:21.000Z
captured_at: 2026-09-19T15:17:20.210Z
status: deleted
status_updated_at: 2026-09-19T15:17:26.964Z
deleted_reason: missing_skills
deleted_reason_other: 
missing_skills: .NET, C#, xunit
deleted_auto: true
fit_score: 1
fit_recommendation: SKIP
fit_required_match: 0.40
fit_overall_match: 0.40
fit_primary_stack: .NET, C#
fit_missing_skills: .NET, C#, xunit
fit_have_skills: State machines, Date math
fit_familiar_skills: 
fit_dont_have_skills: .NET, C#, xunit
fit_summary: "This role fails the hard screen: it requires strong C# and .NET expertise, which are in your Tier 4 (do not have) category. While the ownership model is excellent—you'd own the subscription engine end-to-end—and the compensation is strong, the core tech stack is a fundamental mismatch. Your strongest selling point if you were to apply would be your 25+ years of full-stack experience and deep understanding of state machines and financial logic, but the C#/.NET requirement is a blocker."
fit_early_exit: true
fit_model: claude-haiku-4-5
fit_evaluated_at: 2026-09-19T15:17:26.964Z
---

We sell seat-based plans, billed monthly or annually, and the money math behind every plan change has to be exactly right. We're hiring a senior engineer to own the subscription engine: a pure core that takes the current subscription, a change request, and a point in time, and returns the proration plus the new state. This is subscription and proration logic, not invoice rendering or usage metering.

What you'll do:

* Get proration correct across mid-cycle upgrades and downgrades, seat changes, trial conversions, pauses, and cancellations with refunds
* Make the real judgment calls: how you count days, how you round, and when a downgrade is a credit versus a refund
* Guard against illegal state transitions so a subscription can't end up somewhere it shouldn't
* Keep everything deterministic, with money in decimal and time passed in rather than read from the clock

What we're looking for:

* Strong C# and .NET, with real care around decimal money and rounding
* Experience with state machines and date math
* Enough restraint to keep this a proration engine instead of growing it into a full billing system

Nice to have:

Background in billing or subscriptions, and comfortable designing an immutable, functional core
