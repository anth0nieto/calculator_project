# PROMPTS.md

## How I used AI on this assignment

I used Claude throughout this exercise, but not to generate the project.

The architecture, the layering, the error strategy and the API contract were decisions
I made first. The prompts below implemented within those decisions — they did not
produce them.

The prompts are reproduced in the order I sent them. They are not the complete record:
between them I read, edited and rewrote the generated code by hand. Several prompts
start by pointing at something I had already written — *"I already created the Add
function, do the rest"*, *"you can use the checkResult method I wrote as a guide"* —
because the AI was working inside a structure that already existed.

I also used AI to draft the READMEs, guided section by section: I specified what each
part had to contain and corrected the output wherever it was inaccurate or claimed more
than the code actually did. Some of those corrections are listed at the end.

A note on Go specifically: I had not written Go before this assignment. I spent the
weekend on *A Tour of Go* and built a small unrelated HTTP service (a temperature
converter with the same three-package layout) to get the idioms into my hands before
starting. The assignment itself was then written in the 2–4 hour window.

---

## Backend — domain layer

```
We're building a calculator. We have a file that handles the project's domain:
internal/calculator/calculator.go

Here we'll create the methods that perform the arithmetic operations:
- Add, subtract, multiply, divide
- Power, square root and percentages

The base signature always receives two floats — a and b — plus the operation as a
string.

I already created one of the functions, Add. Handle the others and use them inside
func Calculator. Do NOT add any validation yet. We'll handle that afterwards.
```

```
Now let's define the errors. Add them at the top in a var block, following this
example:

ErrDivisionByZero = errors.New("division by zero")

Add the other possible cases: square root of a negative number, input must be a
finite number, undefined result, result overflow, unknown operation.
```

```
You can use the checkResult method I wrote to validate whether there's an error.
I already added a couple of validations — to Add and Subtract.

Add them for the remaining arithmetic operations.
```

## Backend — domain tests

```
Now let's validate the operations with unit tests.

Create a test table containing:
name, value_a, value_b, operator, want, wantErr

Start with all the happy paths, then the edge cases matching the validations we have
in the main file. I already created calculator_test.go.
```

```
Add tests for overflow in addition, multiplication and power. Also add a case that
documents float64 precision.
```

## Backend — HTTP layer

```
Now let's build the handler. The handler will use calculator.go, which holds the
domain. I already created a base version of the file — it has validation for the
accepted request method and for the body.

Now implement the cases where the domain errors can surface.
```

```
Now let's write the handler tests. Create the file covering these cases:

Happy path → 200, body with result and operation
Format error ("operation": "potato") → 400
Domain error (division by zero) → 422
Malformed JSON → 400
GET method → 405
```

## Frontend — structure and API client

```
Backend is done. I moved everything into /backend.

Now the frontend. My plan is these layers:

src/api/         → typed HTTP client, types, error mapping
src/hooks/       → useCalculator: state, validation, API call
src/components/  → UI that consumes the hook
```

```
Let's start with the API client, which mirrors the backend. The request and response
types, and handling for the three statuses: 200, 400 and 422.
```

## Frontend — hook

```
Now let's create useCalculator, inside the hooks folder.

- State for the two inputs and the operation
- Local validation before calling
- loading, result, error
- Call calculate

Other considerations for this hook:
- The empty-field case can be caught client-side; that validation belongs here
- sqrt is unary
- The hook has to know that when the operation is sqrt, the second input is ignored
  or disabled
- Clear the previous result when starting a new call
- Race condition: if two calculations fire in quick succession, the slow response can
  overwrite the fast one
```

```
Let's add the remaining validations:

Empty field            — not a number, not even a valid request
Non-numeric input      — same case
Division by zero       — a comparison against 0, free
Negative square root   — equally cheap
Negative base with fractional exponent
```

```
The error is currently storing a CalculatorError type. We should store the full object
— the type plus the message that errorMapper already produced in src/api/client.ts
```

## Frontend — component

