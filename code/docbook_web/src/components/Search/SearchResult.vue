<template>
  <div v-if="loadingStatus == LoadingStatus.done">
    <div v-if="queryResultPieces && queryResultPieces.length > 0" class="results-content-wrapper">
      <div v-for="(result_piece, qIndex) in computedQueryResultsDirectorys" :key="qIndex">
        <div v-for="(hit, hIndex) in result_piece.hits" :key="hIndex" class="result-content-wrapper">
          <div class="result-before"><span>{{ Count(qIndex, hIndex) }}</span></div>
          <div class="result-wrapper">
            <div>
              <a href="" class="book-content">
                <p v-html="hit.content"></p>
              </a>
            </div>
            <div class="book-path">
              <div v-for="(dir, dIndex) in result_piece.directory" :key="dIndex">
                <a :href="(dIndex == 0)? `/Reader?bid=${result_piece.directory[0].id}` : `/Reader?bid=${result_piece.directory[0].id}&&cid=${dir.id}`" :class="(dIndex == 0)? 'book-title' : 'book-volume-chapter'">
                  {{ dir.title }}
                </a>
                <span v-if="(dIndex != 0) && (dIndex < result_piece.directory.length - 1)">&nbsp·&nbsp</span>
              </div>
              <div class="book-hit-copy" @click="OnHitCopy(result_piece, hIndex)">
                <span>
                  <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M742.4 76.8H460.8c-84.48 0-153.6 69.12-153.6 153.6h-25.6c-84.48 0-153.6 69.12-153.6 153.6v384c0 84.48 69.12 153.6 153.6 153.6h281.6c84.48 0 153.6-69.12 153.6-153.6h25.6c84.48 0 153.6-69.12 153.6-153.6V230.4c0-84.48-69.12-153.6-153.6-153.6z m-128 691.2c0 28.16-23.04 51.2-51.2 51.2H281.6c-28.16 0-51.2-23.04-51.2-51.2V384c0-28.16 23.04-51.2 51.2-51.2h281.6c28.16 0 51.2 23.04 51.2 51.2v384z m179.2-153.6c0 28.16-23.04 51.2-51.2 51.2h-25.6V384c0-84.48-69.12-153.6-153.6-153.6h-153.6c0-28.16 23.04-51.2 51.2-51.2h281.6c28.16 0 51.2 23.04 51.2 51.2v384z"  /><path d="M512 665.6h-179.2c-28.16 0-51.2 23.04-51.2 51.2s23.04 51.2 51.2 51.2h179.2c28.16 0 51.2-23.04 51.2-51.2s-23.04-51.2-51.2-51.2zM512 512h-179.2c-28.16 0-51.2 23.04-51.2 51.2s23.04 51.2 51.2 51.2h179.2c28.16 0 51.2-23.04 51.2-51.2s-23.04-51.2-51.2-51.2z"  /></svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { UUID } from "crypto";

import { useToast } from "vue-toastification";

import LoadingStatus from "../ts/LoadingStatus";
import { QueryResults } from "../ts/BookDefine";

const toast = useToast();

interface Props {
  loadingStatus: LoadingStatus;
  queryResultPieces: QueryResultPiece[];
  queryResultsDirectorys: QueryResultsDirectory[];
}
const props = defineProps<Props>();
var cumuativeCount: number = 0;

const Count = (qIndex: number, hIndex: number): number => {
  if ((qIndex == 0) && (hIndex == 0)){
    cumuativeCount = 0
  }
  else {
    cumuativeCount ++
  }

  return cumuativeCount
}

const isCheck = (id: UUID) => {
  for(var item of props.queryResultsDirectorys){
    if(item.id === id){
      return item.checkStatus;
    }
  }
  return true;
}

const computedQueryResultsDirectorys = computed<QueryResultPiece[]>(() => {
  var pieces: QueryResultPiece[] = [];

  for (var queryResultPiece of props.queryResultPieces) {
    if(isCheck(queryResultPiece.directory[0].id)){
      pieces.push(queryResultPiece);
    }
  }

  return pieces;
})

const OnHitCopy = async (result_piece: QueryResultPiece, hIndex) => {
  try {
    await navigator.clipboard.writeText(result_piece.hits[hIndex].content);
    toast.success("内容已复制到剪贴板。");
  } catch (err) {
    toast.error(`复制失败！${err}`);
  }
}
</script>

<style scoped>
a {
  text-decoration: none;
}

a:hover {
  color: var(--surface-gray-900);
}

p {
  display: block;
  margin-block-start: 0.5em;
  margin-block-end: 0em;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  text-align: justify;
}

/* 
v-html指令会导致定义了scoped的css因作用域的问题无法使用，
采用v-deep可以实现css穿透。
::v-deep usage as a combinator has been deprecated. Use :deep(<inner-selector>) instead of ::v-deep <inner-selector>. 
*/
:deep(mark) {
  background: transparent;
  color: var(--primary-red-500);
  font-weight: 500;
}

.results-content-wrapper {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  min-height: 200px;
}

.result-content-wrapper {
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  margin: 0px 0px 8px 0px;
  font-size: 18px;
  border-radius: 8px;
  background-color: var(--background);
  border: 1px solid transparent;
  transition: box-shadow 0.3s ease-in-out;
}

.result-content-wrapper:hover {
  border: 1px solid var(--border-black-8);
  box-shadow: 0 4px 24px var(--shadow-16);
}

.result-before {
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--surface-gray-500);
  width: 20px;
  padding: 0 3px;
}

.result-wrapper {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  margin: 8px 20px 0px 8px;
  line-height: 22px;
}

.book-path {
  display: flex;
  align-items: center;
  margin: 8px 0px;
}

.book-content {
  color: var(--surface-gray-900);
  font-size: 18px;
}

.book-title {
  padding: 0px 8px 0px 0px;
  font-weight: 500;
  font-size: 13px;
  color: var(--surface-gray-500);
}

.book-volume-chapter {
  font-weight: 400;
  font-size: 13px;
  color: var(--surface-gray-500);
}
.book-hit-copy {
  width: 22px;
  height: 22px;
  margin-left: auto;
  fill: var(--surface-gray-500);
  cursor: pointer;
}
.book-hit-copy:hover {
  fill: var(--primary-red-500);
}
</style>