Feature-by-feature workflow (implementation blueprint)
0) Tenants, auth, roles

Tenanting

On first signup → create Company (infer currency from country) + User with role ADMIN.

All data is scoped by companyId.

Auth

Email/password (hash with bcrypt) or magic link.

Issue JWT (or use NextAuth credentials if you prefer). JWT payload includes userId, companyId, role.

Roles

ADMIN, MANAGER, EMPLOYEE (single role per user is enough for this app).

EmployeeProfile stores manager relationship (managerId) to support hierarchy.

1) Countries & currencies

On company creation, set Company.defaultCurrency.

Background job updates daily FX rates → FxRate(base, quote, rate, date).

Every expense stores both original and company-currency amounts (freeze the applied rate for audit).

2) User & org management (Admin)

Create users → assign role and optional managerId.

Change role at any time (guard: don’t leave company without any ADMIN).

View org tree (query EmployeeProfile.managerId).

Optional: bulk CSV invite.

3) Expense submission (Employee)

Upload receipt image(s) → create Receipt row; store imageUrl, rawText, parsed JSON, engine, confidence.

Employee enters/edits: amountOriginal, currencyOriginal, category, date, description.

Server converts to company currency via latest rate on expense date → set amountCompany, exchangeRateApplied, rateDate.

De-dup check (hash on vendor+date+amount range + text hash).

Status starts as PENDING.

4) OCR pipeline (optional/async)

Worker picks Receipt with ocrStatus='QUEUED'.

Run OCR:

Local (Tesseract) or cloud (Textract/Vision/Azure).

Write back rawText, parsed (JSON with vendor, date, lineItems, totalCandidates[], confidences).

Heuristic parsing → prefill expense fields; mark parseConfidence.

If any key field < threshold → flag needsReview=true for submitter.

5) Approval policies (Admin)

Two things can exist together:

Sequential steps (multi-approver in order): Manager → Finance → Director, etc.

Conditional rules (percent/specific/hybrid):

Percentage rule: e.g., ≥60% approvals in current step auto-approve the step.

Specific approver rule: if CFO approves, whole expense is approved.

Hybrid combine: OR/AND between the two.

Model this as:

ApprovalPolicy (per company) with:

isManagerFirstApprover boolean.

One or more ApprovalStep (sequence numbers).

Optional global ApprovalRule (percentage + specificApprover + operator).

When an expense is created, snapshot the policy into an instance:

ApprovalInstance + ApprovalInstanceStep + concrete ApprovalTasks (one per approver user at that step).

6) Running the approval (Manager/Admin)

Step activation

When an expense is submitted, build step 1’s approver tasks:

If isManagerFirstApprover, the submitter’s managerId is injected as a task.

Otherwise use configured approvers on the step (user or role).

Decision recording

Approver can APPROVE or REJECT with comment.

If rejected → expense REJECTED (stop).

If approved → evaluate rules:

For step: if step has multiple approvers, check percentage rule for that step or the policy’s global rule.

If rule satisfied → mark step APPROVED and activate next step.

If last step approved → expense APPROVED.

Specific approver short-circuit

If global rule says “CFO approves → auto-approve” and that user approves anywhere in the chain, mark whole instance APPROVED.

7) Visibility & dashboards

Employee: list of own expenses with status timeline (Submitted → Step 1 Approved by X → …).

Manager: inbox of pending approval tasks + team expenses.

Admin: all expenses, policy editor, override (with audit log).

Filters: date window, status, category, amount range, user/team.

8) Notifications & audit

Notifications table → email/in-app on: task assigned, approved, rejected, escalated.

AuditLog row on important changes (status changes, edits to amounts/dates, policy changes, overrides).

9) Guardrails

Validate expense date within allowed window (e.g., 90 days).

Role permissions middleware (server-side).

Don’t allow self-approval (submitter cannot approve their own expense).

If manager is missing → fallback to Admin or “Finance” role (configurable on policy or step).

10) Reporting

Simple reports:

Spend by category/user/team/month.

Cycle time (submission → final decision).

Approval bottlenecks (avg wait per step).

Export CSV.