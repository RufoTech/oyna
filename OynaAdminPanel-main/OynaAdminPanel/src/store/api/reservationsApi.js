import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const reservationsApi = createApi({
  reducerPath: 'reservationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Reservation'],
  endpoints: (builder) => ({
    getReservations: builder.query({
      query: ({ page = 1, limit = 10, search = '' } = {}) => {
        let url = `/reservations?page=${page}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: ['Reservation'],
    }),
    getReservationsByVenue: builder.query({
      query: (venueId) => `/reservations?page=1&limit=100&venueId=${venueId}`,
      providesTags: ['Reservation'],
    }),
    updateReservationStatus: builder.mutation({
      query: ({ id, status, rejectReason }) => ({
        url: `/reservations/${id}/status`,
        method: 'PATCH',
        body: { status, rejectReason },
      }),
      // Invalidate tags so the list automatically refetches
      invalidatesTags: ['Reservation'],
    }),
    exportReservations: builder.query({
      query: ({ period = '1m' }) => `/reservations/export?period=${period}`,
    }),
    checkInReservation: builder.mutation({
      query: ({ reservationNumber, venueId }) => ({
        url: `/reservations/check-in`,
        method: 'PATCH',
        body: { reservationNumber, venueId },
      }),
      invalidatesTags: ['Reservation'],
    }),
  }),
});

export const {
  useGetReservationsQuery,
  useGetReservationsByVenueQuery,
  useUpdateReservationStatusMutation,
  useLazyExportReservationsQuery,
  useCheckInReservationMutation,
} = reservationsApi;
