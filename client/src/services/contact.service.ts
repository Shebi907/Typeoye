import api, { getApiErrorMessage } from './api';

export type ContactTopic = 'General question' | 'Bug report' | 'Feature request' | 'Account issue' | 'Other';

export interface ContactFormData {
  name: string;
  email: string;
  topic: ContactTopic | '';
  message: string;
}

interface ContactResponse {
  deliveredBy: 'email' | 'db';
  message: string;
}

export const contactService = {
  async submit(data: ContactFormData): Promise<ContactResponse> {
    try {
      const { data: res } = await api.post('/contact/messages', {
        name: data.name,
        email: data.email,
        topic: data.topic || 'General question',
        message: data.message,
      });
      return (res.data as ContactResponse);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  },
};
