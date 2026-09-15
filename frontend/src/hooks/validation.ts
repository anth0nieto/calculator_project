import type { Operation, CalculatorError } from '../api';

export interface ValidationError {
  type: CalculatorError;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: ValidationError;
}

const ERROR_MESSAGES: Record<CalculatorError, string> = {
  INVALID_INPUT: 'Please enter valid numbers',
  DIVISION_BY_ZERO: 'Cannot divide by zero',
  NEGATIVE_SQRT: 'Cannot calculate square root of a negative number',
  NEGATIVE_BASE_FRACTIONAL_EXPONENT:
    'Cannot raise a negative number to a fractional power',
  UNKNOWN_OPERATION: 'Unknown operation',
  UNDEFINED_RESULT: 'The calculation resulted in an undefined value',
  OVERFLOW: 'The result is too large to calculate',
  NETWORK_ERROR: 'Unable to connect to the server',
  UNKNOWN_ERROR: 'An unexpected error occurred',
};

export function validateCalculatorInput(
  valueA: string,
  valueB: string,
  operation: Operation | '',
  isUnaryOperation: boolean
): ValidationResult {
  // Check for empty fields
  if (!valueA.trim()) {
    return {
      isValid: false,
      error: { type: 'INVALID_INPUT', message: ERROR_MESSAGES.INVALID_INPUT },
    };
  }

  if (isNaN(Number(valueA))) {
    return {
      isValid: false,
      error: { type: 'INVALID_INPUT', message: ERROR_MESSAGES.INVALID_INPUT },
    };
  }

  if (!isUnaryOperation) {
    if (!valueB.trim()) {
      return {
        isValid: false,
        error: { type: 'INVALID_INPUT', message: ERROR_MESSAGES.INVALID_INPUT },
      };
    }

    if (isNaN(Number(valueB))) {
      return {
        isValid: false,
        error: { type: 'INVALID_INPUT', message: ERROR_MESSAGES.INVALID_INPUT },
      };
    }
  }

  if (!operation) {
    return {
      isValid: false,
      error: { type: 'INVALID_INPUT', message: ERROR_MESSAGES.INVALID_INPUT },
    };
  }

  // Extra validation checks (cheap to validate locally)
  const numA = Number(valueA);
  const numB = isUnaryOperation ? 0 : Number(valueB);

  // Check for division by zero
  if (operation === '/' && numB === 0) {
    return {
      isValid: false,
      error: {
        type: 'DIVISION_BY_ZERO',
        message: ERROR_MESSAGES.DIVISION_BY_ZERO,
      },
    };
  }

  // Check for sqrt of negative
  if (operation === 'sqrt' && numA < 0) {
    return {
      isValid: false,
      error: {
        type: 'NEGATIVE_SQRT',
        message: ERROR_MESSAGES.NEGATIVE_SQRT,
      },
    };
  }

  // Check for negative base with fractional exponent
  if (operation === '^' && numA < 0 && !Number.isInteger(numB)) {
    return {
      isValid: false,
      error: {
        type: 'NEGATIVE_BASE_FRACTIONAL_EXPONENT',
        message: ERROR_MESSAGES.NEGATIVE_BASE_FRACTIONAL_EXPONENT,
      },
    };
  }

  return { isValid: true };
}
