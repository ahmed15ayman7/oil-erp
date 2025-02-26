'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

interface ApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useApi() {
  const [loading, setLoading] = useState(false);

  const fetchApi = async (
    url: string,
    options?: RequestInit & ApiOptions
  ) => {
    const {
      onSuccess,
      onError,
      successMessage,
      errorMessage,
      ...fetchOptions
    } = options || {};

    try {
      setLoading(true);
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (successMessage) {
        toast.success(successMessage);
      }

      onSuccess?.(data);
      return data;
    } catch (error: any) {
      const message = errorMessage || error.message;
      toast.error(message);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    get: (url: string, options?: ApiOptions) =>
      fetchApi(url, { method: 'GET', ...options }),
    post: (url: string, data: any, options?: ApiOptions) =>
      fetchApi(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      }),
    put: (url: string, data: any, options?: ApiOptions) =>
      fetchApi(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      }),
    delete: (url: string, options?: ApiOptions) =>
      fetchApi(url, { method: 'DELETE', ...options }),
    patch: (url: string, data: any, options?: ApiOptions) =>
      fetchApi(url, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options,
      }),
  };
}
