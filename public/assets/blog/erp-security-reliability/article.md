---
title: Security and Reliability in Modern ERP Systems
slug: erp-security-reliability
description: Authentication, tenant isolation, validation, transactions, and the operational habits that keep a business system recoverable.
category: Security
author: BusinessOS
publicationDate: 2026-10-02
updatedDate: 2026-11-04
featuredImage: assets/blog/erp-security-reliability/cover.svg
featuredImageAlt: A shield formed from layered blocks
tags:
  - security
  - rbac
  - jwt
  - audit
  - reliability
featured: false
---

An ERP system concentrates the records a company would least like to lose or leak: who owes what, what is in the warehouse, who is allowed to pay a supplier. Security and reliability are the same design seen from two sides. A query that returns another tenant's invoices is a security failure. A half-posted receipt that cannot be explained on Monday is a reliability failure. Both come from skipped constraints.

This article is a working list for a multi-tenant business application. It is not a compliance certificate. It is the set of controls that keep ordinary features from becoming incidents.

## Authentication is not authorization

Authentication answers who is calling. Authorization answers what they may do. A valid login is not permission to post a payment, export the customer list, or read another company's data.

Keep the steps separate in the request pipeline. Authenticate first and reject unknown callers. Then resolve the tenant, as described in [Multi-Tenant SaaS Architecture Explained](/insights/multi-tenant-saas-architecture). Then check the permission for the specific action. Doing the permission check before you know the tenant leads to rules that are global by accident.

Session end has to be real. A logout that only deletes a token in the browser, while a long-lived refresh token still works, is not a logout. Invalidate the server-side session or the refresh token family, and keep access tokens short so a stolen one expires.

## Roles that match the work

Role-based access control means permissions are grouped into roles, and users receive roles, instead of every user carrying a private list of exceptions. The groups should match jobs you can name: sales, warehouse, finance, administrator. A role called "power user" will accumulate every permission anyone was afraid to refuse.

A few rules keep RBAC honest:

- Check a permission, not a role name, in the code. Roles get renamed and combined. `Invoice.Post` stays meaningful.
- Default to no access. A new endpoint without a permission attribute should fail a test, not ship as public.
- Separate "view" from "post" and "export." Export is how a large copy of the data leaves. It deserves its own permission.
- A platform operator is not a tenant administrator with a flag. Cross-tenant access is a different role, on a different path, with an audit entry every time it reads customer data.

Store the user's permissions in a way you can change without waiting for a token to expire, or keep tokens short enough that a removed permission takes effect quickly. A token that carries a role for twelve hours will keep a departed employee authorized for twelve hours unless you also check a revocation list.

## The tenant boundary, again

Most ERP leaks in a shared database are missing predicates, not clever attacks. Every query, export, file path, cache key, and background job carries the tenant id from the authenticated context. The client does not get to choose a different one by editing a header.

Identifiers should be unguessable where you can manage it, and still checked. Security by obscure ids fails the moment an id appears in a log, a referrer, or a screenshot. Load the row with the tenant filter. If it is not there, return the same not-found you would return for a random id, so you do not confirm that the record exists in another tenant.

## API shape

A business API is a set of actions with authorized side effects, not a generic data explorer.

- Prefer specific operations: post an invoice, receive a purchase order, reserve stock. A free-form update of every column makes authorization and audit vague, because you cannot say what the caller was allowed to change.
- Validate the body before you start a transaction. Reject unknown fields if your serializer is configured to, so a client cannot set `TenantId` or `IsAdmin` by adding a property.
- Return a stable error for forbidden and not-found. Do not include another tenant's data in a message "to be helpful."
- Paginate lists. An unbounded export is both a reliability problem and a data-loss waiting to happen when someone forwards the file.

Administrative endpoints do not belong on the same casually cached route as product search. Cache only responses that are safe to reuse, and vary the cache by user and tenant.

## Tokens

JSON Web Tokens are a common way to carry authentication between a client and an API. A JWT is signed, not encrypted. Anyone who has it can read the claims. Do not put secrets or personal data you would not put in a log into the payload.

Validate the signature, the issuer, the audience, and the lifetime. A token you do not validate is a JSON file the client wrote. Use a clock skew you can justify, and reject tokens that are not yet valid as well as tokens that have expired.

```csharp
options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidIssuer = jwt.Issuer,
    ValidateAudience = true,
    ValidAudience = jwt.Audience,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
    ClockSkew = TimeSpan.FromMinutes(1)
};
```

The signing key is a secret. It does not go in the frontend, in source control, or in a sample `appsettings` that gets deployed by habit. Rotate it with a plan: accept the new key, then stop accepting the old one, so you do not sign users out by surprise unless that is the point of the rotation.

Prefer short access tokens plus a refresh token you can revoke. Store refresh tokens hashed. If the database is copied, the hashes are not usable sessions.

## Validation

Validation is how you refuse a state the rest of the system cannot handle: a negative quantity, a date range that ends before it starts, a payment larger than the open balance, a discount that skips approval.

Do it on the server even if the form also checks. Browsers are not a boundary. Return the field and the reason so the screen can show them. A single "bad request" with no detail produces a second request that is just as wrong.

