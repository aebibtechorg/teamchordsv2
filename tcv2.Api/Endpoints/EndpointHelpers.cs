using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using tcv2.Api.Data;

namespace tcv2.Api.Endpoints;

internal static class EndpointHelpers
{
    public static IResult? Validate(object dto)
    {
        var validationContext = new ValidationContext(dto);
        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(dto, validationContext, results, true))
        {
            var errors = results.Select(r => r.ErrorMessage).Where(m => m != null).ToArray();
            return Results.BadRequest(new { errors });
        }
        return null;
    }

    public static async Task<IResult> ApplyPagingAndFilter<T>(IQueryable<T> query, HttpRequest req) where T : class
    {
        var page = 1;
        var pageSize = 20;
        if (req.Query.TryGetValue("page", out var p) && int.TryParse(p, out var pi) && pi > 0) page = pi;
        if (req.Query.TryGetValue("pageSize", out var ps) && int.TryParse(ps, out var psi) && psi > 0) pageSize = psi;

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Results.Ok(new { items, total, page, pageSize });
    }

    // Keyset / cursor-based paging. Expects the incoming `query` to be ordered by
    // CreatedAt DESC, Id DESC (newest first). The selector projects entities to DTOs.
    public static async Task<IResult> ApplyCursorPaging<TSource, TDest>(IQueryable<TSource> query, HttpRequest req, System.Linq.Expressions.Expression<Func<TSource, TDest>> selector) where TSource : class
    {
        var pageSize = 20;
        if (req.Query.TryGetValue("pageSize", out var ps) && int.TryParse(ps, out var psi) && psi > 0) pageSize = psi;

        DateTime? afterCreatedAt = null;
        Guid? afterId = null;
        if (req.Query.TryGetValue("afterCreatedAt", out var ac))
        {
            // Parse as UTC to avoid passing Local DateTimes to PostgreSQL (timestamptz expects UTC)
            if (DateTime.TryParse(ac, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal, out var acdt))
            {
                afterCreatedAt = DateTime.SpecifyKind(acdt, DateTimeKind.Utc);
            }
        }
        if (req.Query.TryGetValue("afterId", out var aid) && Guid.TryParse(aid, out var ag)) afterId = ag;

        // Apply keyset predicate only if both cursor parts are provided.
        if (afterCreatedAt.HasValue && afterId.HasValue)
        {
            // For CreatedAt DESC, Id DESC ordering we want items older than the cursor
            // (i.e. CreatedAt < afterCreatedAt) OR (CreatedAt == afterCreatedAt && Id < afterId)
            query = query.Where(x => EF.Property<DateTime>(x, "CreatedAt") < afterCreatedAt.Value
                                     || (EF.Property<DateTime?>(x, "CreatedAt") == afterCreatedAt.Value && EF.Property<Guid>(x, "Id") < afterId.Value));
        }

        // Fetch one extra to determine if there's a next page
        var list = await query.Take(pageSize + 1).ToListAsync();

        bool hasNext = list.Count > pageSize;
        TSource? nextCursorItem = null;
        if (hasNext)
        {
            nextCursorItem = list[pageSize];
            list = list.Take(pageSize).ToList();
        }

        // Project to DTOs
        var projected = list.AsQueryable().Select(selector).ToList();

        object? nextCursor = null;
        if (hasNext && nextCursorItem != null)
        {
            // nextCursorItem is an in-memory entity; read properties via reflection
            var createdAtProp = nextCursorItem.GetType().GetProperty("CreatedAt");
            var idProp = nextCursorItem.GetType().GetProperty("Id");
            if (createdAtProp != null && idProp != null)
            {
                var createdAt = (DateTime)createdAtProp.GetValue(nextCursorItem)!;
                var id = (Guid)idProp.GetValue(nextCursorItem)!;
                nextCursor = new { createdAt, id };
            }
        }

        return Results.Ok(new { items = projected, nextCursor, pageSize });
    }

    public static IResult HandleDbUpdateException(DbUpdateException ex)
    {
        var message = ex.InnerException?.Message ?? ex.Message;
        if (!string.IsNullOrEmpty(message))
        {
            if (message.Contains("unique", StringComparison.OrdinalIgnoreCase) || message.Contains("duplicate", StringComparison.OrdinalIgnoreCase))
            {
                return Results.Conflict(new { message = "A uniqueness constraint was violated." });
            }
        }
        return Results.StatusCode(500);
    }
}
