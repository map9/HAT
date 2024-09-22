<template>
  <head-bar :inHeadType="HeadType.library" :in-search-string="searchString" :in-search-range="searchRange" />

  <div id="center">
    <search-result-hit :search-target-count="searchResults.query_target_count"
      :result-pieces-count="searchResults.result_piece_count" />
    <book-shelf v-if="searchResults.result_pieces" :loading-status="loadingStatus"
      :search-results="searchResults.result_pieces" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';

import HeadBar from "./HeadBar.vue";
import SearchResultHit from './Search/SearchResultHit.vue';
import BookShelf from './Books/BookShelf.vue';

import LoadingStatus from "./ts/LoadingStatus";
import { SearchResultObject, SearchRange } from "./ts/BookDefine"
import { getStringParam } from "./ts/Helper"
import { getBookList } from './ts/BookServiceHelper';
import HeadType from './ts/HeadType';

const route = useRoute();

// 定义外部输入的属性
interface Props {
  inSearchString?: string;
}
var props = withDefaults(defineProps<Props>(), {
  inSearchString: '',
});
// 使用 ref 创建本地响应式状态
const searchString = ref<string>(props.inSearchString);
const searchRange = ref<SearchRange>(SearchRange.book);

const searchResults = ref<SearchResultObject>({
  query_target_count: 0,
  result_piece_count: 0,
  result_pieces: undefined,
});
const loadingStatus = ref(LoadingStatus.idle);

const DoSearch = (q: string | undefined) => {
  getBookList(q, (d)=>searchResults.value = d);
  if(q){
    searchString.value = q;
  }else{
    searchString.value = '';
  }
  if (searchString.value.length > 0) {
    document.title = searchString.value + ' - 开卷 书库';
  }else{
    document.title = '开卷 书库';
  }
}

// 初始化时，导入路由跳转传递的参数
// 由于路由跳转时，组件可能未被渲染，因此，采用异步方式来接收参数
onMounted(async () => {
  await nextTick();

  DoSearch(getStringParam(route, 'q'));
});

// watch监听路由变化，当router采用createWebHistory模式时，即使URL已经发生变化，watch函数不会被调用。
watch(() => route.query.q, (newValue) => {
  if (newValue !== undefined) {
    DoSearch(newValue as string);
    console.debug();
  }
});
</script>

<style scoped>
#center {
  flex-grow: 1;
  justify-content: center;
  z-index: 3;
  /*display: flex;
  overflow-y: auto;*/
  margin: auto 10px;
}
</style>
