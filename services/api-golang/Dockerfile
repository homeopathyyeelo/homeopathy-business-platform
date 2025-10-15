FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./main.go

FROM gcr.io/distroless/base-debian12
WORKDIR /
COPY --from=builder /app/server /server
COPY --from=builder /app/openapi.json /openapi.json
ENV PORT=8088
EXPOSE 8088
USER nonroot:nonroot
ENTRYPOINT ["/server"]


