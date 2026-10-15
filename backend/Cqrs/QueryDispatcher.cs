using Microsoft.Extensions.DependencyInjection;

namespace LoanEligibility.Api.Cqrs;

internal sealed class QueryDispatcher(IServiceProvider services) : IQueryDispatcher
{
    public Task<TResult> QueryAsync<TResult>(IQuery<TResult> query, CancellationToken cancellationToken = default)
    {
        var handlerType = typeof(IQueryHandler<,>).MakeGenericType(query.GetType(), typeof(TResult));
        dynamic handler = services.GetRequiredService(handlerType);
        return handler.HandleAsync((dynamic)query, cancellationToken);
    }
}

public static class CqrsServiceCollectionExtensions
{
    public static IServiceCollection AddQueryHandlers(this IServiceCollection services)
    {
        services.AddScoped<IQueryDispatcher, QueryDispatcher>();
        var handlerInterface = typeof(IQueryHandler<,>);
        foreach (var type in typeof(IQueryDispatcher).Assembly.GetTypes().Where(t => t is { IsAbstract: false, IsInterface: false }))
        {
            foreach (var implemented in type.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == handlerInterface))
            {
                services.AddScoped(implemented, type);
            }
        }

        return services;
    }
}
