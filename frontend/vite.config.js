import { defineConfig } from "vite";

export default defineConfig({
    server: {
        host: "localhost",
        port: 5173,
        strictPort: true,

        proxy: {
            "/api": {
                target: "https://api.hydrocontrol.site",
                changeOrigin: true,
                secure: false
            }
        }
    }
});
