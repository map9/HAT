<template>
  <div ref="bookReaderDiv" class="book-reader">
    <template v-if="props.inIsPageMode">
      <div v-if="currentBookChapter != undefined && currentBookChapter.content != undefined" class="db-chapter"
        :data-key="currentChapterIndex" :key="currentChapterIndex">
        <transition-group name="fade" tag="div" v-html="HtmlParseDocument.ParseChapter(currentBookChapter.content)">
        </transition-group>
      </div>
      <div v-if="props.inIsPageMode" class="navbar">
        <button class="nav-item" :disabled="!currentChapterIndex || (currentChapterIndex <= 0)"
          @click="OnPrevChapter">上一章</button>
        <button class="nav-item" @click="OnCatalogue">目录</button>
        <button class="nav-item"
          :disabled="!bookReaderChapters || (bookReaderChapters != undefined && currentChapterIndex != undefined && (currentChapterIndex >= bookReaderChapters.length - 1))"
          @click="OnNextChapter">下一章</button>
      </div>
    </template>
    <template v-else>
      <template v-for="(bookReaderChapter, index) in bookReaderChapters">
        <div v-if="bookReaderChapter != undefined && bookReaderChapter.content != undefined" class="db-chapter"
          :data-key="index" :key="index">
          <transition-group name="fade" tag="div" v-html="HtmlParseDocument.ParseChapter(bookReaderChapter.content)">
          </transition-group>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { withDefaults, ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useToast } from "vue-toastification";

import { debounce } from 'lodash-es';

import LoadingStatus from "../ts/LoadingStatus";
import { Division, BookReaderChapter, DirectoryTuple } from "../ts/BookDefine";
import { getBookChapters, getBookChapter } from '../ts/BookServiceHelper';
import { HtmlParseDocument } from '../ts/DocBookParser';

const toast = useToast();
const bookReaderDiv = ref<HTMLElement | null>(null);

// 定义外部输入的属性
interface Props {
  inBookId?: string;
  inChapterId?: string;
  inIsPageMode?: boolean;
  inTop?: number;
  inBottom?: number;
}

const props = withDefaults(defineProps<Props>(), {
  inBookId: undefined,
  inChapterId: undefined,
  inIsPageMode: true,
  inTop: undefined,
  inBottom: undefined,
});

const bookId = ref<string | undefined>(props.inBookId);
const chapterId = ref<string | undefined>(props.inChapterId);
const bookReaderChapters = ref<BookReaderChapter[]>([]);
const currentChapterIndex = ref<number | undefined>(undefined);
const loadingStatus = ref(LoadingStatus.idle);

watch(() => props.inBookId, (newValue) => {
  if (newValue != undefined) {
    bookId.value = newValue;
    loadBookChapters();
  }
});

watch(() => props.inChapterId, (newValue) => {
  if (newValue != undefined) {
    chapterId.value = newValue;
    loadBookChapterById(chapterId.value, true);
  }
});

// 切换到滚动模式时，预加载当前Chapter的上下章节。
watch(() => props.inIsPageMode, (newValue) => {
  if (newValue !== undefined) {
    if (newValue == false) {
      if (currentChapterIndex.value != undefined){
        loadBookChapterByIndex(currentChapterIndex.value);
      } else if (chapterId.value != undefined){
        loadBookChapterById(chapterId.value);
      }
    }
  }
});

onMounted(async () => {
  window.addEventListener('scroll', debouncedCheckScroll);
  await nextTick();

  loadBookChapters();
});

onUnmounted(() => {
  window.removeEventListener('scroll', debouncedCheckScroll);
});

const currentBookChapter = computed<BookReaderChapter | undefined>(() => {
  if (currentChapterIndex.value != undefined && bookReaderChapters.value.length > currentChapterIndex.value && bookReaderChapters.value[currentChapterIndex.value].content != undefined) {
    return bookReaderChapters.value[currentChapterIndex.value];
  } else {
    return undefined;
  }
});

const getBookChapterDirectoryString = (directory: DirectoryTuple[]): string => {
  const titles: string[] = directory.slice(1).map((v) => v.title);
  //console.log(directory);
  //console.log(`titles: ${titles}.`)
  return titles.join("&nbsp·&nbsp");
};

