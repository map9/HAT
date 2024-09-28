<template>
  <div v-if="props.inBook" ref="bookBriefDiv" class="book-brief">
    <div v-if="(totalWidth>=940) || !(props.inBook.authors && props.inBook.authors.length)" class="book-cover-wrapper">
      <img src="@/assets/book-cover.jpg" :alt="props.inBook.title.title" class="book-cover">
      <div class="book-title-overlay">
        <h3 class="book-title">{{ props.inBook.title.title }}</h3>
      </div>
    </div>
    <div class="book-information">
      <div class="book-information-top">
        <h1 class="">{{props.inBook.title.title}}</h1>
        <p class="book-author" v-html="getBookAuthors(props.inBook)"></p>
        <p class="book-author" v-html="getBookCategories(props.inBook)"></p>
        <p class="book-description">
          {{ props.inBook.description? props.inBook.description : '' }}
        </p>
        <span class="book-update-time">入库时间 {{ props.inBook.date? props.inBook.date : '' }}</span>
      </div>
      <div class="button-group">
        <router-link :to="{ path: '/Reader', 'query':{bid: props.inBook.id}}" class="blue-button-item">阅读</router-link>
        <router-link :to="{ path: '/Reader', 'query':{bid: props.inBook.id}}" class="red-button-item">
          <span><i class="icon-phone">
            <svg xmlns="http://www.w3.org/2000/svg"><path d="M3.3335 4.16565C3.3335 2.78494 4.45278 1.66565 5.8335 1.66565H14.1668C15.5475 1.66565 16.6668 2.78494 16.6668 4.16565V15.8323C16.6668 17.213 15.5475 18.3323 14.1668 18.3323H5.8335C4.45278 18.3323 3.3335 17.213 3.3335 15.8323V4.16565ZM5.00016 4.16565V13.3323C5.00016 13.7926 5.37326 14.1657 5.8335 14.1657H14.1668C14.6271 14.1657 15.0002 13.7926 15.0002 13.3323V4.16565C15.0002 3.70541 14.6271 3.33232 14.1668 3.33232H5.8335C5.37326 3.33232 5.00016 3.70541 5.00016 4.16565ZM10.0002 17.0823C10.5755 17.0823 11.0418 16.6159 11.0418 16.0407C11.0418 15.4654 10.5755 14.999 10.0002 14.999C9.42487 14.999 8.9585 15.4654 8.9585 16.0407C8.9585 16.6159 9.42487 17.0823 10.0002 17.0823Z"/></svg>
          </i>手机扫码读本书</span>
        </router-link>
      </div>
    </div>
    <!--用 svg 实现自定义的 dash -->
    <em v-if="props.inBook.authors && props.inBook.authors.length" class="left-line" >
    </em>
    <div v-if="props.inBook.authors && props.inBook.authors.length" class="carousel" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
      <div class="carousel-inner" :style="{ transform: `translateX(-${currentSlideIndex * 100}%)` }">
        <div class="carousel-item" v-for="(author, index) in props.inBook.authors" :key="index" >
          <div class="author-information">
            <div class="author-information-top">
              <a href="" class="author-icon">
                <img src="https://img2.baidu.com/it/u=2371101480,2399429812&fm=253&fmt=auto&app=138&f=JPEG?w=380&h=429">
              </a>
              <div class="author-introduction">
                <h1>
                  <a class="author-name" href="" target="_blank">{{ author.name }}</a>
                </h1>
                <div class="author-description">
                  <p>{{ author.description? author.description : '' }}</p>
                </div> 
              </div>
            </div>
            <div class="author-other-information">
              <div class="author-works">
                <p>作品</p>
                <em class="color-font-card"></em>
              </div>
              <em class="line"></em>
              <div class="author-life">
                <p>生卒时间</p>
                <em class="color-font-card">{{ author.life ? author.life : '' }}</em>
              </div>
              <em class="line"></em>
              <div class="author-dynasty">
                <p>朝代</p>
                <em class="color-font-card">{{ author.dynasty ? author.dynasty.value : '' }}</em>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="authorCount > 1" class="carousel-indicators">
        <span class="indicator" v-for="(_, index) in props.inBook.authors" :key="index"
        :class="{ active: currentSlideIndex === index }"
        @click="goToSlide(index)"
        ></span>
      </div>
      <button v-if="authorCount > 1 && currentSlideIndex !== 0" class="carousel-control-prev" @click="prevSlide">
        <i class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path d="M609.408 149.376 277.76 489.6a32 32 0 0 0 0 44.672l331.648 340.352a29.12 29.12 0 0 0 41.728 0 30.592 30.592 0 0 0 0-42.752L339.264 511.936l311.872-319.872a30.592 30.592 0 0 0 0-42.688 29.12 29.12 0 0 0-41.728 0z"></path></svg>
        </i>
      </button>
      <button v-if="authorCount>1 && currentSlideIndex !== authorCount - 1" class="carousel-control-next" @click="nextSlide" >
        <i class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path d="M340.864 149.312a30.592 30.592 0 0 0 0 42.752L652.736 512 340.864 831.872a30.592 30.592 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"></path></svg>
        </i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

