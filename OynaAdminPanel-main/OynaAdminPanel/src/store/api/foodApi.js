import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from './baseQuery';

export const foodApi = createApi({
  reducerPath: 'foodApi',
  baseQuery: createBaseQuery('/foods'),
  tagTypes: ['Foods'],
  endpoints: (builder) => ({
    getFoods: builder.query({
      query: () => '/',
      providesTags: (result) => [
        'Foods',
        ...(Array.isArray(result) ? result.map((food) => ({ type: 'Foods', id: food._id })) : []),
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
