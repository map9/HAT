<template>
  <div v-if="searchResults && searchResults.length > 0" class="books-container">
    <div v-for="(book, index) in searchResults" :key="index" class="book-card">
      <div class="book-cover-wrapper" @click="OnReader(book)">
        <img src="@/assets/book-cover.jpg" :alt="book.title.title" class="book-cover">
        <div class="book-title-overlay">
          <h3 class="book-title">{{ book.title.title }}</h3>
        </div>
      </div>
      <div class="book-info">
        <p class="book-author">{{ getBookAuthors(book) }}</p>
        <p class="book-description">{{ book.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import LoadingStatus from "../ts/LoadingStatus";
import { Book } from "../ts/BookDefine";

interface Props {
  loadingStatus: LoadingStatus;
  searchResults: Book[];
}
defineProps<Props>();

const router = useRouter();

const getBookAuthors = (book: Book) => {
  if (book.authors?.length){
    return book.authors.map(v => v.name).join(" ");
  } else {
    return ""
  }
}

const OnReader = (book: Book) => {
  const params: Record<string, string> = { bid: book.id };
  router.push({ path: '/Reader', query: params });
}

</script>

<style scoped>
.books-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

.book-card {
  width: 200px;
  margin: 5px;
  /*padding: 15px;*/
  border: 1px solid transparent;
}

.book-cover-wrapper {
  position: relative;
  height: 300px;
  /* 封面图片的高度 */
}

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-cover:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.book-title-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 40px;
  color: black;
  height: 215px;
}

.book-info {
  margin-top: 10px;
}

.book-title {
  margin: 10px 0;
  font-size: 28px;
}

.book-author {
  font-size: 16px;
  color: #555;
}

.book-description {
  font-size: 14px;
  color: #666;
  max-height: 100px;
  /* 设置最大高度，根据需要调整 */
  overflow: hidden;
  /* 添加滚动条，如果文本超出最大高度 */
  text-overflow: ellipsis;
  /* 显示省略号 */
  /*white-space: nowrap;  不换行 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  /* 限制在3行以内 */
  -webkit-box-orient: vertical;
}
</style>
