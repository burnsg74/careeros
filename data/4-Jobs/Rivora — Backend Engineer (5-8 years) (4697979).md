---
note_type: Job
name: Backend Engineer (5-8 years)
company: Rivora
source: Wellfound
source_id: "4697979"
url: https://wellfound.com/jobs/4697979-backend-engineer-5-8-years
company_url: https://wellfound.com/company/rivora
compensation: $135k – $177k • No equity
equity: No equity
job_type: contract
remote: true
locations: Detroit, Los Angeles
remote_locations: United States
experience_min: 5
skills: Ruby on Rails, Go (Golang)
posted_at: 2026-09-10T20:28:39.000Z
captured_at: 2026-09-19T15:11:42.852Z
status: deleted
status_updated_at: 2026-09-19T15:11:51.961Z
deleted_reason: role_mismatch
deleted_reason_other: 
missing_skills: 
deleted_auto: true
fit_score: 0
fit_recommendation: SKIP
fit_required_match: 0.00
fit_overall_match: 0.00
fit_primary_stack: Ruby on Rails, Go
fit_missing_skills: Ruby on Rails, Go
fit_have_skills: 
fit_familiar_skills: 
fit_dont_have_skills: Ruby on Rails, Go
fit_summary: "This role fails the hard screen on role type: it is contract-only, and Greg prioritizes full-time work. The compensation and remote status both pass, but the primary stack (Ruby on Rails and Go) are both in Tier 4—skills Greg does not have. Even if the contract constraint were waived, the 5–8 year seniority gate and the requirement for \"real fluency in Ruby/Rails or Go, ideally both\" would make this a poor fit. The strongest selling point—direct collaboration with a domain-expert CTO on hard, data-scale problems—cannot overcome the fundamental mismatch on contract type and core technical stack."
fit_early_exit: true
fit_model: claude-haiku-4-5
fit_evaluated_at: 2026-09-19T15:11:51.961Z
---

Rivora is the financial brain for third-party logistics (3PL) companies. We model profitable pricing and catch margin leaks for 3PLs with zero integration required. We've raised millions from world-class VCs and work with massive 3PLs and retailers.

You'll work directly with our CTO, who has spent 15+ years deep in 3PL and fulfillment economics, including founding and exiting one of the most respected fulfillment companies in the space.
As a Backend Engineer at Rivora, you’ll build systems that turn messy, high-volume data into reliable outputs. You’ll design APIs, own data workflows, and push performance at scale. You’ll ship fast, debug hard problems, and care about correctness. You’ll also mentor engineers, raise the bar on code quality, and take on growing ownership of systems and team direction.

**What the work actually looks like**
Our core product performs complex predictive analytics on shipment data. We optimize carrier selection, pricing, and routing across carriers and millions of origin-destination pairs. In production today that means nearly 100s of millions (soon to be billions) package records and growing exponentially. The combinatorial surface we're computing against is orders of magnitude larger. 

The stack is Ruby on Rails (primary API and business logic), with a Go service handling our ClickHouse analytical workload over gRPC and a VueJS presentation layer. ClickHouse is in its early days in production and there's substantial room to build on it. Postgres is the transactional backbone, with CDC flowing to ClickHouse. The team is small and everyone shares context; this is not a siloed role.

**What you'll own**
- Core Rails API and backend services. This is where you'll spend most of your time early on, working closely with our CTO on the systems that drive the product
- The Go/ClickHouse analytical layer. Extending existing services and building new ones that replace Rails components where performance demands it
- Data architecture decisions: schema design, partitioning, the OLTP/OLAP boundary, and knowing when a query problem is actually a modeling problem
- Production reliability: monitoring, debugging, and improving a system that has to be correct, not just fast
- Setting the standard for the engineers around you. Leading by example and being someone others can work with and learn from

**What we're looking for**
- 5-8 years building and owning backend systems in production
- Real fluency in Ruby/Rails or Go, ideally both. Our stack is Rails today and Go in the long term. - Strong fundamentals and a track record of picking up new languages and working within their conventions are just as important as current experience
- Experience working with data at scale. Large datasets, high-volume pipelines, performance under real production load. You understand the tradeoffs between transactional and analytical systems and have made deliberate choices about where to put what
- Strong instincts for correctness and traceability. Our outputs affect real business decisions.
- Someone who ships. We're on a tight timeline with investor milestones to hit. Ambiguity is normal here, waiting for perfect specs is not an option
Low ego, high ownership. Small team means everyone depends on everyone. You can take feedback, give it, and work well alongside engineers at different levels

**Nice to have**
- Background in logistics, supply chain, or freight/parcel economics
- Experience with ClickHouse or other columnar analytical databases
- Exposure to simulation systems, financial modeling, or decision-support products

**What success looks like**
- 0–2 months: Shipping production code, understanding the core data flows, and picking up real context on the system alongside the team
- 3–6 months: Owning major parts of the backend, improving performance and reliability, and becoming a real technical anchor on key projects

Beyond: Driving architecture decisions as we scale, helping onboard and coordinate new hires as the team grows, and becoming a long-term owner of Rivora's core systems

**Why this role**

- Direct collaboration with a CTO who has deep domain expertise and genuinely wants to share ownership of the technical direction
- Hard, real problems, not CRUD work. The data scale, the analytical complexity, and the correctness demands are legitimately interesting
- High trust, high impact. What you build directly affects whether we land customers and hit our milestones
- A path to full-time if the company succeeds, and we're working hard to make sure it does
