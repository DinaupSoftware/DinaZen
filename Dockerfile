FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY samples/DinaZen.Demo/ samples/DinaZen.Demo/
COPY src/ src/

# Restaurar con credenciales de secrets
RUN --mount=type=secret,id=nuget_username \
    --mount=type=secret,id=nuget_token \
    USERNAME="$(cat /run/secrets/nuget_username)" && \
    TOKEN="$(cat /run/secrets/nuget_token)" && \
    dotnet nuget remove source Dinaup-0 || true && \
    dotnet nuget remove source DinaupSoftware || true && \
    dotnet nuget add source "https://nuget.pkg.github.com/Dinaup-0/index.json" \
        --name Dinaup-0 --username "$USERNAME" --password "$TOKEN" --store-password-in-clear-text && \
    dotnet nuget add source "https://nuget.pkg.github.com/DinaupSoftware/index.json" \
        --name DinaupSoftware --username "$USERNAME" --password "$TOKEN" --store-password-in-clear-text && \
    dotnet restore samples/DinaZen.Demo/DinaZen.Demo.csproj

RUN dotnet publish samples/DinaZen.Demo/DinaZen.Demo.csproj -c Release -o /app --no-restore


# ===== CERTS =====
# Genera CA y certificado de servidor con SANs + PFX
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS certs
ARG PFX_PASSWORD=dinazen-dev    # Cambia en build con --build-arg
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Config OpenSSL (SANs y extensiones)
RUN set -eux; \
  printf "%s\n" \
  "[ req ]" \
  "default_bits       = 4096" \
  "prompt             = no" \
  "default_md         = sha256" \
  "distinguished_name = dn" \
  "req_extensions     = v3_req" \
  "" \
  "[ dn ]" \
  "CN = dinazen.dinaup.com" \
  "O = Dinaup" \
  "C = ES" \
  "" \
  "[ v3_req ]" \
  "keyUsage = critical, digitalSignature, keyEncipherment" \
  "extendedKeyUsage = serverAuth" \
  "subjectAltName = @alt_names" \
  "" \
  "[ v3_ca ]" \
  "subjectKeyIdentifier = hash" \
  "authorityKeyIdentifier = keyid:always,issuer" \
  "basicConstraints = critical, CA:true" \
  "keyUsage = critical, keyCertSign, cRLSign" \
  "" \
  "[ alt_names ]" \
  "DNS.1  = dinazen.dinaup.com" \
  "DNS.2  = dinazen.dinaup.live" \
  "DNS.3  = dinazen.dinaup.dev" \
  "DNS.4  = dinazen.dinaup0.com" \
  "DNS.5  = dinazen.dinaup0.live" \
  "DNS.6  = dinazen.dinaup0.dev" \
  "DNS.7  = dinaup.com" \
  "DNS.8  = *.dinaup.com" \
  "DNS.9  = dinaup.live" \
  "DNS.10 = *.dinaup.live" \
  "DNS.11 = dinaup.dev" \
  "DNS.12 = *.dinaup.dev" \
  "DNS.13 = dinaup0.com" \
  "DNS.14 = *.dinaup0.com" \
  "DNS.15 = dinaup0.live" \
  "DNS.16 = *.dinaup0.live" \
  "DNS.17 = dinaup0.dev" \
  "DNS.18 = *.dinaup0.dev" \
  "DNS.19 = localhost" \
  "IP.1   = 127.0.0.1" \
  "IP.2   = ::1" \
  > /tmp/openssl.cnf; \
  mkdir -p /certs /out; \
  # CA raíz
  openssl genrsa -out /certs/rootCA.key 4096; \
  openssl req -x509 -new -nodes -key /certs/rootCA.key -sha256 -days 3650 \
    -out /certs/rootCA.crt -subj "/CN=DinaZen Local Dev CA" \
    -extensions v3_ca -config /tmp/openssl.cnf; \
  # Clave y CSR del servidor
  openssl req -new -newkey rsa:4096 -nodes -keyout /certs/server.key \
    -out /certs/server.csr -config /tmp/openssl.cnf; \
  # Firmar el certificado con la CA (825 días)
  openssl x509 -req -in /certs/server.csr -CA /certs/rootCA.crt -CAkey /certs/rootCA.key \
    -CAcreateserial -out /certs/server.crt -days 825 -sha256 \
    -extfile /tmp/openssl.cnf -extensions v3_req; \
  # Exportar PFX para Kestrel
  openssl pkcs12 -export -out /out/server.pfx -inkey /certs/server.key \
    -in /certs/server.crt -certfile /certs/rootCA.crt -passout pass:${PFX_PASSWORD}; \
  cp /certs/rootCA.crt /out/rootCA.crt


# ===== RUNTIME =====
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app ./

# Copiar certificados
RUN mkdir -p /https
COPY --from=certs /out/server.pfx /https/server.pfx
COPY --from=certs /out/rootCA.crt /https/rootCA.crt

# Escuchar en 80 y 443 y configurar Kestrel con el PFX
ARG PFX_PASSWORD=dinazen-dev
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_FORWARDEDHEADERS_ENABLED=true \
    ASPNETCORE_URLS="https://+:443;http://+:80" \
    ASPNETCORE_Kestrel__Certificates__Default__Path="/https/server.pfx" \
    ASPNETCORE_Kestrel__Certificates__Default__Password="${PFX_PASSWORD}"

# Si tu imagen corre como usuario no-root y falla enlazar 443,
# puedes forzar root o dar capability al binario dotnet.
USER root

EXPOSE 80 443
ENTRYPOINT ["dotnet", "DinaZen.Demo.dll"]
