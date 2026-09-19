---
note_type: Job
name: Backend Engineer
company: Elaborate
source: Wellfound
source_id: "3137067"
url: https://wellfound.com/jobs/3137067-backend-engineer
company_url: https://wellfound.com/company/weareelaborate
compensation: $130k – $160k • 0.0% – 0.4%
equity: 0.0% – 0.4%
job_type: full_time
remote: true
locations: New York City
remote_locations: United States
experience_min: 4
skills: Python, PostgreSQL, HL7 Integration, Fhir, Semantic Interoperability (HL7, FHIR)
posted_at: 2026-06-25T16:42:24.000Z
captured_at: 2026-09-19T15:18:48.817Z
status: deleted
fit_error: parse_failed
status_updated_at: 2026-09-19T17:34:13.042Z
deleted_reason: not_interested
deleted_reason_other: 
missing_skills: 
deleted_auto: 
---

***US-based applicants only. Unfortunately, our  contracts do not allow for hires outside of the United States. ***

# Overview

Every health system is racing to adopt AI, yet most of it sits unused. The problem isn't that the models are weak. It's that they're generic. 

The reality is, clinicians don't all practice the same way. The same patient may be managed differently depending on a physician's training, specialty, local protocols, risk tolerance, and years of experience. Those differences aren't noise; they're clinical judgment.

Most applications of AI ignore that reality. They give every clinician the same answer, making it useful for everyone in theory, but trusted by no one in practice.

We believe the future isn't a smarter generic model. It's infrastructure that curates AI and automation to the individual clinician. AI should understand who it's working for - how that doctor practices, what they escalate, the exceptions they make, how they talk to their patients, what they consider alarming vs. not, etc - and power automation that reflects those decisions.

That's why we built the Clinical Context Layer: a framework that captures how care actually varies and uses that knowledge to personalize AI and automation at scale.

We started with one of healthcare's biggest pain points: the clinical inbox. Every day, clinicians are buried under messages while patients wait for responses. By personalizing automation to how each clinician actually practices, we've built AI that doctors trust enough to leave turned on—with an opt-out rate below 0.001% and no-edit/full clinician agreement rate of &gt;97%. 

Today, Elaborate is trusted by leading health systems including Cedars-Sinai, Northwestern, and Community Health Network, and backed by Tusk Ventures, Founder Collective, Bling Capital, and Arkitekt Ventures.

The inbox is just the beginning. Our ambition is much larger: to build the personalization layer that makes AI useful for every clinician, across every workflow, and ultimately every patient.

Join us.

# **What you'll own:**

**The architecture of our clinical context layer:** Partner with the clinical programming team to own the technical architecture of our clinical context layer - the full system of rules, guardrails, preferences, and configurations that comprise our clinical logic. That means adding new factors and data points into the reasoning layer, retiring logic that no longer scales, refining how configurations interact with one another, and managing client- and cohort-level customizations so the system stays coherent as it grows. You are the technical owner of the rule system; the clinical team is the expert authoring inside it.

**The infrastructure powering clinical operations:** Today, much of our clinical QA, onboarding, and ongoing data curation relies on expert judgment and manual review. Your job is to build &amp; own the systems that change that. Examples include automated marker mappings, automated alerting, safety rails to prevent a well-meaning global configuration change from breaking a client customization, tooling that surfaces gaps in the engine, and refining the logic behind our feedback loops. The goal is to build the system that lets the clinical programming team own and evolve the logic directly with minimal manual &amp; rote processes. 

**Healthcare data integrations:** Own client integrations end-to-end, from standing up HL7, FHIR, or API connections, to representing Elaborate on technical implementation calls, to customizing the configuration logic that embeds our system into the EMR (print groups, TAOs, and the client-specific quirks that never appear in the spec). Your ownership extends beyond initial implementation to building and scaling our AWS infrastructure and shipping alerting and logging that catches the integration the moment it breaks. Compliance, performance, and observability are part of your expected scope of work. 

# **Who you are:**

**You've built technical systems with non-technical domain experts:** This is the filter we care about most. You've worked closely with someone who holds the "rules" (e.g. a doctor, nurse, lawyer, accountant, compliance officer, scientist, policy expert) and your job was to pair their knowledge with infrastructure that made it work at scale. You know what it feels like to sit with a domain expert for an hour and come away with a different mental model than you started with. You know how to ask the question that surfaces the edge case. You know that "what did you actually mean by that" is the most important sentence in the room. This is not "I went to meetings with stakeholders." You translated expert judgment into a system that ran without them.

**You have expertise in building systems vs. patches:** You're infrastructure-minded. Faced with a messy, evolving problem, you reach for the durable system, even when you have to put a bridge in place to get through today. You know the difference between "FHIR is set up" and "FHIR is set up, the data elements are landing correctly, and everything maps to our system the way we expected." We don't need a devops engineer. We need someone who, when they see a process that doesn't scale, raises their hand with a concrete idea for the system that would replace it. You're comfortable with distributed systems, queues, workers, data pipelines, and the class of problems that emerge when data and correctness both matter at the same time.

**You’ve been a large part of a small team:** You’ve worked at a startup before, and you’ve had significant ownership over a product. You are capable of directing the majority of your time and energy. You’re excited that there are not multiple layers of management above you, and you’re down to step up as needed. You have 0 ego - there is no work that is “below you”, and you’re excited to do what’s right to push the business in the right direction. 

# **Most likely, you have:**

- 3-4+ years backend experience
- Deep understanding of full-stack architecture
- Some healthcare exposure 
- Some experience incorporating LLMs in production
- Some experience being a self-starter or working at a small company 

***Note: Please do not apply if you do not live in the US. We are unable to hire anyone who does not reside in the United States due to our client contracts.***

# **Our stack:**
- Our application layers are written primarily in Python (+ Django) on the backend and Typescript (+ NextJS) on the frontend (internal tools)
- We store data in Postgres, Redis, and S3.
- We monitor our applications with Datadog and Sentry
- Our infrastructure is built on AWS + Docker and Terraform, managing CI/CD through Github Actions
