using LoanEligibility.Api.Models;

namespace LoanEligibility.Api.Services;

public interface ILoanService
{
    IReadOnlyList<LoanProduct> GetProducts();
    ValidationRulesResponse GetValidationRules();
    ValidationResult<EligibilityResponse> CheckEligibility(EligibilityRequest? request);
    ValidationResult<RateCalculationResponse> CalculateRate(RateRequest? request);
}
