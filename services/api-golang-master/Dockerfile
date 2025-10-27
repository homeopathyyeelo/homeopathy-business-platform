FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build the service from the correct entrypoint
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/main.go

FROM gcr.io/distroless/base-debian12
WORKDIR /
COPY --from=builder /app/server /server
# Optional: include OpenAPI if present
COPY --from=builder /app/openapi.json /openapi.json
ENV PORT=3005
EXPOSE 3005
USER nonroot:nonroot
ENTRYPOINT ["/server"]


