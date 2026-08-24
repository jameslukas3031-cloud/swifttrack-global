// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// On Netlify (NETLIFY=true is set by their build image) pin the Nitro netlify preset
// so the SSR handler is emitted as a Netlify function. Everywhere else the default
// Lovable/Cloudflare target is used unchanged.
const isNetlify = process.env.NETLIFY === "true" || process.env.NITRO_PRESET === "netlify";

export default defineConfig({
  ...(isNetlify ? { nitro: { preset: "netlify" } as const } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
