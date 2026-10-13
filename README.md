# Loan Eligibility Simulator

An ASP.NET Core 10 application with a C# Blazor Server interface and JSON API. The application validates applicant, financial, and loan details before calculating estimated eligibility, a recommended loan, and repayments. The UI and API run in the same service; the form's interactive behavior and validation are implemented in C#.

## Requirements

- .NET 10 SDK or newer

## Getting started

```sh
dotnet watch --project backend/LoanEligibility.Api.csproj
```

Open <http://localhost:3000> for the simulator. The API is available at the same origin under `/api`.

## Run with Docker

With Docker Engine and the Compose plugin installed, build and start the application:

```sh
docker compose up --build
```

Open <http://localhost:8080>. The single ASP.NET Core container serves the Blazor interface, static assets, JSON API, and Swagger UI. Stop it with `docker compose down`.

## Available commands

- `dotnet watch --project backend/LoanEligibility.Api.csproj` — run the application with hot reload
- `dotnet test backend.test/LoanEligibility.Api.Tests.csproj` — test the API and rendered application
- `dotnet publish backend/LoanEligibility.Api.csproj --configuration Release` — build a production publish

Swagger UI is available at <http://localhost:3000/api/docs>, and the OpenAPI document is served at <http://localhost:3000/api/openapi.yaml>.

## Loan API

- `POST /api/loans/eligibility` — validate an application and return eligibility, recommended loan, and affordability results
- `GET /api/loans/products` — list personal and vehicle loan products
- `POST /api/loans/calculate-rate` — calculate a product-specific interest rate, repayment totals, and monthly schedule
- `GET /api/loans/validation-rules` — return application form validation constraints

Invalid requests return HTTP `400` with an `error` and a `details` array containing field-level validation messages.

## Deployment

The Render Blueprint in `render.yaml` deploys the complete application from `Dockerfile.backend`, checks `/api/health`, and serves both the simulator and API from one public origin. GitHub Actions runs the .NET test suite and production publish on pull requests and pushes to `main`; Render can automatically deploy commits from `main`.
