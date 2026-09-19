---
title: Job Match Evaluation Framework
purpose: Guide LLM-assisted job posting analysis and rewriting for accelerated screening
audience: LLM + Greg (Senior Full-Stack Developer)
created: 2026-09-16
updated: 2026-09-16
version: 1.0
---

# Job Match Evaluation Framework

## Greg's Professional Profile

### Work Preferences
- **Minimum Hourly Rate**: $30.00/hour USD (or equivalent full-time salary)
- **Preferred Role Types** (in priority order): Full-time > Contract > Part-time
- **Location**: Remote only
- **Timezone**: PST (UTC-7/-8)
- **Available Hours**: 05:00–07:00 PST overlap with other timezones
- **Company Stage**: Strong preference for startups and small companies (< 50 people)
- **Interview Preference**: Straightforward process; avoids complex multi-round assessments or whiteboard algorithms

### Hard Screening Criteria
1. **Remote only** — Non-negotiable
2. **Salary/Compensation**: Minimum $30/hour or full-time equivalent
3. **Timezone match**: Requires at least 2–3 hours overlap with PST (05:00–07:00 PST = 07:00–09:00 CST, 08:00–10:00 EST)
4. **Role type**: Prefer full-time, but contract acceptable; part-time only if expect income is a Monimun or $5,000 per month. 
5. **Skills match**: Must have at least 70% of required "hard" technical skills

---

## Skills Inventory 

### Tier 1: Fluent / Core Expertise (25+ years, production-ready)
- HTML5 & semantic markup
- CSS3 & responsive design
- JavaScript (ES5, ES6, modern)
- TypeScript
- SQL (advanced queries, optimization)
- Database design & data modeling
- PHP
- Node.js
- Python
- Laravel
- React
- Vue.js 
- AWS 
- PostgreSQL
- REST APIs
- Authentication & Authorization systems
- API design & integration
- Git & GitHub
- Docker basics
- CI/CD concepts
- Unit & integration testing
- JSON & data serialization
- SSH & Linux basics
- Serverless architecture 
- Terraform 

### Tier 2: Competent / Secondary Skills (Solid understanding, production experience)
- Magento
- FastAPI
- Tailwind CSS 

### Tier 3: Touched / Familiar (Some hands-on or theoretical exposure)
- NestJS 
- Next.js 
- Supabase 
- GraphQL 
- Stripe 
- Vercel deployment 
- **Angular / AngularJS** 
- **Rust** 

### Tier 4: DO NOT HAVE (Not in skillset; would require ramp-up)
- **.NET / C# / ASP.NET / Core MVC** 
- **BigCommerce** 
- **Stencil.js** 
- **NHibernate / LINQ** 
- **Java / Spring MVC** 
- **Salesforce / Force.com** 
- **Microsoft SQL Server (MSSQL)** 
- **Azure** 
- **Kubernetes / advanced DevOps** 
- **Embedded systems / Bioinformatics** 
- **React Native** 
- **Go** 
- **Scala / Clojure** 
- **Oracle Database** 
- **Salesforce / Slack APIs** 
- **Machine Learning / Data Science** 

---

## Job Analysis Template (For LLM Use)

### Instructions for LLM: Analyze Job Against Greg's Profile

**Input**: Job posting markdown file
**Output**: Structured analysis highlighting match and mismatch

---

## PROMPT: Evaluate Job Fit Against Greg's Profile

