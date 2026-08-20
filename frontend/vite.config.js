import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, "");
    const backendOrigin = (env.VITE_BACKEND_ORIGIN || "http://127.0.0.1:8001").replace(/\/+$/, "");
    const isGitHubPages = process.env.GITHUB_PAGES === "true" || process.env.CI === "true";

    return {
        base: isGitHubPages ? "/neetprep-edtech-platform/" : "./",
        plugins: [
            react(),
            // Custom plugin to handle SPA routing and generate 404.html for GitHub Pages
            {
                name: "spa-fallback",
                configureServer(server) {
                    server.middlewares.use((req, res, next) => {
                        // Skip API and static file requests
                        if (
                            req.url?.startsWith("/api") ||
                            req.url?.startsWith("/static") ||
                            req.url?.startsWith("/@") ||
                            req.url?.includes(".")
                        ) {
                            return next();
                        }
                        // Rewrite all other requests to index.html for SPA routing
                        req.url = "/index.html";
                        next();
                    });
                },
                closeBundle() {
                    // Copy index.html to 404.html in dist for GitHub Pages SPA routing
                    try {
                        const distPath = path.resolve(__dirname, "dist");
                        const indexPath = path.join(distPath, "index.html");
                        const notFoundPath = path.join(distPath, "404.html");
                        if (fs.existsSync(indexPath)) {
                            fs.copyFileSync(indexPath, notFoundPath);
                        }
                    } catch (e) {
                        console.error("Failed to copy 404.html:", e);
                    }
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
