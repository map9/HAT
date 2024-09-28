<template>
  <div ref="searchBarContainer" class="full-container"
    :style="(!(searchHistory && searchHistory.length > 0) && isInputFocused || (!isInputFocused && !isListFocused)) ? 'border-radius: 22px;' : 'border-radius: 22px 22px 0 0;'">
    <div class="searchbar-container">
      <div class="listitem-icon">
        <i class="icon">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6c3.2 3.2 8.4 3.2 11.6 0l43.6-43.5c3.2-3.2 3.2-8.4 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"/></svg>
        </i>
      </div>
      <div class="input-container">
        <input ref="searchInput" v-model="searchString" class="searchbar" type="text" title="Input search string"
          @keydown.enter="OnSearch" @focus="OnInputFocus" @blur="OnInputBlur">
        <span class="clear-icon" :style="clearIconStyle" @click="clear" title="Clear input string">&#x2715;</span>
      </div>
      <div class="voice-icon">
        <i class="icon">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M451.131077 1024C434.333538 1024 420.706462 1010.766769 420.706462 994.461538 420.706462 978.136615 434.333538 964.923077 451.131077 964.923077L472.615385 964.923077 472.615385 905.846154C322.363077 892.691692 204.091077 771.899077 177.230769 630.153846L236.307692 630.153846C264.014769 748.504615 381.676308 846.769231 512 846.769231 642.323692 846.769231 759.985231 748.504615 787.692308 630.153846L846.769231 630.153846C819.908923 771.899077 701.636923 892.691692 551.384615 905.846154L551.384615 964.923077 572.868923 964.923077C589.666462 964.923077 603.293538 978.136615 603.293538 994.461538 603.293538 1010.766769 589.666462 1024 572.868923 1024L451.131077 1024ZM512 787.692308C394.338462 787.692308 295.384615 685.272615 295.384615 571.076923L295.384615 196.923077C295.384615 82.727385 394.338462 0 512 0 629.661538 0 728.615385 82.727385 728.615385 196.923077L728.615385 571.076923C728.615385 685.272615 629.661538 787.692308 512 787.692308ZM669.538462 196.923077C669.538462 115.357538 596.046769 59.076923 512 59.076923 427.953231 59.076923 354.461538 115.357538 354.461538 196.923077L354.461538 571.076923C354.461538 652.642462 427.953231 728.615385 512 728.615385 596.046769 728.615385 669.538462 652.642462 669.538462 571.076923L669.538462 196.923077Z" /></svg>
        </i>
      </div>
    </div>
  </div>
  <div :style="{ width: searchHistoryContainerWidth + 'px'}"
    v-if="(searchHistory && searchHistory.length > 0 && isInputFocused) || isListFocused" class="search-history-container"
    @mouseenter="OnListMouseEnter" @mouseleave="OnListMouseLeave">
    <div class="divider"></div>
    <ul class="list-container">
      <!-- 这个是一种做法
      <li v-for="(item, index) in searchHistory" :key="index" class="listitem-container">
        <el-icon class="listitem-icon">
          <Search />
        </el-icon>
        <a :href="`/Search?q=${encodeURIComponent(item.searchString)}&range=${encodeURIComponent('BOOK_CONTENT')}`" class="listitem-text">
          <span >{{ item.searchString }}</span>
        </a>
      </li>
      -->
      <li v-for="(item, index) in searchHistory" :key="index" class="listitem-container" @click="OnListClick(item)">
        <div class="listitem-icon">
          <i class="icon">
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6c3.2 3.2 8.4 3.2 11.6 0l43.6-43.5c3.2-3.2 3.2-8.4 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"/></svg>
          </i>
        </div>
        <span class="listitem-text">{{ item.searchString }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification";

import { useSearchStore, SearchParamsItem } from "../../stores/SearchStore"
import { SearchRange } from "../ts/BookDefine";

const toast = useToast();

// 定义外部输入的属性
interface Props {
  inSearchString?: string;
  inSearchRange?: SearchRange;
}
const props = withDefaults(defineProps<Props>(), {
  inSearchString: '',
  inSearchRange: SearchRange.content,
});

// 定义时ref外部的属性值，只会在初始化时，copy一份属性值。
// 并不会因为外部属性值变化，而影响本地的变量。
const searchString = ref<string>(props.inSearchString);
const searchRange = ref<SearchRange>(props.inSearchRange);

// 外部属性值变化，需要通过watch，才能改变本地变量，否则，本地变量不会发生改变。
watch(() => props.inSearchString, (newValue) => {
  if (newValue !== undefined) {
    searchString.value = newValue as string;
    //console.log(`SearchBar, inSearchString: ${props.inSearchString}.`);
  }
});
watch(() => props.inSearchRange, (newValue) => {
  if (newValue !== undefined) {
    searchRange.value = newValue as SearchRange;
    //console.log(`SearchBar, inSearchRange: ${props.inSearchRange}.`);
  }
});

const clearIconStyle = computed(() => {
  if (searchString.value.length > 0)
    return { display: 'block' };
  else
    return { display: 'none' };
})
const searchInput = ref<any>(null);
const clear = () => {
  searchString.value = '';
  searchInput.value.focus();
}

// 保持searchHistoryContainer和searchBarContainer宽度一致
const searchBarContainer = ref();
const searchHistoryContainerWidth = ref<number>();
onMounted(() => {
  if (searchBarContainer && searchBarContainer.value) {
    searchHistoryContainerWidth.value = searchBarContainer.value.offsetWidth;
    //console.log(`${searchBarContainer.value.offsetWidth}`);
  }
  /* 通过searchString和searchRange定义时解决了。
  if(props.inSearchString)
    searchString.value = props.inSearchString;
  if(props.inSearchRange)
    searchRange.value = props.inSearchRange;
  */
  window.addEventListener('resize', onSize);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', onSize);
});
const onSize = () => {
  if (searchBarContainer && searchBarContainer.value) {
    searchHistoryContainerWidth.value = searchBarContainer.value.offsetWidth;
    //console.log(`${searchBarContainer.value.offsetWidth}`);
  }
};

const store = useSearchStore()
const searchHistory = ref<SearchParamsItem[]>(store.searchHistory);

const OnSearch = (e: KeyboardEvent) => {
  // 避免中文输入法的Enter作为Input回车输入。
  // 中文输入法转发的回车输入，键值为229，正常的输入回车，键值为13。
  if (e.keyCode == 229) {
    return;
  }
  DoSearch();
};

const DoSearch = () => {
  const ret = search(searchString.value, searchRange.value);
  if(ret === true){
    store.addSearchText(searchString.value, searchRange.value);
    searchInput.value.blur();
  }
};

// 如果子组件是使用Composition API（例如通过setup函数）定义的，那么它的方法不会自动暴露给外部。
// 在这种情况下，你需要使用defineExpose或者返回一个公开的方法对象。
// 如果不调用这个方法，父组件是无法访问到子组件的方法。
defineExpose({ DoSearch });

const OnListClick = (item: SearchParamsItem) => {
  search(item.searchString, item.searchRange);
  isListFocused.value = false;
  searchInput.value.blur();
};

const router = useRouter();
const search = (q: string, range: SearchRange) : boolean => {
  console.log("SearchBar, q: " + q + ", range: " + range);
  if(q.length === 0){
    toast.error(`请输入搜索关键字。`);
    return false;
  }
  searchString.value = q;
  searchRange.value = range;
  const params: Record<string, string> = { q: q };
  if (range === SearchRange.content){
    router.push({ path: '/Search', query: params });
  }
  else{
    router.push({ path: '/Library', query: params });
  }
  return true;
}

const isInputFocused = ref<boolean>(false)
const OnInputFocus = () => {
  isInputFocused.value = true;
  console.log("isInputFocused, true");
};

const OnInputBlur = () => {
  isInputFocused.value = false;
  console.log("isInputFocused, false");
};

const isListFocused = ref<boolean>(false)
const OnListMouseEnter = () => {
  isListFocused.value = true;
  console.log("isListFocused, true");
};

const OnListMouseLeave = () => {
  isListFocused.value = false;
  console.log("isListFocused, false");
};
</script>

<style scoped>
.full-container {
  margin: 0 auto;
  align-items: center;
  min-width: 200px;
  height: auto;
  min-height: 44px;
  background: var(--background);
  border: 1px solid var(--surface-gray-50);
  border-radius: 22px;
}

.full-container:hover {
  border: 1px solid transparent;
  box-shadow: 0 4px 24px var(--shadow-16);
  border-color: var(--border-black-8);
}

.full-container:focus-within {
  border: 1px solid transparent;
  box-shadow: 0 2px 8px 1px var(--shadow-16);
}

.searchbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 auto;
  width: auto;
  border: none;
}

