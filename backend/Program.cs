using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using LoanEligibility.Api.Services;
using LoanEligibility.Api.Validation;
using LoanEligibility.Api.Models;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        var defaultInvalidModelStateResponse = options.InvalidModelStateResponseFactory;
        options.InvalidModelStateResponseFactory = context =>
        {
            var hasInvalidJson = context.ModelState.TryGetValue("$", out var bodyErrors)
                && bodyErrors.Errors.Count > 0;
            return hasInvalidJson
                ? new BadRequestObjectResult(new { error = "Invalid JSON request body" })
                : defaultInvalidModelStateResponse!(context);
        };
    });
builder.Services.AddSingleton<ILoanRequestValidator, LoanRequestValidator>();
builder.Services.AddSingleton<ILoanService, LoanService>();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services.AddCors();

var app = builder.Build();
var frontendOrigin = Environment.GetEnvironmentVariable("FRONTEND_ORIGIN");

app.UseExceptionHandler();
app.UseCors(policy =>
{
    if (!string.IsNullOrWhiteSpace(frontendOrigin))
    {
        policy.WithOrigins(frontendOrigin).AllowAnyHeader().AllowAnyMethod();
    }
});
app.MapHealthChecks("/api/health", new HealthCheckOptions
{
    ResponseWriter = (context, _) => context.Response.WriteAsJsonAsync(
        new HealthResponse("ok", "loan-eligibility-api"), context.RequestAborted)
});
app.MapGet("/api/openapi.yaml", () =>
    Results.File(
        Path.Combine(AppContext.BaseDirectory, "openapi.yaml"),
        "application/yaml"));
app.UseSwaggerUI(options =>
{
    options.RoutePrefix = "api/docs";
    options.SwaggerEndpoint("/api/openapi.yaml", "Loan Eligibility Simulator API");
});
app.MapControllers();

app.Run();

public partial class Program { }
