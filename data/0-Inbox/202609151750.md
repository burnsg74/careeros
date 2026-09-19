I'll organize this conversation for you:

---

## Summary
Michael is evaluating **ERPNext** (open-source Python-based ERP) as a replacement for your current on-premise **Epicor P21** system. He's asking you to help evaluate and set it up locally, with the potential for you to take over customization work if the project gets CEO approval and moves forward as a POC/MVP. Michael is also working on an internal referral opportunity for you at his company.

---

## Action Items

**For You (Greg):**
- [x] Install ERPNext locally in **non-Docker, production mode** (estimated 1–2 hours)
- [ ] Review ERPNext source code for customization capabilities
- [ ] Compare setup approach and findings with Michael
- [ ] Prepare to potentially take over ongoing customization if project advances
- [ ] Review ERPNext's form-builder and pricing rule customization options (needed to replicate P21 functionality)

**For Michael:**
- [ ] Reinstall ERPNext on VPS (separate from your local setup for comparison)
- [ ] Secure CEO buy-in on ERP replacement initiative
- [ ] Develop POC/MVP with data migration from P21
- [ ] Resolve CloudFlare proxying and WAF rule issues on VPS

---

## Important Details

- **Status:** Opportunity is **conditional** — not guaranteed to move forward; depends on CEO approval
- **Compensation:** Michael is paying you for your evaluation/setup time
- **Tech Stack:** ERPNext is Python-based (aligns with your experience)
- **Key Requirement:** Custom development needed to replicate P21 business processes and pricing rules
- **Infrastructure Challenge:** CloudFlare proxying and WAF rules caused issues on VPS
- **Your IP:** 149.137.182.212 (provided to Michael for potential access)
- **Timeline:** You can dedicate focused time after your current job (7–4 PM)
- **Your Role (if approved):** Lead customization once POC/MVP is validated

---

Would you like me to save this to a Raycast Note for easy reference?


---


ERPNext is running locally as a self-hosted development bench with demo data.

This follows the [![](https://www.google.com/s2/favicons?domain=frappe.io&sz=64)Frappe installation guide](https://docs.frappe.io/framework/user/en/installation) for macOS (the path behind ERPNext’s self-hosting option). macOS is for development, not production.

Open it: [http://127.0.0.1:8000](http://127.0.0.1:8000/)

- User: `Administrator`
- Password: `admin` (change this after first login)

What was installed

- Frappe 16.34.0 and ERPNext 16.35.0 (`version-16`)
- Python 3.14 via `uv`, Node 24, Yarn, MariaDB 11.8, Redis
- Site `demo.localhost` in this workspace
- Company Demo Company, plus Demo Company (Demo) with sample records: 3 customers, 3 suppliers, 10 items, 5 sales orders, 10 purchase orders, and invoices

I confirmed login, the desk, the Customer list (Palmer Productions, West View Software, Grant Plastics), and Sales Invoices for those customers.

Keep it running

`bench start` is already running in this workspace. To start it again later:

```
cd /Users/greg/Code/Local/erp/Untitled
eval "$(/opt/homebrew/bin/brew shellenv)"
export PATH="$HOME/.local/bin:/opt/homebrew/opt/mariadb@11.8/bin:$PATH"
brew services start mariadb@11.8 redis
bench start
```