// 载入id为bookId的书籍的所有章节元数据，同时载入id为chapterId的指定章节内容。
const loadBookChapters = () => {
  //console.log(`Load book chapters, bookId: ${bookId}, chapterId: ${chapterId}`);
  if(bookId.value != undefined){
    getBookChapters(bookId.value, chapterId.value, (c: BookReaderChapter[]) => {
      bookReaderChapters.value = c;
      if (chapterId.value == undefined) {
        currentChapterIndex.value = 0;
      } else {
        loadBookChapterById(chapterId.value, true);
      }
    });
  }
}

// 载入id为bookId的书籍的id为chapterId的指定章节内容。
const loadBookChapterById = (id: string, jumpTo: boolean = false) => {
  let order: number | undefined = undefined;
  for (let index = 0; index < bookReaderChapters.value.length; index++) {
    let item = bookReaderChapters.value[index];
    if (item.directory[item.directory.length - 1].id == id) {
      order = index;
      break;
    }
  }

  loadBookChapterByIndex(order, jumpTo);
}

// 按照书籍章节的显示顺序，跳转到顺序号为index的指定章节，如果该章节未被载入载入该章节内容。
const loadBookChapterByIndex = (index: number | undefined, jumpTo: boolean = false) => {
  if (index == undefined) return;

  if (index < 0) {
    //toast.info(`前面没有章节了！已经到头了。`);
    return;
  } else if (index > bookReaderChapters.value.length - 1) {
    //toast.info(`后面没有章节了！已经到底了。`);
    return;
  }

  if (index > bookReaderChapters.value.length && bookReaderChapters.value[index].content != undefined) {
    //console.log(`Chapter already loaded, id:${bookReaderChapters.value[index].content.id}, index: ${index}.`);
    currentChapterIndex.value = index;
    if (jumpTo) {
      nextTick(() => {
        emit('notify:chapter', index);
        scrollToChapter(index);
      });
    }
  } else {
    const bookReaderChapter: BookReaderChapter = bookReaderChapters.value[index];

    if (bookId.value != undefined) {
      getBookChapter(bookId.value, bookReaderChapter.directory[bookReaderChapter.directory.length - 1].id, (c: Division) => {
        //console.log(`index: ${index}, jumpTo: ${jumpTo}, loaded.`);
        bookReaderChapter.content = c;
        currentChapterIndex.value = index;
        if (jumpTo) {
          nextTick(() => {
            emit('notify:chapter', index);
            scrollToChapter(index);
          });
        }
      });
    }
  }

  // 预先加载上下的章节
  if (!props.inIsPageMode && bookId.value != undefined) {
    if (index - 1 >= 0 && bookReaderChapters.value[index - 1].content === undefined) {
      const bookReaderChapter: BookReaderChapter = bookReaderChapters.value[index - 1];
      getBookChapter(bookId.value, bookReaderChapter.directory[bookReaderChapter.directory.length - 1].id, (c: Division) => {
        bookReaderChapter.content = c;
        nextTick(() => {
          scrollToChapter(index);
        });
      });
    }
    if (index + 1 < bookReaderChapters.value.length && bookReaderChapters.value[index + 1].content === undefined) {
      const bookReaderChapter: BookReaderChapter = bookReaderChapters.value[index + 1];
      getBookChapter(bookId.value, bookReaderChapter.directory[bookReaderChapter.directory.length - 1].id, (c: Division) => {
        bookReaderChapter.content = c;
      });
    }
  }
}

const emit = defineEmits([
  'notify:chapter',
  'notify:catalogue',
]);

const OnNextChapter = () => {
  if (currentChapterIndex.value != undefined) {
    loadBookChapterByIndex(currentChapterIndex.value + 1, true);
  }
};

const OnPrevChapter = () => {
  if (currentChapterIndex.value != undefined) {
    loadBookChapterByIndex(currentChapterIndex.value - 1, true);
  }
};

const OnCatalogue = () => {
  emit('notify:catalogue');
}

