<template>
  <head-bar :inHeadType="HeadType.search" :in-search-string="searchString" :in-search-range="searchRange"/>

  <div id="center">
      <search-result-hit :search-target-count="queryResults.query_target_count"
        :result-pieces-count="queryResults.query_result_count" />
      <div v-if="queryResults.result_pieces && queryResults.result_pieces.length > 0" class="search-results-container">
        <div class="search-results-content-container">
          <search-result :queryResultPieces="queryResults.result_pieces" :queryResultsDirectorys="queryResultsDirectorys" :loading-status="loadingStatus"/>
        </div>
        <div class="search-results-book-directory">
          <search-result-directory :queryResultsDirectorys="queryResultsDirectorys" :loading-status="loadingStatus"
            :isShowSearchResults="true" @update="OnBookDirectoryUpdate" />
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from "axios";
import { useToast } from "vue-toastification";

import HeadBar from "./HeadBar.vue";
import SearchResult from "./Search/SearchResult.vue";
import SearchResultHit from './Search/SearchResultHit.vue';
import SearchResultDirectory from "./Search/SearchResultDirectory.vue";

import LoadingStatus from "./ts/LoadingStatus";
import { QueryResults, SearchRange, DirectoryTuple } from "./ts/BookDefine"
import { searchArchive } from "./ts/BookServiceHelper"
import { getStringParam } from "./ts/Helper"
import HeadType from './ts/HeadType';

const route = useRoute();
const toast = useToast();

// 定义外部输入的属性
interface Props {
  inSearchString?: string;
}
var props = withDefaults(defineProps<Props>(), {
  inSearchString: '',
});
// 使用 ref 创建本地响应式状态
const searchString = ref<string>(props.inSearchString);
const searchRange = ref<SearchRange>(SearchRange.content);

const queryResults = ref<QueryResults>({
  query_target_count: 0,
  query_result_count: 0,
  result_pieces: undefined,
});
const loadingStatus = ref(LoadingStatus.idle);

const queryResultsDirectorys = ref<QueryResultsDirectory[]>([]);

// 初始化时，导入路由跳转传递的参数
// 由于路由跳转时，组件可能未被渲染，因此，采用异步方式来接收参数
onMounted(async () => {
  await nextTick();

  var q = getStringParam(route, 'q');
  doSearch(q);
});

// watch监听路由变化，当router采用createWebHistory模式时，即使URL已经发生变化，watch函数不会被调用。
watch(() => route.query.q, (newValue) => {
  if (newValue != undefined) {
    var q = newValue as string;
    doSearch(q);
  }
});

function QueryResultPiecesToQueryResultsDirectorys(queryResultPieces: QueryResultPiece[]): QueryResultsDirectory[] {
  // Create a map to hold all directories by their ID
  const directoryMap = new Map<UUID, QueryResultsDirectory>();

  // Populate the directoryMap with initial values
  queryResultPieces.forEach((resultPiece) => {
    resultPiece.directory.forEach((dir) => {
      if (!directoryMap.has(dir.id)) {
        directoryMap.set(dir.id, {
          id: dir.id,
          title: dir.title,
          hitCount: 0,
          checkStatus: true,
          childs: [], // Initialize empty child array
        });
      }
    });
  });

  // Build the tree structure
  queryResultPieces.forEach((resultPiece) => {
    resultPiece.directory.forEach((dir, index) => {
      const currentDir = directoryMap.get(dir.id)!;
      if (index > 0) {
        const parentDirId = resultPiece.directory[index - 1].id;
        const parentDir = directoryMap.get(parentDirId)!;
        parentDir.childs.push(currentDir);
      }
      currentDir.hitCount += resultPiece.hits.length;
    });
  });

  // Collect the top-level directories
  const topLevelDirectories: QueryResultsDirectory[] = [];
  queryResultPieces.forEach((resultPiece) => {
    resultPiece.directory.forEach((dir, index) => {
      if (index === 0) {
        const topLevelDir = directoryMap.get(dir.id)!;
        if (!topLevelDirectories.some((d) => d.id === topLevelDir.id)) {
          topLevelDirectories.push(topLevelDir);
        }
      }
    });
  });

  return topLevelDirectories;
}

const doSearch = (q?: string) => {
  loadingStatus.value = LoadingStatus.loading;
  searchArchive(q, (d)=>{
    queryResults.value = d;
    queryResultsDirectorys.value = QueryResultPiecesToQueryResultsDirectorys(queryResults.value.result_pieces);
    loadingStatus.value = LoadingStatus.done;
  });
  if (q != undefined){
    searchString.value = q;
  } else {
    searchString.value = '';
  }

  if (searchString.value.length > 0) {
    document.title = searchString.value + ' - 开卷 搜索';
  }else{
    document.title = '开卷 搜索';
  }
}

const OnBookDirectoryUpdate = (item: DirectoryTuple[]) => {
  console.log("Event received with, book_title: " + item.book_title + ", volume_title: " + item.volume_title + ", chapter_title: " + item.chapter_title + ".");
}

</script>

<style scoped>
#center {
  flex-grow: 1;
  justify-content: center;
  z-index: 3;
  margin: auto 10px;
}

.search-results-container {
  /*display: flex;
  flex-direction: row;
  width: auto;
  position: relative; */
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  position: relative;
  text-align: left;
  /* margin: 0 20px 0 0; */
}

.search-results-book-directory {
  margin-right: 30px;
  position: sticky;
  /* 固定div原地不动 */
  top: 0px;
  /* 当滚动到距离顶部0px时，不动 */
  height: 400px;
  /* 必须要设置高度，不然不会固定 */
}

.search-results-content-container {
  flex-grow: 1;
  height: auto;
  padding-right: 10px;
}

.inline-row {
  padding-bottom: 20px;
}</style>
