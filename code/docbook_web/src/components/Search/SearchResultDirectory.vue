<template>
  <div v-if="isShowSearchResults && queryResultsDirectorys && queryResultsDirectorys.length > 0" class="container">

    <div class="book-title">
      <span v-if="subShowType == ShowType.library">所有书籍</span>
      <div v-if="subShowType == ShowType.library">
        <span class="book-title-detail">共{{currentBookCount}}本，{{currentHitsCount}}个命中结果。</span>
      </div>
      <div class="book-title-inner">
        <span v-if="subShowType == ShowType.book && currentBook">{{ currentBook.title }}</span>
        <div v-if="subShowType == ShowType.book && currentBook" class="book-title-icon" @click="OnBookLibraryClick()" >
          <span>
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M315.63 118.583H95.098c-17.6 0-32 14.4-32 32v746.918c0 17.6 14.4 32 32 32H315.63c17.6 0 32-14.4 32-32V150.583c0-17.6-14.4-32-32-32z m-39.133 245.399H134.231c-17.673 0-32-14.327-32-32s14.327-32 32-32h142.266c17.673 0 32 14.327 32 32s-14.327 32-32 32z m0-113.813H134.231c-17.673 0-32-14.327-32-32s14.327-32 32-32h142.266c17.673 0 32 14.327 32 32s-14.327 32-32 32zM571.71 118.583h-149.4c-17.6 0-32 14.4-32 32v746.918c0 17.6 14.4 32 32 32h149.4c17.6 0 32-14.4 32-32V150.583c0-17.6-14.4-32-32-32z m-10.68 245.399H432.99c-17.673 0-32-14.327-32-32s14.327-32 32-32h128.04c17.673 0 32 14.327 32 32s-14.327 32-32 32z m0-113.813H432.99c-17.673 0-32-14.327-32-32s14.327-32 32-32h128.04c17.673 0 32 14.327 32 32s-14.327 32-32 32zM955.119 872.454L819.663 152.356c-3.254-17.297-20.068-28.786-37.364-25.533l-135.388 25.468c-17.297 3.254-28.786 20.067-25.533 37.364l135.456 720.098c3.254 17.297 20.068 28.786 37.364 25.533l135.388-25.468c17.297-3.254 28.787-20.067 25.533-37.364z m-308.92-627.011a32.044 32.044 0 0 1-1.002-7.949c0.005-14.272 9.629-27.279 24.094-30.971l102.455-26.15c17.122-4.372 34.548 5.967 38.92 23.092a32.044 32.044 0 0 1 1.002 7.949c-0.005 14.272-9.629 27.279-24.094 30.971l-102.455 26.15a32.046 32.046 0 0 1-7.938 1.002c-14.276 0-27.288-9.624-30.982-24.094z m169.523 107.219l-102.455 26.151a32.046 32.046 0 0 1-7.938 1.002c-14.276 0-27.289-9.625-30.982-24.094a32.044 32.044 0 0 1-1.002-7.949c0.005-14.272 9.629-27.279 24.094-30.971l102.455-26.151c17.122-4.372 34.548 5.967 38.92 23.092a32.044 32.044 0 0 1 1.002 7.949c-0.005 14.272-9.629 27.279-24.094 30.971z" />
            </svg>
          </span>
        </div>
      </div>
    </div>

    <div v-if="subShowType == ShowType.library" class="book-directory">
      <div v-for="(book, index) in queryResultsDirectorys" :key="index" class="book-chapter">
        <div class="book-chapter-checkbox">
          <input type="checkbox" v-model="book.checkStatus">
        </div>
        <div class="book-chapter-body" @click="OnBookClick(book)">
          <div class="book-chapter-icon">
            <span>
              <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M960 672V96c0-53.02-43-96-96-96H256C149.96 0 64 85.96 64 192v640c0 106.04 85.96 192 192 192h640c35.34 0 64-28.66 64-62.2 0-23.44-13.214-43.04-32-54.2v-162.72c19.6-19.28 32-44.48 32-72.88zM350.2 256h384c19.4 0 33.8 14.4 33.8 32s-14.4 32-32 32H350.2c-15.8 0-30.2-14.4-30.2-32s14.4-32 30.2-32z m0 128h384c19.4 0 33.8 14.4 33.8 32s-14.4 32-32 32H350.2c-15.8 0-30.2-14.4-30.2-32s14.4-32 30.2-32zM832 896H256c-35.34 0-64-28.66-64-64s28.66-64 64-64h576v128z" /></svg>
            </span>
          </div>
          <div class="book-chapter-title-wraper">
            <div class="book-chapter-title">{{ book.title }}</div>
            <div class="book-chapter-detail"><span>{{ calculateBookSummy(book) }}</span></div>
          </div>
          <div class="book-chapter-arrow-wraper">
            <span class="book-chapter-arrow">
              <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="subShowType == ShowType.book && currentBook" class="book-directory">
      <SearchResultItem
        v-for="child in currentBook.childs"
        :key="child.id"
        :queryResultsDirectoryItem="child"
        :directory="getDirectory(currentBook)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LoadingStatus from "../ts/LoadingStatus";
