import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

function firebaseConfigPlugin(firebaseConfig) {
  const source = `self.FIREBASE_CONFIG = ${JSON.stringify(
    firebaseConfig,
    null,
    2,
  )};`;

  return {
    name: "firebase-config-generator",

    // Serve the generated config during development
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/firebase-config.js") {
          return next();
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-store");
        res.end(source);
      });
    },

    // Generate the same file during production build
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "firebase-config.js",
        source,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };

  return {
    plugins: [
      react(),

      firebaseConfigPlugin(firebaseConfig),

      VitePWA({
        registerType: "autoUpdate",

        manifest: {
          name: "CreatorDesk",
          short_name: "CreatorDesk",
          description: "Personal TikTok Affiliate Manager",
          theme_color: "#7c3aed",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
  };
});
