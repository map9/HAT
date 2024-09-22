<template>
  <div v-if="searchTargetCount && resultPiecesCount" class="hit-text">
    <p>搜索{{ searchTargetCount }}本书籍，共发现{{ resultPiecesCount }}个结果：</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  searchTargetCount: number;
  resultPiecesCount: number;
}
defineProps<Props>();

</script>

<style scoped>
.hit-text {
  line-height: 20px;
  font-size: 14px;
  text-align: left;
  color: var(--surface-gray-500);
}
</style>
