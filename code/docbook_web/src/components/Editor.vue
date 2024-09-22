<template>
  <head-bar :inHeadType="HeadType.search"/>

  <div id="center"  ref="centerDiv">
    <BookEditor />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';

import BookEditor from './Books/BookEditor.vue';
import HeadBar from './HeadBar.vue';

import HeadType from './ts/HeadType';

const centerDiv = ref<HTMLElement | null>(null);

const updateSize = () => {
  if (centerDiv.value) {
    const computedStyle = window.getComputedStyle(centerDiv.value);
    centerDiv.value.setAttribute("style", `height: ${window.innerHeight - centerDiv.value.offsetTop}px;`);
  }
};

onMounted(async () => {
  updateSize(); // 初始尺寸设置
  window.addEventListener('resize', updateSize); // 监听窗口尺寸变化

  await nextTick();
});

onUnmounted(()=>{
  window.removeEventListener('resize', updateSize); // 清理监听器
});

</script>

<style scoped>
#center {
  flex-grow: 1;
  justify-content: center;
  z-index: 3;
  margin: auto 10px;
}

</style>
