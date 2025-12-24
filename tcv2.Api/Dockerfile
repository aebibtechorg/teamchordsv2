FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080

USER app
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG configuration=Release
WORKDIR /src
COPY ["tcv2.Api/tcv2.Api.csproj", "tcv2.Api/"]
COPY ["tcv2.ServiceDefaults/tcv2.ServiceDefaults.csproj", "tcv2.ServiceDefaults/"]
RUN dotnet restore "tcv2.Api/tcv2.Api.csproj"
COPY . .
WORKDIR "/src/tcv2.Api"
RUN dotnet build "tcv2.Api.csproj" -c $configuration -o /app/build

FROM build AS publish
ARG configuration=Release
RUN dotnet publish "tcv2.Api.csproj" -c $configuration -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "tcv2.Api.dll"]
