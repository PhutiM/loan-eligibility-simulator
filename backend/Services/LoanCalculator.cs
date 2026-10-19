using LoanEligibility.Api.Data;
using LoanEligibility.Api.Models;

namespace LoanEligibility.Api.Services;

/// <summary>Pure loan maths and decision rules; contains no request parsing or validation.</summary>
public static class LoanCalculator
{
    public static decimal RoundMoney(decimal amount) =>
        Math.Round(amount, 2, MidpointRounding.AwayFromZero);

    public static decimal GetRate(decimal? creditScore, LoanProduct product)
    {
        var score = creditScore ?? LoanPolicy.DefaultCreditScore;
        var offset = LoanPolicy.LowestBandOffset;
        foreach (var (minScore, bandOffset) in LoanPolicy.RateBands)
        {
            if (score >= minScore)
            {
                offset = bandOffset;
                break;
            }
        }
        return Math.Min(product.InterestRateRange.Min + offset, product.InterestRateRange.Max);
    }

    public static RepaymentCalculation CalculateRepayment(decimal loanAmount, int loanTerm, decimal interestRate)
    {
        var monthlyRate = interestRate / 100m / 12m;
        var monthlyPayment = monthlyRate == 0
            ? loanAmount / loanTerm
            : loanAmount * monthlyRate / (1m - (decimal)Math.Pow((double)(1m + monthlyRate), -loanTerm));
        var schedule = new List<PaymentInstallment>(loanTerm);
        var balance = loanAmount;

        for (var month = 1; month <= loanTerm; month++)
        {
            var interest = RoundMoney(balance * monthlyRate);
            var payment = month == loanTerm
                ? RoundMoney(balance + interest)
                : RoundMoney(monthlyPayment);
            var principal = RoundMoney(payment - interest);
            balance = RoundMoney(Math.Max(0m, balance - principal));
            schedule.Add(new PaymentInstallment(
                month, payment, principal, interest, month == loanTerm ? 0m : balance));
        }

        var totalRepayment = RoundMoney(schedule.Sum(installment => installment.Payment));
        return new RepaymentCalculation(
            RoundMoney(monthlyPayment),
            RoundMoney(totalRepayment - loanAmount),
            totalRepayment,
            schedule);
    }

    public static RateCalculationResponse CalculateRate(ValidatedRate request)
    {
        var rate = GetRate(request.CreditScore, request.Product);
        var repayment = CalculateRepayment(request.LoanAmount, request.LoanTerm, rate);
        return new RateCalculationResponse(
            rate,
            repayment.MonthlyPayment,
            repayment.TotalInterest,
            repayment.TotalRepayment,
            repayment.PaymentSchedule);
    }

    public static EligibilityResponse CalculateEligibility(ValidatedEligibility application)
    {
        var product = application.Product;
        var creditScore = application.CreditScore ?? LoanPolicy.DefaultCreditScore;
        var disposableIncome = RoundMoney(application.MonthlyIncome - application.MonthlyExpenses);
        var existingMonthlyDebt = application.ExistingDebt * LoanPolicy.AssumedMonthlyRepaymentRate;
        var debtToIncomeRatio = RoundMoney(existingMonthlyDebt / application.MonthlyIncome * 100m);
        var maxAmount = RoundMoney(Math.Min(
            product.MaxAmount,
            Math.Max(0m, disposableIncome * LoanPolicy.DisposableIncomeMultiplier)));
        var loanToIncomeRatio = RoundMoney(maxAmount / (application.MonthlyIncome * 12m) * 100m);
        var interestRate = GetRate(creditScore, product);
        var repayment = CalculateRepayment(application.RequestedAmount, application.LoanTerm, interestRate);
        var monthlyDebtRatio =
            (existingMonthlyDebt + repayment.MonthlyPayment) / application.MonthlyIncome * 100m;
        var employed = application.EmploymentStatus is "employed" or "self_employed";
        var isEligible = employed
            && creditScore >= LoanPolicy.MinEligibleCreditScore
            && maxAmount >= product.MinAmount
            && application.RequestedAmount <= maxAmount
            && monthlyDebtRatio <= LoanPolicy.MaxMonthlyDebtRatio;
        var riskCategory = isEligible
                && creditScore >= LoanPolicy.LowRiskCreditScore
                && debtToIncomeRatio <= LoanPolicy.LowRiskDebtToIncome
            ? "low"
            : creditScore >= LoanPolicy.MinEligibleCreditScore
                && monthlyDebtRatio <= LoanPolicy.MaxMonthlyDebtRatio ? "medium" : "high";
        var affordabilityScore = debtToIncomeRatio <= LoanPolicy.LowRiskDebtToIncome
            ? "good"
            : debtToIncomeRatio <= LoanPolicy.FairDebtToIncome ? "fair" : "poor";
        var likelihood = Math.Max(5, Math.Min(95, (int)Math.Floor(
            80m + (creditScore - 650m) * 0.1m
            - Math.Max(0m, debtToIncomeRatio - 20m) * 0.5m
            + (employed ? 5m : -20m) + 0.5m)));
        if (!isEligible)
            likelihood = Math.Min(likelihood, LoanPolicy.IneligibleLikelihoodCap);

        return new EligibilityResponse(
            new EligibilityResult(
                isEligible,
                likelihood,
                riskCategory,
                DescribeDecision(
                    isEligible,
                    riskCategory,
                    employed,
                    creditScore,
                    maxAmount,
                    application.RequestedAmount,
                    monthlyDebtRatio,
                    product)),
            new RecommendedLoan(
                maxAmount,
                isEligible ? application.RequestedAmount : maxAmount,
                interestRate,
                repayment.MonthlyPayment,
                repayment.TotalRepayment),
            new AffordabilityAnalysis(
                disposableIncome, debtToIncomeRatio, loanToIncomeRatio, affordabilityScore));
    }

    private static string DescribeDecision(
        bool isEligible,
        string riskCategory,
        bool employed,
        decimal creditScore,
        decimal maxAmount,
        decimal requestedAmount,
        decimal monthlyDebtRatio,
        LoanProduct product)
    {
        if (isEligible)
        {
            return riskCategory == "low"
                ? "Low risk: your income comfortably covers your expenses and existing debt, and your credit score is strong, so this loan looks affordable"
                : "Moderate income-to-expense ratio and manageable existing debt";
        }

        var reasons = new List<string>();
        if (!employed)
            reasons.Add("you need to be employed or self-employed");
        if (creditScore < LoanPolicy.MinEligibleCreditScore)
            reasons.Add($"your credit score is below {LoanPolicy.MinEligibleCreditScore}");
        if (maxAmount < product.MinAmount)
            reasons.Add($"based on your income and expenses, you can afford less than the R{Format(product.MinAmount)} minimum for this loan");
        else if (requestedAmount > maxAmount)
            reasons.Add($"the amount you asked for is more than you can afford (up to R{Format(maxAmount)})");
        if (monthlyDebtRatio > LoanPolicy.MaxMonthlyDebtRatio)
            reasons.Add($"your monthly debt payments would take up more than {LoanPolicy.MaxMonthlyDebtRatio:0}% of your income");

        var lead = riskCategory == "high"
            ? "High risk, you may not qualify yet"
            : "Medium risk, you are close but may not qualify yet";
        return reasons.Count == 0
            ? $"{lead}: your application does not meet our requirements right now"
            : $"{lead}: {string.Join("; ", reasons)}.";
    }

    private static string Format(decimal number) =>
        number.ToString("N0", System.Globalization.CultureInfo.InvariantCulture);
}
