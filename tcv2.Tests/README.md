# tcv2.Tests

Aspire integration tests for TeamChords API behavior.

## Run

```bash
cd /Users/paul/Desktop/teamchordsv2
dotnet test tcv2.Tests/tcv2.Tests.csproj
```

These tests boot the distributed app in `Destination=test` mode so only PostgreSQL and the API are started.

The suite now covers:

- anonymous config and sign-in endpoints
- local JWT-authenticated organization creation and onboarding seed data
- admin endpoints protected by the `platform-admin` role claim
- rate limiting behavior

Test tokens are signed locally with the deterministic `Auth0__Issuer`, `Auth0__Audience`, and `Auth0__SigningKey` settings forwarded by `tcv2.AppHost`.


