import { createDirectus, authentication, rest, readMe } from '@directus/sdk';

// Use environment variable for Directus URL, fallback to localhost for development
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

// Create Directus client with authentication and REST capabilities
const directus = createDirectus(DIRECTUS_URL)
  .with(authentication('json'))
  .with(rest());

export { directus, readMe };
export default directus;
