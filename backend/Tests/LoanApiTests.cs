using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LoanEligibility.Api.Tests;

public sealed class LoanApiTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Health_and_reference_endpoints_preserve_the_api_contract()
    {
        var health = await _client.GetFromJsonAsync<JsonElement>("/api/health");
        Assert.Equal("ok", health.GetProperty("status").GetString());
        Assert.Equal("loan-eligibility-api", health.GetProperty("service").GetString());

        var products = await _client.GetFromJsonAsync<JsonElement>("/api/loans/products");
        var productList = products.GetProperty("products").EnumerateArray().ToArray();
        Assert.Equal(new[] { "personal_loan", "vehicle_loan" },
            productList.Select(product => product.GetProperty("id").GetString()));
        Assert.Equal(1_500_000, productList[1].GetProperty("maxAmount").GetDouble());

        var rules = await _client.GetFromJsonAsync<JsonElement>("/api/loans/validation-rules");
        Assert.Equal(18, rules.GetProperty("personalInfo").GetProperty("age").GetProperty("min").GetInt32());
        Assert.Equal(60, rules.GetProperty("loanDetails").GetProperty("loanTerm").GetProperty("max").GetInt32());
    }

    [Fact]
    public async Task Openapi_document_and_swagger_ui_are_available()
    {
        using var openApiResponse = await _client.GetAsync("/api/openapi.yaml");
        var document = await openApiResponse.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.OK, openApiResponse.StatusCode);
        Assert.Contains("yaml", openApiResponse.Content.Headers.ContentType?.MediaType);
        Assert.Contains("url: /", document);
        Assert.DoesNotContain("localhost:3000", document);
        Assert.Contains("/api/loans/eligibility:", document);
        Assert.Contains("/api/loans/calculate-rate:", document);

        using var docsResponse = await _client.GetAsync("/api/docs/");
        Assert.Equal(HttpStatusCode.OK, docsResponse.StatusCode);
        Assert.Contains("Swagger UI", await docsResponse.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Rate_calculation_returns_an_amortizing_schedule()
    {
        using var response = await _client.PostAsJsonAsync("/api/loans/calculate-rate", new
        {
            loanAmount = 150000,
            loanTerm = 24,
            creditScore = 650,
            loanType = "personal_loan"
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var schedule = body.GetProperty("paymentSchedule").EnumerateArray().ToArray();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(12.5, body.GetProperty("interestRate").GetDouble());
        Assert.Equal(24, schedule.Length);
        Assert.Equal(1, schedule[0].GetProperty("month").GetInt32());
        Assert.Equal(0, schedule[^1].GetProperty("balance").GetDouble());
        Assert.Equal(
            Math.Round(schedule.Sum(payment => payment.GetProperty("payment").GetDouble()) * 100) / 100,
            body.GetProperty("totalRepayment").GetDouble());
    }

    [Fact]
    public async Task Eligibility_uses_selected_product_and_returns_compatible_result()
    {
        using var response = await _client.PostAsJsonAsync("/api/loans/eligibility", new
        {
            personalInfo = new { age = 35, employmentStatus = "employed", employmentDuration = 24 },
            financialInfo = new { monthlyIncome = 50000, monthlyExpenses = 20000, existingDebt = 0, creditScore = 700 },
            loanDetails = new
            {
                loanType = "vehicle_loan",
                requestedAmount = 200000,
                loanTerm = 36,
                loanPurpose = "new_vehicle"
            }
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(body.GetProperty("eligibilityResult").GetProperty("isEligible").GetBoolean());
        Assert.Equal(200000,
            body.GetProperty("recommendedLoan").GetProperty("recommendedAmount").GetDouble());
        Assert.Equal(30000,
            body.GetProperty("affordabilityAnalysis").GetProperty("disposableIncome").GetDouble());
    }

    [Fact]
    public async Task Eligibility_defaults_an_omitted_credit_score_to_300()
    {
        using var response = await _client.PostAsJsonAsync("/api/loans/eligibility", new
        {
            personalInfo = new { age = 35, employmentStatus = "employed", employmentDuration = 24 },
            financialInfo = new { monthlyIncome = 25000, monthlyExpenses = 15000, existingDebt = 5000 },
            loanDetails = new
            {
                requestedAmount = 100000,
                loanTerm = 24,
                loanPurpose = "home_improvement"
            }
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(18.5, body.GetProperty("recommendedLoan").GetProperty("interestRate").GetDouble());
        Assert.False(body.GetProperty("eligibilityResult").GetProperty("isEligible").GetBoolean());
    }

    [Fact]
    public async Task Invalid_requests_return_field_errors_and_malformed_json_has_legacy_error()
    {
        using var invalidResponse = await _client.PostAsJsonAsync(
            "/api/loans/eligibility", new { personalInfo = new { age = 17 } });
        var error = await invalidResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(HttpStatusCode.BadRequest, invalidResponse.StatusCode);
        Assert.Equal("Validation failed", error.GetProperty("error").GetString());
        Assert.Contains(error.GetProperty("details").EnumerateArray(),
            detail => detail.GetProperty("field").GetString() == "financialInfo.monthlyIncome");

        using var malformedResponse = await _client.PostAsync(
            "/api/loans/calculate-rate",
            new StringContent("{", System.Text.Encoding.UTF8, "application/json"));
        var malformed = await malformedResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(HttpStatusCode.BadRequest, malformedResponse.StatusCode);
        Assert.Equal("Invalid JSON request body", malformed.GetProperty("error").GetString());
    }
}