import { Book } from "../ts/BookDefine";

// 定义外部输入的属性
interface Props {
  inBook: Book | null;
}

const props = withDefaults(defineProps<Props>(), {
  inBook: undefined,
});

const authorCount = computed<number>(()=>{
  if(props.inBook && props.inBook.authors)
    return props.inBook.authors.length;
  else
    return 0;
});

const getBookAuthors = (book: Book)=>{
  if (book.authors && book.authors.length){
    const htmlString: string[] = book.authors.map(author => {
      let itemString = '';
      if (author.dynasty){
        itemString = `<span>[${author.dynasty.value}]</span>&nbsp;&nbsp;`;  
      }
      itemString += `<span class="writer">${author.name}</span>&nbsp;${author.type === undefined? '著' : author.type}`
      return itemString;
    });
    return htmlString.join('&nbsp;&nbsp;<span class="dot">·</span>&nbsp;&nbsp;');
  }
  return '';
}

const getBookCategories = (book: Book)=>{
  if (book.categories && book.categories.length){
    const htmlString: string[] = book.categories.map(categorie => {
      let items = categorie.split("|");
      let itemStrings = items.map(v => `<span>${v}</span>`);
      return itemStrings.join('&nbsp;<span class="dot">·</span>&nbsp;');
    });
    return htmlString.join('&nbsp;&nbsp;|&nbsp;&nbsp;');
  }
  return '';
}

const currentSlideIndex = ref<number>(0);
const slideInterval = ref<any>(undefined);

