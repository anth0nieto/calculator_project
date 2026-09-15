import type { Operation, CalculatorError } from '../api';

export interface ValidationResult {
  isValid: boolean;
  error?: CalculatorError;
}

export function validateCalculatorInput(
  valueA: string,
  valueB: string,
  operation: Operation | '',
  isUnaryOperation: boolean
): ValidationResult {
  // Check for empty fields
  if (!valueA.trim()) {
    return { isValid: false, error: 'INVALID_INPUT' };
  }

  if (isNaN(Number(valueA))) {
    return { isValid: false, error: 'INVALID_INPUT' };
  }

  if (!isUnaryOperation) {
    if (!valueB.trim()) {
      return { isValid: false, error: 'INVALID_INPUT' };
    }

    if (isNaN(Number(valueB))) {
      return { isValid: false, error: 'INVALID_INPUT' };
    }
  }

  if (!operation) {
    return { isValid: false, error: 'INVALID_INPUT' };
  }

  // Extra validation checks (cheap to validate locally)
  const numA = Number(valueA);
  const numB = isUnaryOperation ? 0 : Number(valueB);

  // Check for division by zero
  if (operation === '/' && numB === 0) {
    return { isValid: false, error: 'DIVISION_BY_ZERO' };
  }

  // Check for sqrt of negative
  if (operation === 'sqrt' && numA < 0) {
    return { isValid: false, error: 'NEGATIVE_SQRT' };
  }

  // Check for negative base with fractional exponent
  if (operation === '^' && numA < 0 && !Number.isInteger(numB)) {
    return { isValid: false, error: 'NEGATIVE_BASE_FRACTIONAL_EXPONENT' };
  }

  return { isValid: true };
}
