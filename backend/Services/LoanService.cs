using System.Text.Json;
using LoanEligibility.Api.Helpers;
using LoanEligibility.Api.Models;
using LoanEligibility.Api.Mock;
using static LoanEligibility.Api.Helpers.LoanHelpers;

namespace LoanEligibility.Api.Services;

internal sealed class LoanService : ILoanService
{
    public IReadOnlyList<LoanProduct> GetProducts() => LoanData.Products;

    public object GetValidationRules() => LoanData.ValidationRules;

    public ServiceResult<EligibilityResponse> CheckEligibility(JsonElement body)
    {
        var assessment = ValidateEligibilityRequest(body);
        return assessment.Errors.Count > 0
            ? new ServiceResult<EligibilityResponse>(null, assessment.Errors)
            : new ServiceResult<EligibilityResponse>(CalculateEligibility(assessment), []);
    }

    public ServiceResult<RateCalculationResponse> CalculateRate(JsonElement body)
    {
        var rateRequest = ValidateRateRequest(body);
        if (rateRequest.Errors.Count > 0)
            return new ServiceResult<RateCalculationResponse>(null, rateRequest.Errors);

        var interestRate = GetRate(rateRequest.CreditScore, rateRequest.Product!);
        var repayment = CalculateRepayment(
            rateRequest.LoanAmount,
            rateRequest.LoanTerm,
            interestRate);
        return new ServiceResult<RateCalculationResponse>(
            new RateCalculationResponse(
                interestRate,
                repayment.MonthlyPayment,
                repayment.TotalInterest,
                repayment.TotalRepayment,
                repayment.PaymentSchedule),
            []);
    }

    private static EligibilityAssessment ValidateEligibilityRequest(JsonElement body)
    {
        var errors = new List<FieldError>();
        var personalInfo = GetObject(body, "personalInfo");
        var financialInfo = GetObject(body, "financialInfo");
        var loanDetails = GetObject(body, "loanDetails");

        if (!IsObject(GetProperty(body, "personalInfo")))
            errors.Add(new FieldError("personalInfo", "personalInfo must be an object"));
        if (!IsObject(GetProperty(body, "financialInfo")))
            errors.Add(new FieldError("financialInfo", "financialInfo must be an object"));
        if (!IsObject(GetProperty(body, "loanDetails")))
            errors.Add(new FieldError("loanDetails", "loanDetails must be an object"));

        var loanType = GetString(GetProperty(loanDetails, "loanType")) ?? "personal_loan";
        var product = LoanData.Products.FirstOrDefault(item => item.Id == loanType);

        ValidateNumber(GetProperty(personalInfo, "age"), "personalInfo.age", errors,
            min: 18, max: 65, integer: true, errorMessage: "Age must be between 18 and 65");

        var employmentStatus = GetString(GetProperty(personalInfo, "employmentStatus"));
        if (employmentStatus is not ("employed" or "self_employed" or "unemployed" or "retired"))
            errors.Add(new FieldError("personalInfo.employmentStatus", "Please select your employment status"));

        ValidateNumber(GetProperty(personalInfo, "employmentDuration"), "personalInfo.employmentDuration",
            errors, min: 3, integer: true, errorMessage: "Minimum 3 months employment required");
        ValidateNumber(GetProperty(financialInfo, "monthlyIncome"), "financialInfo.monthlyIncome",
            errors, min: 5000, errorMessage: "Minimum monthly income of R5,000 required");
        ValidateNumber(GetProperty(financialInfo, "monthlyExpenses"), "financialInfo.monthlyExpenses",
            errors, min: 0, errorMessage: "Please enter your monthly expenses");
        ValidateNumber(GetProperty(financialInfo, "existingDebt"), "financialInfo.existingDebt",
            errors, min: 0, errorMessage: "Please enter your existing debt");

        var creditScoreElement = GetProperty(financialInfo, "creditScore");
        if (creditScoreElement.ValueKind is not (JsonValueKind.Undefined or JsonValueKind.Null))
        {
            ValidateNumber(creditScoreElement, "financialInfo.creditScore", errors,
                min: 300, max: 850, integer: true,
                errorMessage: "Credit score must be between 300 and 850");
        }

        if (product is null)
            errors.Add(new FieldError("loanDetails.loanType", "Please select a loan product"));

        ValidateNumber(GetProperty(loanDetails, "requestedAmount"), "loanDetails.requestedAmount",
            errors,
            min: product?.MinAmount ?? LoanData.Products[0].MinAmount,
            max: product?.MaxAmount ?? LoanData.Products[0].MaxAmount,
            errorMessage: product is null
                ? "Loan amount must be between R5,000 and R300,000"
                : $"Loan amount must be between R{FormatNumber(product.MinAmount)} and R{FormatNumber(product.MaxAmount)}");
        ValidateNumber(GetProperty(loanDetails, "loanTerm"), "loanDetails.loanTerm", errors,
            min: product?.MinTerm ?? LoanData.Products[0].MinTerm,
            max: product?.MaxTerm ?? LoanData.Products[0].MaxTerm,
            integer: true,
            errorMessage: product is null
                ? "Loan term must be between 6 and 60 months"
                : $"Loan term must be between {product.MinTerm} and {product.MaxTerm} months");

        var loanPurpose = GetString(GetProperty(loanDetails, "loanPurpose"));
        if (product is not null && !product.Purposes.Contains(loanPurpose, StringComparer.Ordinal))
            errors.Add(new FieldError("loanDetails.loanPurpose", "Please select a loan purpose"));

        return new EligibilityAssessment(
            errors,
            employmentStatus ?? "",
            GetNumber(GetProperty(financialInfo, "monthlyIncome")),
            GetNumber(GetProperty(financialInfo, "monthlyExpenses")),
            GetNumber(GetProperty(financialInfo, "existingDebt")),
            GetNullableNumber(creditScoreElement),
            GetNumber(GetProperty(loanDetails, "requestedAmount")),
            GetNumber(GetProperty(loanDetails, "loanTerm")),
            product);
    }

