import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const foodApi = createApi({
  reducerPath: 'foodApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/foods`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Foods'],
  endpoints: (builder) => ({
    getFoods: builder.query({
      query: () => '/',
      providesTags: (result = []) => [
        'Foods',
        ...result.map((food) => ({ type: 'Foods', id: food._id })),
      ],
    }),

    getFoodById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Foods', id }],
    }),

    createFood: builder.mutation({
      query: (foodData) => ({
        url: '/',
        method: 'POST',
        body: foodData,
      }),
      invalidatesTags: ['Foods'],
    }),

    updateFood: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Foods', id }, 'Foods'],
    }),

    deleteFood: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Foods'],
    }),
  }),
});

export const {
  useGetFoodsQuery,
  useGetFoodByIdQuery,
  useCreateFoodMutation,
  useUpdateFoodMutation,
  useDeleteFoodMutation,
} = foodApi;
