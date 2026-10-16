using System.Text.Json.Serialization;

namespace LoanEligibility.Api.Models;

public sealed record LoanProduct(
    string Id,
    string Name,
    string Description,
    decimal MinAmount,
    decimal MaxAmount,
    int MinTerm,
    int MaxTerm,
    InterestRateRange InterestRateRange,
    string[] Purposes);

public sealed record InterestRateRange(decimal Min, decimal Max);

public sealed record ProductsResponse(IReadOnlyList<LoanProduct> Products);

public sealed record HealthResponse(string Status, string Service);

public sealed record ValidationRule(
    decimal? Min,
    decimal? Max,
    bool? Integer,
    bool Required,
    string[]? Options,
    string ErrorMessage);

public sealed record ValidationRulesResponse(
    PersonalInfoRules PersonalInfo,
    FinancialInfoRules FinancialInfo,
    LoanDetailsRules LoanDetails);

public sealed record PersonalInfoRules(
    ValidationRule Age,
    ValidationRule EmploymentStatus,
    ValidationRule EmploymentDuration);

public sealed record FinancialInfoRules(
    ValidationRule MonthlyIncome,
    ValidationRule MonthlyExpenses,
    ValidationRule ExistingDebt,
    ValidationRule CreditScore);

public sealed record LoanDetailsRules(
    ValidationRule LoanType,
    ValidationRule LoanPurpose,
    ValidationRule RequestedAmount,
    ValidationRule LoanTerm);

public sealed record FieldError(string Field, string Message);

public sealed record ValidationErrorResponse(string Error, IReadOnlyList<FieldError> Details);

// Request DTOs. Properties are nullable so missing or wrongly typed values
// surface as field-level validation errors instead of binding failures.
public sealed record EligibilityRequest
{
    public PersonalInfoRequest? PersonalInfo { get; init; }
    public FinancialInfoRequest? FinancialInfo { get; init; }
    public LoanDetailsRequest? LoanDetails { get; init; }
}

public sealed record PersonalInfoRequest
{
    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? Age { get; init; }

    [JsonConverter(typeof(LenientStringConverter))]
    public string? EmploymentStatus { get; init; }

    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? EmploymentDuration { get; init; }
}

public sealed record FinancialInfoRequest
{
    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? MonthlyIncome { get; init; }

    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? MonthlyExpenses { get; init; }

    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? ExistingDebt { get; init; }

    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? CreditScore { get; init; }
}

public sealed record LoanDetailsRequest
{
    [JsonConverter(typeof(LenientStringConverter))]
    public string? LoanType { get; init; }

    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? RequestedAmount { get; init; }

    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? LoanTerm { get; init; }

    [JsonConverter(typeof(LenientStringConverter))]
    public string? LoanPurpose { get; init; }
}

public sealed record RateRequest
{
    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? LoanAmount { get; init; }

    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? LoanTerm { get; init; }

    [JsonConverter(typeof(LenientDecimalConverter))]
    public decimal? CreditScore { get; init; }

    [JsonConverter(typeof(LenientStringConverter))]
    public string? LoanType { get; init; }
}

// Validated inputs consumed by the calculation logic.
public sealed record ValidatedEligibility(
    string EmploymentStatus,
    decimal MonthlyIncome,
    decimal MonthlyExpenses,
    decimal ExistingDebt,
    decimal? CreditScore,
    decimal RequestedAmount,
    int LoanTerm,
    LoanProduct Product);

public sealed record ValidatedRate(
    decimal LoanAmount,
    int LoanTerm,
    decimal CreditScore,
    LoanProduct Product);

public sealed record RepaymentCalculation(
    decimal MonthlyPayment,
    decimal TotalInterest,
    decimal TotalRepayment,
    IReadOnlyList<PaymentInstallment> PaymentSchedule);

public sealed record PaymentInstallment(
    int Month,
    decimal Payment,
    decimal Principal,
    decimal Interest,
    decimal Balance);

public sealed record RateCalculationResponse(
    decimal InterestRate,
    decimal MonthlyPayment,
    decimal TotalInterest,
    decimal TotalRepayment,
    IReadOnlyList<PaymentInstallment> PaymentSchedule);

public sealed record EligibilityResponse(
    EligibilityResult EligibilityResult,
    RecommendedLoan RecommendedLoan,
    AffordabilityAnalysis AffordabilityAnalysis);

public sealed record EligibilityResult(
    bool IsEligible,
    int ApprovalLikelihood,
    string RiskCategory,
    string DecisionReason);

public sealed record RecommendedLoan(
    decimal MaxAmount,
    decimal RecommendedAmount,
    decimal InterestRate,
    decimal MonthlyPayment,
    decimal TotalRepayment);

public sealed record AffordabilityAnalysis(
    decimal DisposableIncome,
    decimal DebtToIncomeRatio,
    decimal LoanToIncomeRatio,
    string AffordabilityScore);

public sealed record ValidationResult<T>(T? Value, IReadOnlyList<FieldError> Errors)
    where T : class
{
    public bool IsValid => Errors.Count == 0;
}
