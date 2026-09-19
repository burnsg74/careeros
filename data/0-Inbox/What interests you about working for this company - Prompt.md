Here's the plan:

1.  **AI Model:** Given your existing preference for Claude 3.5 Haiku and your focus on efficiency and prompt caching, we'll stick with that. It's cost-effective and performs well for this kind of nuanced generation.
2.  **Prompt Template:** I'll design a prompt that leverages variables for job/company details and your personal profile. It will focus on extracting the *specific* alignment points, as seen in the Track it Forward example.
3.  **Output:** The prompt will generate a concise, human-like answer suitable for embedding directly into your Markdown job files. We'll aim for a strong core message that can be slightly expanded if needed, but prioritizes brevity.
4.  **Personal Data File:** You'll maintain a dedicated file for this prompt's inputs, which the prompt will reference.
5.  **Tone:** The prompt will be instructed to maintain a personal, authentic, "human-like" tone, avoiding corporate jargon.
6.  **Reusability:** I'll provide the prompt structure as a template. You can then integrate this template into your job hunting application logic.

I'll start generating the prompt instructions now. I don't anticipate needing further questions unless you have specific, nuanced requirements for the output format or tone.

Here's the instruction set for building the AI prompt:

---

### **AI Prompt Design: "Why This Company?" for Job Applications**

**Goal:** Generate a concise, authentic, and compelling answer to "What interests you about this company?" that highlights genuine alignment between the applicant (Greg) and the specific job/company. The output should be suitable for direct insertion into job application forms or Markdown job tracking files.

**AI Model:** Claude 3.5 Haiku (or similar efficient, nuanced model)

---

#### **1. Core Prompt Structure & Instructions**

**System Prompt / Persona:**
"You are an AI assistant helping a senior full-stack engineer (Greg) craft authentic, human-like responses to job application questions. Your goal is to identify and articulate genuine points of alignment between Greg's skills, experience, and values, and the specific job/company he's applying for. Focus on *specific*, *concrete* reasons. Avoid corporate jargon, generic platitudes, or overly polished language. Emphasize a pragmatic, results-oriented, and adaptable professional."

**User Prompt Template:**

```
Analyze the following job posting details and Greg's personal profile data to craft an authentic and specific answer to the question: "What interests you about working for this company?"

The answer should be concise (aim for 2-4 sentences, but can be slightly longer if genuine alignment warrants it) and focus on the *most compelling* points of connection. It must avoid generic statements and instead highlight specific reasons for interest based on the provided information.

**Job Posting Analysis:**
*   **Job Title:** {{JOB_TITLE}}
*   **Company Name:** {{COMPANY_NAME}}
*   **Company Description / Mission:** {{COMPANY_DESCRIPTION}}
*   **Job Responsibilities / Scope:** {{JOB_RESPONSIBILITIES}}
*   **Targeted Stack / Technologies:** {{TARGET_STACK}}
*   **Company Culture / Values / Growth Model:** {{COMPANY_CULTURE}}
*   **Location / Remote Policy:** {{LOCATION_POLICY}}
*   **Key Challenges / Problems:** {{KEY_CHALLENGES}}

**Greg's Personal Profile Data:**
*   **Core Identity:** {{GREG_CORE_IDENTITY}} (e.g., "Senior/Principal Full Stack Engineer for small remote product teams")
*   **Primary Stack:** {{GREG_PRIMARY_STACK}} (e.g., "React, TypeScript, Python, AWS serverless, Laravel/PHP, Docker, CI/CD")
*   **Key Experience Pillars:** {{GREG_EXPERIENCE_PILLARS}} (e.g., "AWS serverless architecture for product teams, Laravel/PHP for eCommerce backends")
*   **Relevant Leadership Experience:** {{GREG_LEADERSHIP_EXPERIENCE}} (e.g., "Team lead, technical architect, remote coordination, former CTO, founder")
*   **Specific Relevant Projects (from Job History/Action Plan):** {{GREG_RELEVANT_PROJECTS}} (e.g., "Makpar SBA Portal (React/AWS serverless), Ronati Inventory Sync (Laravel/Python scraper), Red Pocket CTO (CRM migration)")
*   **Values / Work Style:** {{GREG_VALUES_WORK_STYLE}} (e.g., "Prefers small companies/startups, direct founder/HM visibility, high-agency, pragmatic, boots-on-the-ground, values work-life balance, can build from scratch, understands bootstrap constraints")
*   **Constraints / Preferences:** {{GREG_CONSTRAINTS_PREFERENCES}} (e.g., "Seeks remote full-time, $110k-$140k target, avoids whiteboard/algorithm interviews, needs morning sync availability")

**Output Requirements:**
*   **Tone:** Authentic, human-like, personal, direct, avoid corporate jargon.
*   **Conciseness:** Aim for 2-4 strong sentences. Prioritize specific alignment points.
*   **Focus:** Highlight the *most compelling* reasons for interest, drawing direct parallels between the job needs and Greg's profile.
*   **Format:** Plain text, ready to be copied or embedded.

**Generate the answer:**
```

