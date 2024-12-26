<template>
  <div class="loading-container" v-if="inIsLoading">
    <svg class="loading-svg" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="20" fill="none" stroke="#3498db" stroke-width="8" stroke-linecap="round" stroke-dasharray="80" stroke-dashoffset="60">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>
    <div class="loading-text" v-if="inLoadingText !== undefined && inLoadingText !== null">{{ inLoadingText }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  inIsLoading: boolean;
  inLoadingText: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  inIsLoading: true,
  inLoadingText: null,
});
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
}

.loading-svg {
  width: 10px;
  height: 10px;
  margin-bottom: 5px;
}

.loading-text {
  font-size: 0.2em;
  color: #555;
}
</style>
