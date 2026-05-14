import { api } from './client';

export const uploadApi = {
  uploadAudio: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ audio_url: string }>('/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
