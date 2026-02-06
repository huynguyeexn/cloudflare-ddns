# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build bundled JS instead of standalone binary for smaller image size
RUN bun build src/index.ts --outfile dist/index.js --target bun --minify

# Final stage
FROM oven/bun:alpine

WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apk add --no-cache ca-certificates

# Copy the bundled code from builder
COPY --from=builder /app/dist/index.js ./index.js

# Create config directory
RUN mkdir -p /config

# Set config path and log path environment variables
ENV CLOUDFLARE_DDNS_CONFIG_PATH=/config/config.json
ENV CLOUDFLARE_DDNS_LOG_PATH=/config/app.log

VOLUME ["/config"]

ENTRYPOINT ["bun", "run", "index.js"]
CMD ["run"]
