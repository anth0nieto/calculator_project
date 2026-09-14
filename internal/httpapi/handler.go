package httpapi

import (
	"calculator/internal/calculator"
	"encoding/json"
	"errors"
	"net/http"
)

type calculatorRequest struct {
	ValueA    float64 `json:"valueA"`
	ValueB    float64 `json:"valueB"`
	Operation string  `json:"operation"`
}

type errorResponse struct {
	Error string `json:"error"`
}

type successResponse struct {
	Result    float64 `json:"result"`
	Operation string  `json:"operation"`
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorResponse{Error: msg})
}

func HandleCalculator(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req calculatorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	result, err := calculator.Calculator(req.ValueA, req.ValueB, req.Operation)

	if err != nil {
		switch {
		case errors.Is(err, calculator.ErrUnknownOperation),
			errors.Is(err, calculator.ErrInvalidInput):
			writeError(w, http.StatusBadRequest, err.Error())

		case errors.Is(err, calculator.ErrDivisionByZero),
			errors.Is(err, calculator.ErrNegativeSqrt),
			errors.Is(err, calculator.ErrNegativeBaseFractionalExponent),
			errors.Is(err, calculator.ErrUndefinedResult),
			errors.Is(err, calculator.ErrOverflow):
			writeError(w, http.StatusUnprocessableEntity, err.Error())
		default:
			writeError(w, http.StatusInternalServerError, "internal error")
		}
		return
	}

	writeJSON(w, http.StatusOK, successResponse{
		Result:    result,
		Operation: req.Operation,
	})
}
