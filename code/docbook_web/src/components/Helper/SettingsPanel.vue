<template>
  <div v-if="isClosed==false" class="settings-panel">
    <h3>设置</h3>
    <!-- 阅读主题选择 -->
    <div class="settings-categroy">
      <span class="settings-categroy-name">阅读主题</span>
      <div class="settings-categroy-body">
        <button v-for="(color, index) in backgroundColors" :key="index"
              :style="{ backgroundColor: color }"
              :class="index==localThemeParameters.currentTheme? 'theme-color-option checked':'theme-color-option'"
              @click="changeBackgroundColor(index)"><span v-if="index==localThemeParameters.currentTheme">&#10003</span></button>
      </div>
    </div>
    <!-- 字体选择 -->
    <div class="settings-categroy">
      <span class="settings-categroy-name">正文字体</span>
      <div class="settings-categroy-body">
        <button v-for="(font, index) in surfaceFonts" :key="index"
              :style="{ 'font-family': font.fontFamilys }"
              :class="index==localThemeParameters.currentSurfaceFont? 'font-family-option checked':'font-family-option'"
              @click="changeSurfaceFont(index)">{{ font.name }}</button>
      </div>
    </div>
    <!-- 字体大小调整 -->
    <div class="settings-categroy">
      <span class="settings-categroy-name">字体大小</span>
      <div class="settings-categroy-body font-size-body">
        <button class="font-size-option" @click="changeFontSize(-2)">A-</button>
        <span class="font-size-option text">{{ localThemeParameters.currentFontSize }}</span>
        <button class="font-size-option" @click="changeFontSize(2)">A+</button>
      </div>
    </div>
    <!-- 页面宽度 -->
    <div class="settings-categroy">
      <span class="settings-categroy-name">页面宽度</span>
      <div class="settings-categroy-body">
        <button v-for="(pageSize, index) in pageSizes" :key="index"
              :class="index==localThemeParameters.currentPageSize? 'page-size-option checked': 'page-size-option'"
              @click="changePageSize(index, pageSize)">{{ pageSize == 0? 'Auto' : pageSize }}</button>
      </div>
    </div>
    <!-- 阅读模式切换 -->
    <div class="settings-categroy">
      <span class="settings-categroy-name">阅读模式</span>
      <div class="settings-categroy-body">
        <button :class="localThemeParameters.isPageMode? 'read-mode-option checked': 'read-mode-option'" @click="toggleReadMode(true)">章节翻页</button>
        <button :class="!localThemeParameters.isPageMode? 'read-mode-option checked': 'read-mode-option'" @click="toggleReadMode(false)">滚动翻页</button>
      </div>
    </div>
    <!-- 关闭按钮 -->
    <button class="closebutton" @click="close">
      <span>&#x2715;</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, withDefaults, watchEffect } from 'vue';

import { themeParameters, ThemeHelper} from '../ts/ThemeHelper';

const themeHelper = new ThemeHelper();
const backgroundColors = themeHelper.getBackgroundColors();
const surfaceFonts = themeHelper.getFontFamilys();
const fontSizeBound = themeHelper.getFontSizeBound();
const pageSizes = themeHelper.getPageSizes();

// 定义外部输入的属性
interface Props {
  inThemeParameters?: themeParameters;
  isClosed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  inThemeParameters: ()=> {
    return {
      currentTheme: 0,
      currentSurfaceFont: 0,  // 黑体
      currentFontSize: 18,
      currentPageSize: 1,     // 800
      isPageMode: true,
    }
  },
  isClosed: true,
});

// 将外部属性导入本地ref中
const localThemeParameters = ref<themeParameters>(props.inThemeParameters);
const isClosed = ref<boolean>(props.isClosed);

// 更新本地副本以匹配 prop 的当前状态
watchEffect(() => {
  localThemeParameters.value = props.inThemeParameters;
  isClosed.value = props.isClosed;
});

// 由于是对象传递，所以，当本地引用改变时，外部传递的对象内部对象已经被本地引用改变。
// 因此， emit仅仅是通知对象已经被修改了。
const emit = defineEmits([
  'update',
  'close',
]);

const changeBackgroundColor = (index:number) => {
  if(localThemeParameters.value.currentTheme == index) return;
  
  localThemeParameters.value.currentTheme = index;
  themeHelper.setTheme(index);
  emit('update');
};

