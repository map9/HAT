<template>
  <div ref="bookReaderDiv" class="book-reader">
    <template v-if="props.inIsPageMode">
      <div v-if="currentBookChapter != undefined && currentBookChapter.content != undefined" class="db-chapter" :key="currentChapterIndex">
        <transition-group name="fade" tag="div" v-html="HtmlParseDocument.ParseChapter(currentBookChapter.content)">
        </transition-group>
      </div>
      <div v-if="props.inIsPageMode" class="navbar">
        <button class="nav-item" :disabled="!currentChapterIndex || (currentChapterIndex <= 0)" @click="OnPrevChapter">上一章</button>
        <button class="nav-item" @click="OnCatalogue">目录</button>
        <button class="nav-item" :disabled="!bookReaderChapters || (bookReaderChapters && (currentChapterIndex >= bookReaderChapters.length - 1))" @click="OnNextChapter">下一章</button>
      </div>
    </template>
    <template v-else>
      <template v-for="(bookReaderChapter, index) in bookReaderChapters">
        <div v-if="bookReaderChapter != undefined && bookReaderChapter.content != undefined" class="db-chapter" :key="index">
          <transition-group name="fade" tag="div" v-html="HtmlParseDocument.ParseChapter(bookReaderChapter.content)">
          </transition-group>
        </div>
    </template>    
    </template>    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useToast } from "vue-toastification";

import { debounce } from 'lodash-es';

import LoadingStatus from "../ts/LoadingStatus";
import { Book, Chapter } from "../ts/BookDefine";
import { getBookChapters, getBookChapter } from '../ts/BookServiceHelper';
import { HtmlParseDocument } from '../ts/DocBookParser';

const toast = useToast();

const bookReaderDiv = ref<HTMLElement | null>(null);

// TODO:
// 在inIsPageMode == False时，需要计算滚动的div和显示窗口之间的关系，实时计算currentChapterIndex。
// 同时，对滚动超出当前的章节时，加载需要的章节内容。

// 定义外部输入的属性
interface Props {
  inBookId?: string;
  inChapterId?: string;
  inIsPageMode?: boolean,
}
var props = withDefaults(defineProps<Props>(), {
  inBook: undefined,
  inChapterId: undefined,
  inIsPageMode: true,
});

const bookId = ref<string>(props.inBookId);
const chapterId = ref<string>(props.inChapterId);
const bookReaderChapters = ref<BookReaderChapter[]>();
const currentChapterIndex = ref<number>(undefined);

const loadingStatus = ref(LoadingStatus.idle);

const NEXT_CHAPTER = 1;
const CURRENT_CHAPTER = 0;
const LAST_CHAPTER = -1;

watch(() => props.inBookId, (newValue) => {
  if (newValue != undefined) {
    bookId.value = newValue;
    loadBookChapters(bookId.value, chapterId.value);
  }
});

watch(() => props.inChapterId, (newValue) => {
  if (newValue != undefined) {
    chapterId.value = newValue;
    loadBookChapter(bookId.value, chapterId.value);
  }
});

watch(() => props.inIsPageMode, (newValue) => {
  if (newValue !== undefined) {
    if(newValue == false){
      //checkScroll(undefined);
      // 如果用户已经滚动到页面底部（或非常接近底部）
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - (32+15)) {
        jumpToChapter(currentChapterIndex.value, NEXT_CHAPTER);
      }
    }
  }
});

onMounted(async () => {
  window.addEventListener('scroll', debouncedCheckScroll);
  await nextTick();

  loadBookChapters(bookId.value, chapterId.value);
});

onUnmounted(()=>{
  window.removeEventListener('scroll', debouncedCheckScroll);
});

const currentBookChapter = computed<BookReaderChapter>(()=>{
  if (currentChapterIndex.value != undefined && bookReaderChapters.value != undefined && bookReaderChapters.value[currentChapterIndex.value].content != undefined){
    return bookReaderChapters.value[currentChapterIndex.value];
  } else {
    return undefined;
  }
});

