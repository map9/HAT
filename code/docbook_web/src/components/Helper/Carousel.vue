<template>
  <div class="carousel" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
    <div class="carousel-inner" :style="{ transform: `translateX(-${currentSlideIndex * 100}%)` }">
      <div class="carousel-item" v-for="(colorx, index) in colors" :key="index">
        <div :style="{ background: `${colorx}`}">
        </div>
      </div>
    </div>
    <div v-if="colors.length > 1" class="carousel-indicators">
      <span
        class="indicator"
        v-for="(colorx, index) in colors"
        :key="index"
        :class="{ active: currentSlideIndex === index }"
        @click="goToSlide(index)"
      ></span>
    </div>
    <button v-if="colors.length > 1 && currentSlideIndex !== 0" class="carousel-control-prev" @click="prevSlide">
      <i class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M609.408 149.376 277.76 489.6a32 32 0 0 0 0 44.672l331.648 340.352a29.12 29.12 0 0 0 41.728 0 30.592 30.592 0 0 0 0-42.752L339.264 511.936l311.872-319.872a30.592 30.592 0 0 0 0-42.688 29.12 29.12 0 0 0-41.728 0z"></path></svg>
      </i>
    </button>
    <button v-if="colors.length>1 && currentSlideIndex !== colors.length - 1" class="carousel-control-next" @click="nextSlide" >
      <i class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M340.864 149.312a30.592 30.592 0 0 0 0 42.752L652.736 512 340.864 831.872a30.592 30.592 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"></path></svg>
      </i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const colors = ref([
  'blue',
  'green',
  'red',
  'yellow',
  'orange',
  // 添加更多图片路径
]);

const currentSlideIndex = ref(0);
const slideInterval = ref<any>(undefined);

const nextSlide = () => {
  if (currentSlideIndex.value < colors.value.length - 1) {
    currentSlideIndex.value++;
  }else{
    console.log(currentSlideIndex.value);
    currentSlideIndex.value = 0;
  }
};

const prevSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--;
  }
};

const goToSlide = (index:number) => {
  currentSlideIndex.value = index;
};

const startAutoPlay = () => {
  stopAutoPlay();
  slideInterval.value = setInterval(nextSlide, 30000); // 3秒切换一次
};

const stopAutoPlay = () => {
  clearInterval(slideInterval.value);
};

onMounted(startAutoPlay);
onUnmounted(stopAutoPlay);
</script>

<style scoped>
.carousel {
  position: relative;
  overflow: hidden;
}

.carousel .carousel-inner {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.carousel .carousel-item {
  min-width: 100%;
}

.carousel .carousel-item div {
  width: 100%;
  height: 300px;
  display: block;
}

.carousel .carousel-control-prev, .carousel .carousel-control-next {
  display: inline-flex;
  position: absolute;
  justify-content: center;
  align-items: center;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  font-size: 12px;
  text-align: center;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 100%;
  cursor: pointer;
}

.carousel .icon {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 1em;
  width: 1em;
  font-size: 12px;
  font-weight: 400;
  vertical-align: top;
  line-height: 1em;
  fill: currentColor;
}

.icon svg {
  height: 1em;
  width: 1em;
}

.carousel .carousel-control-prev {
  left: 10px;
}

.carousel .carousel-control-next {
  right: 10px;
}

.carousel .carousel-indicators {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.carousel .indicator {
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background-color: gray;
  margin: 0 5px;
  cursor: pointer;
}

.carousel .indicator.active {
  background-color: white;
}
</style>
