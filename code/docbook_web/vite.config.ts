import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import path from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  publicDir: "public", // 静态资源服务的文件夹
  /*base: './',	// 不加打包后白屏*/
  resolve: {
    // 别名配置，引用src路径下的东西可以通过@
    // 如：import Layout from '@/layout/index.vue'
    alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        "@_c": path.resolve('src/components'),
    },
    // 导入时想要省略的扩展名列表
    extensions:['.mjs','.js','.ts','.jsx','.tsx','.json'],
  },
  server: {             
    host: '127.0.0.1',	
    // port: 8080,      
    open: true,
    proxy: {
      // 设置代理
      "/api": {
        target: "http://127.0.0.1:6060", // 访问数据的计算机域名，不能用localhost，好像有安全问题，访问返回403
        ws: true, // 是否启用websockets
        changeOrigin: true, //开启代理,
        // 重写代理规则，/api开头，代理到 /api
        // 例：[本服务地址]/api/book/search代理到
        // http://localhost:5000/book/search
        // p.replace('/^\/api/', '') FAILED，要却掉正则表达式中的引号
        rewrite: (path)=>path.replace(/^\/api/, '')
      }
    }
  },
})