const getBookChapterDirectoryString = (directory: DirectoryTuple[]): string => {
  var titles: string[] = directory.slice(1).map((v) => v.title);
  //console.log(directory);
  //console.log(`titles: ${titles}.`)
  return titles.join("&nbsp·&nbsp");
};

// 载入id为bookId的书籍的所有章节元数据，同时载入id为chapterId的指定章节内容。
const loadBookChapters = (bookId: string, chapterId: string) => {
  //console.log(`Load book chapters, bookId: ${bookId}, chapterId: ${chapterId}`);
  getBookChapters(bookId, chapterId, (c: BookReaderChapter[])=>{
    bookReaderChapters.value = c;
    if (chapterId == undefined){
      currentChapterIndex.value = 0;
    } else {
      for(let _index = 0; _index < bookReaderChapters.value.length; _index ++) {
        var item = bookReaderChapters.value[_index];
        if (item.directory[item.directory.length-1].id == chapterId){
          //console.log(`item: ${item.directory[item.directory.length-1].id}, ${chapterId}, ${item.content}.`)
          if (item.content){
            currentChapterIndex.value = _index;
          }
          break;
        }
      }
    }
  });
}

// 载入id为bookId的书籍的id为chapterId的指定章节内容。
const loadBookChapter = (bookId: string, chapterId: string) => {
  var index = undefined
  for(let _index = 0; _index < bookReaderChapters.value.length; _index ++) {
    var item = bookReaderChapters.value[_index];
    if (item.directory[item.directory.length-1].id == chapterId){
      if (item.content){
        currentChapterIndex.value = _index;
        return;
      } else {
        index = _index;
        break;
      }
    }
  }
  if (index != undefined){
    getBookChapter(bookId, chapterId, (c: Chapter)=>{
      bookReaderChapters.value[index].content = c;
      currentChapterIndex.value = index;
    });
  }
}

