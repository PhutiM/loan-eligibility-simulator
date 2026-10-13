using Bunit;
using LoanEligibility.Api.Components.Pages;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace LoanEligibility.Api.Tests;

public sealed class LoanSimulatorComponentTests
{
    [Fact]
    public void Switching_products_updates_choices_and_clears_product_dependent_fields()
    {
        using var context = new BunitContext();
        context.Services.AddLogging();
        var component = context.Render<Home>();

        component.Find("input[value='personal_loan']").Change("personal_loan");
        component.Find("#loan-purpose").Change("home_improvement");
        component.Find("#requested-amount").Change("150000");
        component.Find("#loan-term").Change("24");

        component.Find("input[value='vehicle_loan']").Change("vehicle_loan");

        Assert.Contains("new_vehicle", component.Find("#loan-purpose").InnerHtml);
        Assert.DoesNotContain("home_improvement", component.Find("#loan-purpose").InnerHtml);
        Assert.True(string.IsNullOrEmpty(component.Find("#loan-purpose").GetAttribute("value")));
        Assert.True(string.IsNullOrEmpty(component.Find("#requested-amount").GetAttribute("value")));
        Assert.True(string.IsNullOrEmpty(component.Find("#loan-term").GetAttribute("value")));
        Assert.Equal("50000", component.Find("#requested-amount").GetAttribute("min"));
        Assert.Equal("1500000", component.Find("#requested-amount").GetAttribute("max"));
    }

    [Fact]
    public void Valid_application_displays_estimate_and_reset_clears_the_form()
    {
        using var context = new BunitContext();
        context.Services.AddLogging();
        var component = context.Render<Home>();

        component.Find("#age").Change("35");
        component.Find("#employment-status").Change("employed");
        component.Find("#employment-duration").Change("24");
        component.Find("#monthly-income").Change("50000");
        component.Find("#monthly-expenses").Change("20000");
        component.Find("#existing-debt").Change("0");
        component.Find("#credit-score").Change("700");
        component.Find("input[value='personal_loan']").Change("personal_loan");
        component.Find("#loan-purpose").Change("home_improvement");
        component.Find("#requested-amount").Change("150000");
        component.Find("#loan-term").Change("24");

        component.Find("form").Submit();

        component.WaitForAssertion(() =>
        {
            Assert.Contains("You are likely eligible!", component.Markup);
            Assert.Contains("Monthly Payment", component.Markup);
            Assert.Contains("Total Repayment", component.Markup);
            Assert.Contains("24 months", component.Markup);
        });

        component.Find("button.secondary-button").Click();

        Assert.Contains("Ready to get started?", component.Markup);
        Assert.True(string.IsNullOrEmpty(component.Find("#age").GetAttribute("value")));
    }

    [Fact]
    public void Invalid_application_displays_field_validation_messages()
    {
        using var context = new BunitContext();
        context.Services.AddLogging();
        var component = context.Render<Home>();

        component.Find("#age").Change("17");
        component.Find("form").Submit();

        component.WaitForAssertion(() =>
        {
            Assert.Contains("Age must be between 18 and 65", component.Markup);
            Assert.Contains("Please select a loan product", component.Markup);
            Assert.Contains("Minimum monthly income of R5,000 required", component.Markup);
            Assert.Equal("true", component.Find("#age").GetAttribute("aria-invalid"));
            Assert.Equal("age-error", component.Find("#age").GetAttribute("aria-describedby"));
        });
    }
}
