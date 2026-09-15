import { useState, useCallback, useEffect, useRef } from 'react';
import { useCalculator } from '../hooks';
import type { Operation } from '../api';
import styles from './Calculator.module.css';

type ActiveField = 'a' | 'b';

const OPERATIONS: { label: string; symbol: string; value: Operation }[] = [
  { label: 'Add', symbol: '+', value: '+' },
  { label: 'Subtract', symbol: '−', value: '-' },
  { label: 'Multiply', symbol: '×', value: '*' },
  { label: 'Divide', symbol: '÷', value: '/' },
  { label: 'Percentage', symbol: '%', value: '%' },
  { label: 'Square Root', symbol: '√', value: 'sqrt' },
  { label: 'Power', symbol: '^', value: '^' },
];

const KEYPAD_NUMBERS = [
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '0', value: '0' },
];

export function Calculator() {
  const {
    valueA,
    valueB,
    operation,
    loading,
    result,
    error,
    isUnaryOperation,
    setValueA,
    setValueB,
    setOperation,
    calculate,
    reset,
  } = useCalculator();

  const [activeField, setActiveField] = useState<ActiveField>('a');
  const inputARef = useRef<HTMLInputElement>(null);

  const appendDigit = useCallback(
    (digit: string) => {
      if (activeField === 'a') {
        setValueA(valueA + digit);
      } else {
        setValueB(valueB + digit);
      }
    },
    [activeField, valueA, valueB, setValueA, setValueB]
  );

  const handleDecimal = useCallback(() => {
    if (activeField === 'a') {
      if (!valueA.includes('.')) {
        setValueA(valueA ? valueA + '.' : '0.');
      }
    } else {
      if (!valueB.includes('.')) {
        setValueB(valueB ? valueB + '.' : '0.');
      }
    }
  }, [activeField, valueA, valueB, setValueA, setValueB]);

  const handleDelete = useCallback(() => {
    if (activeField === 'a') {
      setValueA(valueA.slice(0, -1));
    } else {
      setValueB(valueB.slice(0, -1));
    }
  }, [activeField, valueA, valueB, setValueA, setValueB]);

  const handleToggleSign = useCallback(() => {
    if (activeField === 'a') {
      if (valueA) {
        if (valueA.startsWith('-')) {
          setValueA(valueA.slice(1));
        } else {
          setValueA('-' + valueA);
        }
      }
    } else {
      if (valueB) {
        if (valueB.startsWith('-')) {
          setValueB(valueB.slice(1));
        } else {
          setValueB('-' + valueB);
        }
      }
    }
  }, [activeField, valueA, valueB, setValueA, setValueB]);

  const handleOperationClick = useCallback(
    (op: Operation) => {
      if (!loading) {
        setOperation(op);
        if (op === 'sqrt') {
          setActiveField('a');
        } else {
          setActiveField('b');
        }
      }
    },
    [loading, setOperation]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (loading) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        appendDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculate();
      } else if (e.key === '+' || e.key === '-') {
        e.preventDefault();
        handleOperationClick(e.key as Operation);
      } else if (e.key === '*') {
        e.preventDefault();
        handleOperationClick('*' as Operation);
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperationClick('/' as Operation);
      }
    },
    [loading, appendDigit, handleDecimal, handleDelete, calculate, handleOperationClick]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    inputARef.current?.focus();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Calculator</h1>
        {/* Display Area */}
        <div className={styles.displayArea}>
          {/* Row A: Field A + Operation Display */}
          <div className={styles.rowA}>
            <div className={styles.fieldGroup}>
              <label htmlFor="valueA" className={styles.label}>
                First Number
              </label>
              <input
                ref={inputARef}
                id="valueA"
                type="text"
                value={valueA}
                onChange={(e) => setValueA(e.target.value.replace(/[^0-9.-]/g, ''))}
                onClick={() => setActiveField('a')}
                onFocus={() => setActiveField('a')}
                disabled={loading}
                placeholder="0"
                aria-label="First number input"
                className={`${styles.input} ${activeField === 'a' ? styles.inputActive : ''}`}
              />
            </div>

            {/* Operation Display (only show if operation selected) */}
            {operation && (
              <div className={styles.operationDisplay}>
                {OPERATIONS.find((op) => op.value === operation)?.symbol || operation}
              </div>
            )}
          </div>

          {/* Row B: Field B (hidden for unary operations) */}
          {!isUnaryOperation && (
            <div className={styles.fieldGroup}>
              <label htmlFor="valueB" className={styles.label}>
                Second Number
              </label>
              <input
                id="valueB"
                type="text"
                value={valueB}
                onChange={(e) => setValueB(e.target.value.replace(/[^0-9.-]/g, ''))}
                onClick={() => setActiveField('b')}
                onFocus={() => setActiveField('b')}
                disabled={loading}
                placeholder="0"
                aria-label="Second number input"
                className={`${styles.input} ${activeField === 'b' ? styles.inputActive : ''}`}
              />
            </div>
          )}

          {/* Result Display - Top */}
          {!error && (
            <div className={styles.resultContainer} role="status">
              <div className={styles.resultLabel}>Result:</div>
              <div className={styles.resultValue}>{result}</div>
            </div>
          )}

          {/* Error Display - Top */}
          {error && (
            <div className={styles.errorContainer} role="alert">
              <div className={styles.errorLabel}>Error:</div>
              <div className={styles.errorMessage}>{error.message}</div>
            </div>
          )}
        </div>

        {/* Operation Buttons */}
        <div className={styles.operationButtons}>
          {OPERATIONS.map((op) => (
            <button
              key={op.value}
              onClick={() => handleOperationClick(op.value)}
              disabled={loading}
              aria-label={op.label}
              className={`${styles.opButton} ${operation === op.value ? styles.opButtonActive : ''}`}
              title={op.label}
            >
              {op.symbol}
            </button>
          ))}
        </div>

        {/* Numeric Keypad */}
        <div className={styles.keypad}>
          {KEYPAD_NUMBERS.map((num) => (
            <button
              key={num.value}
              onClick={() => appendDigit(num.value)}
              disabled={loading}
              aria-label={`Number ${num.label}`}
              className={styles.keyButton}
            >
              {num.label}
            </button>
          ))}
          {/* Decimal Button */}
          <button
            onClick={handleDecimal}
            disabled={loading}
            aria-label="Decimal point"
            className={styles.keyButton}
          >
            .
          </button>
          {/* Toggle Sign Button */}
          <button
            onClick={handleToggleSign}
            disabled={loading}
            aria-label="Toggle sign (positive/negative)"
            className={styles.keyButton}
            title="Toggle sign"
          >
            +/−
          </button>
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={loading}
            aria-label="Delete last digit"
            className={`${styles.keyButton} ${styles.deleteButton}`}
          >
            ⌫
          </button>
          {/* Equals Button */}
          <button
            onClick={calculate}
            disabled={loading}
            aria-label="Calculate result"
            className={`${styles.keyButton} ${styles.equalsButton}`}
            aria-busy={loading}
          >
            {loading ? '⏳' : '='}
          </button>
        </div>

        {/* Reset Button */}
        <button
          onClick={reset}
          disabled={loading}
          aria-label="Reset calculator"
          className={styles.resetButton}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