//defineExpose({ loadBookChapterByOrder, OnNextChapter, OnPrevChapter });
// 滚动窗口到指定序列号的章节div。
const scrollToChapter = (index: number) => {
  if (bookReaderDiv.value) {
    const chapterDiv = bookReaderDiv.value.querySelector(`div[data-key='${index}']`) as HTMLElement | null;
    chapterDiv?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 检查章节元素是否超出当前视口，或需要加载上下文章节
const isChapterInView = (chapterElement: HTMLElement): { inView: boolean, loadPrevious: boolean, loadNext: boolean } => {
  const rectChapter = chapterElement.getBoundingClientRect();
  const buffer = 150; // 设定一个缓冲区，提前预加载前后章节
  const top = props.inTop || 0;
  const bottom = props.inBottom || window.innerHeight;

  //console.log(`index: ${chapterElement.getAttribute('data-key')}, ${rectChapter.top}, ${rectChapter.bottom}.`);

  return {
    inView: rectChapter.top >= top && rectChapter.bottom <= bottom, // 章节完全可见
    loadPrevious: rectChapter.top >= top - buffer && rectChapter.top <= buffer && rectChapter.bottom > top, // 章节顶部超出视口，需要加载上一个章节
    loadNext: rectChapter.top < bottom && rectChapter.bottom >= bottom - buffer && rectChapter.bottom <= bottom + buffer // 章节底部超出视口，需要加载下一个章节
  };
};

// 滚动时检查
const checkScroll = () => {
  if (props.inIsPageMode === false) {
    const chapterDivs = bookReaderDiv.value?.querySelectorAll('.db-chapter') || [];
    let _currentChapterIndex = currentChapterIndex.value;
    let _previousChapterIndex = undefined;
    let _nextChapterIndex = undefined;

    chapterDivs.forEach((chapterDiv, index) => {
      const chapterElement = chapterDiv as HTMLElement;
      const viewStatus = isChapterInView(chapterElement);
      const dataKey = chapterElement.getAttribute('data-key');
      if (dataKey != undefined){
        index = Number(dataKey);
      }

      //console.log(`index: ${index}, ${viewStatus.inView}, ${viewStatus.loadPrevious}, ${viewStatus.loadNext}.`);
      // 如果当前章节在视口中，更新 currentChapterIndex
      if (viewStatus.inView) {
        _currentChapterIndex = index;
        if (_previousChapterIndex == undefined || (_previousChapterIndex != undefined && _previousChapterIndex > index))
          _previousChapterIndex = index;
        if (_nextChapterIndex == undefined || (_nextChapterIndex != undefined && _nextChapterIndex < index))
          _nextChapterIndex = index;
      }

      // 如果章节超出顶部或底部，需要加载前后章节
      if (viewStatus.loadPrevious && (_previousChapterIndex == undefined || (_previousChapterIndex != undefined && _previousChapterIndex > index))) {
        _previousChapterIndex = index;
      }
      if (viewStatus.loadNext && (_nextChapterIndex == undefined || (_nextChapterIndex != undefined && _nextChapterIndex < index))) {
        _nextChapterIndex = index;
      }
    });

    //console.log(`index: ${_currentChapterIndex}, previous: ${_previousChapterIndex}, next: ${_nextChapterIndex}.`);

    // 更新 currentChapterIndex 并预加载相邻章节
    if (_currentChapterIndex !== currentChapterIndex.value) {
      currentChapterIndex.value = _currentChapterIndex;
    }
    console.log(`current: ${currentChapterIndex.value}, ${_currentChapterIndex}.`);

    // 如果需要加载上一个章节
    if (bookId.value && _previousChapterIndex && _previousChapterIndex - 1 >= 0 && bookReaderChapters.value[_previousChapterIndex - 1].content === undefined) {
      const bookReaderChapter: BookReaderChapter = bookReaderChapters.value[_previousChapterIndex - 1];
      getBookChapter(bookId.value, bookReaderChapter.directory[bookReaderChapter.directory.length - 1].id, (c: Division) => {
        const chapterIndex = _previousChapterIndex;
        bookReaderChapter.content = c;
        nextTick(() => {
          if(chapterIndex !== undefined) scrollToChapter(chapterIndex);
        });
      });
    }

    // 如果需要加载下一个章节
    if (bookId.value && _nextChapterIndex && _nextChapterIndex + 1 < bookReaderChapters.value.length && bookReaderChapters.value[_nextChapterIndex + 1].content === undefined) {
      const bookReaderChapter: BookReaderChapter = bookReaderChapters.value[_nextChapterIndex + 1];
      getBookChapter(bookId.value, bookReaderChapter.directory[bookReaderChapter.directory.length - 1].id, (c: Division) => {
        bookReaderChapter.content = c;
      });
    }
  }
};

const debouncedCheckScroll = debounce(checkScroll, 200);
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
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
