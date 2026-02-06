# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build standalone binary
RUN bun run build

# Final stage
FROM debian:bookworm-slim

WORKDIR /app

# Install dependencies for the binary (if any)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/cfddns /usr/local/bin/cfddns

# Create config directory
RUN mkdir -p /config

# Set config path and log path environment variables
ENV CFDDNS_CONFIG_PATH=/config/config.json
ENV CFDDNS_LOG_PATH=/config/app.log

VOLUME ["/config"]

ENTRYPOINT ["cfddns"]
CMD ["start"]
