---
note_type: Job
name: Staff/Principal Software Engineer — AI Platform (contract)
company: Just Whole Care
source: Wellfound
source_id: "4751482"
url: https://wellfound.com/jobs/4751482-staff-principal-software-engineer-ai-platform-contract
company_url: https://wellfound.com/company/just-whole-care
compensation: $312k – $340k • No equity
equity: No equity
job_type: contract
remote: true
locations: California
remote_locations: United States
experience_min: 7
skills: Python, Javascript, Cloud Computing, Distributed Systems, System Design, Backend Development, API, Github, Google Apps, Docker, Google Cloud Platform, CI/CD, Observability, Generative AI, Retrieval-Augmented Generation (RAG)
posted_at: 2026-09-22T23:26:30.000Z
captured_at: 2026-09-24T13:39:54.617Z
status: new
fit_score: 10
fit_recommendation: STRONG_PASS
fit_required_match: 1.00
fit_overall_match: 0.93
fit_primary_stack: Python, Google Cloud Platform, Docker
fit_missing_skills: 
fit_have_skills: Python, Backend Development, Distributed Systems, System Design, AWS, Docker, CI/CD concepts, REST APIs, Git, Unit & integration testing, JavaScript, Observability, Communication, Code review
fit_familiar_skills: Generative AI, Retrieval-Augmented Generation (RAG)
fit_dont_have_skills: 
fit_summary: This is a strong fit for your seniority and technical depth. You have all core skills (Python, distributed systems, GCP-adjacent cloud, Docker, CI/CD, observability, testing) and the role explicitly values judgment over narrow expertise—exactly your strength. The main gap is hands-on GCP experience, but the posting treats that as secondary to systems thinking. Lead with your 25+ years stabilizing complex systems and your ability to say no to unnecessary complexity; the CEO coordination and incident-response aspects align perfectly with your background.
fit_early_exit: false
fit_model: claude-haiku-4-5
fit_evaluated_at: 2026-09-24T13:40:08.726Z
---

Just Whole Care (JWC) is a California health-equity consulting firm building Assessment Lab (AL), an AI-assisted platform our team uses to turn complex organizational, financial, clinical, policy and operational evidence into assessments, decision tools, financial models and client deliverables.

We are looking for a genuinely senior software engineer for a bounded, part-time contract engagement to stabilize and simplify AL and help us successfully deliver the next phase of the product for two active client engagements.

This is not a greenfield build and not a mandate to redesign the platform.

AL already works across Python, Google Cloud Run services and jobs, Google Cloud Storage, Google Apps Script and Sheets, document retrieval and parsing, multiple LLM providers, cached model artifacts, durable job state, release bindings and AI-assisted development through Cursor.

Our immediate need is an engineer senior enough to understand that system as a whole, make it substantially more reliable and simpler to operate, and say no when more code or architecture is not the right answer.

**Initial engagement**

We expect approximately **60–70 hours of work**, generally **5–10 hours per week**, with somewhat heavier involvement at the beginning and flexibility around releases or production incidents.

Target contract rate: **$150–$165/hour**, depending on experience.

There may be follow-on work if it is valuable to both sides, but this is not being presented as a full-time position.

**Your first mandate: make AL boring**

Before adding significant new functionality, you will help us make the existing system predictable:

**Make assessment runs reliable.**
A new real-world organization should be able to enter AL, progress through its stages, checkpoint safely, resume when necessary and complete without routine engineering intervention.

**Make recovery simple.**
Failures should be diagnosable and recoverable without stale workers, stuck state or manual command-line archaeology.

**Make releases routine.**
We want one reproducible, safe release path with automatic agreement across the relevant Cloud Run, job and Apps components, clear rollback and fewer environment- or credential-specific surprises.

**Improve observability.**
We should be able to tell quickly where an assessment is, how long it has been there, what it has cost, what failed and whether a human actually needs to intervene.