const changeSurfaceFont = (index:number) => {
  if(localThemeParameters.value.currentSurfaceFont == index) return;
  localThemeParameters.value.currentSurfaceFont = index;
  themeHelper.setFontFamily(index);
  emit('update');
}

const changeFontSize = (increment:number) => {
  localThemeParameters.value.currentFontSize = Math.max(fontSizeBound[0], Math.min(fontSizeBound[1], localThemeParameters.value.currentFontSize + increment));
  themeHelper.setFontSize(localThemeParameters.value.currentFontSize);
  emit('update');
};

const changePageSize = (index:number, pageSize:number) => {
  if(localThemeParameters.value.currentPageSize == index) return;
  localThemeParameters.value.currentPageSize = index;
  themeHelper.setPageSize(localThemeParameters.value.currentPageSize);
  emit('update', 'pagesize', pageSize);
}

const toggleReadMode = (mode:boolean) => {
  if(localThemeParameters.value.isPageMode == mode) return;
  localThemeParameters.value.isPageMode = !localThemeParameters.value.isPageMode;
  emit('update', 'readmode', localThemeParameters.value.isPageMode);
}

const close = () => {
  isClosed.value = true;
  emit('close');
}

</script>

<style scoped>
button {
  border: none;
  outline: none;
  padding: 0;
  border-radius: 0px;
  cursor: pointer;
}
.settings-panel {
  position: relative;
  /*top: 30px;
  right: 50px;*/
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px var(--shadow-16);
  background: var(--background);
  z-index: 1000;
}
.settings-panel h3 {
  font-size: 24px;
  line-height: 32px;
  font-weight: 500;
  text-align: left;
  margin-block-start: 0;
  margin-block-end: 1em;
  color: var(--surface-gray-900);
}
.settings-categroy {
  display: flex;
  align-items: center;
}
.settings-categroy button {
  height: 36px;
  text-align: center;
  vertical-align: middle;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  color: var(--surface-gray-900);
  background-color: var(--surface-gray-50);
  border: 1px solid var(--border-black-8);
  transition: border-color 0.3s;
}
.settings-categroy button:hover {
  color: var(--primary-red-500);
  border-color: var(--primary-red-500);
  background-color: var(--primary-red-50);
  box-shadow: 0 1px 4px var(--shadow-16);
}

.settings-categroy .checked {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
  border-color: var(--primary-red-500);
}

.settings-categroy-name {
  padding-right: 12px;
  margin-right: 16px;
  font-size: 12px;
  line-height: 20px;
  font-weight: 500;
  color: var(--surface-gray-500);
}
.settings-categroy-body {
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}
.settings-categroy-body .theme-color-option {
  display: inline-block;
  width: 36px;
  height: 36px;
  border-radius: 100%;
}
.settings-categroy-body .theme-color-option:not(:last-of-type)  {
  margin-right: 5px;
}
.settings-categroy-body .font-family-option {
  display: inline-block;
  width: 33.333%;
  margin: 0 3px;
}
.font-size-body {
  border-radius: 8px;
  border: 1px solid var(--border-black-8);
  background-color: var(--surface-gray-50);
  overflow: hidden;
}
.settings-categroy-body .font-size-option {
  position: relative;
  height: 36px;
  width: 33.333%;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  font-size: 20px;
  border-radius: 0px;
  background-color: transparent;
  border: none;
}
.settings-categroy-body .font-size-option:first-child:hover,
.settings-categroy-body .font-size-option:last-child:hover {
  color: var(--primary-red-500);
  background-color: var(--surface-gray-100);
}
.settings-categroy-body .text {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: auto;
  font-size: 20px;
  font-weight: 600;
  color: var(--surface-gray-500);
}
.settings-categroy-body .font-size-option:not(:last-child)::after{
  position: absolute;
  width: 1px;
  height: 22px;
  right: 0px;
  top: 7px;
  content: '';
  box-sizing: border-box;
  border-right: 1px solid var(--border-black-8);
}
.settings-categroy-body .page-size-option {
  width: 20%;
  margin: 0 3px;
  padding: 0 5px;
  text-align: center;
}
.settings-categroy-body .read-mode-option {
  width: 50%;
  margin: 0 3px;
  padding: 0 5px;
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
.noise-bg {
background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAAAXNSR…qy6fUEbRs1CruoCM5zlPaIIL6/biLs0edft/d7IfjhT9gfL6wnSxDYPyIAAAAASUVORK5CYII=);
background-attachment: scroll;
}

</style>
