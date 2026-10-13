namespace LoanEligibility.Api;

internal static class LoanData
{
    internal static readonly LoanProduct[] Products =
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

    internal static readonly object ValidationRules = new
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
}
