import type { CalculatorError } from './types';

interface ErrorMapping {
  [key: string]: {
    type: CalculatorError;
    userMessage: string;
  };
}

const ERROR_MAPPING: ErrorMapping = {
  'division by zero': {
    type: 'DIVISION_BY_ZERO',
    userMessage: 'Cannot divide by zero',
  },
  'square root of negative number': {
    type: 'NEGATIVE_SQRT',
    userMessage: 'Cannot calculate square root of a negative number',
  },
  'negative base in exponential fraction': {
    type: 'NEGATIVE_BASE_FRACTIONAL_EXPONENT',
    userMessage: 'Cannot raise a negative number to a fractional power',
  },
  'unknown operation': {
    type: 'UNKNOWN_OPERATION',
    userMessage: 'Unknown operation',
  },
  'input must be a finite number': {
    type: 'INVALID_INPUT',
    userMessage: 'Please enter valid numbers',
  },
  'undefined result': {
    type: 'UNDEFINED_RESULT',
    userMessage: 'The calculation resulted in an undefined value',
  },
  'result overflows float64': {
    type: 'OVERFLOW',
    userMessage: 'The result is too large to calculate',
  },
};

export function mapErrorMessage(backendMessage: string): {
  type: CalculatorError;
  userMessage: string;
} {
  const mapping = ERROR_MAPPING[backendMessage.toLowerCase()];

  if (mapping) {
    return mapping;
  }

  return {
    type: 'UNKNOWN_ERROR',
    userMessage: backendMessage || 'An unexpected error occurred',
  };
}
