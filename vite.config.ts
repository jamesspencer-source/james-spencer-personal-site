import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/james-spencer-personal-site/" : "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor-react";
          }

          if (id.includes("node_modules/gsap")) {
            return "vendor-gsap";
          }

          if (
            id.includes("node_modules/d3-geo") ||
            id.includes("node_modules/topojson-client") ||
            id.includes("node_modules/us-atlas") ||
            id.includes("node_modules/world-atlas")
          ) {
            return "vendor-geo";
          }

          if (id.includes("node_modules/three")) {
            return "vendor-three";
          }

          if (
            id.includes("src/components/RolesVisualStage") ||
            id.includes("src/components/LabBuildingsScene")
          ) {
            return "roles-visuals";
          }
        }
      }
    }
  }
}));
