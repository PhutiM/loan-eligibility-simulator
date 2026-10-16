using Microsoft.AspNetCore.Mvc;
using LoanEligibility.Api.Models;
using LoanEligibility.Api.Services;

namespace LoanEligibility.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class LoanController(ILoanService loanService) : ControllerBase
{
    [HttpGet("loans/products")]
    public ActionResult<ProductsResponse> GetProducts() =>
        Ok(new ProductsResponse(loanService.GetProducts()));

    [HttpGet("loans/validation-rules")]
    public ActionResult<ValidationRulesResponse> GetValidationRules() =>
        Ok(loanService.GetValidationRules());

    [HttpPost("loans/eligibility")]
    [ProducesResponseType<EligibilityResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationErrorResponse>(StatusCodes.Status400BadRequest)]
    public IActionResult CheckEligibility([FromBody] EligibilityRequest? request) =>
        ToActionResult(loanService.CheckEligibility(request));

    [HttpPost("loans/calculate-rate")]
    [ProducesResponseType<RateCalculationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationErrorResponse>(StatusCodes.Status400BadRequest)]
    public IActionResult CalculateRate([FromBody] RateRequest? request) =>
        ToActionResult(loanService.CalculateRate(request));

    private IActionResult ToActionResult<T>(ValidationResult<T> result) where T : class =>
        result.IsValid
            ? Ok(result.Value)
            : BadRequest(new ValidationErrorResponse("Validation failed", result.Errors));
}
