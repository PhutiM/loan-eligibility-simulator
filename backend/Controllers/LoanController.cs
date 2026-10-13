using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using LoanEligibility.Api.Models;
using LoanEligibility.Api.Services;

namespace LoanEligibility.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class LoanController(ILoanService loanService) : ControllerBase
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
    public IActionResult GetProducts() =>
        Ok(new { products = loanService.GetProducts() });

    [HttpGet("loans/validation-rules")]
    public IActionResult GetValidationRules() =>
        Ok(loanService.GetValidationRules());

    [HttpPost("loans/eligibility")]
    public IActionResult CheckEligibility([FromBody] JsonElement body)
    {
        var result = loanService.CheckEligibility(body);
        if (result.Errors.Count > 0)
        {
            return BadRequest(new ValidationErrorResponse("Validation failed", result.Errors));
        }

        return Ok(result.Value);
    }

    [HttpPost("loans/calculate-rate")]
    public IActionResult CalculateRate([FromBody] JsonElement body)
    {
        var result = loanService.CalculateRate(body);
        if (result.Errors.Count > 0)
        {
            return BadRequest(new ValidationErrorResponse("Validation failed", result.Errors));
        }

        return Ok(result.Value);
    }
}
