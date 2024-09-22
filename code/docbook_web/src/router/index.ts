import { createRouter, createWebHistory, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: 'Home',
		meta: { title: '开卷' },
		component:()=>import('../components/Home.vue'),
	},
	{
		path: '/Search',
		name: 'Search',
		meta: { title: '开卷 搜索' },
		component:()=>import('../components/Search.vue'),
	},
	{
		path: '/Library',
		name: 'Library',
		meta: { title: '开卷 书库' },
		component:()=>import('../components/Library.vue'),
	},
	{
		path: '/Reader',
		name: 'Reader',
		meta: { title: '开卷 阅读' },
		component:()=>import('../components/Reader.vue'),
	},
	{
		path: '/Editor',
		name: 'Editor',
		meta: { title: '开卷 编辑' },
		component:()=>import('../components/Editor.vue'),
	},
]

const router = createRouter({
  //history: createWebHistory(),
	// 自动在URL后增加#
	history: createWebHashHistory(),
  routes
})

router.afterEach((to, from) => {
  // 使用 'meta.title' 字段来设置页面标题
  if (to.meta && to.meta.title) {
    document.title = to.meta.title as string;
  }
});

export default router