using System.Text.Json;
using System.Text.Json.Serialization;
using LoanEligibility.Api.Services;

var builder = WebApplication.CreateBuilder(args);
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddScoped<ILoanService, LoanService>();
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
app.MapControllers();

app.Run();

public partial class Program { }
