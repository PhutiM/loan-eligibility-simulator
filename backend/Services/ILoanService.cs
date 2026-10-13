using System.Text.Json;
using LoanEligibility.Api.Models;

namespace LoanEligibility.Api.Services;

public interface ILoanService
{
    IReadOnlyList<LoanProduct> GetProducts();
    object GetValidationRules();
    ServiceResult<EligibilityResponse> CheckEligibility(JsonElement body);
    ServiceResult<RateCalculationResponse> CalculateRate(JsonElement body);
}
