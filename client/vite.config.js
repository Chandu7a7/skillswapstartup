import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This will now correctly forward requests like /auth/signup to your backend
      "/api": {
        target: "https://skillswapstartup.onrender.com",
        changeOrigin: true,
      },
    },
  },
});