```
You are analyzing a job posting against a senior full-stack developer's profile.

GREG'S PROFILE:
- 25+ years experience: PHP, Laravel, React, TypeScript, Python, Node.js, AWS, PostgreSQL
- Secondary skills: FastAPI, CSS, HTML, database design, API integration, testing, startup environments
- Timezone: PST (05:00–07:00 overlap required)
- Minimum salary: $30/hour or equivalent
- Preferences: Remote only, Full-time > Contract > Part-time, Startup/small company (< 50 people)
- Interview: Prefers straightforward process; avoids complex multi-round assessments

ANALYSIS TASK:
1. Extract all "Required Skills" and "Nice-to-Have Skills" from the job posting
2. Categorize each skill:
   - ✅ HAVE (Tier 1: fluent; Tier 2: competent)
   - ⚠️ TOUCHED (Tier 3: familiar, would need ramp-up)
   - ❌ DON'T HAVE (Tier 4: not in skillset; significant learning curve)
3. Calculate match percentage: (HAVE + 0.5×TOUCHED) / Total Skills = Match %
4. Flag hard blockers:
   - Missing core stack (e.g., pure .NET without Python/Node.js)
   - Timezone incompatibility (e.g., Japan-based, no US overlap)
   - Salary below $30/hour or not disclosed with equity vague
   - On-site or hybrid required
   - Complex multi-round interview (5+ rounds, whiteboard, take-home assessments)
5. Assess company fit:
   - Is it a startup or small company? (Check headcount, Series A/B, funding)
   - Does it emphasize shipping and ownership? (Good fit)
   - Does it emphasize process, hierarchy, or specialization? (Poor fit)
6. Output a SCORE out of 10:
   - 9–10: Strong fit. Apply immediately.
   - 7–8: Viable fit with minor gaps. Consider.
   - 5–6: Possible fit with learning curve. Apply if other factors strong.
   - < 5: Poor fit. Skip.

OUTPUT FORMAT:
---
# [Job Title] @ [Company]
**Score**: [X/10]
**Analysis Date**: 2026-09-XX

## Hard Blockers
- [ ] Timezone incompatible
- [ ] Salary below $30/hour
- [ ] On-site/hybrid required
- [ ] Complex interview process (5+ rounds)
- [ ] Critical skill gap (e.g., pure .NET, requires domain expertise)
- [List any blockers]

## Skills Match
| Skill | Have | Tier | Status |
|-------|------|------|--------|
| React | ✅ | 1 | Fluent |
| TypeScript | ✅ | 1 | Fluent |
| [Skill] | ❌ | 4 | Don't have |

**Match %**: [X]%

## Company & Role Fit
- **Company Stage**: [Series X, [N] employees, etc.]
- **Startup/Small Company**: [Yes/No/Partial]
- **Ownership Model**: [Describes whether role emphasizes shipping vs. process]
- **Interview Process**: [Straightforward / Complex / Unknown]

## Timezone & Availability
- **Company Location/Timezone**: [TZ]
- **Overlap with PST (05:00–07:00)**: [Yes/No; specific hours]
- **Remote Status**: [Remote / Hybrid / On-site]

## Compensation
- **Salary Range**: [$X–$Y or "Not disclosed"]
- **Equity**: [X% or "No equity"]
- **Meets Minimum ($30/hr)**: [Yes/No/Unclear]

## Summary
[2–3 sentences on why this is a good/poor fit]

## Recommendation
- [ ] STRONG PASS: Apply now
- [ ] PASS: Apply with customized pitch
- [ ] HOLD: Viable but not priority; reconsider if pipeline slow
- [ ] SKIP: Hard blocker present

---
```

---

## PROMPT: Rewrite Job Posting for Clarity & Easy Evaluation

**Purpose**: Restructure job posting to surface Greg's decision factors first, making evaluation faster and clearer.

**Input**: Original job posting markdown
**Output**: Reorganized job posting with new section order

---

## PROMPT: Reformat Job Posting for Quick Evaluation