import SearchResultItem from "./SearchResultItem.vue"
import { QueryResultsDirectory, DirectoryTuple } from "../ts/BookDefine"

// 通过父组件从外部传入的属性数据
interface Props {
  loadingStatus: LoadingStatus;
  queryResultsDirectorys: QueryResultsDirectory[];
  isShowSearchResults: boolean;
}

var props = withDefaults(defineProps<Props>(), {
  loadingStatus: LoadingStatus.idle,
  queryResultsDirectorys: undefined,
  isShowSearchResults: true
});

enum ShowType {
  library,
  book,
}

const subShowType = ref<ShowType>(ShowType.library);
const currentBook = ref<QueryResultPiece>();

// 计算被选择上的hit数量
const currentHitsCount = computed<number>(()=>{
  var count = 0;
  for(var book of props.queryResultsDirectorys){
    count += (book.hitCount && book.checkStatus===true)? book.hitCount : 0;
  }
  return count;
});

// 计算被选择上的book数量
const currentBookCount = computed<number>(()=>{
  var count = 0;
  for(var book of props.queryResultsDirectorys){
    count += (book.checkStatus===true)? 1 : 0;
  }
  return count;
});

const getDirectory = (item: QueryResultsDirectory)=>{
  var directory: DirectoryTuple[] = []
  directory.push({
      id: item.id,
      title: item.title,
    })
  return directory;
};

function countQueryResultsDirectoryChapter(queryResultsDirectory: QueryResultsDirectory): number {
  if (queryResultsDirectory.childs.length == 0) {
    return 1;
  }

  var count: number = 0;
  for (var child of queryResultsDirectory.childs) {
    count += countQueryResultsDirectoryChapter(child);
  }

  return count;
}

const calculateBookSummy = (book: QueryResultsDirectory) => {
  if (!book) return "";
  
  return `共${countQueryResultsDirectoryChapter(book)}章，${book.hitCount}个命中结果。`;
}

const OnBookLibraryClick = () => {
  currentBook.value = undefined;
  subShowType.value = ShowType.library;  
}

const OnBookClick = (book: QueryResultsDirectory) =>{
  if (!book) return "";

  currentBook.value = book;
  subShowType.value = ShowType.book;
}
</script>

<style scoped>
.container {
  position: relative;
  margin: 0 auto;
  height: auto;
  width: 320px;
  min-width: 280px;
  overflow: hidden;
  background: var(--background);
  line-height: 1.58em;
  text-align: left;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid var(--border-black-8);
}

.container:hover{
  box-shadow: 0 4px 24px var(--shadow-16);
}

.book-title {
  padding: 14px 16px;
  font-size: 20px;
  color: var(--surface-gray-900);
}
.book-title-detail {
  font-size: 14px;
  color: var(--surface-gray-500);
  overflow: hidden;
}

.book-title-inner {
  display: flex;
  align-items: center;
}
.book-chapter-checkbox {
  margin: 0 4px;
}
.book-title-icon {
  width: 38px;
  height: 38px;
  margin-left: auto;
  fill: currentColor;
  cursor: pointer;
}

.book-directory {
  max-height: 400px;
  overflow-y: auto;
}

.book-volume {
  padding: 4px 16px;
  font-size: 16px;
  color: var(--surface-gray-500);
  background-color: var(--surface-gray-50);
  border-top: 1px solid var(--border-black-8);
}

.book-chapter {
  display: flex;
  align-items: center;
  padding-left: 16px;
  font-size: 18px;
  color: var(--surface-gray-900);
  border-top: 1px solid var(--border-black-8);
  overflow: hidden;
}

.book-chapter:hover {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
}

.book-chapter-body {
  display: flex;
  align-items: center;
  padding: 8px 16px 8px 0px;
  width: 100%;
}

.book-chapter-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  padding: 8px 8px;
  fill: currentColor;
}

.book-chapter-title-wraper {
  padding: 0 10px 0 0;
  min-height: 40px;
  font-size: 14px;
  overflow: hidden;
}

.book-chapter-title {
  font-size: 14px;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-chapter-detail {
  font-size: 14px;
  color: var(--surface-gray-500);
  overflow: hidden;
}

.book-chapter-arrow-wraper {
  margin-left: auto;
  padding-top: 8px;
  color: var(--surface-gray-500);
}

.book-chapter-arrow {
  display: inline-block;
  position: relative;
  width: 24px;
  height: 24px;
  fill: currentColor;
}
</style>