    private static RateRequestAssessment ValidateRateRequest(JsonElement body)
    {
        var errors = new List<FieldError>();
        if (!IsObject(body))
            errors.Add(new FieldError("body", "Request body must be an object"));

        var loanAmountElement = GetProperty(body, "loanAmount");
        var loanTermElement = GetProperty(body, "loanTerm");
        var creditScoreElement = GetProperty(body, "creditScore");
        ValidateNumber(loanAmountElement, "loanAmount", errors, min: 1);
        ValidateNumber(loanTermElement, "loanTerm", errors, min: 1, integer: true);
        ValidateNumber(creditScoreElement, "creditScore", errors, min: 300, max: 850, integer: true);

        var product = LoanData.Products.FirstOrDefault(item => item.Id == GetString(GetProperty(body, "loanType")));
        if (product is null)
            errors.Add(new FieldError("loanType", "loanType must be personal_loan or vehicle_loan"));

        var loanAmount = GetNumber(loanAmountElement);
        var loanTerm = GetNumber(loanTermElement);
        if (errors.Count == 0 && product is not null)
        {
            if (loanAmount < product.MinAmount || loanAmount > product.MaxAmount)
            {
                errors.Add(new FieldError("loanAmount",
                    $"loanAmount must be between {FormatNumber(product.MinAmount)} and {FormatNumber(product.MaxAmount)} for {product.Id}"));
            }
            if (loanTerm < product.MinTerm || loanTerm > product.MaxTerm)
            {
                errors.Add(new FieldError("loanTerm",
                    $"loanTerm must be between {product.MinTerm} and {product.MaxTerm} for {product.Id}"));
            }
        }

        return new RateRequestAssessment(
            errors, loanAmount, loanTerm, GetNumber(creditScoreElement), product);
    }

    private static double GetRate(double? creditScore, LoanProduct product)
    {
        var score = creditScore ?? 300;
        var rateOffset = score >= 750 ? 0
            : score >= 700 ? 1
            : score >= 650 ? 2
            : score >= 600 ? 4
            : score >= 500 ? 6
            : 8;
        return Math.Min(product.InterestRateRange.Min + rateOffset, product.InterestRateRange.Max);
    }

