<template>
  <head-bar :inHeadType="HeadType.reader" :in-search-string="searchString" :in-search-range="searchRange" />

  <div id="center" ref="centerDiv">
    <BookBrief v-if="chapterId==undefined" :in-book="bookCatalogue" />
    <BookCatalogue v-if="chapterId==undefined" :in-book="bookCatalogue" :is-dialog="false" />
    <BookReader v-if="chapterId!==undefined"  @notify:chapter="OnReaderChapter" @notify:catalogue="OnReaderCatalogue"
    :in-book-id="bookId" :in-chapter-id="chapterId"
    :inIsPageMode="currentThemeParameters.isPageMode"
    :in-top="position.top" :in-Bottom="position.top+position.height"/>
  </div>
  <div id="toolbar" v-if="chapterId!==undefined" :style="{top: position.top+20+'px', left: position.left+position.width+'px'}">
    <toolbar @notify="OnToolbar" :is-night-mode="isNightMode"/>
  </div>
  <div id="settingpanel" v-if="showSetting" :style="{top: position.top+'px', right: position.right+'px'}">
    <SettingsPanel @close="OnSettingPanelClose" @update="OnSettingPanelUpdate"
    :in-theme-parameters="currentThemeParameters" :isClosed="!showSetting"/>
  </div>
  <div id="catalogue" v-if="showCatalogue" :style="{left: position.left+'px', top: position.top+'px', right: position.right+'px', height: position.height+'px'}">
    <BookCatalogue @close="OnCatalogueClose" :in-book="bookCatalogue" :is-dialog="true"/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { themeParameters, ThemeHelper} from './ts/ThemeHelper';

import HeadBar from "./HeadBar.vue";
import BookBrief from './Books/BookBrief.vue';
import BookCatalogue from './Books/BookCatalogue.vue';
import BookReader from './Books/BookReader.vue';
import Toolbar from './Helper/Toolbar.vue';
import SettingsPanel from './Helper/SettingsPanel.vue';

import LoadingStatus from "./ts/LoadingStatus";
import { Book, SearchRange } from "./ts/BookDefine";
import { getStringParam } from "./ts/Helper"
import HeadType from './ts/HeadType';
import { getBookCatalogue } from './ts/BookServiceHelper';
import { Bottom } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

const centerDiv = ref<HTMLElement | null>(null);

// 使用 ref 创建本地响应式状态
const searchString = ref<string | undefined>();
const searchRange = ref<SearchRange>(SearchRange.book);
const bookId = ref<string | undefined>();
const chapterId = ref<string | undefined>();

const bookCatalogue = ref<Book>();

const loadingStatus = ref(LoadingStatus.idle);

// This section for Theme operator.
const themeHelper = new ThemeHelper();
const currentThemeParameters = ref<themeParameters>({
  currentTheme: 0,
  currentSurfaceFont: 0,
  currentFontSize: 18,
  currentPageSize: 3,
  isPageMode: true,
});
var lastDayId = 0;
const isNightMode = computed<boolean>(() => {
  return themeHelper.isNightTheme(currentThemeParameters.value.currentTheme)
});
const showSetting = ref<boolean>(false);
const showCatalogue = ref<boolean>(false);

// This section for get component position for change settingpanel and toolbar component position. 
const position = ref<{ left: number, top:number, width:number, height:number, right:number }>({top: 0, left: 0, width: 0, height: 0, right: 0});
const updateSize = () => {
  if (centerDiv.value) {
    const computedStyle = window.getComputedStyle(centerDiv.value);
    position.value.top = centerDiv.value.offsetTop;
    position.value.left = centerDiv.value.offsetLeft;
    position.value.width = centerDiv.value.offsetWidth + parseFloat(computedStyle.marginRight);
    position.value.height = window.innerHeight - position.value.top;
    position.value.right = window.innerWidth - (centerDiv.value.offsetLeft + centerDiv.value.offsetWidth);
    //console.debug(`${positionXY.value.left}, ${computedStyle.marginRight}`);
  }
};

