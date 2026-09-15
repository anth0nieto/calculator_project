# Backend - Calculator API

Go REST API for the calculator. Pure domain logic separated from HTTP transport, with comprehensive error handling and validation.

## Stack & Versions

- **Go** 1.27.1
- **Standard Library Only** — No external dependencies

---

## Architecture

```
.
├── cmd/server/              Wiring & server setup
│   └── main.go              Builds mux, registers routes, starts server
│
└── internal/
    ├── calculator/          Domain logic (100% transport-agnostic)
    │   ├── calculator.go    Core arithmetic functions
    │   └── calculator_test.go 62 comprehensive tests
    │
    └── httpapi/             HTTP transport layer
        ├── handler.go       HTTP handlers, error translation, CORS
        └── handler_test.go  11 HTTP-specific tests
```

### Layers

**cmd/server/** - Wiring Only
- HTTP mux setup
- Route registration (`POST /calculate`, `GET /health`)
- Server initialization on port 8080
- No business logic

**internal/calculator/** - Pure Domain Logic
- Arithmetic operations: `Add`, `Subtract`, `Multiply`, `Divide`, `Power`, `SquareRoot`, `Percentage`
- Input validation (division by zero, negative sqrt, overflow detection)
- Returns `(float64, error)` — agnostic to HTTP
- Imports nothing from `net/http` or `encoding/json`

**internal/httpapi/** - HTTP Transport
- Decodes JSON requests → calls calculator
- Maps calculator errors to HTTP status codes:
  - 400: Invalid input, unknown operation
  - 422: Domain errors (division by zero, negative sqrt, etc.)
  - 200: Success
- Encodes results to JSON
- CORS middleware for browser requests

---

## Run Locally (Without Docker)

### Prerequisites
- Go 1.27+ installed

### Start Server

```bash
go run ./cmd/server
```

Server listens at `http://localhost:8080`

Test it:
```bash
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"valueA": 5, "valueB": 3, "operation": "+"}'

# Response: {"result":8,"operation":"+"}
```

---

## Run with Docker

From project root:

```bash
docker-compose up
```

Backend accessible at `http://localhost:8080`

Frontend on `http://localhost:3000` connects automatically via internal network.

---

## Tests

```bash
# Run all tests
go test ./...

# With coverage
go test ./... -cover

# Verbose output
go test ./... -v

# Specific package
go test ./internal/calculator -v
go test ./internal/httpapi -v
```

Current coverage:
- `internal/calculator`: 90.7%
- `internal/httpapi`: 97.1%

---

## Coverage Report

Generate HTML report:

```bash
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage/index.html
```

Open `coverage/index.html` in browser.

Or from project root:
```bash
./coverage.sh
```

---

## API Endpoints

### POST /calculate

Calculate with two operands.

**Request:**
```json
{
  "valueA": 10,
  "valueB": 2,
  "operation": "/"
}
```

**Operations:** `+`, `-`, `*`, `/`, `^`, `sqrt`, `%`

**Response (200):**
```json
{
  "result": 5,
  "operation": "/"
}
```

**Error (400/422):**
```json
{
  "error": "cannot divide by zero"
}
```

### GET /health

Health check endpoint. Returns 200 OK if server is running.

---

## Development

```bash
# Format code
go fmt ./...

# Vet for issues
go vet ./...

# Build binary
go build -o calculator ./cmd/server

# Run binary
./calculator
```