    private static RepaymentCalculation CalculateRepayment(double loanAmount, double loanTerm, double interestRate)
    {
        var monthlyRate = interestRate / 100 / 12;
        var monthlyPayment = monthlyRate == 0
            ? loanAmount / loanTerm
            : loanAmount * monthlyRate / (1 - Math.Pow(1 + monthlyRate, -loanTerm));
        var paymentSchedule = new List<PaymentInstallment>();
        var balance = loanAmount;

        for (var month = 1; month <= loanTerm; month++)
        {
            var interest = RoundMoney(balance * monthlyRate);
            var payment = month == loanTerm
                ? RoundMoney(balance + interest)
                : RoundMoney(monthlyPayment);
            var principal = RoundMoney(payment - interest);
            balance = RoundMoney(Math.Max(0, balance - principal));
            paymentSchedule.Add(new PaymentInstallment(
                month, payment, principal, interest, month == loanTerm ? 0 : balance));
        }

        var totalRepayment = RoundMoney(paymentSchedule.Sum(installment => installment.Payment));
        return new RepaymentCalculation(
            RoundMoney(monthlyPayment),
            RoundMoney(totalRepayment - loanAmount),
            totalRepayment,
            paymentSchedule);
    }

    private static EligibilityResponse CalculateEligibility(EligibilityAssessment application)
    {
        var product = application.Product ?? LoanData.Products[0];
        var creditScore = application.CreditScore ?? 300;
        var disposableIncome = RoundMoney(application.MonthlyIncome - application.MonthlyExpenses);
        var debtToIncomeRatio = RoundMoney(application.ExistingDebt / application.MonthlyIncome * 100);
        var maxAmount = RoundMoney(Math.Min(product.MaxAmount, Math.Max(0, disposableIncome * 18)));
        var loanToIncomeRatio = RoundMoney(maxAmount / (application.MonthlyIncome * 12) * 100);
        var interestRate = GetRate(creditScore, product);
        var repayment = CalculateRepayment(application.RequestedAmount, application.LoanTerm, interestRate);
        var monthlyDebtRatio =
            (application.ExistingDebt + repayment.MonthlyPayment) / application.MonthlyIncome * 100;
        var employed = application.EmploymentStatus is "employed" or "self_employed";
        var isEligible = employed
            && creditScore >= 600
            && maxAmount >= product.MinAmount
            && application.RequestedAmount <= maxAmount
            && monthlyDebtRatio <= 55;
        var riskCategory = isEligible && creditScore >= 650 && debtToIncomeRatio <= 30
            ? "low"
            : creditScore >= 600 && monthlyDebtRatio <= 55 ? "medium" : "high";
        var affordabilityScore = debtToIncomeRatio <= 30
            ? "good"
            : debtToIncomeRatio <= 45 ? "fair" : "poor";
        var approvalLikelihood = Math.Max(5, Math.Min(95, JsRound(
            80 + (creditScore - 650) * 0.1
            - Math.Max(0, debtToIncomeRatio - 20) * 0.5
            + (employed ? 5 : -20))));
        if (!isEligible)
            approvalLikelihood = Math.Min(approvalLikelihood, 35);

        return new EligibilityResponse(
            new EligibilityResult(
                isEligible,
                approvalLikelihood,
                riskCategory,
                isEligible
                    ? "Strong income-to-expense ratio and manageable existing debt"
                    : DescribeDeclineReasons(
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

    private static string DescribeDeclineReasons(
        bool employed,
        double creditScore,
        double maxAmount,
        double requestedAmount,
        double monthlyDebtRatio,
        LoanProduct product)
    {
        var reasons = new List<string>();
        if (!employed)
            reasons.Add("employment status must be employed or self-employed");
        if (creditScore < 600)
            reasons.Add("credit score is below 600");
        if (maxAmount < product.MinAmount)
            reasons.Add($"affordable amount is below the R{FormatNumber(product.MinAmount)} minimum");
        else if (requestedAmount > maxAmount)
            reasons.Add($"requested amount exceeds the affordable maximum of R{FormatNumber(maxAmount)}");
        if (monthlyDebtRatio > 55)
            reasons.Add("monthly debt payments would exceed 55% of income");

        return reasons.Count == 0
            ? "The application does not meet the simulator's screening criteria"
            : $"Not eligible: {string.Join("; ", reasons)}";
    }
}
