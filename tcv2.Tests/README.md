# tcv2.Tests

Aspire integration tests for TeamChords rate limiting.

## Run

```bash
cd /Users/paul/Desktop/teamchordsv2
dotnet test tcv2.Tests/tcv2.Tests.csproj
```

These tests boot the distributed app in `Destination=test` mode so only PostgreSQL, Redis, and the API are started.