const nextSlide = () => {
  if (currentSlideIndex.value < authorCount.value - 1) {
    currentSlideIndex.value++;
  }else{
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
  slideInterval.value = setInterval(nextSlide, 5000); // 5秒切换一次
};

const stopAutoPlay = () => {
  clearInterval(slideInterval.value);
};

const bookBriefDiv = ref<HTMLElement | null>(null);
const totalWidth = ref<number>(0);

const updateSize = () => {
  if(bookBriefDiv.value){
    totalWidth.value = bookBriefDiv.value.offsetWidth;
  }
};

onMounted(()=> {
  updateSize(); // 初始尺寸设置
  window.addEventListener('resize', updateSize); // 监听窗口尺寸变化

  startAutoPlay();
});

onUnmounted(()=>{
  window.removeEventListener('resize', updateSize); // 清理监听器

  stopAutoPlay();
});
</script>

<style scoped>
a {
  color: var(--surface-gray-900);
  outline: none;
  text-decoration: none;
}

h1, p {
  margin-block-start: 0px;
  margin-block-end: 0px;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
}

.book-brief {
  display: flex;
  position: relative;
  width: auto;
  margin: 20px 0;
  padding: 32px;
  border-radius: 10px;
  outline: 1px solid transparent;
  box-shadow: 0 4px 24px var(--shadow-16);
  color: var(--surface-gray-900);
  background-color: var(--background);
  box-sizing: border-box;
  text-align: left;
}

.book-cover-wrapper {
  position: relative;
  width: 180px;
  min-height: 240px;
  border-radius: 4px;
  box-shadow: 0 4px 20px var(--shadow-16);
  overflow: hidden;
}

.book-cover{
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-title-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 40px;
  height: 215px;
  color: #191919;
}
.book-title {
  margin: 10px 0;
  font-size: 28px;
}
.book-information {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  padding-left: 15px;
  padding-right: 0px;
}

.book-information h1 {
  height: 42px;
  margin: 0;
  color: var(--surface-gray-900);
  font-size: 28px;
  font-weight: 600;
  line-height: 42px;
  overflow: hidden;
}

.book-information .book-author {
  display: flex;
  margin: 8px 0;
  color: var(--surface-gray-900);
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.book-information .dot {
  color: var(--surface-gray-500);
  margin: 0 3px;
}

.book-information .book-update-time {
  display: inline-block;
  color: var(--surface-gray-500);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: wrap;
}

.book-information .book-description {
  margin: 8px 0;
  font-size: 14px;
  color: var(--surface-gray-500);
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.button-group {
  display: flex;
}

.button-group .blue-button-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  margin-right: 12px;
  border-radius: 4px;
  box-sizing: border-box;
  color: var(--surface-gray-900);
  background-color: var(--surface-gray-50);
  border: 1px solid var(--border-black-8);
  transition: border-color 0.3s;
}

.button-group .red-button-item {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  width: 152px;
  height: 40px;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  vertical-align: middle;
  color: #fff;
  background: var(--primary-red-500);
  border-color: var(--primary-red-500);
  z-index: 1;
}
.button-group .blue-button-item:hover {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
}

.red-button-item .icon-phone {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  vertical-align: middle;
  width: 20px;
  height: 20px;
  margin-right: 2px;
  margin-top: -2px;
  fill: currentColor;
}
.left-line {
  display: inline-block;
  position: relative;
  width: 2px;
  margin-left: 10px;
  border-right: 1px dashed var(--border-black-8);
}

.left-line svg {
  width: 100%;
  height: 100%;
}

.carousel {
  position: relative;
  min-width: 275px;
  max-width: 325px;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.carousel .carousel-inner {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.carousel .carousel-item {
  min-width: 100%;
}
.carousel .carousel-control-prev,
.carousel .carousel-control-next {
  position: absolute;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  top: 50px;/* 50% */
  /*transform: translateY(-50px); 50% */
  width: 30px;
  height: 30px;
  border-radius: 100%;
  font-size: 12px;
  text-align: center;
  color: var(--surface-gray-900);
  background-color: var(--surface-gray-50);
  border: none;
  cursor: pointer;
}

.carousel .icon {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  vertical-align: top;
  height: 1em;
  width: 1em;
  line-height: 1em;
  fill: var(--surface-gray-900);
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

.carousel .carousel-control-prev:hover,
.carousel .carousel-control-next:hover {
  color: var(--primary-red-500);
  background-color: var(--primary-red-50);
}

.carousel .carousel-indicators {
  display: flex;
  position: absolute;
  left: 50%;
  top: 5px;
  transform: translateX(-50%);
}

.carousel .indicator {
  height: 5px;
  width: 5px;
  border-radius: 50%;
  background-color: var(--surface-gray-50);
  margin: 0 5px;
  cursor: pointer;
}

.carousel .indicator.active {
  background-color: var(--primary-red-50);
}

.author-information {
  display: flex;
  position: relative;
  /*flex: 1;*/
  flex-direction: column;
  justify-content: space-between;
  min-width: 275px;
  max-width: 325px;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}
.author-icon {
  display: block;
  position: relative;
  text-align: center;
}
.author-icon img {
  width: 100px;
  height: 100px;
  border-radius: 100%;
  border: 1px solid var(--border-black-8);
  box-shadow: 0 3px 16px var(--shadow-16);
  transition: all .2s ease;
}
.author-introduction {
  /*margin-top: 9px;*/
}
.author-introduction h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0px;
}
.author-introduction .author-name {
  color: var(--surface-gray-900);
  font-size: 20px;
  font-weight: 600;
  line-height: 26px;
}
.author-description {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: space-between;
  margin: 0 15px;
  font-size: 14px;
  color: var(--surface-gray-500);
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}
.author-other-information {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  margin: 12px 15px 0;
  font-size: 14px;
}
.author-works, .author-life, .author-dynasty {
  position: relative;
  text-align: center;
  height: 36px;
  color: var(--surface-gray-900);
  font-size: 14px;
  font-weight: 400;
  line-height: 17px;
}

.author-works em,
.author-life em,
.author-dynasty em {
  color: var(--surface-gray-500);
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  font-style: normal;
}

.line {
  display: block;
  width: 1px;
  height: 36px;
  margin-left: 12px;
  margin-right: 12px;
  transform-origin: 50% 100%;
  background-color: var(--border-black-8);
}


</style>
