import { createApp } from 'vue'
import 'normalize.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from "pinia";

import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
/*
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
*/
const app = createApp(App)

//app.use(ElementPlus);

// 创建Pinia实例
const pinia = createPinia();
// 把pinia实例加入到app应用中
app.use(router).use(pinia).mount('#app');

app.use(Toast, {
  // 这里可以自定义 Toast 的全局配置
});

// 注册所有图标
//for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//  app.component(key, component)
//}