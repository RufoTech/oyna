import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from './baseQuery';

const venuesBaseQuery = createBaseQuery('/venues');

// Memory cache to track which venues lack the dedicated /layout endpoint,
// avoiding duplicate 404 network requests and fallback API calls.
const missingLayoutVenues = new Set();

const isMissingLayoutEndpoint = (result) => {
  const message = result?.error?.data?.message;
  return (
    result?.error?.status === 404 &&
    (typeof message !== 'string' || message.includes('/layout') || message.includes('Cannot'))
  );
};

export const venuesApi = createApi({
  reducerPath: 'venuesApi',
  baseQuery: venuesBaseQuery,
  tagTypes: ['Venues', 'Branches', 'Specs', 'BlockedUsers', 'Layout'],
  endpoints: (builder) => ({
    // GET /venues
    getVenues: builder.query({
      query: () => '',
      providesTags: ['Venues'],
    }),

    // GET /venues/shared/branches
    getBranches: builder.query({
      query: () => '/shared/branches',
      providesTags: ['Branches'],
    }),

    // GET /venues/:id
    getVenueById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Venues', id }],
    }),

    // POST /venues — step 1 initial creation
    createVenue: builder.mutation({
      query: (venueData) => ({
        url: '/',
        method: 'POST',
        body: venueData,
      }),
      invalidatesTags: ['Venues'],
    }),

    // PATCH /venues/:id — step 2 & 3 updates
    updateVenue: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Venues', id }, 'Venues'],
    }),

    // DELETE /venues/:id
    deleteVenue: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Venues'],
    }),

    // ═══════════════════════════════════════════════
    // BLOCKED USERS ENDPOINTS
    // ═══════════════════════════════════════════════

    // GET /venues/:id/blocked-users
    getBlockedUsers: builder.query({
      query: (venueId) => `/${venueId}/blocked-users`,
      providesTags: (result, error, venueId) => [{ type: 'BlockedUsers', id: venueId }],
    }),

    // PATCH /venues/:id/block-user
    blockUserForVenue: builder.mutation({
      query: ({ venueId, email, action }) => ({
        url: `/${venueId}/block-user`,
        method: 'PATCH',
        body: { email, action },
      }),
      invalidatesTags: (result, error, { venueId }) => [{ type: 'BlockedUsers', id: venueId }],
    }),

    // ═══════════════════════════════════════════════
    // SPECS ENDPOINTS (Step 4 — Tiers & Packages)
    // ═══════════════════════════════════════════════

    // GET /venues/:id/specs — Fetch specs for a venue
    getVenueSpecs: builder.query({
      query: (venueId) => `/${venueId}/specs`,
      providesTags: (result, error, venueId) => [{ type: 'Specs', id: venueId }],
    }),

    // PATCH /venues/:id/specs — Save/Update specs
    updateVenueSpecs: builder.mutation({
      query: ({ venueId, specs }) => ({
        url: `/${venueId}/specs`,
        method: 'PATCH',
        body: specs,
      }),
      invalidatesTags: (result, error, { venueId }) => [
        { type: 'Specs', id: venueId },
        { type: 'Venues', id: venueId },
      ],
    }),

    // ═══════════════════════════════════════════════
    // LAYOUT ENDPOINTS (Simulation / Floor-plan)
    // ═══════════════════════════════════════════════

    // GET /venues/:id/layout
    getVenueLayout: builder.query({
      async queryFn(venueId, api, extraOptions) {
        if (missingLayoutVenues.has(venueId)) {
          const venueResult = await venuesBaseQuery(`/${venueId}`, api, extraOptions);
          if (venueResult.error) return venueResult;
          return { data: venueResult.data?.layout || { items: [] } };
        }

        const layoutResult = await venuesBaseQuery(`/${venueId}/layout`, api, extraOptions);
        if (!isMissingLayoutEndpoint(layoutResult)) return layoutResult;

        missingLayoutVenues.add(venueId);

        const venueResult = await venuesBaseQuery(`/${venueId}`, api, extraOptions);
        if (venueResult.error) return venueResult;
        return { data: venueResult.data?.layout || { items: [] } };
      },
      providesTags: (result, error, venueId) => [{ type: 'Layout', id: venueId }],
    }),

    // PATCH /venues/:id/layout
    updateVenueLayout: builder.mutation({
      async queryFn({ venueId, layout }, api, extraOptions) {
        if (missingLayoutVenues.has(venueId)) {
          const venueResult = await venuesBaseQuery(
            {
              url: `/${venueId}`,
              method: 'PATCH',
              body: { layout },
            },
            api,
            extraOptions
          );
          if (venueResult.error) return venueResult;
          return { data: venueResult.data?.layout || layout };
        }

        const layoutResult = await venuesBaseQuery(
          {
            url: `/${venueId}/layout`,
            method: 'PATCH',
            body: layout,
          },
          api,
          extraOptions
        );

        if (!isMissingLayoutEndpoint(layoutResult)) return layoutResult;

        missingLayoutVenues.add(venueId);

        const venueResult = await venuesBaseQuery(
          {
            url: `/${venueId}`,
            method: 'PATCH',
            body: { layout },
          },
          api,
          extraOptions
        );

        if (venueResult.error) return venueResult;
        return { data: venueResult.data?.layout || layout };
      },
      invalidatesTags: (result, error, { venueId }) => [
        { type: 'Layout', id: venueId },
      ],
    }),
  }),
});

export const {
  useGetVenuesQuery,
  useGetBranchesQuery,
  useGetVenueByIdQuery,
  useCreateVenueMutation,
  useUpdateVenueMutation,
  useDeleteVenueMutation,
  // Specs hooks
  useGetVenueSpecsQuery,
  useUpdateVenueSpecsMutation,
  // Blocked users hooks
  useGetBlockedUsersQuery,
  useBlockUserForVenueMutation,
  // Layout hooks
  useGetVenueLayoutQuery,
  useUpdateVenueLayoutMutation,
} = venuesApi;
