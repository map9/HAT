import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'HistoricalChart',
      fileName: (format) => `historical-chart.${format === 'es' ? 'esm.' : ''}js`
    },
    rollupOptions: {
      external: ['d3'],
      output: {
        globals: {
          d3: 'd3'
        }
      }
    }
  },
  server: {
    port: 5180,
    open: '/test/index.html'
  }
});
