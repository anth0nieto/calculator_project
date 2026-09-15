import type {
  CalculatorRequest,
  CalculatorResponse,
  ErrorResponse,
  ApiResult,
} from './types';
import { mapErrorMessage } from './errorMapper';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export class CalculatorApiClient {
  static async calculate(request: CalculatorRequest): Promise<ApiResult<CalculatorResponse>> {
    try {
      const response = await fetch(`${API_URL}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // 200 OK
      if (response.status === 200) {
        const data = await response.json() as CalculatorResponse;
        return {
          success: true,
          data,
        };
      }

      // 400 Bad Request, 422 Unprocessable Entity
      if (response.status === 400 || response.status === 422) {
        const errorData = await response.json() as ErrorResponse;
        const { type, userMessage } = mapErrorMessage(errorData.error);
        return {
          success: false,
          error: {
            type,
            message: userMessage,
          },
        };
      }

      // Other status codes
      return {
        success: false,
        error: {
          type: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      };
    } catch {
      return {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          message: 'Unable to connect to the server',
        },
      };
    }
  }
}
