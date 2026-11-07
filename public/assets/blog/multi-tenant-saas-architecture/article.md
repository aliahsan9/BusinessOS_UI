---
title: Multi-Tenant SaaS Architecture Explained
slug: multi-tenant-saas-architecture
description: How shared-database and database-per-tenant designs isolate customer data, identify the current tenant, and stay correct under concurrency.
category: SaaS Architecture
author: BusinessOS
publicationDate: 2026-10-18
updatedDate: 2026-11-02
featuredImage: assets/blog/multi-tenant-saas-architecture/cover.svg
featuredImageAlt: Layered panels representing separate tenants inside one software platform
tags:
  - multi-tenancy
  - ef-core
  - saas
  - security
  - architecture
featured: true
---

A SaaS product promises many companies the same software without promising them the same data. Multi-tenancy is the set of decisions that make that promise true: where each customer's rows live, how a request learns which customer it belongs to, and what stops one customer from reading another customer's invoices.

This article walks through those decisions the way a team actually has to make them. The examples use ASP.NET Core and EF Core because that stack makes the trade-offs concrete. They are patterns, not a claim that any particular screen in BusinessOS is implemented this way.

## What multi-tenancy means

A tenant is a customer boundary. In a business platform that is usually a company: its users, products, stock, orders, and settings. Users sign in as people, but almost every business record belongs to the company, not to the person.

Multi-tenancy means one deployed application serves many of those companies. The opposite is a single-tenant deployment: a separate app and database for each customer. Single-tenant hosting is easier to reason about and harder to operate. Every upgrade, backup, and incident is multiplied by the number of customers.

The hard part is not drawing a `TenantId` column. The hard part is making that column unavoidable. A missed filter in one query is a data leak. A cache key that forgets the tenant is also a data leak, just a faster one.

## Why SaaS platforms share a deployment

Teams choose multi-tenancy for operational reasons:

- One build is what every customer runs, so a fix reaches everyone.
- Idle capacity is shared. A quiet tenant does not need its own server.
- Onboarding can be a database row and a set of roles, not a new environment.
- Cross-tenant operational views, used only by the platform operator, are possible because the data is in one place. Those views must be explicit and audited. They are not the same code path as a customer's request.

None of that removes the isolation requirement. Sharing a deployment is an efficiency choice. Sharing data is a defect.

## Shared database or a database per tenant

Two shapes cover most business systems.

| Model | How data is separated | Operational cost | Fits when |
| --- | --- | --- | --- |
| Shared database, shared schema | Every table has a tenant key. Queries must filter on it. | Lowest. One backup, one migration. | Many small and mid-sized customers on the same product. |
| Database per tenant | Each customer has a physical database. The app chooses a connection string. | Highest. Migrations and backups fan out. | A customer needs a hard boundary, a private restore, or a region of their own. |
| Shared database, separate schema | Each tenant has a schema inside one server. | Middle. Tooling is awkward. | Rarely worth it unless a platform already works that way. |

![Two panels: one shared database with stacked tenant rows, and four separate databases](assets/blog/multi-tenant-saas-architecture/tenancy-models.svg)

A practical SaaS often starts with a shared database and keeps an escape hatch: the tenant record stores a connection strategy, even if every tenant currently points at the same database. Moving one large customer later should be a routing change, not a rewrite of every query.

## Tenant isolation is a query problem

In a shared database, isolation is a predicate. `Orders` does not contain "the orders." It contains every tenant's orders, and the only safe statement is "the orders for this tenant."

That predicate has to exist in every read and every write:

- List screens, exports, and search.
- Background jobs that send reminders or recalculate stock.
- "Get by id" endpoints. An id by itself is not a tenant boundary. Guessable integers make this worse. Opaque ids help, but they are not a substitute for the filter.
- Unique indexes. An invoice number that is unique per tenant must be unique on `(TenantId, Number)`, not on `Number` alone.

The dangerous queries are the ones that look harmless: a report that joins three tables and forgets the tenant on the third, or an admin tool that was written against a single-company prototype and never grew a filter.

## How a request learns its tenant

Something early in the pipeline has to resolve a tenant id and keep it for the rest of the request. Common sources, from strongest to weakest:

1. A claim inside a validated access token. The user already authenticated, and the token says which company they are acting for.
2. A verified membership. The user may belong to more than one company, and the selected company is checked against a membership table before it is trusted.
3. A subdomain or custom domain mapped to a tenant. Useful for public pages. Still verify it. Host headers are not a secret.
4. A header or route value sent by the client. Treat this as untrusted until it matches the user's membership. A client can send any header it wants.

Resolve the tenant once, in middleware or a scoped service, and pass that value into the data layer. Do not let controllers parse the header again. Two parsers drift apart.

```csharp
public interface ITenantContext
{
    Guid TenantId { get; }
}

public sealed class HttpTenantContext : ITenantContext
{
    public HttpTenantContext(IHttpContextAccessor accessor)
    {
        var claim = accessor.HttpContext?.User.FindFirstValue("tenant_id");
        if (!Guid.TryParse(claim, out var tenantId))
        {
            throw new UnauthorizedAccessException("The request has no tenant.");
        }

        TenantId = tenantId;
    }

    public Guid TenantId { get; }
}
```

Fail closed. A missing tenant should produce an error, not an unfiltered query.

## Authorization and data isolation are different

Authorization answers "may this user do this action?" Data isolation answers "which rows can this request see?"

A warehouse clerk and a finance manager in the same company share a tenant and still should not share every permission. Role checks do not replace the tenant filter. The tenant filter does not replace role checks. You need both.