For money, use a decimal type and a defined scale. Floating-point arithmetic will not match the invoice the customer adds up. Round in one place, with a rule, and test the edge where half a cent appears.

## SQL injection and the queries you meant

Injection happens when a string the caller supplied becomes part of the SQL text. An ORM query with parameters avoids that. A report that concatenates a filter into a string does not.

```csharp
// The parameter stays data. It is not appended to the statement text.
var invoices = await _db.Invoices
    .Where(invoice => invoice.Number == input.Number)
    .ToListAsync(cancellationToken);
```

Raw SQL is acceptable when you need it, if every value is a parameter, including parts you think are "just a sort column." If the sort column is dynamic, map the caller's word to a fixed list of columns in code. Do not pass it through.

The database login used by the application should not be able to drop tables or read system catalogs it does not need. An injection that runs as owner is a different incident from one that runs as a limited role.

## Audit logs

An audit log answers who did what to which record, when, and from which tenant. It is not a debug trace, and it is not optional for payments, permissions, and exports.

Write it in the same transaction as the change when you can, so you never have a payment with no history or a history of a payment that rolled back. Store the actor's user id, not only their display name. Store the record id and the operation. Store a before and after for fields that matter, and do not store secrets, full card numbers, or another tenant's payload by dumping the entire request.

Protect the log from the people it watches. A user who can edit their own audit trail does not have an audit trail. Keep retention long enough for the dispute you actually get, which in a commercial setting is often months, not hours.

## Rate limiting

Authentication endpoints and exports deserve limits. A login form without a limit is a password-guessing service. An export without a limit is how one script walks every id.

Limits should be per account and per IP, with a clear response when the caller is over the limit, and they should not lock out the entire company because one integration misbehaved if you can scope the bucket more tightly. Background jobs that call your own API with a user token need to be inside the limit or on a separate internal path. Otherwise you will throttle your own invoice run.

## Transactions

A business action that touches two records should commit once. Receiving goods updates the purchase line and the stock balance. Posting a payment updates the payment and the invoice balance. If one succeeds and the other fails, the books and the warehouse disagree, and no screen will explain it cleanly.

```csharp
await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
invoice.AmountPaid += payment.Amount;
_db.Payments.Add(payment);
await _db.SaveChangesAsync(cancellationToken);
await transaction.CommitAsync(cancellationToken);
```

Keep the transaction short. Do not call an email provider or a payment network while you hold a row lock. Commit, then do the slow work, and record whether the slow work succeeded so you can retry it. The reliability techniques in [Business Process Automation with AI](/insights/business-process-automation-ai) apply here: idempotency keys on the retry, and a visible failed state when retries are exhausted.

Isolation level is a product decision. The default is often enough for a document update and not enough for the stock reservation discussed in the inventory article, which needs a lock or a conditional update so two sellers cannot take the last unit.

## Concurrency

Two users will open the same customer and save. Without a version check, the second save erases the first user's change and both people believe they succeeded.

A row version, checked on update, turns that into a conflict the second user can see: reload, look at the new values, save again if they still mean to. That is a better outcome than a silent overwrite of a credit limit.

The same pattern belongs on stock and on documents with a status. A status transition should be conditional: update the order to shipped where the status is still confirmed. If zero rows change, someone else already moved it. Report that. Do not ship it twice.

## Backups and restore

A backup you have not restored is a file. For a business system, test the restore onto a separate environment and run a reconciliation: invoice totals, stock balances, user counts. Do it on a schedule, not after the first failure.

Know the point you can return to. A nightly backup means up to a day of re-entry unless you also keep transaction logs that can roll forward. Write down which one you have, because the answer changes what an outage costs.

In a shared database, restoring a single tenant is not the same as restoring the server. If a contract promises a customer their own restore point, plan the data model for that, or isolate that customer. Practice deleting and reloading a tenant in a test environment before you promise it.

Protect the backup as carefully as the database. A copy of production in a world-readable bucket is a second production, with none of the access checks.

## Watching the system

Reliability is also how fast you notice. You do not need a large monitoring product to start. You need:

- The process is up, and the health check reads the database rather than only returning OK from memory.
- Error rate and a log you can search by request id, tenant id, and user id.
- A queue or job that is old. The most common "nothing is broken" incident is a worker that stopped, while orders sit in a status nobody sees.
- Disk, database size, and backup success as things that page a person, not as charts reviewed quarterly.

Page on symptoms a customer would notice: they cannot sign in, payments are failing, the worker is hours behind. Do not page on every warning or the pages will be muted.

When something fails, the audit log, the job state, and the last successful backup are the three facts that shorten the recovery. Build them before you need them.

## Conclusion

Secure, reliable ERP design is repetitive on purpose. Authenticate the caller, authorize the action, constrain every query to the tenant, validate the input, and commit the business change in one transaction. Log the action in a store the actor cannot edit. Limit the endpoints that are easy to abuse. Back up the database and restore it while the restore is still hypothetical.

None of these controls replace the others. A perfect token on an unfiltered query is still a leak. A careful permission model on a half-committed payment is still a night of reconciliation. Treat them as one list, and test the boring cases: the wrong tenant, the missing permission, the double submit, and the restore.
