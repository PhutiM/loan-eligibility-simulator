using LoanEligibility.Api.Data;
using LoanEligibility.Api.Models;
using LoanEligibility.Api.Validation;

namespace LoanEligibility.Api.Services;

internal sealed class LoanService(ILoanRequestValidator validator) : ILoanService
{
    public IReadOnlyList<LoanProduct> GetProducts() => LoanCatalog.Products;

    public ValidationRulesResponse GetValidationRules() => LoanCatalog.ValidationRules;

    public ValidationResult<EligibilityResponse> CheckEligibility(EligibilityRequest? request)
    {
        var validated = validator.Validate(request);
        return validated.IsValid
            ? new(LoanCalculator.CalculateEligibility(validated.Value!), [])
            : new(null, validated.Errors);
    }

    public ValidationResult<RateCalculationResponse> CalculateRate(RateRequest? request)
    {
        var validated = validator.Validate(request);
        return validated.IsValid
            ? new(LoanCalculator.CalculateRate(validated.Value!), [])
            : new(null, validated.Errors);
    }
}
