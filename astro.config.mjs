import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'http://kawai.onamaeweb.jp',
  base: '/lab/member/2109',
  integrations: [mdx(), sitemap(), react(), tailwind()],
  markdown: {
    drafts: true,
  },
});
