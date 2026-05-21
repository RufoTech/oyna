import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/auth`,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');

      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: ['Admins'],
  endpoints: (builder) => ({
    loginAdmin: builder.mutation({
      query: (credentials) => ({
        url: '/login/admin',
        method: 'POST',
        body: credentials,
      }),
    }),
    loginSuperAdmin: builder.mutation({
      query: (credentials) => ({
        url: '/login/super-admin',
        method: 'POST',
        body: credentials,
      }),
    }),
    getAdmins: builder.query({
      query: () => '/admins',
      providesTags: ['Admins'],
    }),
    createAdmin: builder.mutation({
      query: (body) => ({
        url: '/admins',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Admins'],
    }),
    deleteAdmin: builder.mutation({
      query: (id) => ({
        url: `/admins/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Admins'],
    }),
    resetPassword: builder.mutation({
      query: ({ id, password }) => ({
        url: `/admins/${id}/password`,
        method: 'PATCH',
        body: { password },
      }),
      invalidatesTags: ['Admins'],
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: '/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    verifyResetCode: builder.mutation({
      query: (body) => ({
        url: '/verify-reset-code',
        method: 'POST',
        body,
      }),
    }),
    resetPasswordWithCode: builder.mutation({
      query: (body) => ({
        url: '/reset-password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginAdminMutation,
  useLoginSuperAdminMutation,
  useGetAdminsQuery,
  useCreateAdminMutation,
  useDeleteAdminMutation,
  useResetPasswordMutation,
  useForgotPasswordMutation,
  useVerifyResetCodeMutation,
  useResetPasswordWithCodeMutation,
} = authApi;
