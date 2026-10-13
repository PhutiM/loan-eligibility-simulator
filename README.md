# Loan Eligibility Simulator

React, Vite, TypeScript, React Hook Form, Material UI, and Tailwind CSS frontend with a C# ASP.NET Core backend. The eligibility form validates applicant, financial, and loan details before submitting to the backend and showing the result.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- .NET 10 SDK or newer

## Getting started

```sh
npm install
npm run dev
```

The frontend runs at <http://localhost:5173> and the API runs at <http://localhost:3000>. Vite proxies `/api` requests to the ASP.NET Core backend during development.

## Run with Docker

With Docker Engine and the Compose plugin installed, build and start the frontend and backend containers:

```sh
docker compose up --build
```

Open <http://localhost:8080>. The frontend container serves the production Vite build and proxies `/api` requests (including Swagger UI at `/api/docs`) to the backend container. The backend is reachable only within the Compose network. Stop the containers with `docker compose down`.

## Available commands

- `npm run dev` — start the frontend and backend together
- `npm run build` — type-check and build the frontend
- `npm run lint` — lint the frontend
- `npm run test:coverage --workspace frontend` — run frontend tests and enforce 80% statement, branch, function, and line coverage
- `dotnet test backend.test/LoanEligibility.Api.Tests.csproj` — test the backend API
- `dotnet run --project backend/LoanEligibility.Api.csproj` — start the backend

Swagger UI is available at <http://localhost:3000/api/docs>, and the OpenAPI document is served at <http://localhost:3000/api/openapi.yaml>.

## Loan API

- `POST /api/loans/eligibility` — validate an application and return eligibility, recommended loan, and affordability results
- `GET /api/loans/products` — list personal and vehicle loan products
- `POST /api/loans/calculate-rate` — calculate a product-specific interest rate, repayment totals, and monthly schedule
- `GET /api/loans/validation-rules` — return frontend form validation constraints

Invalid requests return HTTP `400` with an `error` and a `details` array containing field-level validation messages.

## GitHub Pages deployment

`.github/workflows/deploy.yml` runs backend tests, frontend tests with 80% coverage thresholds, frontend lint, and the production build on pull requests and pushes to `main`. It publishes the frontend to GitHub Pages on pushes to `main` and manual workflow runs after the `VITE_API_BASE_URL` Actions variable has been configured. Until then, verification still runs and the deployment job is skipped. In the repository settings, enable **Settings → Pages → Build and deployment → GitHub Actions**.

The backend is deployed separately by Render using the root `render.yaml` Blueprint. In Render, create a new Blueprint and select this repository; the Blueprint builds `Dockerfile.backend`, checks `/api/health`, and automatically deploys commits from `main`. Add the repository Actions variable `VITE_API_BASE_URL` with the backend's public HTTPS origin shown by Render (for example, `https://loan-eligibility-api.onrender.com`, without a trailing slash). The workflow uses the repository name as the GitHub Pages base path.

The Blueprint configures `FRONTEND_ORIGIN=https://phutim.github.io` so browsers permit API requests from the GitHub Pages site. The Pages project path is not part of this origin. For local development, leave `VITE_API_BASE_URL` unset; Vite proxies `/api` to `localhost:3000`.

To deploy an additional Docker-based frontend on Render while keeping GitHub Pages, create a separate **Web Service** from this repository and set **Runtime** to Docker, **Root Directory** to `.`, **Dockerfile Path** to `./Dockerfile.frontend`, and **Health Check Path** to `/`. Set the `API_UPSTREAM` environment variable to the backend's public origin (for example, `https://loan-eligibility-simulator.onrender.com`, without a trailing slash); Render provides the `PORT` variable automatically. Nginx serves the frontend and proxies `/api` requests to the backend. Create this frontend service separately rather than reapplying the root Blueprint, which also defines the API service. The local Docker Compose setup uses `http://backend:3000` as its upstream.

The ASP.NET Core API endpoints are implemented by `LoanController`, which conforms to `ILoanController`. Request validation and loan calculations are kept in the backend service and helper classes. The sample loan products and validation rules are kept separately in `LoanData`.
