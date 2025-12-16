// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.js', // 库的入口文件
      name: 'TimelineChart', // 全局变量名
      fileName: 'TimelineChart', // 输出文件名
      formats: ['umd', 'es', 'cjs'], // 打包格式
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: [],
      output: {
        globals: {
          // 如果需要，可以为外部依赖定义全局变量
        },
      },
    },
  },
});