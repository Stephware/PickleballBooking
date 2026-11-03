FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/Pickleball.Api/Pickleball.Api.csproj backend/Pickleball.Api/
RUN dotnet restore backend/Pickleball.Api/Pickleball.Api.csproj
COPY backend/Pickleball.Api/ backend/Pickleball.Api/
RUN dotnet publish backend/Pickleball.Api/Pickleball.Api.csproj -c Release --no-restore -o /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
RUN mkdir -p /var/lib/pickleball/proofs /var/lib/pickleball/keys \
    && chown -R app:app /var/lib/pickleball \
    && chmod 700 /var/lib/pickleball/proofs /var/lib/pickleball/keys
COPY --from=build /out/ .
USER app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Pickleball.Api.dll"]
