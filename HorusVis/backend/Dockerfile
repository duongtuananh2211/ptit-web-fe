# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution-level files first for layer caching
COPY Directory.Build.props .
COPY Directory.Packages.props .
COPY NuGet.Config .

# Copy project files and restore (cached unless .csproj files change)
COPY src/HorusVis.Core/HorusVis.Core.csproj src/HorusVis.Core/
COPY src/HorusVis.Business/HorusVis.Business.csproj src/HorusVis.Business/
COPY src/HorusVis.Data/HorusVis.Data.csproj src/HorusVis.Data/
COPY src/HorusVis.Data.Migrations/HorusVis.Data.Migrations.csproj src/HorusVis.Data.Migrations/
COPY src/HorusVis.Web/HorusVis.Web.csproj src/HorusVis.Web/

RUN dotnet restore src/HorusVis.Web/HorusVis.Web.csproj --locked-mode

# Copy source and publish
COPY src/ src/
RUN dotnet publish src/HorusVis.Web/HorusVis.Web.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# ASP.NET Core 8+ defaults to port 8080 inside containers
EXPOSE 8080

ENTRYPOINT ["dotnet", "HorusVis.Web.dll"]
