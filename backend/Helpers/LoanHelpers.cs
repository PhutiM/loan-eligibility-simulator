using System.Globalization;
using System.Text.Json;
using LoanEligibility.Api.Models;

namespace LoanEligibility.Api.Helpers;

internal static class LoanHelpers
{
    private const double NumberEpsilon = 2.2204460492503131e-16;

    internal static void ValidateNumber(
        JsonElement value,
        string field,
        List<FieldError> errors,
        double? min = null,
        double? max = null,
        bool integer = false,
        string? errorMessage = null)
    {
        if (value.ValueKind != JsonValueKind.Number || !value.TryGetDouble(out var number) || !double.IsFinite(number))
        {
            errors.Add(new FieldError(field, errorMessage ?? $"{field} must be a number"));
            return;
        }
        if (integer && number != Math.Truncate(number))
        {
            errors.Add(new FieldError(field, errorMessage ?? $"{field} must be an integer"));
            return;
        }
        if (min is not null && number < min)
        {
            errors.Add(new FieldError(field, errorMessage ?? $"{field} must be at least {FormatNumber(min.Value)}"));
            return;
        }
        if (max is not null && number > max)
            errors.Add(new FieldError(field, errorMessage ?? $"{field} must be at most {FormatNumber(max.Value)}"));
    }

    internal static double RoundMoney(double amount) =>
        Math.Floor((amount + NumberEpsilon) * 100 + 0.5) / 100;

    internal static int JsRound(double value) => (int)Math.Floor(value + 0.5);

    internal static string FormatNumber(double number) =>
        number.ToString("N0", CultureInfo.InvariantCulture);

    internal static bool IsObject(JsonElement value) => value.ValueKind == JsonValueKind.Object;

    internal static JsonElement GetObject(JsonElement parent, string property)
    {
        var value = GetProperty(parent, property);
        return IsObject(value) ? value : default;
    }

    internal static JsonElement GetProperty(JsonElement parent, string property) =>
        parent.ValueKind == JsonValueKind.Object && parent.TryGetProperty(property, out var value)
            ? value
            : default;

    internal static string? GetString(JsonElement value) =>
        value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    internal static double GetNumber(JsonElement value) =>
        value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var number) ? number : 0;

    internal static double? GetNullableNumber(JsonElement value) =>
        value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var number) ? number : null;
}