**Freeze important interfaces.**
Help us stop repeatedly changing core data, evidence and product contracts while client-facing capabilities are being built on top of them.

**Reduce complexity.**
Identify experimental, duplicate or unnecessary paths that do not help current client delivery. Turn them off, defer them or recommend later removal rather than building around them.

**Then help us finish the client-critical product work**

Once the critical run/release foundation is dependable, you will help productize the specific AL capabilities required for our current Safe &amp; Sound and Compass engagements.

These include structured baseline and data-quality outputs, funding and billability decision tools, non-duplication and funding-braid logic, useful financial modeling and pro formas, implementation tools, cross-assessment synthesis and related staff-facing workflows.

Our healthcare, policy, finance and consulting experts own the domain meaning. Your role is to turn those requirements into dependable software without creating unnecessary platform complexity.

**How we use AI development tools**

JWC uses Cursor and advanced language models extensively in engineering.

We are not hiring someone simply to type code that an AI agent can produce.

We need someone who can:

* determine the smallest correct engineering change;
* give AI coding agents clear, bounded work;
* review what they actually built;
* identify system-level failure modes that local code review misses;
* stop unnecessary refactors, frameworks and speculative development;
* decide when existing behavior should be reused instead of rebuilt;
* get approved work through testing, release and production verification; and
* reduce total engineering and model spend rather than adding another management layer.

A major measure of success is that the CEO spends less time coordinating ChatGPT, Cursor, releases and engineering incidents.

**What we're looking for**

You likely have:

* 7+ years of professional software engineering experience, with Staff-, Principal- or equivalent senior technical ownership.
* Strong hands-on Python experience.
* Strong backend and distributed-systems judgment.
* Production experience with Google Cloud Platform or comparable cloud infrastructure.
* Experience with containerized services, asynchronous jobs, durable state, checkpointing/retry patterns and distributed failure recovery.
* Strong experience with CI/CD, release engineering, observability and production incident response.
* Experience debugging systems that cross application code, cloud infrastructure, APIs, storage and external services.
* Strong automated testing skills and the judgment to know which tests actually prove production behavior.
* Comfort inheriting substantial existing code and simplifying it without breaking working behavior.
* Excellent judgment about when not to build something.
* Ability to communicate technical decisions clearly to a non-engineer CEO and domain experts.
* Willingness to take a problem from diagnosis through tested, deployed resolution rather than handing off implementation fragments.

**Helpful but secondary**

Experience with any of the following is valuable, but we would choose excellent systems judgment over narrow expertise in these areas:

* modern LLM APIs and AI-enabled applications;
* RAG, document retrieval or evidence-grounded AI;
* AI coding agents such as Cursor;
* Google Cloud Run, Cloud Build and GCS;
* Google Workspace APIs, Google Sheets or Apps Script;
* structured LLM outputs, model evaluation and provider failover;
* document extraction or Document AI;
* healthcare, Medicaid or other regulated/sensitive-data environments;
* spreadsheet or financial-modeling applications.

**This role is not a fit if**

Your instinct when inheriting a complicated system is to start over.

It is also probably not a fit if your primary expertise is prompt engineering, ML research, frontend design or infrastructure in isolation.

We need an engineer who enjoys taking a system that has accumulated too many moving parts and making it smaller, clearer and reliably useful.

**What success looks like**

By the end of the initial engagement:

* ordinary AL assessments complete without routine engineering intervention;
* stalled work has a straightforward recovery path;
* releases are reproducible and substantially less fragile;
* we can quickly see assessment state, failure, duration and meaningful cost;
* important interfaces stop changing underneath client-facing development;
* unnecessary development paths have been identified and deferred or disabled where appropriate;
* the Safe &amp; Sound and Compass capabilities that actually require engineering are working;
* Cursor and model spend are materially better controlled;
* development requires substantially less CEO orchestration; and
* AL is easier for the next engineer to understand than it was when you arrived.
