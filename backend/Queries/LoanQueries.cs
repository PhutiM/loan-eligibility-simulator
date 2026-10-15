using System.Text.Json;
using LoanEligibility.Api.Cqrs;
using LoanEligibility.Api.Models;
using LoanEligibility.Api.Services;

namespace LoanEligibility.Api.Queries;

public sealed record GetLoanProductsQuery : IQuery<IReadOnlyList<LoanProduct>>;

public sealed record GetValidationRulesQuery : IQuery<object>;

public sealed record CheckEligibilityQuery(JsonElement Body) : IQuery<ServiceResult<EligibilityResponse>>;

public sealed record CalculateRateQuery(JsonElement Body) : IQuery<ServiceResult<RateCalculationResponse>>;

internal sealed class GetLoanProductsQueryHandler(ILoanService loanService)
    : IQueryHandler<GetLoanProductsQuery, IReadOnlyList<LoanProduct>>
{
    public Task<IReadOnlyList<LoanProduct>> HandleAsync(GetLoanProductsQuery query, CancellationToken cancellationToken) =>
        Task.FromResult(loanService.GetProducts());
}

internal sealed class GetValidationRulesQueryHandler(ILoanService loanService)
    : IQueryHandler<GetValidationRulesQuery, object>
{
    public Task<object> HandleAsync(GetValidationRulesQuery query, CancellationToken cancellationToken) =>
        Task.FromResult(loanService.GetValidationRules());
}

internal sealed class CheckEligibilityQueryHandler(ILoanService loanService)
    : IQueryHandler<CheckEligibilityQuery, ServiceResult<EligibilityResponse>>
{
    public Task<ServiceResult<EligibilityResponse>> HandleAsync(CheckEligibilityQuery query, CancellationToken cancellationToken) =>
        Task.FromResult(loanService.CheckEligibility(query.Body));
}

internal sealed class CalculateRateQueryHandler(ILoanService loanService)
    : IQueryHandler<CalculateRateQuery, ServiceResult<RateCalculationResponse>>
{
    public Task<ServiceResult<RateCalculationResponse>> HandleAsync(CalculateRateQuery query, CancellationToken cancellationToken) =>
        Task.FromResult(loanService.CalculateRate(query.Body));
}
