namespace LoanEligibility.Api;

internal sealed class EligibilityApplicationForm
{
    public PersonalInfoForm PersonalInfo { get; set; } = new();
    public FinancialInfoForm FinancialInfo { get; set; } = new();
    public LoanDetailsForm LoanDetails { get; set; } = new();
}

internal sealed class PersonalInfoForm
{
    public int? Age { get; set; }
    public string EmploymentStatus { get; set; } = "";
    public int? EmploymentDuration { get; set; }
}

internal sealed class FinancialInfoForm
{
    public double? MonthlyIncome { get; set; }
    public double? MonthlyExpenses { get; set; }
    public double? ExistingDebt { get; set; }
    public int? CreditScore { get; set; }
}

internal sealed class LoanDetailsForm
{
    public string LoanType { get; set; } = "";
    public double? RequestedAmount { get; set; }
    public int? LoanTerm { get; set; }
    public string LoanPurpose { get; set; } = "";
}
