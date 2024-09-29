<template>
  <div v-if="queryRange && queryResultCount" class="hit-text">
    <p>搜索{{ queryRange }}本书籍，共发现{{ queryResultCount }}个结果：</p>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';

interface Props {
  queryRange?: number;
  queryResultCount?: number;
}
const props = defineProps<Props>();

watch(() => props.queryRange, (newValue) => {
  if (newValue !== undefined) {
  }
});

watch(() => props.queryResultCount, (newValue) => {
  if (newValue !== undefined) {
  }
});

</script>

<style scoped>
.hit-text {
  line-height: 20px;
  font-size: 14px;
  text-align: left;
  color: var(--surface-gray-500);
}
</style>
