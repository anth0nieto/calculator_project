import { useState, useCallback, useRef } from 'react';
import { CalculatorApiClient, type Operation } from '../api';
import { validateCalculatorInput, type ValidationError } from './validation';

interface UseCalculatorState {
  valueA: string;
  valueB: string;
  operation: Operation | '';
  loading: boolean;
  result: number | null;
  error: ValidationError | null;
}

const UNARY_OPERATIONS: Operation[] = ['sqrt'];

export function useCalculator() {
  const [state, setState] = useState<UseCalculatorState>({
    valueA: '',
    valueB: '',
    operation: '',
    loading: false,
    result: null,
    error: null,
  });

  const requestIdRef = useRef(0);

  const isSqrt = state.operation === 'sqrt';
  const isUnaryOperation = UNARY_OPERATIONS.includes(state.operation as Operation);


  const setValueA = useCallback((value: string) => {
    setState((prev) => ({ ...prev, valueA: value }));
  }, []);

  const setValueB = useCallback((value: string) => {
    setState((prev) => ({ ...prev, valueB: value }));
  }, []);

  const setOperation = useCallback((operation: Operation | '') => {
    setState((prev) => ({ ...prev, operation }));
  }, []);

  const reset = useCallback(() => {
    setState({
      valueA: '',
      valueB: '',
      operation: '',
      loading: false,
      result: null,
      error: null,
    });
  }, []);

  const calculate = useCallback(async () => {
    // Validate inputs
    const validation = validateCalculatorInput(
      state.valueA,
      state.valueB,
      state.operation,
      isUnaryOperation
    );

    if (!validation.isValid) {
      setState((prev) => ({
        ...prev,
        error: validation.error ?? null,
      }));
      return;
    }

    // Clear previous result and error
    setState((prev) => ({
      ...prev,
      loading: true,
      result: null,
      error: null,
    }));

    // Track this request to prevent race conditions
    const currentRequestId = ++requestIdRef.current;

    const valueA = Number(state.valueA);
    const valueB = isUnaryOperation ? 0 : Number(state.valueB);

    const result = await CalculatorApiClient.calculate({
      valueA,
      valueB,
      operation: state.operation as Operation,
    });

    // Only update state if this is the latest request
    if (currentRequestId !== requestIdRef.current) {
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      result: result.success ? result.data.result : null,
      error: result.success
        ? null
        : {
            type: result.error.type,
            message: result.error.message,
          },
    }));
  }, [state.valueA, state.valueB, state.operation, isUnaryOperation]);

  return {
    // State
    valueA: state.valueA,
    valueB: state.valueB,
    operation: state.operation,
    loading: state.loading,
    result: state.result,
    error: state.error,
    // Computed
    isUnaryOperation,
    isSqrt,
    // Actions
    setValueA,
    setValueB,
    setOperation,
    calculate,
    reset,
  };
}
