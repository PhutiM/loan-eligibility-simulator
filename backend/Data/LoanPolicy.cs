namespace LoanEligibility.Api.Data;

/// <summary>Business rules and thresholds used by validation and eligibility decisions.</summary>
public static class LoanPolicy
{
    public const int MinAge = 18;
    public const int MaxAge = 65;
    public const int MinEmploymentMonths = 3;
    public const decimal MinMonthlyIncome = 5000m;
    public const int MinCreditScore = 300;
    public const int MaxCreditScore = 850;
    public const int DefaultCreditScore = 300;

    public static readonly string[] EmploymentStatuses =
        ["employed", "self_employed", "unemployed", "retired"];

    public const int MinEligibleCreditScore = 600;
    public const int LowRiskCreditScore = 650;
    public const decimal MaxMonthlyDebtRatio = 55m;
    public const decimal LowRiskDebtToIncome = 30m;
    public const decimal FairDebtToIncome = 45m;
    public const decimal DisposableIncomeMultiplier = 18m;
    public const int IneligibleLikelihoodCap = 35;

    // Credit score floor -> percentage points added to the product's minimum rate.
    public static readonly (int MinScore, decimal Offset)[] RateBands =
        [(750, 0m), (700, 1m), (650, 2m), (600, 4m), (500, 6m)];
    public const decimal LowestBandOffset = 8m;
}