```
You are reformatting a job posting to help a senior full-stack developer quickly evaluate fit.

REWRITE RULES:
1. Keep ALL original content (no deletion; only reorganization)
2. New section order (top to bottom):
   - Hard Requirements (must-haves that act as filters)
   - Skills: Required (Tier assessment)
   - Skills: Nice-to-Have (Tier assessment)
   - Company & Role Details
   - Compensation & Logistics
   - Interview Process
   - About the Company
   - Responsibilities (original)
   - Full Details (everything else from original)

3. For EACH SKILL, add inline tier indicator:
   - [TIER 1: FLUENT] — Candidate has 5+ years production expertise
   - [TIER 2: COMPETENT] — Candidate has solid understanding, some gaps
   - [TIER 3: TOUCHED] — Candidate familiar, would need ramp-up
   - [TIER 4: DON'T HAVE] — Not in candidate's skillset; learning curve required

4. Hard Requirements section should highlight:
   - Timezone requirements (vs. PST 05:00–07:00 availability)
   - Remote vs. on-site/hybrid
   - Salary/hourly rate (vs. $30/hour minimum)
   - Role type (Full-time/Contract/Part-time)
   - Company stage & size (startup/small vs. enterprise)
   - Interview complexity (straightforward vs. complex)
   - Any certifications, clearances, or legal requirements
   - Work authorization / sponsorship policies

5. Consolidate scattered requirements:
   - If "Required Skills" and "You should have experience with" are separate sections, merge under "Skills: Required"
   - If "Nice-to-Have" is listed separately, clearly label it
   - Flag any skills listed as required in job description but "nice-to-have" in qualifications (contradictions)

6. For Timezone/Availability:
   - Calculate overlap between job's primary timezone and PST 05:00–07:00
   - Example: "Job based in EST (UTC-5). PST 05:00–07:00 = EST 08:00–10:00. ✅ 2-hour overlap."

7. For Compensation:
   - Highlight minimum salary/rate prominently
   - Note if equity is vague or conditional
   - Flag if benefits/bonuses not mentioned
   - Calculate hourly equivalent for full-time roles ($salary / 2000 hours/year)

8. For Interview Process:
   - List exact steps in order (e.g., "Screening call → Technical interview → Take-home assignment → Founder conversation → Offer")
   - Flag if 4+ rounds or includes whiteboard/complex assessment
   - Note if structured, practical, or open-ended

OUTPUT FORMAT (Markdown with YAML frontmatter):
---
title: [Job Title]
company: [Company Name]
source: [Wellfound/LinkedIn/etc.]
source_id: [Job ID]
url: [Job URL]
rewritten_date: 2026-09-16

# HARD REQUIREMENTS (FILTERS)
- **Remote Status**: [Remote only / Hybrid / On-site] — Required: Remote only
- **Timezone**: [Job timezone; overlap calculation] — ✅ / ❌ Matches PST 05:00–07:00
- **Minimum Salary**: [$X/hour or $Y annual] vs. $30/hour minimum — ✅ / ❌ / ⚠️ Unclear
- **Role Type**: [Full-time / Contract / Part-time] — Prefers: Full-time > Contract > Part-time
- **Company Stage**: [Series X, [N] employees, startup/small/enterprise] — Prefers: Startup/small (< 50)
- **Interview Complexity**: [Straightforward / Complex (4+ rounds) / Unknown] — ⚠️ Complex interview if multi-round
- **Legal Requirements**: [U.S. Citizen / Security Clearance / Visa sponsorship / None]

## ❌ Hard Blockers
[List any blockers present; if none, state "None detected."]

---

# SKILLS MATCH

## Skills: Required
| Skill | Tier | Status | Notes |
|-------|------|--------|-------|
| React | [TIER 1: FLUENT] | ✅ | Greg has 5+ years production React |
| TypeScript | [TIER 1: FLUENT] | ✅ | Core in React stack |
| Node.js | [TIER 1: FLUENT] | ✅ | Primary backend language |
| .NET | [TIER 4: DON'T HAVE] | ❌ | Not in skillset; 3–6 month ramp |
| [Skill] | [TIER X] | ✅/❌/⚠️ | [Notes] |

**Match %**: [X]% ([Y]/[Z] skills present)

## Skills: Nice-to-Have
| Skill | Tier | Status | Notes |
|-------|------|--------|-------|
| Supabase | [TIER 3: TOUCHED] | ⚠️ | Familiar with concept; limited hands-on |
| GraphQL | [TIER 3: TOUCHED] | ⚠️ | Conceptual knowledge; not primary |
| [Skill] | [TIER X] | ✅/❌/⚠️ | [Notes] |

---

# COMPANY & ROLE DETAILS
**Company**: [Name]
**Stage**: [Series X; Y employees; Z funding]
**Problem**: [1-sentence problem statement]
**Approach**: [1-sentence product/approach]
**Startup/Small?**: ✅ Yes (< 50 people) / ⚠️ Medium (50–250) / ❌ Enterprise (> 250)
**Emphasis**: [Shipping fast / Process-driven / Specialization / Ownership]
**Team Size**: [Engineering headcount if disclosed]

---

# COMPENSATION & LOGISTICS
**Salary Range**: [$X–$Y] / **Hourly Rate**: [$X–$Y/hour]
- Equivalent hourly (if annual): $Y salary ÷ 2000 hours = ~$X/hour
- Meets minimum ($30/hour): ✅ Yes / ⚠️ Close / ❌ Below / ❓ Not disclosed

**Equity**: [X%–Y% / No equity / TBD]
- Note: [Vesting schedule, cliff, conditions if disclosed]

**Benefits**: [Health, 401k, PTO, etc. if mentioned; otherwise "Not disclosed"]

**Remote**: [Remote only / Remote with occasional travel / Hybrid / On-site]

**Timezone/Location**: [Primary location; overlap calculation]
- PST 05:00–07:00 overlap: [Yes; specific hours / No / Unclear]

**Work Authorization**: [Sponsorship available / Sponsorship not available / U.S. only / No restrictions]

---

# INTERVIEW PROCESS
1. [Step 1] ([Format], [Duration])
2. [Step 2] ([Format], [Duration])
3. [Step 3] ([Format], [Duration])
...

**Total Rounds**: [N]
**Complexity**: [Straightforward (1–2 calls + technical) / Moderate (3–4 steps) / Complex (5+ rounds, assessments)]
**Red Flags**: [Whiteboard coding / Take-home project / Panel interviews / Unclear timeline]

---

# ABOUT THE COMPANY
[Original "About" section, kept intact]

---

# RESPONSIBILITIES
[Original "What You'll Own" or "Key Responsibilities" section, kept intact]

---

# FULL DETAILS
[All remaining original content, reorganized for reference but less critical to initial evaluation]

---
```

