using LoanEligibility.Api.Models;

namespace LoanEligibility.Api.Data;

public static class LoanCatalog
{
    public static readonly IReadOnlyList<LoanProduct> Products =
    [
        new(
            "personal_loan",
            "Personal Loan",
            "Flexible personal financing for various needs",
            5000m,
            300000m,
            6,
            60,
            new InterestRateRange(10.5m, 18.5m),
            ["debt_consolidation", "home_improvement", "education", "medical", "other"]),
        new(
            "vehicle_loan",
            "Vehicle Finance",
            "Financing for new and used vehicles",
            50000m,
            1500000m,
            12,
            72,
            new InterestRateRange(8.5m, 15m),
            ["new_vehicle", "used_vehicle"])
    ];

    public static LoanProduct? FindProduct(string? id) =>
        Products.FirstOrDefault(product => product.Id == id);

    public static readonly ValidationRulesResponse ValidationRules = new(
        new PersonalInfoRules(
            new ValidationRule(LoanPolicy.MinAge, LoanPolicy.MaxAge, true, true, null,
                "Age must be between 18 and 65"),
            new ValidationRule(null, null, null, true, LoanPolicy.EmploymentStatuses,
                "Please select your employment status"),
            new ValidationRule(LoanPolicy.MinEmploymentMonths, null, true, true, null,
                "Minimum 3 months employment required")),
        new FinancialInfoRules(
            new ValidationRule(LoanPolicy.MinMonthlyIncome, null, null, true, null,
                "Minimum monthly income of R5,000 required"),
            new ValidationRule(0, null, null, true, null, "Please enter your monthly expenses"),
            new ValidationRule(0, null, null, true, null, "Please enter your existing debt"),
            new ValidationRule(LoanPolicy.MinCreditScore, LoanPolicy.MaxCreditScore, true, false, null,
                "Credit score must be between 300 and 850")),
        new LoanDetailsRules(
            new ValidationRule(null, null, null, true,
                Products.Select(product => product.Id).ToArray(), "Please select a loan product"),
            new ValidationRule(null, null, null, true, null, "Please select a loan purpose"),
            new ValidationRule(Products[0].MinAmount, Products[0].MaxAmount, null, true, null,
                "Loan amount must be between R5,000 and R300,000"),
            new ValidationRule(Products[0].MinTerm, Products[0].MaxTerm, true, true, null,
                "Loan term must be between 6 and 60 months")));
}
