import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Preserve inline spacing from Astro 5 instead of Astro 7's JSX whitespace rules.
  compressHTML: true,
});
