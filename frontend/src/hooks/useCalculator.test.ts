import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculator } from './useCalculator';
import { CalculatorApiClient } from '../api';

vi.mock('../api', () => ({
  CalculatorApiClient: {
    calculate: vi.fn(),
  },
}));

const mockCalculate = vi.mocked(CalculatorApiClient.calculate);

describe('useCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useCalculator());

      expect(result.current.valueA).toBe('');
      expect(result.current.valueB).toBe('');
      expect(result.current.operation).toBe('');
      expect(result.current.loading).toBe(false);
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Input management', () => {
    it('should update valueA', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setValueA('10');
      });

      expect(result.current.valueA).toBe('10');
    });

    it('should update valueB', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setValueB('5');
      });

      expect(result.current.valueB).toBe('5');
    });

    it('should update operation', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setOperation('+');
      });

      expect(result.current.operation).toBe('+');
    });
  });

  describe('Unary operations', () => {
    it('should identify sqrt as unary operation', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setOperation('sqrt');
      });

      expect(result.current.isUnaryOperation).toBe(true);
      expect(result.current.isSqrt).toBe(true);
    });

    it('should not identify binary operations as unary', () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setOperation('+');
      });

      expect(result.current.isUnaryOperation).toBe(false);
      expect(result.current.isSqrt).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate empty valueA', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setValueB('5');
        result.current.setOperation('+');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.error?.type).toBe('INVALID_INPUT');
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it('should validate empty valueB for binary operations', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setValueA('10');
        result.current.setOperation('+');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.error?.type).toBe('INVALID_INPUT');
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it('should not require valueB for sqrt', async () => {
      const { result } = renderHook(() => useCalculator());

      mockCalculate.mockResolvedValue({
        success: true,
        data: { result: 4, operation: 'sqrt' },
      });

      act(() => {
        result.current.setValueA('16');
        result.current.setOperation('sqrt');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(mockCalculate).toHaveBeenCalledWith({
        valueA: 16,
        valueB: 0,
        operation: 'sqrt',
      });
    });

    it('should validate non-numeric input', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setValueA('abc');
        result.current.setValueB('5');
        result.current.setOperation('+');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.error?.type).toBe('INVALID_INPUT');
    });

    it('should validate missing operation', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setValueA('10');
        result.current.setValueB('5');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.error?.type).toBe('INVALID_OPERATION');
    });
  });

  describe('Extra validation (local checks)', () => {
    it('should validate division by zero locally', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setValueA('5');
        result.current.setValueB('0');
        result.current.setOperation('/');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.error?.type).toBe('DIVISION_BY_ZERO');
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it('should validate sqrt of negative locally', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setValueA('-4');
        result.current.setOperation('sqrt');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.error?.type).toBe('NEGATIVE_SQRT');
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it('should validate negative base with fractional exponent locally', async () => {
      const { result } = renderHook(() => useCalculator());

      act(() => {
        result.current.setValueA('-2');
        result.current.setValueB('0.5');
        result.current.setOperation('^');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.error?.type).toBe('NEGATIVE_BASE_FRACTIONAL_EXPONENT');
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it('should allow negative base with integer exponent', async () => {
      const { result } = renderHook(() => useCalculator());

      mockCalculate.mockResolvedValue({
        success: true,
        data: { result: 8, operation: '^' },
      });

      act(() => {
        result.current.setValueA('-2');
        result.current.setValueB('3');
        result.current.setOperation('^');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(mockCalculate).toHaveBeenCalled();
    });
  });

  describe('Calculate functionality', () => {
    it('should call API with correct values', async () => {
      const { result } = renderHook(() => useCalculator());

      mockCalculate.mockResolvedValue({
        success: true,
        data: { result: 15, operation: '+' },
      });

      act(() => {
        result.current.setValueA('10');
        result.current.setValueB('5');
        result.current.setOperation('+');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(mockCalculate).toHaveBeenCalledWith({
        valueA: 10,
        valueB: 5,
        operation: '+',
      });
    });

    it('should set result on success', async () => {
      const { result } = renderHook(() => useCalculator());

      mockCalculate.mockResolvedValue({
        success: true,
        data: { result: 15, operation: '+' },
      });

      act(() => {
        result.current.setValueA('10');
        result.current.setValueB('5');
        result.current.setOperation('+');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.result).toBe(15);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failure', async () => {
      const { result } = renderHook(() => useCalculator());

      mockCalculate.mockResolvedValue({
        success: false,
        error: { type: 'DIVISION_BY_ZERO', message: 'Cannot divide by zero' },
      });

      act(() => {
        result.current.setValueA('10');
        result.current.setValueB('0');
        result.current.setOperation('/');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.result).toBeNull();
      expect(result.current.error?.type).toBe('DIVISION_BY_ZERO');
    });

    it('should manage loading state', async () => {
      const { result } = renderHook(() => useCalculator());

      mockCalculate.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: { result: 15, operation: '+' },
                }),
              10
            )
          )
      );

      act(() => {
        result.current.setValueA('10');
        result.current.setValueB('5');
        result.current.setOperation('+');
      });

      await act(async () => {
        await result.current.calculate();
      });

      expect(result.current.loading).toBe(false);
    });

  });

});
