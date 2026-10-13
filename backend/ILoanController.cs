using Microsoft.AspNetCore.Mvc;

namespace LoanEligibility.Api;

public interface ILoanController
{
    IActionResult Health();
    Task<IActionResult> OpenApi();
    IActionResult GetProducts();
    IActionResult GetValidationRules();
    Task<IActionResult> CheckEligibility();
    Task<IActionResult> CalculateRate();
}
