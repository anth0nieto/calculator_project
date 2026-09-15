import { describe, it, expect } from 'vitest';
import { validateCalculatorInput } from './validation';

describe('validateCalculatorInput', () => {
  describe('Basic validation', () => {
    it('should pass valid addition', () => {
      const result = validateCalculatorInput('10', '5', '+', false);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should pass valid sqrt', () => {
      const result = validateCalculatorInput('16', '', 'sqrt', true);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail on empty valueA', () => {
      const result = validateCalculatorInput('', '5', '+', false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_INPUT');
    });

    it('should fail on non-numeric valueA', () => {
      const result = validateCalculatorInput('abc', '5', '+', false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_INPUT');
    });

    it('should fail on empty valueB for binary operation', () => {
      const result = validateCalculatorInput('10', '', '+', false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_INPUT');
    });

    it('should fail on non-numeric valueB', () => {
      const result = validateCalculatorInput('10', 'abc', '+', false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_INPUT');
    });

    it('should fail on missing operation', () => {
      const result = validateCalculatorInput('10', '5', '', false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('INVALID_INPUT');
    });
  });

  describe('Division by zero', () => {
    it('should fail on division by zero', () => {
      const result = validateCalculatorInput('5', '0', '/', false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('DIVISION_BY_ZERO');
    });

    it('should pass on division by non-zero', () => {
      const result = validateCalculatorInput('10', '2', '/', false);
      expect(result.isValid).toBe(true);
    });

    it('should pass on division by negative', () => {
      const result = validateCalculatorInput('10', '-2', '/', false);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Square root validation', () => {
    it('should fail on sqrt of negative', () => {
      const result = validateCalculatorInput('-1', '', 'sqrt', true);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('NEGATIVE_SQRT');
    });

    it('should pass on sqrt of zero', () => {
      const result = validateCalculatorInput('0', '', 'sqrt', true);
      expect(result.isValid).toBe(true);
    });

    it('should pass on sqrt of positive', () => {
      const result = validateCalculatorInput('4', '', 'sqrt', true);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Negative base with fractional exponent', () => {
    it('should fail on negative base with fractional exponent', () => {
      const result = validateCalculatorInput('-2', '0.5', '^', false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('NEGATIVE_BASE_FRACTIONAL_EXPONENT');
    });

    it('should pass on negative base with integer exponent', () => {
      const result = validateCalculatorInput('-2', '3', '^', false);
      expect(result.isValid).toBe(true);
    });

    it('should pass on positive base with fractional exponent', () => {
      const result = validateCalculatorInput('4', '0.5', '^', false);
      expect(result.isValid).toBe(true);
    });

    it('should pass on negative base with zero exponent', () => {
      const result = validateCalculatorInput('-2', '0', '^', false);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Other operations', () => {
    it('should pass on subtraction', () => {
      const result = validateCalculatorInput('10', '3', '-', false);
      expect(result.isValid).toBe(true);
    });

    it('should pass on multiplication', () => {
      const result = validateCalculatorInput('10', '0', '*', false);
      expect(result.isValid).toBe(true);
    });

    it('should pass on power with positive base', () => {
      const result = validateCalculatorInput('2', '10', '^', false);
      expect(result.isValid).toBe(true);
    });

    it('should pass on percentage', () => {
      const result = validateCalculatorInput('50', '100', '%', false);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace in fields', () => {
      const result = validateCalculatorInput('  10  ', '  5  ', '+', false);
      expect(result.isValid).toBe(true);
    });

    it('should handle negative numbers', () => {
      const result = validateCalculatorInput('-10', '-5', '+', false);
      expect(result.isValid).toBe(true);
    });

    it('should handle decimal numbers', () => {
      const result = validateCalculatorInput('10.5', '2.5', '+', false);
      expect(result.isValid).toBe(true);
    });

    it('should handle scientific notation', () => {
      const result = validateCalculatorInput('1e10', '1e-5', '+', false);
      expect(result.isValid).toBe(true);
    });
  });
});
