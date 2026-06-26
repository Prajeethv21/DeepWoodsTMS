import api from './api';
import type { EmailThread, EmailMessage } from './api';

const emailService = {
  /**
   * Fetch Gmail threads matching the user's criteria (assigned tasks or inbox for admin).
   */
  getEmailThreads: async (email: string): Promise<EmailThread[]> => {
    try {
      return await api.get<EmailThread[]>('getEmailThreads', { email });
    } catch (err) {
      console.error("Failed to fetch email threads: ", err);
      throw err;
    }
  },

  /**
   * Fetch all messages in a specific thread after confirming authorization.
   */
  getThreadMessages: async (threadId: string, email: string): Promise<EmailMessage[]> => {
    try {
      return await api.get<EmailMessage[]>('getThreadMessages', { threadId, email });
    } catch (err) {
      console.error("Failed to fetch thread messages: ", err);
      throw err;
    }
  },

  /**
   * Reply to an email thread.
   */
  replyToThread: async (threadId: string, body: string, email: string): Promise<{ success: boolean; message: string }> => {
    try {
      return await api.post<{ success: boolean; message: string }>('replyToThread', {
        threadId,
        body,
        email
      });
    } catch (err) {
      console.error("Failed to send reply to thread: ", err);
      throw err;
    }
  }
};

export default emailService;
