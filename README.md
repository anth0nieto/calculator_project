# Calculator — Full-Stack React + Go

A complete calculator application: REST API backend in Go, React UI frontend, containerized and ready to run.

**Start here:** `docker-compose up` — both services run together on a shared network.

---

## Project Structure

### Frontend ([details →](./frontend/README.md))

React + TypeScript UI with numeric keypad, real-time validation, and accessible interactions.

**Layers:**
- **api/** — Typed HTTP client, error mapping
- **hooks/** — State management, validation, API calls (useCalculator hook)
- **components/** — UI and keypad (Calculator component)

**Tech:** React 19, TypeScript 6, Vite 8, Vitest 5

Accessible at `http://localhost:3000`

### Backend ([details →](./backend/README.md))

Go REST API with domain logic fully separated from HTTP transport.

**Layers:**
- **cmd/server/** — Wiring only: mux, routes, server startup
- **internal/calculator/** — Pure domain logic (no HTTP imports)
- **internal/httpapi/** — HTTP transport: decoding, error mapping, response encoding

**Tech:** Go 1.27.1, standard library only

Accessible at `http://localhost:8080`

---

## Quick Start

### Prerequisites

Choose one path:

**Path A: Docker Only** (Recommended for trying the app)
- Docker + Docker Compose
- Nothing else needed

**Path B: Local Development** (Recommended for development + testing)
- Go 1.27+
- Node.js 20+ + npm
- (Docker is optional; only needed if you want to run containerized)

### Run Everything with Docker

```bash
docker-compose up
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:8080`

Both services share an internal network. Frontend connects to backend automatically.

### Run Locally (Without Docker)

**Backend:**
```bash
go run ./backend/cmd/server
```

**Frontend** (in another terminal):
```bash
cd frontend
npm install
npm run dev
```

To point frontend to a different backend URL:
```bash
VITE_API_URL=http://your-backend-url:8080 npm run dev
```

---

## Testing & Coverage

### Prerequisites

To run tests and coverage locally, you need:
- Go 1.27+
- Node.js 20+ with npm
- Frontend dependencies: `cd frontend && npm install`

(If you only want to run the app, use Docker instead — no prerequisites needed)

### Generate Reports

One command generates both reports:

```bash
./coverage.sh
```

This runs:
- Backend: `go test ./... -coverprofile=coverage.out`
- Frontend: `npm run test:coverage`

⚠️ **Note:** `./coverage.sh` runs tests *locally* on your machine. It requires Go and Node.js installed. It does NOT use Docker.

### View Coverage

Open in your browser:
- **Backend:** `backend/coverage/index.html`
- **Frontend:** `frontend/coverage/index.html`

### Current Coverage

- **Backend Calculator:** 90.7% (domain logic is thoroughly tested)
- **Backend HTTP API:** 97.1%
- **Frontend:** 83.2% overall

### Run Tests Individually

**Backend:**
```bash
cd backend
go test ./...                    # Run all tests
go test ./... -v                 # Verbose
go test ./internal/calculator -v # Specific package
```

**Frontend:**
```bash
cd frontend
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage report
```

---

## Scenarios

Choose based on what you want to do:

| Goal | Command | Prerequisites | Time |
|------|---------|---------------|------|
| **Try the app** | `docker-compose up` | Docker only | 30s |
| **See coverage** | `./coverage.sh` | Go 1.27+, Node 20+, npm install | 20s |
| **Develop locally** | `go run ./backend/cmd/server` + `npm run dev` (separate terminals) | Go 1.27+, Node 20+ | 10s each |
| **Run backend tests** | `cd backend && go test ./...` | Go 1.27+ | 1s |
| **Run frontend tests** | `cd frontend && npm run test` | Node 20+ | 2s |

---

## Architecture

### Why This Structure?

**Layered, not tiered.** Each layer imports inward only; nothing in the domain knows about HTTP or JSON.

```
Backend:
  cmd/server → internal/httpapi → internal/calculator

Frontend:
  components → hooks → api
```

This means:
- Domain logic is tested without a server
- Transport can change without touching business logic
- A second transport (CLI, gRPC) could coexist with HTTP

**No service layer.** Examined and rejected: it would be a pure passthrough, adding indirection without behaviour.

**Monorepo.** Backend and frontend together. Single clone, easy to follow API contract across both sides.

---

## Design Decisions

### Backend

#### Go stdlib only

No framework, no external dependencies. `net/http`. A framework would introduce dependencies with no corresponding gain.

#### Sentinel errors + `errors.Is`

Domain errors are package-level `var` values. Callers use `errors.Is` rather than string matching — stable even if the message changes. Custom error types were rejected: callers only need to know *which* category, not read fields.

#### Two-level validation

1. **Pre-operation** — division by zero, negative sqrt, negative base with fractional exponent. Precise messages.
2. **Post-operation** — every result checked for `NaN` and `±Inf`. Go arithmetic is silent (1/0 = Inf, sqrt(-1) = NaN); the second level prevents invalid values in JSON.

Inputs are also rejected at entry if they are `NaN` or infinite, so malformed input produces "invalid input" (400) rather than "result overflowed" (422).

#### Two status codes for two kinds of errors

| Family | Examples | Status |
|--------|----------|--------|
| Format | unknown operation, non-finite input | 400 |
| Domain | division by zero, negative sqrt, overflow | 422 |

A 400 means "I don't understand the request." A 422 means "I understand, but it has no answer." The distinction lets the frontend show the backend's message directly for domain errors (the user asked for something impossible) while showing guidance for format errors (the client sent something wrong).

#### Square root is unary; `valueB` ignored

`sqrt` takes only `valueA`. If `valueB` is sent, it's silently discarded. Validating its absence would require switching to `*float64` (omitted floats decode to 0, not null) — extra machinery for little gain. The frontend hides the second input for unary ops, so the case doesn't arise in normal use.

#### Percentage is "A percent of B"

`{"valueA": 10, "valueB": 200, "operation": "%"}` returns 20. This is worth stating explicitly; the reverse reading is equally plausible from the endpoint.

### Frontend

#### Validation on both sides, for different reasons

**Server validates for correctness** — it's the authority and can't trust any client.

**Client validates for responsiveness** — immediate feedback without a round trip.

The split follows what's cheap and stable to check locally:
- *Client:* empty fields, non-numeric values, zero divisor, negative sqrt. One-line checks.
- *Server:* overflow, undefined results. Replicating float64 limits in TypeScript would be true duplication.

**Consequence:** Division by zero is caught client-side in normal use, so the server branch is rarely exercised. It remains necessary — it protects against direct API calls and frontend bugs — but the server is the authority.

#### Errors as values, not exceptions

The API client returns an `ApiResult` discriminated union, not throwing. Expected failures (422 from server) flow through the same path as successes. TypeScript can narrow on `result.success`.

#### Backend messages mapped to user text

A single module translates Go's technical wording into user-facing messages. Unrecognised messages fall through to the raw backend text — the failure mode described in limitation 1."

#### Race condition handling

Two calculations dispatched in quick succession: only the most recent one updates state. Uses a request-ID ref. The calculate button also disables during flight.

#### Accessibility

- Every input has an associated `<label>`
- Result uses `role="status"`, error uses `role="alert"` — status doesn't interrupt screen readers, alert does
- Operator buttons have `aria-label` (symbols like × and ÷ don't read well)
- Keypad supplements keyboard input; calculator remains usable by keyboard and assistive tech

### Floating-point precision

All arithmetic uses `float64`. Deliberate: `0.1 + 0.2` = `0.30000000000000004` (IEEE 754 behaviour), and `1e20 + 1` = `1e20` (increment disappears).

This is why financial systems use integer minor units or decimals. A production calculator in this domain would do the same.

Two test cases exist to document this: `0.1 + 0.2` and `1/3 * 3` pass only because comparisons use `1e-9` tolerance, not equality.

`float64` was kept because this is a general-purpose calculator, not a ledger, and arbitrary precision would have expanded scope beyond the brief.

### Testing strategy

Tests are table-driven and split by responsibility:

- **`internal/calculator`** — arithmetic and domain rules (every op, every edge case, overflow, precision)
- **`internal/httpapi`** — HTTP translation only (status codes, response shape, malformed JSON)
- **`api/`, `hooks/`** — client's status handling, error mapping, hook validation and loading states
- **`components/`** — rendering and interaction (hook mocked)

#### Coverage is uneven by design

- `cmd/server`: 0% (only wiring, testing would test stdlib)
- Domain & transport: >90% (business logic thoroughly covered)
- Frontend validation: 100%, hook: 93%, component: lower (logic > presentation)

The domain doesn't reach 100% for a reason: the NaN/Inf safety net is partly unreachable because specific validations catch those cases first. That's defence in depth working.

---

## Known Limitations & Next Steps

Listed in order of priority:

1. **Error responses should carry a stable code.** Frontend currently matches error messages by text. If wording changes in Go, the frontend falls through to its default. Fix: add a `code` field (`{"error": "...", "code": "DIVISION_BY_ZERO"}`), match on code, use message for debugging.

2. **Keypad logic should move to its own hook.** Active-field tracking, digit appending, decimal handling, and sign toggling are input mechanics, not calculation. A `useKeypad` hook would let them be tested in isolation. Stayed in component for scope.

3. **Keyboard listener is global.** Attached to `window`; captures all keystrokes. Fine for a single view, but would conflict with other inputs later. Scope it to the calculator container.

4. **API client's catch block is broad.** Any thrown exception is reported as a network error, including JSON parse failures from HTML responses. Production client would distinguish transport failures from malformed responses.

5. **CORS allows all origins.** `Access-Control-Allow-Origin: *` is for local dev. Production would restrict to known frontend host, ideally via config.

6. **`aria-busy` is on the wrong element.** It's on the calculate button; should be on the region whose content changes.

---

## API Reference

### POST /calculate

Calculate with two operands.

#### Success (200 OK)

```bash
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"valueA":10,"valueB":2,"operation":"/"}'
```

Response:
```json
{
  "result": 5,
  "operation": "/"
}
```

#### Domain Error (422 Unprocessable Entity)

The request is valid, but the operation has no defined result.

```bash
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"valueA":5,"valueB":0,"operation":"/"}'
```

Response:
```json
{
  "error": "division by zero"
}
```

#### Format Error (400 Bad Request)

The request is malformed or incomprehensible.

```bash
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"valueA":2,"valueB":3,"operation":"potato"}'
```

Response:
```json
{
  "error": "unknown operation"
}
```

#### Supported Operations

| Operation | Symbol | Example |
|-----------|--------|---------|
| Addition | `+` | `{"valueA":2,"valueB":3,"operation":"+"}` → `5` |
| Subtraction | `-` | `{"valueA":10,"valueB":3,"operation":"-"}` → `7` |
| Multiplication | `*` | `{"valueA":4,"valueB":5,"operation":"*"}` → `20` |
| Division | `/` | `{"valueA":10,"valueB":2,"operation":"/"}` → `5` |
| Power | `^` | `{"valueA":2,"valueB":8,"operation":"^"}` → `256` |
| Square Root | `sqrt` | `{"valueA":9,"valueB":0,"operation":"sqrt"}` → `3` (valueB ignored) |
| Percentage | `%` | `{"valueA":10,"valueB":200,"operation":"%"}` → `20` (10% of 200) |

### GET /health

Health check endpoint. Returns 200 OK if server is running.

```bash
curl http://localhost:8080/health
```

Response: `200 OK` (empty body)

---

## Developing Locally

### Backend

```bash
cd backend

# Format & vet
go fmt ./...
go vet ./...

# Build binary
go build -o calculator ./cmd/server

# Run
./calculator
```

### Frontend

```bash
cd frontend

# Lint
npm run lint
npm run lint:fix

# Build for production
npm run build

# Preview the build
npm run preview
```

---

## API Reference

See [Backend README](./backend/README.md#api-endpoints) for full details.

### POST /calculate

```json
{ "valueA": 10, "valueB": 2, "operation": "/" }
```

Returns:
```json
{ "result": 5, "operation": "/" }
```

**Operations:** `+`, `-`, `*`, `/`, `^` (power), `sqrt`, `%`

---

## File Structure

```
.
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── calculator/
│   │   │   ├── calculator.go
│   │   │   └── calculator_test.go
│   │   └── httpapi/
│   │       ├── handler.go
│   │       └── handler_test.go
│   ├── Dockerfile
│   ├── go.mod
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── errorMapper.ts
│   │   ├── hooks/
│   │   │   ├── useCalculator.ts
│   │   │   ├── useCalculator.test.ts
│   │   │   └── validation.ts
│   │   ├── components/
│   │   │   ├── Calculator.tsx
│   │   │   ├── Calculator.test.tsx
│   │   │   └── Calculator.module.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── vitest.config.ts
│   └── README.md
│
├── docker-compose.yml
├── coverage.sh
├── DOCKER.md
├── PROMPTS.md
├── .gitignore
└── README.md (this file)
```

---

## How This Project Was Built

See [**PROMPTS.md**](./PROMPTS.md) for:

- **Prompts used** — Each phase of development (domain layer, HTTP layer, frontend, component, etc.)
- **Key decisions** — Why certain patterns were chosen
- **What was rejected** — Alternative approaches and why they didn't work
- **Assumptions** — Decisions made before code was written
- **Corrections** — Issues found during manual testing and how they were fixed

PROMPTS.md documents the iterative process, not just the final result. It shows what worked, what didn't, and the reasoning behind architectural choices.

---