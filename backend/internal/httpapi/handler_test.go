package httpapi

import (
	"bytes"
	"encoding/json"
	"math"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleCalculator(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		body           any
		expectedStatus int
		expectedError  string
		expectedResult float64
		checkResult    bool
	}{
		// Happy path
		{
			name:           "Happy path: 2 + 3",
			method:         http.MethodPost,
			body:           calculatorRequest{ValueA: 2, ValueB: 3, Operation: "+"},
			expectedStatus: http.StatusOK,
			expectedResult: 5,
		},
		{
			name:           "Happy path: 10 / 2",
			method:         http.MethodPost,
			body:           calculatorRequest{ValueA: 10, ValueB: 2, Operation: "/"},
			expectedStatus: http.StatusOK,
			expectedResult: 5,
		},
		{
			name:           "Happy path: sqrt(4)",
			method:         http.MethodPost,
			body:           calculatorRequest{ValueA: 4, ValueB: 0, Operation: "sqrt"},
			expectedStatus: http.StatusOK,
			expectedResult: 2,
		},

		// Domain errors (422)
		{
			name:           "Domain error: division by zero",
			method:         http.MethodPost,
			body:           calculatorRequest{ValueA: 5, ValueB: 0, Operation: "/"},
			expectedStatus: http.StatusUnprocessableEntity,
			expectedError:  "division by zero",
		},
		{
			name:           "Domain error: negative sqrt",
			method:         http.MethodPost,
			body:           calculatorRequest{ValueA: -1, ValueB: 0, Operation: "sqrt"},
			expectedStatus: http.StatusUnprocessableEntity,
			expectedError:  "square root of negative number",
		},
		{
			name:           "Domain error: negative base fractional exponent",
			method:         http.MethodPost,
			body:           calculatorRequest{ValueA: -2, ValueB: 0.5, Operation: "^"},
			expectedStatus: http.StatusUnprocessableEntity,
			expectedError:  "negative base in exponential fraction",
		},
		{
			name:           "Domain error: overflow",
			method:         http.MethodPost,
			body:           calculatorRequest{ValueA: 1e200, ValueB: 1e200, Operation: "*"},
			expectedStatus: http.StatusUnprocessableEntity,
			expectedError:  "result overflows float64",
		},

		// Input errors (400)
		{
			name:           "Input error: unknown operation",
			method:         http.MethodPost,
			body:           calculatorRequest{ValueA: 2, ValueB: 3, Operation: "potato"},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "unknown operation",
		},
		{
			name:           "Input error: malformed JSON",
			method:         http.MethodPost,
			body:           []byte(`{invalid json}`),
			expectedStatus: http.StatusBadRequest,
			expectedError:  "invalid JSON body",
		},

		// HTTP method errors (405)
		{
			name:           "Method error: GET not allowed",
			method:         http.MethodGet,
			body:           calculatorRequest{ValueA: 2, ValueB: 3, Operation: "+"},
			expectedStatus: http.StatusMethodNotAllowed,
			expectedError:  "method not allowed",
		},
		{
			name:           "Method error: PUT not allowed",
			method:         http.MethodPut,
			body:           calculatorRequest{ValueA: 2, ValueB: 3, Operation: "+"},
			expectedStatus: http.StatusMethodNotAllowed,
			expectedError:  "method not allowed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var body []byte
			var err error

			switch v := tt.body.(type) {
			case []byte:
				body = v
			default:
				body, err = json.Marshal(tt.body)
				if err != nil {
					t.Fatalf("Failed to marshal request body: %v", err)
				}
			}

			req := httptest.NewRequest(tt.method, "/calculate", bytes.NewReader(body))
			w := httptest.NewRecorder()

			HandleCalculator(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if tt.expectedStatus == http.StatusOK {
				var resp successResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}

				if math.Abs(resp.Result-tt.expectedResult) > 1e-9 {
					t.Errorf("Expected result %v, got %v", tt.expectedResult, resp.Result)
				}
			} else {
				var resp errorResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Fatalf("Failed to decode error response: %v", err)
				}

				if tt.expectedError != "" && resp.Error != tt.expectedError {
					t.Errorf("Expected error '%s', got '%s'", tt.expectedError, resp.Error)
				}
			}
		})
	}
}

func TestCORSMiddleware(t *testing.T) {
	tests := []struct {
		name              string
		method            string
		expectedStatus    int
		checkCORSHeaders  bool
	}{
		{
			name:             "CORS: OPTIONS preflight request",
			method:           http.MethodOptions,
			expectedStatus:   http.StatusOK,
			checkCORSHeaders: true,
		},
		{
			name:             "CORS: POST request with CORS headers",
			method:           http.MethodPost,
			expectedStatus:   http.StatusOK,
			checkCORSHeaders: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(calculatorRequest{ValueA: 2, ValueB: 3, Operation: "+"})
			req := httptest.NewRequest(tt.method, "/calculate", bytes.NewReader(body))
			w := httptest.NewRecorder()

			handler := CORSMiddleware(HandleCalculator)
			handler(w, req)

			if tt.checkCORSHeaders {
				corsOrigin := w.Header().Get("Access-Control-Allow-Origin")
				corsMethods := w.Header().Get("Access-Control-Allow-Methods")
				corsHeaders := w.Header().Get("Access-Control-Allow-Headers")

				if corsOrigin != "*" {
					t.Errorf("Expected Access-Control-Allow-Origin: *, got: %s", corsOrigin)
				}
				if corsMethods != "POST, OPTIONS" {
					t.Errorf("Expected Access-Control-Allow-Methods: POST, OPTIONS, got: %s", corsMethods)
				}
				if corsHeaders != "Content-Type" {
					t.Errorf("Expected Access-Control-Allow-Headers: Content-Type, got: %s", corsHeaders)
				}
			}

			if tt.method == http.MethodOptions {
				if w.Code != http.StatusOK {
					t.Errorf("OPTIONS request should return 200, got %d", w.Code)
				}
			}
		})
	}
}
