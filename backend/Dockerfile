FROM golang:1.27-alpine AS builder

WORKDIR /app

COPY go.mod go.mod
RUN go mod download

COPY cmd/ cmd/
COPY internal/ internal/

RUN CGO_ENABLED=0 GOOS=linux go build -o calculator ./cmd/server

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/calculator .

EXPOSE 8080

CMD ["./calculator", "-port", "8080"]
