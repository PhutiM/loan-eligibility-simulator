using Microsoft.AspNetCore.Mvc;
using static LoanEligibility.Api.LoanHelpers;

namespace LoanEligibility.Api;

[ApiController]
[Route("api")]
public sealed class LoanController : ControllerBase, ILoanController
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
        Ok(new { products = LoanData.Products });

    [HttpGet("loans/validation-rules")]
    public IActionResult GetValidationRules() =>
        Ok(LoanData.ValidationRules);

    [HttpPost("loans/eligibility")]
    public async Task<IActionResult> CheckEligibility()
    {
        using var body = await ReadJsonBodyAsync(Request);
        var assessment = LoanService.ValidateEligibilityRequest(body.RootElement);
        if (assessment.Errors.Count > 0)
        {
            return BadRequest(new ValidationErrorResponse("Validation failed", assessment.Errors));
        }

        return Ok(LoanService.CalculateEligibility(assessment));
    }

    [HttpPost("loans/calculate-rate")]
    public async Task<IActionResult> CalculateRate()
    {
        using var body = await ReadJsonBodyAsync(Request);
        var rateRequest = LoanService.ValidateRateRequest(body.RootElement);
        if (rateRequest.Errors.Count > 0)
        {
            return BadRequest(new ValidationErrorResponse("Validation failed", rateRequest.Errors));
        }

        var interestRate = LoanService.GetRate(rateRequest.CreditScore, rateRequest.Product!);
        var repayment = LoanService.CalculateRepayment(
            rateRequest.LoanAmount,
            rateRequest.LoanTerm,
            interestRate);
        return Ok(new RateCalculationResponse(
            interestRate,
            repayment.MonthlyPayment,
            repayment.TotalInterest,
            repayment.TotalRepayment,
            repayment.PaymentSchedule));
    }
}
