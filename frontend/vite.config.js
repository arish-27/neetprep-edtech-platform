import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, "");
    const backendOrigin = (env.VITE_BACKEND_ORIGIN || "http://127.0.0.1:8001").replace(/\/+$/, "");
    return {
        plugins: [
            react(),
            // Custom plugin to handle SPA routing
            {
                name: 'spa-fallback',
                configureServer(server) {
                    server.middlewares.use((req, res, next) => {
                        // Skip API and static file requests
                        if (req.url?.startsWith('/api') ||
                            req.url?.startsWith('/static') ||
                            req.url?.startsWith('/@') ||
                            req.url?.includes('.')) {
                            return next();
                        }
                        // Rewrite all other requests to index.html for SPA routing
                        req.url = '/index.html';
                        next();
                    });
                },
            },
        ],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            port: 5173,
            strictPort: false,
            proxy: {
                "/api": {
                    target: backendOrigin,
                    changeOrigin: true,
                },
                "/static": {
                    target: backendOrigin,
                    changeOrigin: true,
                },
            },
        },
        preview: {
            port: 5173,
            strictPort: false,
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: undefined,
                },
            },
        },
    };
});
