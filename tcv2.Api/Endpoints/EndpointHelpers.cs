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
        if (req.Query.TryGetValue("pageSize", out var ps) && int.TryParse(ps, out var psi) && psi > 0) pageSize = Math.Min(100, psi);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Results.Ok(new { items, total, page, pageSize });
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
