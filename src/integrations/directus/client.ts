import { createDirectus, rest, authentication } from '@directus/sdk';

// Directus client configuration
// The URL and token will be used from edge functions for admin operations
// Client-side will use public REST API with authentication

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || '';

// Create the Directus client with REST and authentication
export const directus = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(authentication('json'));

// Helper to check if Directus is configured
export const isDirectusConfigured = () => {
  return !!DIRECTUS_URL && DIRECTUS_URL.length > 0;
};
