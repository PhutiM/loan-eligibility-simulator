using System.Globalization;
using LoanEligibility.Api.Data;
using LoanEligibility.Api.Models;

namespace LoanEligibility.Api.Validation;

public interface ILoanRequestValidator
{
    ValidationResult<ValidatedEligibility> Validate(EligibilityRequest? request);
    ValidationResult<ValidatedRate> Validate(RateRequest? request);
}

public sealed class LoanRequestValidator : ILoanRequestValidator
{
    public ValidationResult<ValidatedEligibility> Validate(EligibilityRequest? request)
    {
        var errors = new List<FieldError>();
        var personal = request?.PersonalInfo;
        var financial = request?.FinancialInfo;
        var details = request?.LoanDetails;

        if (personal is null)
            errors.Add(new("personalInfo", "personalInfo must be an object"));
        if (financial is null)
            errors.Add(new("financialInfo", "financialInfo must be an object"));
        if (details is null)
            errors.Add(new("loanDetails", "loanDetails must be an object"));

        var loanType = details?.LoanType ?? "personal_loan";
        var product = LoanCatalog.FindProduct(loanType);
        var fallback = LoanCatalog.Products[0];

        CheckNumber(personal?.Age, "personalInfo.age", errors,
            LoanPolicy.MinAge, LoanPolicy.MaxAge, integer: true, "Age must be between 18 and 65");

        var status = personal?.EmploymentStatus;
        if (status is null || !LoanPolicy.EmploymentStatuses.Contains(status))
            errors.Add(new("personalInfo.employmentStatus", "Please select your employment status"));

        CheckNumber(personal?.EmploymentDuration, "personalInfo.employmentDuration", errors,
            LoanPolicy.MinEmploymentMonths, null, integer: true, "Minimum 3 months employment required");
        CheckNumber(financial?.MonthlyIncome, "financialInfo.monthlyIncome", errors,
            LoanPolicy.MinMonthlyIncome, null, false, "Minimum monthly income of R5,000 required");
        CheckNumber(financial?.MonthlyExpenses, "financialInfo.monthlyExpenses", errors,
            0, null, false, "Please enter your monthly expenses");
        CheckNumber(financial?.ExistingDebt, "financialInfo.existingDebt", errors,
            0, null, false, "Please enter your existing debt");

        // Credit score is optional but, when supplied, must be valid. A wrongly typed
        // value deserialises to null and is treated as omitted by the lenient converter.
        if (financial?.CreditScore is not null)
        {
            CheckNumber(financial.CreditScore, "financialInfo.creditScore", errors,
                LoanPolicy.MinCreditScore, LoanPolicy.MaxCreditScore, true,
                "Credit score must be between 300 and 850");
        }

        if (product is null)
            errors.Add(new("loanDetails.loanType", "Please select a loan product"));

        var limits = product ?? fallback;
        CheckNumber(details?.RequestedAmount, "loanDetails.requestedAmount", errors,
            limits.MinAmount, limits.MaxAmount, false,
            product is null
                ? "Loan amount must be between R5,000 and R300,000"
                : $"Loan amount must be between R{Format(product.MinAmount)} and R{Format(product.MaxAmount)}");
        CheckNumber(details?.LoanTerm, "loanDetails.loanTerm", errors,
            limits.MinTerm, limits.MaxTerm, true,
            product is null
                ? "Loan term must be between 6 and 60 months"
                : $"Loan term must be between {product.MinTerm} and {product.MaxTerm} months");

        var purpose = details?.LoanPurpose;
        if (product is not null && (purpose is null || !product.Purposes.Contains(purpose)))
            errors.Add(new("loanDetails.loanPurpose", "Please select a loan purpose"));

        if (errors.Count > 0 || product is null)
            return new(null, errors);

        return new(new ValidatedEligibility(
            status!,
            financial!.MonthlyIncome!.Value,
            financial.MonthlyExpenses!.Value,
            financial.ExistingDebt!.Value,
            financial.CreditScore,
            details!.RequestedAmount!.Value,
            (int)details.LoanTerm!.Value,
            product), errors);
    }

    public ValidationResult<ValidatedRate> Validate(RateRequest? request)
    {
        var errors = new List<FieldError>();
        if (request is null)
            errors.Add(new("body", "Request body must be an object"));

        CheckNumber(request?.LoanAmount, "loanAmount", errors, 1, null, false);
        CheckNumber(request?.LoanTerm, "loanTerm", errors, 1, null, true);
        CheckNumber(request?.CreditScore, "creditScore", errors,
            LoanPolicy.MinCreditScore, LoanPolicy.MaxCreditScore, true);

        var product = LoanCatalog.FindProduct(request?.LoanType);
        if (product is null)
            errors.Add(new("loanType", "loanType must be personal_loan or vehicle_loan"));

        if (errors.Count == 0 && product is not null)
        {
            if (request!.LoanAmount < product.MinAmount || request.LoanAmount > product.MaxAmount)
                errors.Add(new("loanAmount",
                    $"loanAmount must be between {Format(product.MinAmount)} and {Format(product.MaxAmount)} for {product.Id}"));
            if (request.LoanTerm < product.MinTerm || request.LoanTerm > product.MaxTerm)
                errors.Add(new("loanTerm",
                    $"loanTerm must be between {product.MinTerm} and {product.MaxTerm} for {product.Id}"));
        }

        if (errors.Count > 0 || product is null)
            return new(null, errors);

        return new(new ValidatedRate(
            request!.LoanAmount!.Value,
            (int)request.LoanTerm!.Value,
            request.CreditScore!.Value,
            product), errors);
    }

    private static void CheckNumber(
        decimal? value,
        string field,
        List<FieldError> errors,
        decimal? min,
        decimal? max,
        bool integer,
        string? message = null)
    {
        if (value is null)
            errors.Add(new(field, message ?? $"{field} must be a number"));
        else if (integer && value != decimal.Truncate(value.Value))
            errors.Add(new(field, message ?? $"{field} must be an integer"));
        else if (min is not null && value < min)
            errors.Add(new(field, message ?? $"{field} must be at least {Format(min.Value)}"));
        else if (max is not null && value > max)
            errors.Add(new(field, message ?? $"{field} must be at most {Format(max.Value)}"));
    }

    private static string Format(decimal number) =>
        number.ToString("N0", CultureInfo.InvariantCulture);
}