A platform operator who can see across tenants is a third case. Give that path its own permission, its own queries, and an audit record. Do not implement it by adding an `if (isAdmin) skipFilter` inside the customer query pipeline. Those skips spread, and one of them will run for the wrong caller.

## EF Core global query filters

EF Core can attach the tenant predicate to a model so ordinary queries include it without each call site remembering.

```csharp
public abstract class TenantEntity
{
    public Guid TenantId { get; set; }
}

public sealed class AppDbContext : DbContext
{
    private readonly ITenantContext _tenant;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenant)
        : base(options)
    {
        _tenant = tenant;
    }

    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>()
            .HasQueryFilter(order => order.TenantId == _tenant.TenantId);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<TenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.TenantId = _tenant.TenantId;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
```

The filter uses a field on the context, not a captured constant, so EF re-reads it per request. The context itself must be scoped, not singleton. A singleton context would pin the first tenant for the life of the process.

A few consequences are easy to miss:

- `IgnoreQueryFilters()` disables the protection. Search the codebase for it in review. It belongs in migrations, tests, and the audited operator path, not in a feature query.
- Filters do not apply to raw SQL, `FromSql`, or a stored procedure. Those need an explicit parameter.
- Includes and splits still carry the filter, but a hand-written join in SQL will not.
- Design-time tooling that creates a context without an HTTP request needs a fake tenant or a factory that does not touch `ITenantContext`.

Set `TenantId` on insert inside `SaveChanges`, as above, so a caller cannot assign another tenant's id and write into their partition. Reject updates that try to change `TenantId`.

## Tenant-aware caching

A cache is a second database with worse review tooling. If the key is `product:{id}`, the second tenant to open that id receives the first tenant's product.

Include the tenant in every key, and include it in the value you check on the way out if the cost of a mistake is high.

```csharp
public async Task<Product?> GetProductAsync(Guid productId, CancellationToken cancellationToken)
{
    var cacheKey = $"tenant:{_tenant.TenantId}:product:{productId}";
    var cached = await _cache.GetAsync<Product>(cacheKey, cancellationToken);
    if (cached is not null)
    {
        return cached.TenantId == _tenant.TenantId ? cached : null;
    }

    var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
    if (product is not null)
    {
        await _cache.SetAsync(cacheKey, product, TimeSpan.FromMinutes(5), cancellationToken);
    }

    return product;
}
```

The same rule applies to output caching, compiled reports, and "current company settings" held in a static field. Static fields are process-wide. They are the wrong place for tenant state.

Invalidate with the same key shape. A stock update that clears `product:{id}` and forgets the tenant either does nothing useful or clears another tenant's entry.

## Concurrency

Tenant filters do not make writes atomic. Two users in the same company can still sell the last unit, approve the same purchase order, or edit the same customer.

Handle that inside the tenant with the same tools you would use in a single-company system:

- A transaction around a read-modify-write of stock or balances.
- A row version (`xmin`, a `rowversion` column, or an explicit version number) so a stale edit fails instead of overwriting.
- Unique indexes that include `TenantId`, so two clerks cannot create the same document number.

Do not take a lock "for the tenant" on every request. That serializes the whole company. Lock the row you are changing.

Background work needs the same discipline. A job payload should carry the tenant id, and the worker should create a scope that sets `ITenantContext` before it opens a database context. A worker loop that uses the last HTTP tenant is a bug that only appears in production.

## Security considerations

Isolation bugs are security bugs. A short review list:

- Every new table either has a tenant key and a query filter, or it is genuinely global (a list of countries, a plan catalog) and is documented as global.
- Identifiers in URLs are checked with the filter, not trusted because they are hard to guess.
- File storage paths include the tenant. Object storage keys are not an exception.
- Logs may contain a tenant id. They should not contain another tenant's document body just because an exception handler dumped a query.
- Search indexes and queues are partitioned by tenant the same way tables are.
- Backup restores are tested. In a shared database, restoring one customer is a row-level operation, which is harder than restoring a database. If a contract requires per-customer restore, that customer may belong in the database-per-tenant model.

For how roles, tokens, and audit logs sit on top of this boundary, see [Security and Reliability in Modern ERP Systems](/insights/erp-security-reliability).

## Architecture trade-offs

| Choice | You gain | You accept |
| --- | --- | --- |
| Shared schema | Simple operations and cheap small tenants | You must prove every query is filtered |
| Database per tenant | Clear restore and noisy-neighbor boundaries | Migration tooling and connection management |
| Tenant id in the token | Stable, explicit context | Token refresh must keep the claim correct |
| Global query filters | Less repeated code | Raw SQL and `IgnoreQueryFilters` bypass them |
| Tenant-prefixed cache keys | No cross-tenant cache hits | More keys and a stricter invalidation scheme |

There is no layout that removes the need for review. Shared-schema systems fail by omission: a missing predicate. Database-per-tenant systems fail by operations: a migration that ran on 40 databases and not the 41st. Pick the failure mode you can detect.

## Conclusion

Multi-tenancy is a constraint on every read, write, cache key, and job, not a column you add at the end. Resolve the tenant once from a source the client cannot forge, apply it in the data layer so feature code cannot forget it, and keep authorization as a separate question. Shared databases win on cost when the filter is automatic. Separate databases win when a customer needs a physical boundary. Either design works if the tenant id is boring, mandatory, and tested.

The tests that matter are small and specific: a user from tenant A requests tenant B's id and receives nothing, a cache key written for A is not readable as B, and a save cannot change `TenantId`. Those tests are cheaper than the incident they replace.
