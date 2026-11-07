---
title: Business Intelligence and Data-Driven Decisions
slug: business-intelligence-data-driven-decisions
description: How operational records become sales, margin, and inventory numbers you can defend, and where AI summaries help or mislead.
category: Data & Analytics
author: BusinessOS
publicationDate: 2026-06-24
updatedDate: 2026-08-27
featuredImage: assets/blog/business-intelligence-data-driven-decisions/cover.svg
featuredImageAlt: A rising line chart over a faint grid
tags:
  - business-intelligence
  - analytics
  - sql
  - dashboards
  - kpis
featured: false
---

A dashboard is not a decision. A decision is a person changing a purchase, a price, or a hire because a number moved, and being able to say which number. Business intelligence is the work of making that number traceable to operational records: invoices, stock movements, expenses, not to a spreadsheet that diverged from them last spring.

This article is about that path. What to measure, how operational data differs from a report, and how to keep AI-written commentary from sounding more certain than the query underneath it.

## What business intelligence is for

Business intelligence turns recorded activity into a small set of figures people use on a schedule. The schedule matters. A chart nobody looks at before the purchasing meeting is decoration. A chart that purchasing looks at every Monday, with a definition everyone agrees on, is a tool.

The agreement is the hard part. "Revenue" might mean invoiced, collected, or ordered. Those three numbers answer different questions and should not share a label. Write the definition next to the figure. If the definition needs a footnote longer than the decision, the metric is not ready.

## Operational data and analytical data

Operational data is the current state used to run the business: this order, this stock balance, this unpaid invoice. It is updated in transactions and must be correct now. Analytical data is a reading of that activity over time: revenue by month, stock turns, which customers buy which category.

You can often answer both from the same database, and you should, until the analytical queries start to slow the people taking orders. Signs you have reached that point: a monthly report scans whole history during business hours, or a dashboard refreshes by running five heavy groupings every time someone opens it.

Until then, a separate warehouse is an extra copy to keep in sync. Prefer a clear query with a supporting index over a second system you will forget to load. When you do copy data out, copy from posted documents (invoices, receipts, movements), not from screens, and store the definition of each metric with the copy.

Do not let the analytical copy become a place where people fix numbers that were wrong at the source. Fix the invoice. Otherwise you now have two revenues.

## Metrics worth having

A small company does not need fifty KPIs. It needs a few that change a recurring decision.

| Metric | Definition to write down | Decision it should inform |
| --- | --- | --- |
| Invoiced revenue | Sum of invoice totals in the period, excluding voided invoices | Did sales actually bill what the pipeline suggested? |
| Collected cash | Sum of payments applied in the period | Can we pay suppliers from collections, not from bookings? |
| Gross margin | Revenue minus the cost method you use for those goods | Are we discounting below the cost we believe? |
| Available stock | On hand minus reserved, by SKU | What can we still promise? |
| Overdue receivables | Open invoice balance past its due date | Who needs a reminder or a credit hold? |
| Expense by category | Posted expenses in the period | Which costs moved, and are they one-off? |

Notice the absences. "Growth" is not a metric until you say growth of what, against which prior period. A percentage with no base is how a quiet month looks like a crisis or a triumph depending on the color of the arrow.

Compare like with like. This month against the same month last year is often fairer than this month against a short February, but only if the business was comparable. If you opened a second location, say so on the chart. The software will not know.

## Sales

Sales analytics starts from documents, not from a CRM stage, if the question is about money. A deal marked "won" is a forecast. An invoice is a bill. An order is a commitment. Pick the document that matches the question and resist blending them into one line called sales.

Useful cuts, once the definition is stable:

- By customer and by a customer group you maintain, so one large account does not hide in a total.
- By product category, so you see mix, not only volume.
- By salesperson only if the order stores that person reliably. A field that is empty half the time will rank the wrong people.

A pipeline view still helps the sales meeting. Label it as pipeline. Do not add it to collected cash.

## Revenue and expenses

Revenue and expense meet in a period. The period has to be explicit. Cash basis asks when money moved. Accrual asks when the invoice or the bill was recognized. A small business often talks in cash and reports in accrual without noticing. The dashboard should say which one it is.

Expenses need categories people will actually use. Twenty categories with three transactions each teach nothing. Six categories that match how the owner thinks about the company, plus an "other" you review, teach more. Recategorizing last year's history every time the list changes will make trends lie. Add categories forward, or remap with a dated rule.

Profit is revenue minus the costs you included. If cost of goods is missing because receipts were never costed, the margin figure is not conservative or aggressive. It is unfinished. Show it as unfinished rather than as zero cost, which looks like a perfect margin.

## Inventory insights

Inventory reporting for decisions is not the same as the warehouse's on-hand screen, but it must reconcile to it. A valuation report that does not tie to the movement ledger will be ignored after the first mismatch, correctly.

Questions worth answering:

- Which SKUs are below their reorder point after subtracting quantity already on order?
- Which SKUs have stock and no sales in a period you choose? That is a candidate for a return to the supplier or a discount, not an automatic one.
- What is the value on hand, using the same cost method as the movement posting described in [Modern Inventory Management Systems](/insights/modern-inventory-management)?

