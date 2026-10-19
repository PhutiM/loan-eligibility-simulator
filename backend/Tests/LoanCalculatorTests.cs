using LoanEligibility.Api.Data;
using LoanEligibility.Api.Models;
using LoanEligibility.Api.Services;
using LoanEligibility.Api.Validation;
using Xunit;

namespace LoanEligibility.Api.Tests;

public sealed class LoanCalculatorTests
{
    private static readonly LoanProduct Personal = LoanCatalog.Products[0];

    [Theory]
    [InlineData(800, 10.5)]
    [InlineData(700, 11.5)]
    [InlineData(650, 12.5)]
    [InlineData(600, 14.5)]
    [InlineData(500, 16.5)]
    [InlineData(300, 18.5)]
    public void Rate_follows_credit_score_bands(int score, double expected) =>
        Assert.Equal((decimal)expected, LoanCalculator.GetRate(score, Personal));

    [Fact]
    public void Repayment_schedule_clears_the_balance()
    {
        var result = LoanCalculator.CalculateRepayment(100000m, 12, 12m);
        Assert.Equal(12, result.PaymentSchedule.Count);
        Assert.Equal(0m, result.PaymentSchedule[^1].Balance);
        Assert.Equal(result.TotalRepayment - 100000m, result.TotalInterest);
    }

    [Fact]
    public void Zero_interest_splits_principal_evenly()
    {
        var result = LoanCalculator.CalculateRepayment(1200m, 12, 0m);
        Assert.Equal(100m, result.MonthlyPayment);
        Assert.Equal(0m, result.TotalInterest);
    }

    [Fact]
    public void Validator_reports_field_errors_for_missing_sections()
    {
        var result = new LoanRequestValidator().Validate(new EligibilityRequest());
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Field == "personalInfo");
        Assert.Contains(result.Errors, e => e.Field == "financialInfo.monthlyIncome");
    }

    [Fact]
    public void Rate_validator_rejects_amounts_outside_product_limits()
    {
        var result = new LoanRequestValidator().Validate(new RateRequest
        {
            LoanAmount = 1_000_000m, LoanTerm = 24, CreditScore = 700, LoanType = "personal_loan"
        });
        Assert.Contains(result.Errors, e => e.Field == "loanAmount");
    }

    private static ValidatedEligibility Application(
        string employment, decimal income, decimal debt, decimal score, decimal amount) =>
        new(employment, income, income / 2, debt, score, amount, 24, Personal);

    [Fact]
    public void Decision_reason_matches_low_risk()
    {
        var result = LoanCalculator.CalculateEligibility(Application("employed", 50000m, 0m, 750m, 50000m));
        Assert.Equal("low", result.EligibilityResult.RiskCategory);
        Assert.StartsWith("Low risk", result.EligibilityResult.DecisionReason);
    }

    [Fact]
    public void Decision_reason_matches_medium_risk_when_eligible()
    {
        var result = LoanCalculator.CalculateEligibility(Application("employed", 50000m, 20000m, 620m, 50000m));
        Assert.True(result.EligibilityResult.IsEligible);
        Assert.Equal("medium", result.EligibilityResult.RiskCategory);
        Assert.Equal(
            "Moderate income-to-expense ratio and manageable existing debt",
            result.EligibilityResult.DecisionReason);
    }

    [Fact]
    public void Decision_reason_matches_high_risk_when_declined()
    {
        var result = LoanCalculator.CalculateEligibility(Application("employed", 50000m, 0m, 400m, 50000m));
        Assert.Equal("high", result.EligibilityResult.RiskCategory);
        Assert.StartsWith("High risk", result.EligibilityResult.DecisionReason);
        Assert.Contains("credit score is below 600", result.EligibilityResult.DecisionReason);
    }

    [Fact]
    public void Existing_debt_is_a_balance_not_a_monthly_payment()
    {
        var application = new ValidatedEligibility("employed", 60000m, 10000m, 50000m, 634m, 100000m, 36, Personal);
        var result = LoanCalculator.CalculateEligibility(application);

        Assert.Equal(2.5m, result.AffordabilityAnalysis.DebtToIncomeRatio);
        Assert.True(result.EligibilityResult.IsEligible);
    }
}
