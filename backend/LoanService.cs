using System.Globalization;
using System.Text.Json;

namespace LoanEligibility.Api;

internal static class LoanService
{
    private const double NumberEpsilon = 2.2204460492503131e-16;

    public static readonly LoanProduct[] Products =
    [
        new(
            "personal_loan",
            "Personal Loan",
            "Flexible personal financing for various needs",
            5000,
            300000,
            6,
            60,
            new InterestRateRange(10.5, 18.5),
            ["debt_consolidation", "home_improvement", "education", "medical", "other"]),
        new(
            "vehicle_loan",
            "Vehicle Finance",
            "Financing for new and used vehicles",
            50000,
            1500000,
            12,
            72,
            new InterestRateRange(8.5, 15),
            ["new_vehicle", "used_vehicle"])
    ];

    public static readonly object ValidationRules = new
    {
        personalInfo = new
        {
            age = new ValidationRule(18, 65, true, true, null, "Age must be between 18 and 65"),
            employmentStatus = new ValidationRule(null, null, null, true,
                ["employed", "self_employed", "unemployed", "retired"],
                "Please select your employment status"),
            employmentDuration = new ValidationRule(3, null, true, true, null,
                "Minimum 3 months employment required")
        },
        financialInfo = new
        {
            monthlyIncome = new ValidationRule(5000, null, null, true, null,
                "Minimum monthly income of R5,000 required"),
            monthlyExpenses = new ValidationRule(0, null, null, true, null,
                "Please enter your monthly expenses"),
            existingDebt = new ValidationRule(0, null, null, true, null,
                "Please enter your existing debt"),
            creditScore = new ValidationRule(300, 850, true, false, null,
                "Credit score must be between 300 and 850")
        },
        loanDetails = new
        {
            loanType = new ValidationRule(null, null, null, true,
                Products.Select(product => product.Id).ToArray(), "Please select a loan product"),
            loanPurpose = new ValidationRule(null, null, null, true, null,
                "Please select a loan purpose"),
            requestedAmount = new ValidationRule(5000, 300000, null, true, null,
                "Loan amount must be between R5,000 and R300,000"),
            loanTerm = new ValidationRule(6, 60, true, true, null,
                "Loan term must be between 6 and 60 months")
        }
    };

    public static async Task<JsonDocument> ReadJsonBodyAsync(HttpRequest request)
    {
        using var reader = new StreamReader(request.Body);
        var body = await reader.ReadToEndAsync(request.HttpContext.RequestAborted);
        return JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
    }

