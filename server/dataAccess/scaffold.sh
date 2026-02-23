#!/usr/bin/env bash
set -e

# Load CONN_STR from .env (must be in this folder)
set -a
source .env
set +a

# Ensure dotnet-ef is available
dotnet tool install --global dotnet-ef || true

# Scaffold DbContext + Entities into THIS project (dataAccess)
dotnet ef dbcontext scaffold "$CONN_STR" Npgsql.EntityFrameworkCore.PostgreSQL \
  --project ./dataAccess.csproj \
  --startup-project ./dataAccess.csproj \
  --context MyDbContext \
  --context-dir . \
  --output-dir Entities \
  --namespace dataAccess.Entities \
  --context-namespace dataAccess \
  --no-onconfiguring \
  --schema Windmill \
  --force