---

## Quick-Check Scoring Rubric (For LLM or Manual Evaluation)

| Criterion | Weight | 10/10 | 7/10 | 5/10 | 0/10 |
|-----------|--------|-------|------|------|------|
| **Skills Match** | 25% | 90%+ match | 70–89% | 50–69% | < 50% |
| **Salary** | 20% | $45+/hr equivalent | $30–$45 | $20–$30 (negotiable) | < $20 |
| **Company Stage** | 15% | Early-stage startup (5–20 ppl) | Growth-stage (21–50) | Mid-size (51–200) | Enterprise (> 200) |
| **Interview Ease** | 15% | 1–2 straightforward calls | 2–3 steps, practical | 4 steps, mix of formats | 5+ rounds, whiteboard, assessments |
| **Remote & Timezone** | 15% | Remote, 3+ hour overlap | Remote, 1–2 hour overlap | Remote, < 1 hour overlap | On-site or hybrid |
| **Equity/Upside** | 10% | 0.5%+ in seed/A stage | 0.1–0.5% in later stage | Vague or very small | No equity |

**Total Score**: Sum of (Criterion Score × Weight ÷ 100)
- **9–10**: Apply immediately
- **7–8**: Strong consider; apply with pitch
- **5–6**: Viable if pipeline slow; conditional apply
- **< 5**: Pass; not a priority

---

## Example Reformatted Job (Template)

---

# Example: "Senior Full-Stack AI Developer" @ 1280 Labs

**Original Posting**: Wellfound
**Rewritten**: 2026-09-16

## HARD REQUIREMENTS (FILTERS)

- **Remote**: Remote (Canada/US) ✅
- **Timezone**: Toronto (EST). PST 05:00–07:00 = EST 08:00–10:00. ✅ 2-hour overlap
- **Salary**: $90k–$200k CAD (~$67k–$150k USD) = ~$32–$72/hour. ✅ Meets minimum
- **Role Type**: Full-time ✅ (top preference)
- **Company Stage**: Series ? (not disclosed); small team (dev shop) ✅
- **Interview**: Not disclosed ⚠️
- **Legal**: No clearance/citizenship mentioned ✅

### Hard Blockers
None detected. ✅

---

## SKILLS MATCH

### Required Skills
| Skill | Tier | Status | Notes |
|-------|------|--------|-------|
| Python | [TIER 1: FLUENT] | ✅ | Greg's primary language |
| TypeScript | [TIER 1: FLUENT] | ✅ | Core in all modern stacks |
| React.js | [TIER 1: FLUENT] | ✅ | 10+ years production |
| Node.js / Backend | [TIER 1: FLUENT] | ✅ | Primary stack |
| Document Retrieval / RAG | [TIER 3: TOUCHED] | ⚠️ | Familiar with concept; RAG-specific tools (LangChain, etc.) need ramp-up |
| Tool Calling (LLM Agents) | [TIER 3: TOUCHED] | ⚠️ | Conceptual understanding; hands-on agent development limited |
| Benchmarking/Evaluating LLMs | [TIER 3: TOUCHED] | ⚠️ | Exposure to evals; not primary expertise |
| Building Automations/Workflows | [TIER 2: COMPETENT] | ✅ | Background jobs, task queues, workflow design |
| Designing Reliable AI Systems | [TIER 3: TOUCHED] | ⚠️ | Would need guidance on AI-specific testing & failure modes |
| Testing & Code Quality | [TIER 2: COMPETENT] | ✅ | Strong testing background; applies to AI systems with learning |
| NestJS | [TIER 3: TOUCHED] | ⚠️ | Framework familiarity; not primary production experience |

