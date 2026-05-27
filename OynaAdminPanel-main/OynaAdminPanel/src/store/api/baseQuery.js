import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Creates a configured fetchBaseQuery instance with standard headers.
 * Ensures consistent, CamelCase 'Authorization' and 'Content-Type' headers.
 * 
 * @param {string} subPath - Optional path suffix (e.g. '/auth', '/foods')
 */
export const createBaseQuery = (subPath = '') => {
  const baseUrl = subPath 
    ? `${import.meta.env.VITE_API_URL}${subPath}`
    : import.meta.env.VITE_API_URL;

  return fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  });
};