.searchbar {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  height: 40px;
  width: 100%;
  font-size: 16px;
  outline: none;
  border: none;
  color: var(--surface-gray-900);
  background-color: var(--background);
}

.input-container {
  position: relative;
  display: inline-block;
  flex-grow: 1;
}

.clear-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--surface-gray-500);
  cursor: pointer;
}

.clear-icon:hover {
  color: var(--primary-red-500);
}

.voice-icon {
  display: block;
  width: 42px;
  height: 24px;
  margin-right: 15px;
  font-size: 22px;
  box-sizing: content-box;
  color: var(--primary-red-500);
  fill: var(--primary-red-500);
  cursor: pointer;
}

.search-history-container {
  position: absolute;
  margin: 0 auto;
  height: auto;
  min-width: 200px;
  min-height: 44px;
  align-items: center;
  overflow: hidden;
  background: var(--background);
  border-radius: 0 0 22px 22px;
  box-shadow: 0 9px 8px -3px var(--shadow-16), 8px 0 8px -7px var(--shadow-16), -8px 0 8px -7px var(--shadow-16);
  border: 0;
  z-index: 9999;
}

.divider {
  border-top: 1px solid var(--border-black-8);
  margin: 0 14px;
  padding-bottom: 4px;
}

ul {
  display: block;
  list-style-type: disc;
  margin-block-start: 0em;
  margin-block-end: 0em;
  padding-inline-start: 0px;
}

.list-container {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: auto;
  max-height: 600px;
  font-size: 14px;
  border: none;
  margin-bottom: 15px;
  cursor: default;
  z-index: 9998;
}

.listitem-container {
  display: flex;
  align-items: center;
  /* 这将确保所有子元素包括文本垂直居中 */
  justify-content: space-between;
  padding: 4px 0;
  color: var(--surface-gray-900);
}

.listitem-container:hover {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
}

.listitem-icon {
  display: block;
  width: 42px;
  height: 24px;
  padding-left: 5px;
  font-size: 22px;
  box-sizing: content-box;
  color: var(--primary-gray-500);
  fill: var(--surface-gray-500);
}

.icon {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  vertical-align: top;
  fill: currentColor;
}

.icon svg {
  height: 1em;
  width: 1em;
}
.listitem-text {
  display: flex;
  /* 使用flex布局 */
  align-items: center;
  /* 这将确保文本自身也垂直居中 */
  flex-grow: 1;
  margin: 0 0px;
  text-align: center;
  /* 文本和图标之间的间距 */
  color: currentColor;
}
</style>
