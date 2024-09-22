<template>
  <div v-if="props.inBook" class="book-catalogue">
    <div class="catalogue-header">
      <p class="catalogue-header-infos"><span class="catalogue-header-title">目录</span></p>
      <div class="catalogue-header-operate">
        <button class="catalogue-header-oi" @click="OnOrder">
          <i class="icon">
            <svg :style="order? { transform: 'rotate(0deg)' } : { transform: 'rotate(180deg)' }" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M365 663.5v210.7c0 18.6-23.4 26.8-35 12.3L131.2 637.9c-13.3-16.6-1.5-41.1 19.8-41.1h80.7v-400c0-36.8 29.8-66.7 66.7-66.7 36.8 0 66.7 29.8 66.7 66.7v466.7h-0.1z m200-466.7h266.7c36.8 0 66.7 29.8 66.7 66.7s-29.8 66.7-66.7 66.7H565c-36.8 0-66.7-29.8-66.7-66.7 0-36.8 29.9-66.7 66.7-66.7z m0 266.7h200c36.8 0 66.7 29.8 66.7 66.6s-29.8 66.7-66.6 66.7H565c-36.8 0-66.7-29.8-66.7-66.7 0.1-36.8 29.9-66.6 66.7-66.6z m0 266.7h133.3c36.8 0 66.7 29.8 66.7 66.7 0 36.8-29.8 66.7-66.7 66.7H565c-36.8 0-66.7-29.8-66.7-66.7 0.1-36.9 29.9-66.7 66.7-66.7z" /></svg>
          </i>
          <span style="padding-left: 5px">{{ order? '倒序': '正序' }}</span>
        </button>
      </div>
    </div>
    <div class="catalogue-all">
      <div class="catalogue-volume">
        <BookCatalogueItem
          :inBook="localBook"
          :inDivision="localBook"
          :key="props.inBook.id"
          @close="close"
        />
      </div>
    </div>
    <!-- 关闭按钮 -->
    <button v-if="props.isDialog===true" class="closebutton" @click="close">
      <span>&#x2715;</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BookCatalogueItem from "./BookCatalogueItem.vue"
import { Book, Division } from "../ts/BookDefine";

const router = useRouter();

// 定义外部输入的属性
interface Props {
  inBook: Book;
  isDialog: boolean;
}
var props = withDefaults(defineProps<Props>(), {
  inBook: undefined,
  isDialog: undefined,
});

const localBook = ref<Book>(props.inBook);

const order = ref<boolean>(true);

const reverseBookCatalogue = (division: Book | Division) => {
  if (division.divisions === undefined){
    return
  }

  for (var _division of division.divisions){
    reverseBookCatalogue(_division)
  }

  division.divisions = division.divisions.slice().reverse()
  return Object.assign({}, division);
}

const OnOrder = () => {
  order.value = !order.value;

  localBook.value = reverseBookCatalogue(localBook.value)
}

// 监听 props.inBook 的变化
watch(() => props.inBook, (newBook) => {
  localBook.value = newBook;
});

const emit = defineEmits([
  'close',
]);

const close = () => {
  emit('close');
}

</script>

<style scoped>
button {
  border: none;
  outline: none;
  padding: 0;
  border-radius: 0px;
  background-color: transparent;
  cursor: pointer;
}

label {
  cursor: pointer;
}

.book-catalogue {
  display: flex;
  flex-direction: column;
  width: auto;
  height: 100%;
  /*margin: 20px 0;*/
  padding: 32px 32px 32px 32px;
  outline: 1px solid transparent;
  border-radius: 10px;
  background: var(--background);
  box-shadow: 0 4px 24px var(--shadow-16);
  box-sizing: border-box;
  text-align: left;
}

.book-catalogue div {
  display: block;
  margin: 0;
  padding: 0;
}

.book-catalogue .catalogue-header {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 32px;
}
.catalogue-header .catalogue-header-infos {
  display: flex;
  flex-grow: 1;
}
.catalogue-header p {
  margin-block-start: 0px;
  margin-block-end: 0px;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
}
.catalogue-header-infos .catalogue-header-title {
  display: inline-block;
  margin-bottom: 8px;
  margin-top: 8px;
  pointer-events: none;
  font-size: 28px;
  line-height: 32px;
  font-weight: 600;
  vertical-align: top;
  color: var(--surface-gray-900);
}

.catalogue-header-infos .catalogue-header-operate {
  position: relative;
}

.catalogue-header-operate .catalogue-header-oi {
  display: inline-block;
  padding: 10px 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--surface-gray-900);
  background-color: var(--background);
}

.catalogue-header-operate .catalogue-header-oi:hover {
  border-radius: 8px;
  color: var(--primary-red-500);
  background: var(--primary-red-50);
}

.catalogue-header-operate .catalogue-header-oi .icon {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 1em;
  width: 1em;
  font-size: 20px;
  font-weight: 400;
  line-height: 1em;
  vertical-align: top;
  fill: currentColor;
}

.icon svg {
  height: 1em;
  width: 1em;
}

.book-catalogue .catalogue-all {
  flex-grow: 1; /* 让 catalogue-items 占据所有剩余空间 */
  padding: 0 16px;
  overflow: auto;
}

.book-catalogue .volume-header {
  position: relative;
  padding: 0 16px;
  margin: 0 0 10px 0;
  border-radius: 8px;
  background: var(--surface-gray-50);
}

.catalogue-volume .volume-name {
  padding: 11px 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  color: var(--surface-gray-900);
}

.catalogue-volume .volume-name .dot {
  margin: 0 3px;
}

.catalogue-volume .volume-operate {
  position: absolute;
  right: 16px;
  top: 10px;
  font-size: 0;
  z-index: 2;
}

.catalogue-volume .volume-col {
  display: inline-block;
  height: 28px;
  padding: 8px;
  margin-left: 8px;
  margin-right: -8px;
  box-sizing: border-box;
  color: var(--surface-gray-900);
}

.catalogue-volume .volume-col .icon {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 1em;
  width: 1em;
  padding-left: 10px;
  margin-right: 10px;
  line-height: 1em;
  border-left: 1px solid var(--border-black-8);
  font-size: 14px;
  font-weight: 400;
  vertical-align: top;
  fill: currentColor;
}

.catalogue-volume .volume-chapters {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  margin-bottom: 20px;
}

.volume-chapters .chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 33.33333%;
  padding: 0 16px;
  border-radius: 8px;
  box-sizing: border-box;
}
.volume-chapters .chapter-item:hover {
  color: var(--primary-red-500);
  background: var(--primary-red-50);
}

.volume-chapters .chapter-name {
  display: block;
  padding: 8px 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 22px;
  overflow: hidden;
  color: var(--surface-gray-900);
}

.volume-chapters .chapter-item:hover .chapter-name {
  color: var(--primary-red-500);
}
.closebutton {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center; 
  top: 20px;
  right: 20px;
  width: 25px;
  height: 25px;
  border-radius: 100%;
  font-size: 14px;
  color: var(--border-black-8);
  background-color: var(--surface-gray-50);
}
.closebutton:hover{
  color: var(--primary-red-500);
  background-color: var(--surface-gray-100);
}

</style>