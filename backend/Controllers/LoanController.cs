using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using LoanEligibility.Api.Models;
using LoanEligibility.Api.Cqrs;
using LoanEligibility.Api.Queries;

namespace LoanEligibility.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class LoanController(IQueryDispatcher queries) : ControllerBase
{
    [HttpGet("health")]
    public IActionResult Health() =>
        Ok(new { status = "ok", service = "loan-eligibility-api" });

    [HttpGet("openapi.yaml")]
    [Produces("application/yaml")]
    public async Task<IActionResult> OpenApi()
    {
        var assemblyDirectory = Path.GetDirectoryName(typeof(Program).Assembly.Location)!;
        var document = await System.IO.File.ReadAllTextAsync(
            Path.Combine(assemblyDirectory, "openapi.yaml"),
            HttpContext.RequestAborted);
        return Content(document, "application/yaml");
    }

    [HttpGet("loans/products")]
    public async Task<IActionResult> GetProducts(CancellationToken cancellationToken) =>
        Ok(new { products = await queries.QueryAsync(new GetLoanProductsQuery(), cancellationToken) });

    [HttpGet("loans/validation-rules")]
    public async Task<IActionResult> GetValidationRules(CancellationToken cancellationToken) =>
        Ok(await queries.QueryAsync(new GetValidationRulesQuery(), cancellationToken));

    [HttpPost("loans/eligibility")]
    public async Task<IActionResult> CheckEligibility([FromBody] JsonElement body, CancellationToken cancellationToken)
    {
        var result = await queries.QueryAsync(new CheckEligibilityQuery(body), cancellationToken);
        if (result.Errors.Count > 0)
        {
            return BadRequest(new ValidationErrorResponse("Validation failed", result.Errors));
        }

        return Ok(result.Value);
    }

    [HttpPost("loans/calculate-rate")]
    public async Task<IActionResult> CalculateRate([FromBody] JsonElement body, CancellationToken cancellationToken)
    {
        var result = await queries.QueryAsync(new CalculateRateQuery(body), cancellationToken);
        if (result.Errors.Count > 0)
        {
            return BadRequest(new ValidationErrorResponse("Validation failed", result.Errors));
        }

        return Ok(result.Value);
    }
}
