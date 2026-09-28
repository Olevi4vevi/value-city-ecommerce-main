import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replaces Vite's default "Local:" line with the customer and admin links
function valueCityLinks() {
  return {
    name: 'valuecity-links',
    configureServer(server) {
      server.printUrls = () => {
        const port = server.httpServer?.address()?.port ?? server.config.server.port;
        console.log(`  ➜  Customer: http://valuecity.localhost:${port}/`);
        console.log(`  ➜  Admin:    http://admin.valuecity.localhost:${port}/`);
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), valueCityLinks()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ['.localhost'],
  },
});