<template>
  <div id="header">
    <div class="header-container">
      <!-- 左侧按钮组 -->
      <div v-if="$props.inHeadType==HeadType.index" class="header-item-group">
        <a href="" class="header-item-links">About</a>
        <a href="" class="header-item-links">Help</a>
      </div>
      <div v-else class="header-item-group">
        <router-link to="/" class="header-item-links">
          <div class="logo" >
            <img alt="KaiJuan" src="@/assets/logo.svg">
          </div>
        </router-link>
        <div class="header-item-warper">
          <div>
            <search-bar :in-search-string="searchString" :in-search-range="searchRange"/>
          </div>
        </div>
      </div>
      <!-- 右侧按钮组 -->
      <div class="header-item-group">
        <router-link v-if="props.inHeadType==HeadType.library || props.inHeadType==HeadType.reader" to="/" class="header-item-links">Search</router-link>
        <router-link v-if="props.inHeadType!=HeadType.library "  to="/Library" class="header-item-links">Library</router-link>
        <a href="" class="header-item-links grid">
          <i class="icon">
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M170.666667 170.666667h170.666666v170.666666H170.666667z m256 0h170.666666v170.666666h-170.666666z m256 0h170.666666v170.666666h-170.666666zM170.666667 426.666667h170.666666v170.666666H170.666667z m256 0h170.666666v170.666666h-170.666666z m256 0h170.666666v170.666666h-170.666666zM170.666667 682.666667h170.666666v170.666666H170.666667z m256 0h170.666666v170.666666h-170.666666z m256 0h170.666666v170.666666h-170.666666z" /></svg>
          </i>
        </a>
        <button class="header-item-button" type="button">Sign in</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SearchBar from "./Search/SearchBar.vue";

import { SearchRange } from "./ts/BookDefine";
import HeadType from "./ts/HeadType"

// 定义外部输入的属性
interface Props {
  inHeadType?: HeadType;
  inSearchString?: string;
  inSearchRange?: SearchRange;
}
var props = withDefaults(defineProps<Props>(), {
  inHeadType: HeadType.index,
  inSearchString: '',
  inSearchRange: SearchRange.content,
});

const searchString = computed(()=>{
  return props.inSearchString;
});
const searchRange = computed(()=>{
  return props.inSearchRange;
});

</script>

<style scoped>
#header {
  position: sticky;
  top: 0px;
  /*height: 50px;*/
  /*min-width: 1024px;*/
  z-index: 999;
  background-color: var(--background);
}

#header .header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
}

#header .header-item-group {
  display: flex;
  align-items: center;
}

#header .header-item-links {
  display: inline-block;
  padding: 5px;
  font-size: 14px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-decoration: none;
  color: var(--surface-gray-900);
  box-sizing: border-box;
}

#header .header-item-button {
  position: relative;
  min-width: 100px;
  height: 36px;
  padding: 0px 23px;
  font-size: 14px;
  font-weight: bold;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #fff;
  background-color: var(--primary-red-500);
}

#header .header-item-links:hover {
  text-decoration: underline;
}

#header .header-item-button:hover {
  box-shadow: 0 4px 24px var(--shadow-16);
}

#header .grid {
  display: block;
  width: 25px;
  height: 25px;
  font-size: 22px;
  box-sizing: content-box;
}

#header .grid:hover {
  border-radius: 50%;
  color: var(--primary-red-500);
  background: var(--primary-red-50);
}

.grid .icon {
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

/* 让包含 search-bar 的左侧 header-item-group 填充所有可用空间 */
#header .header-item-group:first-child {
  flex-grow: 1;
}

#header .header-item-group:first-child .header-item-button:not(:last-child),
.header-item-group:first-child .header-item-links:not(:last-child) {
  margin-right: 15px;
}

#header .header-item-group:last-child .header-item-button:not(:first-child),
.header-item-group:last-child .header-item-links:not(:first-child) {
  margin-left: 15px;
}

#header .header-item-warper {
  width: 100%;
  padding: 0 10px 0 0;
}

#header .logo {
  position: relative;
  height: 40px;
  width: 130px;
  text-align: left;
}

#header .logo img{
  height: 100%;
}
</style>
