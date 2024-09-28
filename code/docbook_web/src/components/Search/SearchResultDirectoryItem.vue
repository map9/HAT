<template>
  <div v-if="queryResultsDirectoryItem && queryResultsDirectoryItem.childs.length > 0" class="book-volume">
    <span>{{ queryResultsDirectoryItem.title }}</span>
  </div>
  <div v-else-if="queryResultsDirectoryItem" class="book-chapter" @click="OnChapterClick(queryResultsDirectoryItem)">
    <div class="book-chapter-body">
      <div class="book-chapter-icon">
        <span>
          <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
            <path
              d="M768 85.333333l-512 0c-47.146667 0-85.333333 38.186667-85.333333 85.333333l0 682.666667c0 47.146667 38.186667 85.333333 85.333333 85.333333l512 0c47.146667 0 85.333333-38.186667 85.333333-85.333333l0-682.666667c0-47.146667-38.186667-85.333333-85.333333-85.333333zM256 170.666667l213.333333 0 0 341.333333-106.666667-64-106.666667 64 0-341.333333z" />
          </svg>
        </span>
      </div>
      <div class="book-chapter-title-wraper">
        <div class="book-chapter-title">{{ queryResultsDirectoryItem.title }}</div>
        <div class="book-chapter-detail"><span>共{{ queryResultsDirectoryItem.hitCount }}个。</span></div>
      </div>
      <!--
      <div class="book-chapter-arrow-wraper">
        <span class="book-chapter-arrow">
          <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
          </svg>
        </span>
      </div>
      -->
    </div>
  </div>
  <div v-if="queryResultsDirectoryItem && queryResultsDirectoryItem.childs.length">
    <SearchResultDirectoryItem
      v-for="child in queryResultsDirectoryItem.childs"
      :key="child.id"
      :queryResultsDirectoryItem="child"
      :directory="getDirectory(queryResultsDirectoryItem)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { QueryResultsDirectory, DirectoryTuple } from "../ts/BookDefine"

// 通过父组件从外部传入的属性数据
interface Props {
  queryResultsDirectoryItem: QueryResultsDirectory;
  directory: DirectoryTuple[];
}

const props = withDefaults(defineProps<Props>(), {
  queryResultsDirectoryItem: undefined,
  directory: undefined,
});

const getDirectory = (item: QueryResultsDirectory) => {
  if(props.directory){
    const directory: DirectoryTuple[] = Array.from(props.directory);
    directory.push({
      id: item.id,
      title: item.title,
    })
    return directory
  }
  return undefined
}

// 定义发出的事件及其可能的参数类型
const emit = defineEmits<{
  (event: 'update', data: DirectoryTuple[]): void;
}>();

const OnChapterClick = (item: QueryResultsDirectory) => {
  const directory: DirectoryTuple[] | undefined = getDirectory(item);
  console.log(directory);

  // 触发名为 'update' 的事件，并传递字符串数据
  if(directory != undefined){
    emit('update', directory);
  }
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