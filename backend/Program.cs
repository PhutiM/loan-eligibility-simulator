using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using LoanEligibility.Api.Cqrs;
using LoanEligibility.Api.Services;

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
builder.Services.AddScoped<ILoanService, LoanService>();
builder.Services.AddQueryHandlers();
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
app.UseSwaggerUI(options =>
{
    options.RoutePrefix = "api/docs";
    options.SwaggerEndpoint("/api/openapi.yaml", "Loan Eligibility Simulator API");
});
app.MapControllers();

app.Run();

public partial class Program { }