const DoSearch = (bid: string) => {
  getBookCatalogue(bid, (d) => {
    bookCatalogue.value = d;
    if (bookCatalogue.value){
      searchString.value = bookCatalogue.value.title.title;
    } else {
      searchString.value = "";
    }
    if (searchString.value.length > 0) {
      document.title = searchString.value + ' - 开卷 阅读';
    }else{
      document.title = '开卷 阅读';
    }
  });
}

// watch监听路由变化，当router采用createWebHistory模式时，即使URL已经发生变化，watch函数不会被调用。
watch(() => route.query.bid, (newValue) => {
  if (newValue != undefined) {
    bookId.value = newValue as string;
    DoSearch(bookId.value);
  }
});

watch(() => route.query.cid, async (newValue) => {
  if (newValue != undefined) {
    chapterId.value = newValue as string;
  }else{
    chapterId.value = undefined;
    await nextTick();
    //centerDiv.value?.scrollIntoView({ behavior: 'smooth' });
    document.documentElement.scrollIntoView({ behavior: 'smooth' });
  }
});

// 初始化时，导入路由跳转传递的参数
// 由于路由跳转时，组件可能未被渲染，因此，采用异步方式来接收参数
onMounted(async () => {
  await nextTick();

  bookId.value = getStringParam(route, 'bid');
  if(bookId.value){
    DoSearch(bookId.value);
  }
  chapterId.value = getStringParam(route, 'cid');

  themeHelper.setTheme(currentThemeParameters.value.currentTheme);
  themeHelper.setFontFamily(currentThemeParameters.value.currentSurfaceFont);
  themeHelper.setFontSize(currentThemeParameters.value.currentFontSize);
  themeHelper.setPageSize(currentThemeParameters.value.currentPageSize);
  updateSize(); // 初始尺寸设置
  window.addEventListener('resize', updateSize); // 监听窗口尺寸变化
});

onUnmounted(()=>{
  window.removeEventListener('resize', updateSize); // 清理监听器
});

// ReadChapter component chapter change message
const OnReaderChapter = (chapterNum: number) => {

}

// ReadChapter catalogue message
const OnReaderCatalogue = () => {
  showCatalogue.value = true;
  console.log(`${showCatalogue.value}`);
}

const OnToolbar = (event:string) => {
  if(event === 'brief'){
    if(bookId.value){
      const params: Record<string, string> = { bid: bookId.value };
      router.push({ path: '/Reader', query: params });
    }else{
      console.error(`Can't find bookId: ${bookId.value} is undefined.`);
    }
  }else if(event === 'catalogue'){
    showCatalogue.value = !showCatalogue.value;
  }else if(event === 'theme'){
    if(themeHelper.isNightTheme(currentThemeParameters.value.currentTheme)){
      var id = themeHelper.setTheme(lastDayId);
      if(typeof id === 'number'){
        currentThemeParameters.value.currentTheme = id;
      }
    }else{
      lastDayId = currentThemeParameters.value.currentTheme || 0;
      var id = themeHelper.setNightTheme();
      if(typeof id === 'number'){
        currentThemeParameters.value.currentTheme = id;
      }
    }  
  }else if(event === 'setting'){
    showSetting.value = !showSetting.value;
  }else if(event === 'top'){
    
  }
}

const OnSettingPanelClose = () => {
  showSetting.value = false;
}

const OnSettingPanelUpdate = (event:string, param:any) => {
  if(event === 'pagesize'){
    var pageSize = param as number;
    if(pageSize === 0){
      pageSize = window.innerWidth - 130;
      document.documentElement.style.setProperty('--page-size', `${pageSize}px`);
    }
    updateSize();
  }else if(event === 'readmode'){
    
  }else{
  }
}

const OnCatalogueClose = () => {
  showCatalogue.value = false;
}

</script>

<style scoped>
#center {
  position: relative;
  flex-grow: 1;
  justify-content: center;
  margin: auto 10px;
  z-index: 3;
}

#toolbar {
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 4;
}

#settingpanel {
  position: fixed;
  top: 0px;
  right: 0px;
  z-index: 4;
}

#catalogue {
  position: fixed;
  top: 0px;
  left: 0px;
  z-index: 5;
}
</style>
