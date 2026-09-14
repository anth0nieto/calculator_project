package calculator

import (
	"errors"
	"math"
)

var (
	ErrDivisionByZero                 = errors.New("division by zero")
	ErrNegativeSqrt                   = errors.New("square root of negative number")
	ErrUnknownOperation               = errors.New("unknown operation")
	ErrInvalidInput                   = errors.New("input must be a finite number")
	ErrUndefinedResult                = errors.New("undefined result")
	ErrOverflow                       = errors.New("result overflows float64")
	ErrNegativeBaseFractionalExponent = errors.New("negative base in exponential fraction")
)

func Add(a, b float64) (float64, error) {
	result := a + b
	if err := checkResult(result); err != nil {
		return 0, err
	}
	return result, nil
}

func Subtract(a, b float64) (float64, error) {
	result := a - b
	if err := checkResult(result); err != nil {
		return 0, err
	}
	return result, nil
}

func Multiply(a, b float64) (float64, error) {
	result := a * b
	if err := checkResult(result); err != nil {
		return 0, err
	}
	return result, nil
}

func Divide(a, b float64) (float64, error) {
	if a == 0 && b == 0 {
		return 0, ErrUndefinedResult
	}
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	result := a / b
	if err := checkResult(result); err != nil {
		return 0, err
	}
	return result, nil
}

func Power(a, b float64) (float64, error) {
	if a < 0 && b != math.Trunc(b) {
		return 0, ErrNegativeBaseFractionalExponent
	}

	if a == 0 && b < 0 {
		return 0, ErrDivisionByZero
	}
	result := math.Pow(a, b)
	if err := checkResult(result); err != nil {
		return 0, err
	}
	return result, nil
}

func SquareRoot(a float64) (float64, error) {
	if a < 0 {
		return 0, ErrNegativeSqrt
	}
	result := math.Sqrt(a)
	if err := checkResult(result); err != nil {
		return 0, err
	}
	return result, nil
}

func Percentage(a, b float64) (float64, error) {
	result := (a / 100) * b
	if err := checkResult(result); err != nil {
		return 0, err
	}
	return result, nil
}

func Calculator(a float64, b float64, operation string) (float64, error) {
	if math.IsNaN(a) || math.IsNaN(b) || math.IsInf(a, 0) || math.IsInf(b, 0) {
		return 0, ErrInvalidInput
	}

	switch operation {
	case "+":
		return Add(a, b)
	case "-":
		return Subtract(a, b)
	case "*":
		return Multiply(a, b)
	case "/":
		return Divide(a, b)
	case "^":
		return Power(a, b)
	case "sqrt":
		return SquareRoot(a)
	case "%":
		return Percentage(a, b)
	default:
		return 0, ErrUnknownOperation
	}
}

func checkResult(v float64) error {
	if math.IsNaN(v) {
		return ErrUndefinedResult
	}
	if math.IsInf(v, 0) {
		return ErrOverflow
	}
	return nil
}
