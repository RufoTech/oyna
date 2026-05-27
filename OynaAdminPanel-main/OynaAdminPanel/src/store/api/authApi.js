import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from './baseQuery';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: createBaseQuery('/auth'),
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
      transformResponse: (response) => {
        if (!Array.isArray(response)) return response;
        return response.map((admin) => ({
          ...admin,
          createdAt: admin.createdAt 
            ? new Date(admin.createdAt).toLocaleDateString('az-AZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
            : '-',
        }));
      },
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
