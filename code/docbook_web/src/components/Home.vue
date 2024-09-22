<template>
  <head-bar :inHeadType="HeadType.index" />
  <div id="center">
    <div class="center-container">
      <div class="logo">
        <img alt="KaiJuan" src="@/assets/logo.svg">
      </div>
      <search-bar ref="searchBar" />
      <div class="center-buttons-container">
        <button class="center-item-button" type="button" @click="OnSearch">KaiJuan Search</button>
        <button class="center-item-button" type="button">I'm Feeling Lucky</button>
      </div>
    </div>
  </div>
  <div id="footer">
    <p>Author: <a href="mailto:sunyafu@yeah.net">sunyafu@yeah.net</a></p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import SearchBar from "./Search/SearchBar.vue";
import HeadBar from "./HeadBar.vue";

import HeadType from './ts/HeadType';

// 父组件通过refs调用子组件的方法
const searchBar = ref<any>(null);
const OnSearch = () => {
  if (searchBar.value)
    searchBar.value.DoSearch();
}
</script>

<style scoped>
#footer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
}

#center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  overflow-y: auto;
}

.center-container {
  min-width: 584px;
}
.logo {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  max-height: 92px;
}

.center-buttons-container {
  margin-top: 30px;
}

.center-buttons-container .center-item-button {
  margin: 5px;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 4px;
  color: var(--surface-gray-900);
  background-color: var(--surface-gray-50);
  border: 1px solid var(--border-black-8);
}

.center-buttons-container .center-item-button:hover {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
}
</style>
