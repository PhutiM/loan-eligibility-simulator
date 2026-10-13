namespace LoanEligibility.Api.Models;

public sealed record LoanProduct(
    string Id,
    string Name,
    string Description,
    double MinAmount,
    double MaxAmount,
    int MinTerm,
    int MaxTerm,
    InterestRateRange InterestRateRange,
    string[] Purposes);

public sealed record InterestRateRange(double Min, double Max);

public sealed record ValidationRule(
    double? Min,
    double? Max,
    bool? Integer,
    bool Required,
    string[]? Options,
    string ErrorMessage);

public sealed record FieldError(string Field, string Message);

public sealed record ValidationErrorResponse(string Error, IReadOnlyList<FieldError> Details);

internal sealed record EligibilityAssessment(
    List<FieldError> Errors,
    string EmploymentStatus,
    double MonthlyIncome,
    double MonthlyExpenses,
    double ExistingDebt,
    double? CreditScore,
    double RequestedAmount,
    double LoanTerm,
    LoanProduct? Product);

internal sealed record RateRequestAssessment(
    List<FieldError> Errors,
    double LoanAmount,
    double LoanTerm,
    double CreditScore,
    LoanProduct? Product);

internal sealed record RepaymentCalculation(
    double MonthlyPayment,
    double TotalInterest,
    double TotalRepayment,
    IReadOnlyList<PaymentInstallment> PaymentSchedule);

public sealed record PaymentInstallment(
    int Month,
    double Payment,
    double Principal,
    double Interest,
    double Balance);

public sealed record RateCalculationResponse(
    double InterestRate,
    double MonthlyPayment,
    double TotalInterest,
    double TotalRepayment,
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
    double MaxAmount,
    double RecommendedAmount,
    double InterestRate,
    double MonthlyPayment,
    double TotalRepayment);

public sealed record AffordabilityAnalysis(
    double DisposableIncome,
    double DebtToIncomeRatio,
    double LoanToIncomeRatio,
    string AffordabilityScore);

public sealed record ServiceResult<T>(T? Value, IReadOnlyList<FieldError> Errors)
    where T : class;
