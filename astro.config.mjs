import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Astro 7 defaults this to 'jsx', which strips whitespace between inline
  // elements and swallows the space in markup like `Website: <a>...</a>`.
  // `true` keeps Astro 4's whitespace handling.
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()]
  }
});
