/**
 * API Request Validation Schemas
 * 
 * Zod schemas for common API request patterns:
 * - Pagination
 * - Filtering
 * - Sorting
 * - Search
 */

import { z } from 'zod';

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

/**
 * Sort order validation
 */
export const sortOrderSchema = z.enum(['asc', 'desc']);

/**
 * Sort field validation
 * Generic sort schema - specific fields validated per endpoint
 */
export const sortSchema = z.object({
  field: z.string().min(1, 'Sort field is required'),
  order: sortOrderSchema.default('asc'),
});

/**
 * Date range filter schema
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
  }
);

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be 200 characters or less')
    .trim(),
});

/**
 * Generic filter schema
 * For key-value filtering
 */
export const filterSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
  ])
);

/**
 * Combined pagination and sort schema
 */
export const paginationSortSchema = paginationSchema.extend({
  sort: sortSchema.optional(),
});

/**
 * Combined pagination, sort, and filter schema
 */
export const paginationSortFilterSchema = paginationSortSchema.extend({
  filters: filterSchema.optional(),
});

/**
 * Combined pagination, sort, filter, and search schema
 */
export const paginationSortFilterSearchSchema = paginationSortFilterSchema.extend({
  search: searchQuerySchema.optional(),
});

/**
 * ID parameter validation (for route parameters)
 */
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

/**
 * Multiple IDs validation (for bulk operations)
 */
export const idsParamSchema = z.object({
  ids: z.array(z.string().min(1, 'ID is required')).min(1, 'At least one ID is required').max(100, 'Cannot process more than 100 IDs at once'),
});

/**
 * Type exports for TypeScript inference
 */
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortInput = z.infer<typeof sortSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type FilterInput = z.infer<typeof filterSchema>;
export type PaginationSortInput = z.infer<typeof paginationSortSchema>;
export type PaginationSortFilterInput = z.infer<typeof paginationSortFilterSchema>;
export type PaginationSortFilterSearchInput = z.infer<typeof paginationSortFilterSearchSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type IdsParamInput = z.infer<typeof idsParamSchema>;
