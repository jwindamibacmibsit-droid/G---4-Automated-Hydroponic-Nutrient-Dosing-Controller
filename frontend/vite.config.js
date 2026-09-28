import { defineConfig } from "vite";

export default defineConfig({
    server: {
        host: "localhost",
        port: 5173,
        strictPort: true,

        proxy: {
            "/api": {
                target: "https://backend-pi-three-53.vercel.app",
                changeOrigin: true,
                secure: false
            }
        }
    }
});
