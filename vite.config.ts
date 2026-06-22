import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (SSR error wrapper).
      server: { entry: "src/server" },
    }),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