// 按照书籍章节的显示顺序，跳转到顺序号为index的指定章节，如果该章节未被载入载入该章节内容。
const jumpToChapter = (index: number, type: number = CURRENT_CHAPTER) => {
  if (index == undefined) return;

  if (type == NEXT_CHAPTER) {
    index ++;
  } else if (type == LAST_CHAPTER) {
    index --;
  }

  if (index < 0){
    toast.info(`前面没有章节了！已经到头了。`);
    return;
  } else if (index > bookReaderChapters.value.length - 1){
    toast.info(`后面没有章节了！已经到底了。`);
    return;
  }

  if (props.inIsPageMode){
    if (bookReaderChapters.value[index].content != undefined){
      console.log(`Chapter already loaded, id:${bookReaderChapters.value[index].content.id}, index: ${index}.`);
      currentChapterIndex.value = index;
      emit('notify:chapter', index);
      bookReaderDiv.value?.scrollIntoView({ behavior: 'smooth' });
    } else {
      var bookReaderChapter: BookReaderChapter = bookReaderChapters.value[index];
      getBookChapter(bookId.value, bookReaderChapter.directory[bookReaderChapter.directory.length-1].id, (c: Chapter) => {
        bookReaderChapter.content = c;
        currentChapterIndex.value = index;
        emit('notify:chapter', index);
        bookReaderDiv.value?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  } else {
    if (bookReaderChapters.value[index].content != undefined){
      console.log(`Chapter already loaded, id:${bookReaderChapters.value[index].content.id}, index: ${index}.`);
      currentChapterIndex.value = index;
      emit('notify:chapter', index);
  } else {
      var bookReaderChapter: BookReaderChapter = bookReaderChapters.value[index];
      getBookChapter(bookId.value, bookReaderChapter.directory[bookReaderChapter.directory.length-1].id, (c: Chapter) => {
        bookReaderChapter.content = c;
        currentChapterIndex.value = index;
        emit('notify:chapter', index);
      });
    }
  }
}

const emit = defineEmits([
  'notify:chapter',
  'notify:catalogue',
]);

const OnNextChapter = () => {
  jumpToChapter(currentChapterIndex.value, NEXT_CHAPTER);
};

const OnPrevChapter = () => {
  jumpToChapter(currentChapterIndex.value, LAST_CHAPTER);
};

defineExpose({ jumpToChapter, OnNextChapter, OnPrevChapter });

const checkScroll = (event) => {
  if(props.inIsPageMode == false){
    // 如果用户已经滚动到页面底部（或非常接近底部）
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - (32+15)) {
      if(currentChapterIndex.value){
        jumpToChapter(currentChapterIndex.value, NEXT_CHAPTER);
      }
    }
    // 如果用户已经滚动到页面顶部（或非常接近顶部）
    if(window.scrollY < 5){
      if(currentChapterIndex.value){
        jumpToChapter(currentChapterIndex.value, LAST_CHAPTER);
      }
    }
    // console.debug(`window.scrollY: ${window.scrollY}.`);
  }
}

const debouncedCheckScroll = debounce(checkScroll, 200);

const OnCatalogue = () => {
  emit('notify:catalogue');
}
</script>

<style>
@import '../theme/book_body.css';
@import '../theme/atom_one_dark.scss';
@import '../theme/atom_one_light.scss';
</style>

<style scoped>
button {
  border-radius: 0px;
  outline: none;
  border: none;
  color: inherit;
  background-color: inherit;
}
.book-reader {
  margin: 20px 0;
  padding: 32px;
  min-width: 600px;
  border-radius: 8px;
  border: 1px solid transparent;
  box-shadow: 0 4px 24px var(--shadow-16);
  color: var(--surface-gray-900);
  background-color: var(--background);
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAAAXNSR0IArs4c6QAAAWlJREFUeNqlloFtwzAMBFU0PxF34k5eoUtktBZVnBysixEEUWBD+idpUnrTGXNkhPvt18awXZjKyE5BE5ix8sw6IEQHfKA1kZoMF5ZNnndqy1k2vae+wTAjMBPIp+sY3QJP1JADaXtvFjv4LR1TFKA5GD4suFSQcGEhjPWRn2+zKpRLT0hBwSo3lRerdpScpbMQCgZS2cH4tHQwerJVPIQjUVBH9wFTPOMgxnRwObhWLLkKlpaJA8TnpDxBwEv1r8Uo+ImegDVX4DBXKKWt3mQnZRRMlxZ7vfxDra6j0vD8vKUtKvJ79Pt1X9W6XxZNTvphhYxcGEjneWncGVH3pM2kAs6Qlq4XDIus4x2qDKieYEsz0nTAYd96MelYZEEgElZxnJtEa4mefZpr7hHGsLLmS2uDVgPGEUadgBxwrn3zwRwGhkU2NVqy6fUEbRs1CruoCM5zlPaIIL6/biLs0edft/d7IfjhT9gfL6wnSxDYPyIAAAAASUVORK5CYII=);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.navbar {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 28px;

  margin: 30px auto;
  min-width: 300px;

  font-size: 18px;
  line-height: 26px;
  font-weight: 500;

  overflow: hidden;
}

button {
  min-width: 100px;
  border-radius: 8px;
  text-align: center;
  font-size: 16px;
  color: var(--surface-gray-900);
  background-color: var(--surface-gray-50);
}

.navbar .nav-item {
  position: relative;
  flex: 1;

  padding-top: 15px;
  padding-bottom: 15px;
  border-radius: 0px;
}

.navbar .nav-item:hover {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
}

.navbar .nav-item:disabled {
  color: var(--surface-gray-500);
  background-color: var(--surface-gray-50);
}

.navbar .nav-item:not(:last-child)::after {
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 1px;
  content: '';
  box-sizing: border-box;
  border-right: 1px solid var(--border-black-8);
}

</style>