Turns and days of supply are ratios. They need an agreed demand window. A ratio built on a week that included a one-off project will tell you to buy for a demand that will not repeat. Put the window in the title of the chart.

## Dashboards and the meeting they serve

A dashboard should match a meeting. The Monday operations view is not the monthly finance view. Mixing them produces a page where nothing is large enough to read and everything refreshes slowly.

For each view, limit it to the figures that meeting will act on, a comparison period, and a way to open the underlying records. A bar with no drill-down forces people back to exports. An export that does not match the bar, because the export used a different filter, is worse than no export.

Refresh on a schedule you can explain. Real-time is necessary for available stock on the order screen. It is rarely necessary for a monthly margin chart, and a live query across all history will compete with the people creating invoices. A cached result with a visible "as of" time is an honest design.

## Charts that match the question

Use the plain chart that fits the comparison:

- A line for a measure over time.
- A bar for categories in one period.
- A table when the user needs the actual figures, which is more often than design trends suggest.

Avoid a chart that encodes the same number three ways. Dual axes are easy to misread because the scales are independent. A spike in a tiny category looks like a company-wide event if the axis starts at a convenient number. Start quantity and money axes at zero unless you are showing a genuine difference and the title says the axis is truncated.

Color is not the only signal. A red arrow next to a metric that is supposed to go down, such as overdue balance, will train people to celebrate the wrong move if red always means bad without a definition. State the desired direction.

## Aggregation and indexes

Analytical queries are groupings and filters. They stay fast when the filter matches an index and the grouping is not forced to scan every row. You do not need a clever index for every chart. You need one for the filters you actually run.

```sql
SELECT
    c.Name AS Category,
    SUM(l.Quantity * l.UnitPrice) AS InvoicedAmount
FROM InvoiceLines AS l
INNER JOIN Invoices AS i ON i.Id = l.InvoiceId
INNER JOIN Products AS p ON p.Id = l.ProductId
INNER JOIN Categories AS c ON c.Id = p.CategoryId
WHERE i.TenantId = @tenantId
  AND i.Status <> 'Void'
  AND i.InvoiceDate >= @from
  AND i.InvoiceDate < @to
GROUP BY c.Name
ORDER BY InvoicedAmount DESC;
```

The tenant predicate is not optional in a shared database. An analytical query that forgets it is a wider leak than a single screen, because it summarizes everyone. The date predicate should be a range, not a function wrapped around the column, so an index on `(TenantId, InvoiceDate)` can be used.

Check the plan when a report gets slow. A missing index is a common cause. A report that joins an unbounded text search to a grouping is another. Fix the query before you cache a wrong or cross-tenant result.

Aggregates should use the same status rules as the metric definition. If void invoices are excluded in the SQL and included in the card at the top of the page, users will do the arithmetic themselves and stop trusting both.

## Data quality is the constraint

No visualization repairs a source problem. The usual ones in a business system:

- Orders with no customer, or customers duplicated under two spellings.
- Invoices left in draft and then included, or excluded, inconsistently.
- Stock adjustments with no reason, so valuation moves and nobody can say why.
- Dates in the wrong field: the day someone typed the invoice versus the day it was issued.
- A category left blank, which becomes its own silent bucket.

Assign an owner to the worst field and fix it at entry with a required value or a duplicate check. A monthly cleanup project does not stick. A validation at save does.

Publish a short reconciliation: the dashboard revenue equals the invoice report equals the general ledger for that period, or here is the list of documents in one and not the other. That list is the most valuable report you will build. It is also the least decorative.

## AI-written insight

A model can describe a result you computed: "Invoiced revenue in this category fell against the prior period. The largest drop is customer A." That is helpful when the description is tied to numbers your query produced and the user can open customer A.

It is not helpful when the model invents a cause. "Revenue fell because of the marketing campaign" is a story unless a table you supplied says that. Ask the model to summarize only the rows you pass in, to quote the figures rather than recompute them, and to skip a cause you did not provide. The pattern is the same as retrieval in [How AI and RAG Are Transforming Business Software](/insights/ai-rag-business-software): the system of record computes, the model phrases, the person decides.

Do not send a cross-tenant extract to a hosted model to get a nicer paragraph. The paragraph is not worth the disclosure. Aggregate inside your boundary, then summarize the aggregate if you still want the prose.

Treat the prose as optional. The table is the product. If the summary and the table disagree, the summary is wrong.

## Conclusion

Business intelligence is a definition, a query that matches the definition, and a meeting that uses the result. Operational records stay the source. Revenue, cash, margin, available stock, and overdue balances cover more decisions than a large catalog of vague scores.

Index the filters you run, keep tenant and status rules in the query, and reconcile the dashboard to the ledger often enough that a mismatch is a task, not a surprise. Use AI to describe a result you already computed. The decision, and the reason it was legitimate, still belong to the person who can change the purchase order.