---

#### **2. Information Gathering & Variable Mapping**

**A. Information about the Job and Company (to be extracted from job posting/company website):**

*   **`{{JOB_TITLE}}`**: e.g., "Lead Developer", "Senior Full Stack Engineer"
*   **`{{COMPANY_NAME}}`**: e.g., "Track it Forward", "Innovate Solutions Inc."
*   **`{{COMPANY_DESCRIPTION}}`**: Summary of what the company does, its mission, its market. Look for keywords related to industry (SaaS, non-profit, social good, fintech), business model (bootstrapped, profitable, VC-funded), and size/stage (startup, scale-up, established).
*   **`{{JOB_RESPONSIBILITIES}}`**: Key duties, what the role entails. Focus on the *problems* they need solved (e.g., "greenfield rebuild", "modernize mobile apps", "scale architecture", "migrate customers").
*   **`{{TARGET_STACK}}`**: Technologies explicitly mentioned for the role or company. Note both new (Python/Django, React) and legacy (Drupal 6, MySQL) to understand their current state and future direction.
*   **`{{COMPANY_CULTURE}}`**: Explicit statements about work style, values, team structure, growth philosophy ("no growth-at-all-costs", "work-life balance", "puzzle-loving culture", "high autonomy", "fast-paced startup").
*   **`{{LOCATION_POLICY}}`**: Remote status, hybrid, timezone requirements, geo-restrictions (e.g., "US W-2 Tax Residency Required", "Core Sync Hours: 9:00 AM – 12:00 PM PST").
*   **`{{KEY_CHALLENGES}}`**: The core problems the job is meant to solve. This is crucial for demonstrating understanding and alignment. Examples: "legacy system migration", "scaling infrastructure", "implementing new tech stack", "building security from scratch".

**B. Information about Greg (to be populated from his profile files):**

*   **`{{GREG_CORE_IDENTITY}}`**: His stated primary professional identity. (From `Action Plan.md`)
*   **`{{GREG_PRIMARY_STACK}}`**: His current most marketable skills. (From `About Me.md` and `Action Plan.md`)
*   **`{{GREG_EXPERIENCE_PILLARS}}`**: Specific areas of depth or specialization he wants to emphasize. (From `About Me.md` and `Action Plan.md`)
*   **`{{GREG_LEADERSHIP_EXPERIENCE}}`**: Relevant leadership roles and responsibilities. (From `Work History.md`, `About Me.md`, `Action Plan.md`)
*   **`{{GREG_RELEVANT_PROJECTS}}`**: Concrete examples of projects that align with the job's challenges/responsibilities. (From `Work History.md`, `Action Plan.md` - select *specific* projects that match the job.)
*   **`{{GREG_VALUES_WORK_STYLE}}`**: His preferred working environment and approach. (From `Action Plan.md`)
*   **`{{GREG_CONSTRAINTS_PREFERENCES}}`**: Key job requirements he meets or needs to align with. (From `Action Plan.md`, `About Me.md`)

---

#### **3. Prompt Engineering Tips & Nuances**

*   **Specificity is King:** The prompt needs to instruct the AI to look for explicit matches. E.g., if the job mentions "bootstrapped, profitable," the AI should look for Greg's "founder/CTO at bootstrapped companies" or "understands bootstrap constraints" data.
*   **Prioritize Alignment:** The AI should be told to pick the *strongest* 1-3 points of connection, not list everything.
*   **"Human-like" Tone:** This means using phrases like "I'm drawn to...", "What really resonates is...", "This speaks to me because...", "I thrive in environments like...", "This aligns perfectly with my experience in..."
*   **Action-Oriented Language:** Encourage the AI to use action verbs when describing Greg's past projects that mirror the job's responsibilities.
*   **Constraint Handling:** If there's a potential mismatch (e.g., timezone), the prompt should instruct the AI to *address it positively* if possible (e.g., "The 9 AM PST sync window works perfectly for my timezone"). If it's a constraint Greg *meets*, it should be highlighted as a positive.
*   **"Why *this* company?" focus:** The prompt must guide the AI to answer *why this specific company* and *this specific role*, not just why he wants *a* job.

---

This structured approach will allow your application to dynamically generate tailored answers by populating the `{{VARIABLES}}` with data specific to each job and Greg's profile.

Let me know if this makes sense or if you'd like any adjustments!