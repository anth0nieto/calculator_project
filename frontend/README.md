# Frontend - Calculator UI

React UI for the calculator. Consumes the backend API and handles local validation, state management, and user interaction.

## Stack & Versions

- **React** 19.2.8
- **TypeScript** 6.0.2
- **Vite** 8.3.0
- **Vitest** 5.0.0 (tests + coverage)
- **Testing Library** 16.3.3

## Architecture

```
src/
├── api/              Typed HTTP client + error mapping
│   ├── client.ts     CalculatorApiClient class
│   ├── types.ts      TypeScript interfaces
│   └── errorMapper.ts Error string → user-friendly message
│
├── hooks/            State & logic
│   ├── useCalculator.ts    State machine, validation, API calls
│   └── validation.ts       Input validation rules
│
└── components/       UI
    ├── Calculator.tsx     Main component + numeric keypad
    └── Calculator.module.css  Responsive styles (320px+)
```

### Layers

**api/** - HTTP Communication
- `CalculatorApiClient`: POST to `/calculate`, handles 200/400/422 responses
- `errorMapper`: Translates backend errors to user-friendly messages

**hooks/** - Business Logic
- `useCalculator`: Manages state (valueA, valueB, operation, result, error)
- Validates input locally (numbers, division by zero, negative sqrt)
- Detects unary operations (sqrt ignores valueB)
- Prevents race conditions with requestId tracking

**components/** - UI Layer
- `Calculator`: Numeric keypad (0-9, +, −, ×, ÷, √, ^, %)
- Sign toggle, delete, equals, reset buttons
- Responsive from 320px
- Accessibility: aria-labels, role="alert", role="status"

---

## Run Locally (Without Docker)

```bash
npm install
npm run dev
```

Access at `http://localhost:5173`

Backend must be running at `http://localhost:8080` (default)

### Custom API URL

To connect to a different backend:

```bash
VITE_API_URL=http://your-api-url:8080 npm run dev
```

Or create `.env.local`:
```
VITE_API_URL=http://your-api-url:8080
```

Then run `npm run dev` and it will use your URL automatically.

---

## Run with Docker

From project root:

```bash
docker-compose up
```

Access at `http://localhost:3000`

Frontend connects to backend automatically via internal network.

---

## Tests & Coverage

```bash
# Tests
npm run test              # Watch mode
npm run test:run          # Single run

# Coverage
npm run test:coverage     # Generates HTML report
```

Report at `coverage/index.html` → Open in browser

Or from project root:
```bash
./coverage.sh
```

---

## Development

```bash
npm run lint              # ESLint
npm run lint:fix          # Auto-fix issues
npm run build             # TypeScript + Vite
```
