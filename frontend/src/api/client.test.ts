import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CalculatorApiClient } from './client';
import type { CalculatorRequest, CalculatorResponse } from './types';

global.fetch = vi.fn();

describe('CalculatorApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('200 OK - Success cases', () => {
    it('should handle successful calculation', async () => {
      const mockResponse: CalculatorResponse = {
        result: 5,
        operation: '+',
      };

      vi.mocked(global.fetch).mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      });

      const request: CalculatorRequest = {
        valueA: 2,
        valueB: 3,
        operation: '+',
      };

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeUndefined();
    });

    it('should handle division result', async () => {
      const mockResponse: CalculatorResponse = {
        result: 5,
        operation: '/',
      };

      vi.mocked(global.fetch).mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      });

      const request: CalculatorRequest = {
        valueA: 10,
        valueB: 2,
        operation: '/',
      };

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(true);
      expect(result.data?.result).toBe(5);
    });
  });

  describe('400 Bad Request - Input errors', () => {
    it('should handle unknown operation error', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 400,
        json: async () => ({ error: 'unknown operation' }),
      });

      const request = {
        valueA: 2,
        valueB: 3,
        operation: 'potato',
      } as unknown as CalculatorRequest;

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('UNKNOWN_OPERATION');
      expect(result.error?.message).toBe('Unknown operation');
    });

    it('should handle invalid input error', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 400,
        json: async () => ({ error: 'input must be a finite number' }),
      });

      const request: CalculatorRequest = {
        valueA: NaN,
        valueB: 3,
        operation: '+',
      };

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('INVALID_INPUT');
      expect(result.error?.message).toBe('Please enter valid numbers');
    });
  });

  describe('422 Unprocessable Entity - Domain errors', () => {
    it('should handle division by zero error', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 422,
        json: async () => ({ error: 'division by zero' }),
      });

      const request: CalculatorRequest = {
        valueA: 5,
        valueB: 0,
        operation: '/',
      };

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('DIVISION_BY_ZERO');
      expect(result.error?.message).toBe('Cannot divide by zero');
    });

    it('should handle negative sqrt error', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 422,
        json: async () => ({ error: 'square root of negative number' }),
      });

      const request: CalculatorRequest = {
        valueA: -1,
        valueB: 0,
        operation: 'sqrt',
      };

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('NEGATIVE_SQRT');
      expect(result.error?.message).toBe(
        'Cannot calculate square root of a negative number'
      );
    });

    it('should handle overflow error', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 422,
        json: async () => ({ error: 'result overflows float64' }),
      });

      const request: CalculatorRequest = {
        valueA: 1e200,
        valueB: 1e200,
        operation: '*',
      };

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('OVERFLOW');
      expect(result.error?.message).toBe('The result is too large to calculate');
    });

    it('should handle negative base fractional exponent', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 422,
        json: async () => ({ error: 'negative base in exponential fraction' }),
      });

      const request: CalculatorRequest = {
        valueA: -2,
        valueB: 0.5,
        operation: '^',
      };

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('NEGATIVE_BASE_FRACTIONAL_EXPONENT');
      expect(result.error?.message).toBe(
        'Cannot raise a negative number to a fractional power'
      );
    });
  });

  describe('Network errors', () => {
    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      const request: CalculatorRequest = {
        valueA: 2,
        valueB: 3,
        operation: '+',
      };

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Unable to connect to the server');
    });

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new TypeError('Failed to fetch'));

      const request: CalculatorRequest = {
        valueA: 2,
        valueB: 3,
        operation: '+',
      };

      const result = await CalculatorApiClient.calculate(request);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('NETWORK_ERROR');
    });
  });

  describe('HTTP requests', () => {
    it('should send correct request format', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 200,
        json: async () => ({ result: 5, operation: '+' }),
      });

      const request: CalculatorRequest = {
        valueA: 2,
        valueB: 3,
        operation: '+',
      };

      await CalculatorApiClient.calculate(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/calculate'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      );
    });
  });
});