```
Create the main calculator screen component using the useCalculator hook.

Stack: React + TypeScript, Vite. No UI or styling libraries.

Structure:
- Two numeric inputs (valueA and valueB) and an operation selector
- Operations: + - * / ^ sqrt %
- "Calculate" button
- Result area and error area, visually distinct

Behaviour:
- The component contains NO calculation or validation logic: everything comes from
  the hook
- When the operation is unary (isUnaryOperation), the second input is hidden
- Enter in any input triggers the calculation, same as the button
- While loading, the button is disabled and shows a loading state
- Reset button that clears everything

Accessibility:
- Each input with its <label> associated via htmlFor
- Error area with role="alert"
- Labelled selector
- No control identifiable by colour alone

Responsive:
- Must not break from 320px width
- Plain CSS with media queries, no frameworks

Return the component and its CSS.
```

```
UI change to the calculator component.

Replace the operation selector with buttons. Symbols: + − × ÷ % √ ^

Add a numeric keypad with buttons: digits 0-9, decimal point, and delete.

The active input is filled by clicking the numeric keypad. It must be visually clear
which of the two fields is receiving the digits, and the user must be able to switch
fields by clicking on them.

The calculate button becomes "=". Keep the reset button.

The fields remain editable via physical keyboard in addition to the on-screen keypad:
it's a complement, not a replacement.

Keep: all logic in the hook, associated labels, role="alert" on the error, no
libraries, responsive from 320px.

Every button needs a descriptive aria-label — "×" and "÷" don't read well in a
screen reader.
```

```
The response text needs to fit inside its box. Right now, if the result is very long
it overflows. The result should wrap and always adapt.
```

---

## What I rejected or corrected

The prompts above are the requests. This section is the part that isn't visible in
them — where I didn't take what came back.

**Operator precedence bug in the decimal handler.** The generated decimal-append logic
was `setValueA(valueA || '0' + '.')`. The concatenation binds first, so the expression
evaluates to `valueA || '0.'` and silently does nothing whenever the field already had
a value. Found by manual testing. A unit test on that logic would have caught it
immediately, which is the reasoning behind limitation 2 in the README.

**Helper functions that tried to abort the handler.** A suggested refactor extracted
the method and body checks into `validateRequestMethod` / `validateBody`, each writing
an error response and returning. In Go the `return` exits the helper, not the caller —
the handler would have continued and written a second response to the same connection.
I moved both checks back inline.

**Unexported struct fields.** The request struct was generated with lowercase field
names. `encoding/json` uses reflection and cannot reach unexported fields, so the
decode compiled, ran without error, and left the struct empty. Exported them.

**A single-input expression parser.** I considered replacing the two inputs with one
free-text field where the user types `2+3`. Rejected: it implies operator precedence,
parentheses, ambiguous unary minus, and a grammar for `sqrt` and `%` — a large surface
of new bugs in a deliverable whose brief explicitly asks to prioritise correctness over
extra features, and an asymmetry with a backend that accepts one binary operation.

**Documentation claiming more than the code does.** The generated README drafts included
a `GET /health` endpoint that did not exist, labelled the backend "Clean Architecture"
when the structure deliberately doesn't follow that taxonomy, and quoted an error
message (`"cannot divide by zero"`) that did not match the sentinel in `calculator.go`.
All three removed or corrected. The last one is the same string-coupling problem
described in limitation 1 — it reached the documentation before it reached production.

**Redundant assertions in generated tests.** Two component tests asserted
`expect(element).toBeTruthy()` on an element that had already rendered, which can never
fail. Removed rather than kept for the coverage number.

---

## What I'd do differently

The most useful thing I did was write a throwaway service in Go before starting the
assignment. It meant the prompts during the exercise were about this problem rather
than about the language, and it's why the domain package came out idiomatic on the
first pass instead of the third.

The least useful pattern was accepting generated helper abstractions without checking
them against Go's control flow. Both of the structural bugs above came from code that
looked reasonable and would have been correct in TypeScript.