    public static EligibilityAssessment ValidateEligibilityRequest(JsonElement body)
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
        var product = Products.FirstOrDefault(item => item.Id == loanType);

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
            min: product?.MinAmount ?? Products[0].MinAmount,
            max: product?.MaxAmount ?? Products[0].MaxAmount,
            errorMessage: product is null
                ? "Loan amount must be between R5,000 and R300,000"
                : $"Loan amount must be between R{FormatNumber(product.MinAmount)} and R{FormatNumber(product.MaxAmount)}");
        ValidateNumber(GetProperty(loanDetails, "loanTerm"), "loanDetails.loanTerm", errors,
            min: product?.MinTerm ?? Products[0].MinTerm,
            max: product?.MaxTerm ?? Products[0].MaxTerm,
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

    public static RateRequestAssessment ValidateRateRequest(JsonElement body)
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

        var product = Products.FirstOrDefault(item => item.Id == GetString(GetProperty(body, "loanType")));
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

    public static double GetRate(double? creditScore, LoanProduct product)
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

    public static RepaymentCalculation CalculateRepayment(double loanAmount, double loanTerm, double interestRate)
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

    public static EligibilityResponse CalculateEligibility(EligibilityAssessment application)
    {
        var product = application.Product ?? Products[0];
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
        var riskCategory = creditScore >= 650 && debtToIncomeRatio <= 30
            ? "low"
            : creditScore >= 600 && monthlyDebtRatio <= 55 ? "medium" : "high";
        var affordabilityScore = debtToIncomeRatio <= 30
            ? "good"
            : debtToIncomeRatio <= 45 ? "fair" : "poor";
        var approvalLikelihood = Math.Max(5, Math.Min(95, JsRound(
            80 + (creditScore - 650) * 0.1
            - Math.Max(0, debtToIncomeRatio - 20) * 0.5
            + (employed ? 5 : -20))));

        return new EligibilityResponse(
            new EligibilityResult(
                isEligible,
                approvalLikelihood,
                riskCategory,
                isEligible
                    ? "Strong income-to-expense ratio and manageable existing debt"
                    : "The application does not meet the income, employment, credit, or affordability criteria"),
            new RecommendedLoan(
                maxAmount,
                isEligible ? application.RequestedAmount : maxAmount,
                interestRate,
                repayment.MonthlyPayment,
                repayment.TotalRepayment),
            new AffordabilityAnalysis(
                disposableIncome, debtToIncomeRatio, loanToIncomeRatio, affordabilityScore));
    }

    private static void ValidateNumber(
        JsonElement value,
        string field,
        List<FieldError> errors,
        double? min = null,
        double? max = null,
        bool integer = false,
        string? errorMessage = null)
    {
        if (value.ValueKind != JsonValueKind.Number || !value.TryGetDouble(out var number) || !double.IsFinite(number))
        {
            errors.Add(new FieldError(field, errorMessage ?? $"{field} must be a number"));
            return;
        }
        if (integer && number != Math.Truncate(number))
        {
            errors.Add(new FieldError(field, errorMessage ?? $"{field} must be an integer"));
            return;
        }
        if (min is not null && number < min)
        {
            errors.Add(new FieldError(field, errorMessage ?? $"{field} must be at least {FormatNumber(min.Value)}"));
            return;
        }
        if (max is not null && number > max)
            errors.Add(new FieldError(field, errorMessage ?? $"{field} must be at most {FormatNumber(max.Value)}"));
    }

    private static double RoundMoney(double amount) =>
        Math.Floor((amount + NumberEpsilon) * 100 + 0.5) / 100;

    private static int JsRound(double value) => (int)Math.Floor(value + 0.5);

    private static string FormatNumber(double number) =>
        number.ToString("N0", CultureInfo.InvariantCulture);

    private static bool IsObject(JsonElement value) => value.ValueKind == JsonValueKind.Object;

    private static JsonElement GetObject(JsonElement parent, string property)
    {
        var value = GetProperty(parent, property);
        return IsObject(value) ? value : default;
    }

    private static JsonElement GetProperty(JsonElement parent, string property) =>
        parent.ValueKind == JsonValueKind.Object && parent.TryGetProperty(property, out var value)
            ? value
            : default;

    private static string? GetString(JsonElement value) =>
        value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    private static double GetNumber(JsonElement value) =>
        value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var number) ? number : 0;

    private static double? GetNullableNumber(JsonElement value) =>
        value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var number) ? number : null;
}

internal sealed record LoanProduct(
    string Id,
    string Name,
    string Description,
    double MinAmount,
    double MaxAmount,
    int MinTerm,
    int MaxTerm,
    InterestRateRange InterestRateRange,
    string[] Purposes);

internal sealed record InterestRateRange(double Min, double Max);
internal sealed record ValidationRule(
    double? Min,
    double? Max,
    bool? Integer,
    bool Required,
    string[]? Options,
    string ErrorMessage);
internal sealed record FieldError(string Field, string Message);
internal sealed record ValidationErrorResponse(string Error, IReadOnlyList<FieldError> Details);
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
internal sealed record PaymentInstallment(
    int Month,
    double Payment,
    double Principal,
    double Interest,
    double Balance);
internal sealed record RateCalculationResponse(
    double InterestRate,
    double MonthlyPayment,
    double TotalInterest,
    double TotalRepayment,
    IReadOnlyList<PaymentInstallment> PaymentSchedule);
internal sealed record EligibilityResponse(
    EligibilityResult EligibilityResult,
    RecommendedLoan RecommendedLoan,
    AffordabilityAnalysis AffordabilityAnalysis);
internal sealed record EligibilityResult(
    bool IsEligible,
    int ApprovalLikelihood,
    string RiskCategory,
    string DecisionReason);
internal sealed record RecommendedLoan(
    double MaxAmount,
    double RecommendedAmount,
    double InterestRate,
    double MonthlyPayment,
    double TotalRepayment);
internal sealed record AffordabilityAnalysis(
    double DisposableIncome,
    double DebtToIncomeRatio,
    double LoanToIncomeRatio,
    string AffordabilityScore);
