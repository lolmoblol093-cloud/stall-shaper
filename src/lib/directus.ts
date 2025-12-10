import { createDirectus, authentication, rest, readMe } from '@directus/sdk';

const DIRECTUS_URL = 'http://localhost:8055';

// Create Directus client with authentication and REST capabilities
const directus = createDirectus(DIRECTUS_URL)
  .with(authentication('json'))
  .with(rest());

export { directus, readMe };
export default directus;
