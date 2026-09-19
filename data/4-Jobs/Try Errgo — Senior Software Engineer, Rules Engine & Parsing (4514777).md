---
note_type: Job
name: Senior Software Engineer, Rules Engine & Parsing
company: Try Errgo
source: Wellfound
source_id: "4514777"
url: https://wellfound.com/jobs/4514777-data-engineer-ingestion-change-data-capture-clone
company_url: https://wellfound.com/company/try-errgo
compensation: $160k – $200k • No equity
equity: No equity
job_type: full_time
remote: true
locations: San Francisco
remote_locations: 
experience_min: 5
skills: Java, Maven, JUNIT, Error Handling
posted_at: 2026-07-25T05:20:57.000Z
captured_at: 2026-09-19T15:16:59.364Z
status: deleted
status_updated_at: 2026-09-19T15:17:07.005Z
deleted_reason: wrong_location
deleted_reason_other: 
missing_skills: 
deleted_auto: true
fit_score: 0
fit_recommendation: SKIP
fit_required_match: 0.50
fit_overall_match: 0.50
fit_primary_stack: Java
fit_missing_skills: Java, Maven
fit_have_skills: Unit & integration testing, Error Handling
fit_familiar_skills: 
fit_dont_have_skills: Java, Maven
fit_summary: "This role fails your hard screen: the posting lists San Francisco as a location alongside remote status, indicating a hybrid or on-site requirement that conflicts with your remote-only preference. While the compensation ($160k–$200k) exceeds your minimum and the role is full-time, Java is not in your skill inventory and would require significant ramp-up; the parsing-engine focus is specialized and not aligned with your full-stack generalist background. The ownership model and seniority level are strong fits, but the location constraint is disqualifying."
fit_early_exit: true
fit_model: claude-haiku-4-5
fit_evaluated_at: 2026-09-19T15:17:07.005Z
---

Our product runs on rules. Analysts write them as short expressions like 'amount &gt; 1000 &amp;&amp; (region == "US" || vip)', and we evaluate each one against every record that comes through. We're hiring a senior engineer to own the engine behind them: a lexer, a parser, and an evaluator, written in plain Java with no parsing libraries.

What you'll do:

* Get operator precedence and associativity right across arithmetic, comparison, boolean, and unary operators, plus parentheses, variables, and a handful of built-in functions
* Tokenize correctly, including multi-character operators and syntax errors that point at the right position
* Evaluate expressions and return clear, typed errors for what goes wrong: unknown variables, divide-by-zero, type mismatches, and wrong argument counts
* Keep the whole pipeline predictable and well tested

What we're looking for:

* Strong Java and hands-on parsing experience: tokenizing, building an AST, and handling precedence
* Good instincts for expression evaluation and error handling
* The judgment to hand-write focused code instead of reaching for a parser generator

Nice to have:

Built an interpreter or rules engine before, and familiar with recursive-descent or precedence-climbing parsing
