import api from './api';
import type { AuthStatus } from './api';

const authService = {
  /**
   * Validate email on Google Spreadsheet team config registry.
   * Calls endpoint /auth/login (mapped to getAuthStatus action in GET request).
   */
  validateUser: async (email: string): Promise<AuthStatus> => {
    try {
      const responseData = await api.get<AuthStatus>('getAuthStatus', { email });
      return responseData;
    } catch (err) {
      console.error("Auth validation service failure: ", err);
      throw err;
    }
  }
};

export default authService;