**Match %**: 73% (9/12 required skills present to some degree)

### Nice-to-Have Skills
- Experience with design kits and design-first development: ⚠️ Limited (CSS/Figma, but not design kit specialist)
- High velocity with AI assistance: ✅ Greg actively uses Claude/AI for development
- Production systems, databases, APIs, queues, caching, integrations: ✅ Core strength

---

## COMPANY & ROLE DETAILS
**Company**: 1280 Labs
**Focus**: Dev shop working with startups and enterprise companies
**Looking For**: Full-stack + AI engineer; someone who designs reliable AI systems and ships polished products
**Team**: Hiring a senior lead and jr/intermediate (implying small team)
**Emphasis**: Shipping useful products, high velocity with AI, code quality, production reliability

---

## COMPENSATION & LOGISTICS
**Salary**: $90k–$200k CAD (≈$67k–$150k USD)
**Equity**: 0–3%
**Equivalent Hourly** (at $120k midpoint): ~$58/hour ✅
**Meets Minimum**: Yes
**Role**: Full-time ✅
**Remote**: Yes (Canada, United States) ✅
**Timezone**: Toronto (EST). 2-hour overlap with PST ✅

---

## INTERVIEW PROCESS
Not disclosed in posting. ⚠️ **Note**: Posting says "please include desired rate and seniority in your application." Straightforward pitch opportunity.

---

## ABOUT THE COMPANY
Dev shop working with startups and enterprise companies. [Original text from posting.]

---

## RESPONSIBILITIES
Deep understanding required in: document retrieval/RAG, tool calling, benchmarking LLMs, building automations/workflows, designing reliable AI systems, testing outputs, measuring accuracy, understanding failure cases. Experience building scalable production systems (databases, APIs, background jobs, queues, caching, integrations, observability, performance). Strong React, TypeScript, NestJS, Python. Comfortable across frontend, backend, AI, and infrastructure.

---

## RECOMMENDATION
**Score**: 7.5/10

This is a strong consideration. Skills match is solid (73%), with most gaps in RAG/LLM-specific tools (Tier 3: touched). Full-time, remote, good salary, early-stage company. Interview process unknown, but application-focused pitch plays to Greg's strength. AI focus aligns with current interests.

**Action**: Apply with customized pitch emphasizing production reliability and AI architecture experience.

---

---

## Files Generated

After analysis, LLM should produce:

1. **`[JobTitle]__[Company]__[SourceID]__analyzed.md`** — Full skill breakdown & recommendation
2. **`[JobTitle]__[Company]__[SourceID]__rewritten.md`** — Restructured posting for quick eval
3. **`job-screening-summary.csv`** — Bulk summary (optional, for filtering pipeline)

---

## Notes for LLM Implementation

- **Tier Assessment**: Use the skills inventory above as ground truth. Cross-reference against Greg's stated experience (25 years: PHP, Laravel, React, TypeScript, Python, AWS, PostgreSQL).
- **Match % Calculation**: (# Tier 1/2 skills + 0.5 × # Tier 3 skills) ÷ Total required skills
- **Score Calculation**: Use the rubric above; multiply each criterion score by its weight.
- **Blocking Logic**: If any hard blocker detected (on-site, < $30/hr, no timezone overlap), score ≤ 4/10 and recommend SKIP.
- **Consistency**: Always use the same terminology (Tier 1–4, ✅/❌/⚠️, Match %, Score/10).
- **Preserve Original**: Rewritten version must include all original job details; only reorganize and add tier labels.

---

## Future Enhancements

- [ ] Integrate with job scraper to auto-populate source, URL, company details
- [ ] Add screening summary CSV export (company, role, score, recommendation, link)
- [ ] Build filtering logic to auto-skip low-scoring jobs
- [ ] Track applied jobs and interview outcomes for feedback loop
- [ ] Create "pitch template" generator based on job gaps and company focus
