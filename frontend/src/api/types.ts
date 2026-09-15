export type Operation = '+' | '-' | '*' | '/' | '^' | 'sqrt' | '%';

export interface CalculatorRequest {
  valueA: number;
  valueB: number;
  operation: Operation;
}

export interface CalculatorResponse {
  result: number;
  operation: Operation;
}

export interface ErrorResponse {
  error: string;
}

export type CalculatorError =
  | 'DIVISION_BY_ZERO'
  | 'NEGATIVE_SQRT'
  | 'NEGATIVE_BASE_FRACTIONAL_EXPONENT'
  | 'UNKNOWN_OPERATION'
  | 'INVALID_INPUT'
  | 'UNDEFINED_RESULT'
  | 'OVERFLOW'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'
  | 'INVALID_OPERATION';

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { type: CalculatorError; message: string } };
