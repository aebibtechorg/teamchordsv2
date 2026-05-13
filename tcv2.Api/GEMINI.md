# Team Chords API

## Overview
The backend API for Team Chords, built with ASP.NET Core 9 and Minimal APIs.

## Architecture & Conventions
- **Minimal APIs:** Endpoints are organized into modular mapping extension methods found in the `Endpoints/` directory.
- **Dependency Injection:** Services are registered in `Program.cs`.
- **Database:** Entity Framework Core with PostgreSQL. Use `AddNpgsqlDbContext` (Aspire integration).
- **Authentication:** Auth0 JWT authentication. Supports local deterministic JWTs for testing.
- **Real-time:** SignalR hubs for billing, setlists, and chord sheet updates.
- **Documentation:** OpenAPI/Scalar documentation is available at `/scalar/v1` in development.

## Project Structure
- `Endpoints/`: Contains static classes with `MapXEndpoints` methods.
- `Data/`: Entity Framework Core `AppDbContext` and migrations.
- `Models/`: Data transfer objects (DTOs) and domain entities.
- `Services/`: Business logic and external service integrations (e.g., Dodo, ZeptoMail).
- `Hubs/`: SignalR hubs.
- `Options/`: Configuration options classes.

## Development
- Use `.NET Aspire` (`tcv2.AppHost`) to run the API along with its dependencies (Postgres, Redis).
- Run migrations using `dotnet ef database update` or via the `/api/migrate` endpoint in development.
