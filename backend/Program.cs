using System.Text.Json;
using System.Text.Json.Serialization;
using LoanEligibility.Api;

var builder = WebApplication.CreateBuilder(args);
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddCors();

var app = builder.Build();
var frontendOrigin = Environment.GetEnvironmentVariable("FRONTEND_ORIGIN");

app.UseCors(policy =>
{
    if (!string.IsNullOrWhiteSpace(frontendOrigin))
    {
        policy.WithOrigins(frontendOrigin).AllowAnyHeader().AllowAnyMethod();
    }
});
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (JsonException)
    {
        context.Response.Clear();
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsJsonAsync(new { error = "Invalid JSON request body" });
    }
});
app.UseSwaggerUI(options =>
{
    options.RoutePrefix = "api/docs";
    options.SwaggerEndpoint("/api/openapi.yaml", "Loan Eligibility Simulator API");
});

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", service = "loan-eligibility-api" }));
app.MapGet("/api/openapi.yaml", async () =>
{
    var assemblyDirectory = Path.GetDirectoryName(typeof(Program).Assembly.Location)!;
    var document = await File.ReadAllTextAsync(Path.Combine(assemblyDirectory, "openapi.yaml"));
    return Results.Text(document, "application/yaml");
});
app.MapGet("/api/loans/products", () => Results.Ok(new { products = LoanService.Products }));
app.MapGet("/api/loans/validation-rules", () => Results.Ok(LoanService.ValidationRules));
app.MapPost("/api/loans/eligibility", async (HttpRequest request) =>
{
    using var body = await LoanService.ReadJsonBodyAsync(request);
    var assessment = LoanService.ValidateEligibilityRequest(body.RootElement);
    if (assessment.Errors.Count > 0)
    {
        return Results.BadRequest(new ValidationErrorResponse("Validation failed", assessment.Errors));
    }

    return Results.Ok(LoanService.CalculateEligibility(assessment));
});
app.MapPost("/api/loans/calculate-rate", async (HttpRequest request) =>
{
    using var body = await LoanService.ReadJsonBodyAsync(request);
    var rateRequest = LoanService.ValidateRateRequest(body.RootElement);
    if (rateRequest.Errors.Count > 0)
    {
        return Results.BadRequest(new ValidationErrorResponse("Validation failed", rateRequest.Errors));
    }

    var interestRate = LoanService.GetRate(rateRequest.CreditScore, rateRequest.Product!);
    var repayment = LoanService.CalculateRepayment(
        rateRequest.LoanAmount,
        rateRequest.LoanTerm,
        interestRate);
    return Results.Ok(new RateCalculationResponse(
        interestRate,
        repayment.MonthlyPayment,
        repayment.TotalInterest,
        repayment.TotalRepayment,
        repayment.PaymentSchedule));
});

app.Run();

public partial class Program { }
