import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Enable minification with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    // Disable source maps in production for smaller bundles
    sourcemap: false,
    // Enable CSS minification
    cssMinify: true,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'i18n-vendor': ['i18next', 'react-i18next'],
          'radix-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const imageRegex = /\.(png|jpe?g|gif|svg|webp|ico)$/;
          const cssRegex = /\.css$/;
          
          if (imageRegex.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          if (cssRegex.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
        // Chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500,
  },
  // Optimization settings
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react'],
    // Exclude packages that shouldn't be pre-bundled
    exclude: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
