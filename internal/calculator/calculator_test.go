package calculator

import (
	"errors"
	"math"
	"testing"
)

func TestCalculator(t *testing.T) {
	tests := []struct {
		name    string
		a       float64
		b       float64
		op      string
		want    float64
		wantErr error
	}{
		// Happy path - Addition
		{"Add: 2 + 3", 2, 3, "+", 5, nil},
		{"Add: -1 + 1", -1, 1, "+", 0, nil},
		{"Add: 2.5 + 1.5", 2.5, 1.5, "+", 4, nil},
		{"Add: 0 + 5", 0, 5, "+", 5, nil},

		// Happy path - Subtraction
		{"Subtract: 5 - 3", 5, 3, "-", 2, nil},
		{"Subtract: 1 - 1", 1, 1, "-", 0, nil},
		{"Subtract: -5 - 3", -5, 3, "-", -8, nil},
		{"Subtract: 0 - 5", 0, 5, "-", -5, nil},

		// Happy path - Multiplication
		{"Multiply: 2 * 3", 2, 3, "*", 6, nil},
		{"Multiply: -2 * 3", -2, 3, "*", -6, nil},
		{"Multiply: 0 * 5", 0, 5, "*", 0, nil},
		{"Multiply: 2.5 * 4", 2.5, 4, "*", 10, nil},

		// Happy path - Division
		{"Divide: 6 / 2", 6, 2, "/", 3, nil},
		{"Divide: -6 / 2", -6, 2, "/", -3, nil},
		{"Divide: 10 / 4", 10, 4, "/", 2.5, nil},
		{"Divide: 0 / 5", 0, 5, "/", 0, nil},

		// Happy path - Power
		{"Power: 2 ^ 3", 2, 3, "^", 8, nil},
		{"Power: 2 ^ 0", 2, 0, "^", 1, nil},
		{"Power: 10 ^ 2", 10, 2, "^", 100, nil},
		{"Power: 4 ^ 0.5", 4, 0.5, "^", 2, nil},

		// Happy path - Square Root
		{"SquareRoot: sqrt(4)", 4, 0, "sqrt", 2, nil},
		{"SquareRoot: sqrt(0)", 0, 0, "sqrt", 0, nil},
		{"SquareRoot: sqrt(9)", 9, 0, "sqrt", 3, nil},
		{"SquareRoot: sqrt(2)", 2, 0, "sqrt", math.Sqrt(2), nil},

		// Happy path - Percentage
		{"Percentage: 50% of 100", 50, 100, "%", 50, nil},
		{"Percentage: 25% of 200", 25, 200, "%", 50, nil},
		{"Percentage: 10% of 50", 10, 50, "%", 5, nil},
		{"Percentage: 0% of 100", 0, 100, "%", 0, nil},

		// Edge cases - Division by zero
		{"Error: 5 / 0", 5, 0, "/", 0, ErrDivisionByZero},
		{"Error: -10 / 0", -10, 0, "/", 0, ErrDivisionByZero},
		{"Error: 0 / 0", 0, 0, "/", 0, ErrUndefinedResult},

		// Edge cases - Negative square root
		{"Error: sqrt(-1)", -1, 0, "sqrt", 0, ErrNegativeSqrt},
		{"Error: sqrt(-4)", -4, 0, "sqrt", 0, ErrNegativeSqrt},
		{"Error: sqrt(-0.5)", -0.5, 0, "sqrt", 0, ErrNegativeSqrt},

		// Edge cases - Negative base with fractional exponent
		{"Error: (-2) ^ 0.5", -2, 0.5, "^", 0, ErrNegativeBaseFractionalExponent},
		{"Error: (-1) ^ 0.25", -1, 0.25, "^", 0, ErrNegativeBaseFractionalExponent},

		// Edge cases - Zero to negative power
		{"Error: 0 ^ -1", 0, -1, "^", 0, ErrDivisionByZero},
		{"Error: 0 ^ -2", 0, -2, "^", 0, ErrDivisionByZero},

		// Edge cases - NaN input
		{"Error: NaN + 5", math.NaN(), 5, "+", 0, ErrInvalidInput},
		{"Error: 5 + NaN", 5, math.NaN(), "+", 0, ErrInvalidInput},

		// Edge cases - Infinity input
		{"Error: Inf + 5", math.Inf(1), 5, "+", 0, ErrInvalidInput},
		{"Error: 5 + Inf", 5, math.Inf(1), "+", 0, ErrInvalidInput},
		{"Error: 5 - Inf", math.Inf(-1), 5, "-", 0, ErrInvalidInput},

		// Edge cases - Unknown operation
		{"Error: unknown op &", 2, 3, "&", 0, ErrUnknownOperation},
		{"Error: unknown op //", 2, 3, "//", 0, ErrUnknownOperation},
		{"Error: unknown op", 2, 3, "unknown", 0, ErrUnknownOperation},

		// Overflow cases - Addition
		{"Overflow: very large addition", math.MaxFloat64, math.MaxFloat64, "+", 0, ErrOverflow},
		{"Overflow: large positive + large positive", 1e308, 1e308, "+", 0, ErrOverflow},

		// Overflow cases - Multiplication
		{"Overflow: 1e200 * 1e200", 1e200, 1e200, "*", 0, ErrOverflow},
		{"Overflow: very large multiply", math.MaxFloat64 / 2, 10, "*", 0, ErrOverflow},
		{"Overflow: -1e200 * 1e200", -1e200, 1e200, "*", 0, ErrOverflow},

		// Overflow cases - Power
		{"Overflow: 10 ^ 309", 10, 309, "^", 0, ErrOverflow},
		{"Overflow: 1e100 ^ 10", 1e100, 10, "^", 0, ErrOverflow},
		{"Overflow: 100 ^ 200", 100, 200, "^", 0, ErrOverflow},

		// Float64 precision cases
		{"Precision: 0.1 + 0.2", 0.1, 0.2, "+", 0.3, nil},
		{"Precision: 1/3 * 3", 1.0 / 3.0, 3, "*", 1.0, nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculator(tt.a, tt.b, tt.op)

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Calculator(%v, %v, %q) error = %v, want = %v", tt.a, tt.b, tt.op, err, tt.wantErr)
			}

			if tt.wantErr != nil {
				return
			}

			if math.Abs(got-tt.want) > 1e-9 {
				t.Errorf("Calculator(%v, %v, %q) = %v, want %v", tt.a, tt.b, tt.op, got, tt.want)
			}
		})
	}
}
