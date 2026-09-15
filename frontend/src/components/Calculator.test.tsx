import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calculator } from './Calculator';
import * as hooks from '../hooks';

vi.mock('../hooks', () => ({
  useCalculator: vi.fn(),
}));

const mockUseCalculator = vi.mocked(hooks.useCalculator);

const createMockHook = (overrides = {}) => ({
  valueA: '',
  valueB: '',
  operation: '',
  loading: false,
  result: null,
  error: null,
  isUnaryOperation: false,
  setValueA: vi.fn(),
  setValueB: vi.fn(),
  setOperation: vi.fn(),
  calculate: vi.fn(),
  reset: vi.fn(),
  ...overrides,
});

describe('Calculator Component', () => {
  beforeEach(() => {
    mockUseCalculator.mockReturnValue(createMockHook());
  });

  describe('Rendering', () => {
    it('should render title and display areas', () => {
      render(<Calculator />);
      expect(screen.getByText('Calculator')).toBeInTheDocument();
      expect(screen.getByLabelText('First number input')).toBeInTheDocument();
    });

    it('should render all operation buttons', () => {
      render(<Calculator />);
      expect(screen.getByLabelText('Add')).toBeInTheDocument();
      expect(screen.getByLabelText('Subtract')).toBeInTheDocument();
      expect(screen.getByLabelText('Multiply')).toBeInTheDocument();
      expect(screen.getByLabelText('Divide')).toBeInTheDocument();
      expect(screen.getByLabelText('Percentage')).toBeInTheDocument();
      expect(screen.getByLabelText('Square Root')).toBeInTheDocument();
      expect(screen.getByLabelText('Power')).toBeInTheDocument();
    });

    it('should render numeric keypad 0-9', () => {
      render(<Calculator />);
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByLabelText(`Number ${i}`)).toBeInTheDocument();
      }
    });

    it('should render decimal, sign toggle, delete, and equals buttons', () => {
      render(<Calculator />);
      expect(screen.getByLabelText('Decimal point')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle sign (positive/negative)')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete last digit')).toBeInTheDocument();
      expect(screen.getByLabelText('Calculate result')).toBeInTheDocument();
      expect(screen.getByLabelText('Reset calculator')).toBeInTheDocument();
    });

    it('should show second number input for binary operations', () => {
      mockUseCalculator.mockReturnValue(createMockHook({ isUnaryOperation: false }));
      render(<Calculator />);
      expect(screen.getByLabelText('Second number input')).toBeInTheDocument();
    });

    it('should hide second number input for unary operations', () => {
      mockUseCalculator.mockReturnValue(createMockHook({ isUnaryOperation: true }));
      render(<Calculator />);
      expect(screen.queryByLabelText('Second number input')).not.toBeInTheDocument();
    });
  });

  describe('Numeric Input', () => {
    it('should call setValueA when clicking number and field A is active', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '' }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Number 5'));
      expect(setValueA).toHaveBeenCalledWith('5');
    });

    it('should call setValueB when field B is active', () => {
      const setValueB = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueB, valueB: '' }));
      render(<Calculator />);

      const fieldB = screen.getByLabelText('Second number input');
      fireEvent.click(fieldB);
      fireEvent.click(screen.getByLabelText('Number 3'));
      expect(setValueB).toHaveBeenCalledWith('3');
    });

    it('should append decimal point to active field', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '5' }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Decimal point'));
      expect(setValueA).toHaveBeenCalledWith('5.');
    });

    it('should not add decimal if already present', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '5.5' }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Decimal point'));
      expect(setValueA).not.toHaveBeenCalled();
    });
  });

  describe('Sign Toggle', () => {
    it('should toggle sign on active field', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '5' }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Toggle sign (positive/negative)'));
      expect(setValueA).toHaveBeenCalledWith('-5');
    });

    it('should remove negative sign if already present', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '-5' }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Toggle sign (positive/negative)'));
      expect(setValueA).toHaveBeenCalledWith('5');
    });

    it('should not toggle sign on empty field', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '' }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Toggle sign (positive/negative)'));
      expect(setValueA).not.toHaveBeenCalled();
    });
  });

  describe('Delete Button', () => {
    it('should delete last digit from active field', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '123' }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Delete last digit'));
      expect(setValueA).toHaveBeenCalledWith('12');
    });
  });

  describe('Operation Selection', () => {
    it('should set operation when operation button is clicked', () => {
      const setOperation = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setOperation }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Add'));
      expect(setOperation).toHaveBeenCalledWith('+');
    });

    it('should switch to field B after selecting binary operation', () => {
      const setOperation = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setOperation }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Add'));
      expect(setOperation).toHaveBeenCalled();
    });

    it('should keep field A for unary operation', () => {
      const setOperation = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setOperation }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Square Root'));
      expect(setOperation).toHaveBeenCalledWith('sqrt');
    });
  });

  describe('Calculation', () => {
    it('should call calculate when equals button is clicked', () => {
      const calculate = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ calculate }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Calculate result'));
      expect(calculate).toHaveBeenCalled();
    });

    it('should show result when available', () => {
      mockUseCalculator.mockReturnValue(
        createMockHook({ result: 15, error: null })
      );
      render(<Calculator />);

      expect(screen.getByText('Result:')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should show error message when error exists', () => {
      mockUseCalculator.mockReturnValue(
        createMockHook({
          result: null,
          error: { type: 'DIVISION_BY_ZERO', message: 'Cannot divide by zero' },
        })
      );
      render(<Calculator />);

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Cannot divide by zero')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should show idle state when no result and no error', () => {
      mockUseCalculator.mockReturnValue(
        createMockHook({ result: null, error: null })
      );
      render(<Calculator />);

      expect(screen.getByText('Result:')).toBeInTheDocument();
    });
  });

  describe('Reset', () => {
    it('should call reset when reset button is clicked', () => {
      const reset = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ reset }));
      render(<Calculator />);

      fireEvent.click(screen.getByLabelText('Reset calculator'));
      expect(reset).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable all buttons when loading', () => {
      mockUseCalculator.mockReturnValue(createMockHook({ loading: true }));
      render(<Calculator />);

      expect(screen.getByLabelText('Calculate result')).toBeDisabled();
      expect(screen.getByLabelText('Number 5')).toBeDisabled();
      expect(screen.getByLabelText('Add')).toBeDisabled();
      expect(screen.getByLabelText('Reset calculator')).toBeDisabled();
    });

    it('should show hourglass emoji when loading', () => {
      mockUseCalculator.mockReturnValue(createMockHook({ loading: true }));
      render(<Calculator />);

      expect(screen.getByLabelText('Calculate result')).toHaveTextContent('⏳');
    });

    it('should disable inputs when loading', () => {
      mockUseCalculator.mockReturnValue(createMockHook({ loading: true }));
      render(<Calculator />);

      expect(screen.getByLabelText('First number input')).toBeDisabled();
      expect(screen.getByLabelText('Second number input')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all buttons', () => {
      render(<Calculator />);

      expect(screen.getByLabelText('Add')).toHaveAttribute('aria-label');
      expect(screen.getByLabelText('Multiply')).toHaveAttribute('aria-label');
      expect(screen.getByLabelText('Divide')).toHaveAttribute('aria-label');
    });

    it('should have aria-busy on equals button during loading', () => {
      mockUseCalculator.mockReturnValue(createMockHook({ loading: true }));
      render(<Calculator />);

      expect(screen.getByLabelText('Calculate result')).toHaveAttribute(
        'aria-busy',
        'true'
      );
    });

    it('should have role="alert" on error container', () => {
      mockUseCalculator.mockReturnValue(
        createMockHook({
          error: { type: 'INVALID_INPUT', message: 'Invalid input' },
        })
      );
      render(<Calculator />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have role="status" on result container', () => {
      mockUseCalculator.mockReturnValue(createMockHook({ result: 42 }));
      render(<Calculator />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Keyboard Input', () => {
    it('should handle number keys from physical keyboard', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '' }));
      render(<Calculator />);

      fireEvent.keyDown(window, { key: '5' });
      expect(setValueA).toHaveBeenCalledWith('5');
    });

    it('should handle Enter key to calculate', () => {
      const calculate = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ calculate }));
      render(<Calculator />);

      fireEvent.keyDown(window, { key: 'Enter' });
      expect(calculate).toHaveBeenCalled();
    });

    it('should handle Backspace to delete', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '123' }));
      render(<Calculator />);

      fireEvent.keyDown(window, { key: 'Backspace' });
      expect(setValueA).toHaveBeenCalledWith('12');
    });

    it('should handle decimal point key', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(createMockHook({ setValueA, valueA: '' }));
      render(<Calculator />);

      fireEvent.keyDown(window, { key: '.' });
      expect(setValueA).toHaveBeenCalledWith('0.');
    });

    it('should not process keyboard when loading', () => {
      const setValueA = vi.fn();
      mockUseCalculator.mockReturnValue(
        createMockHook({ setValueA, valueA: '', loading: true })
      );
      render(<Calculator />);

      fireEvent.keyDown(window, { key: '5' });
      expect(setValueA).not.toHaveBeenCalled();
    });
  });
});
