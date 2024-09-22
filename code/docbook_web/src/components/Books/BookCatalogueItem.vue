<template>
  <label v-if="props.inDivision && props.inDivision != props.inBook" for="vol97698856" @click="OnExpand(props.inDivision)">
    <div class="volume-header">
      <h3 class="volume-name">{{ props.inDivision.title.title }}<!---<span v-if="volume.title.length>0" class="dot">·</span>共{{volume.chapters? volume.chapters.length : 0}}章--></h3>
      <div class="volume-operate">
        <label class="volume-col" for="vol97698856">
          <i class="icon">
            <svg :style="(props.inDivision.collapse === undefined || props.inDivision.collapse === false)? { transform: 'rotate(180deg)' } : { transform: 'rotate(0deg)' }" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M512 685.248L233.376 406.624l45.248-45.248L512 594.752l233.376-233.376 45.248 45.248z" /></svg>
          </i>
        </label>
      </div>
    </div>
  </label>
  <template v-for="(item, index) in bookCatalogueParts" :key="index">
    <div class="catalogue-volume">
      <ul v-if="isChapter(item) && (props.inDivision.collapse === undefined || props.inDivision.collapse === false)" class="volume-chapters">
        <li class="chapter-item" v-for="(chapter, indexc) in item.divisions" :key="indexc">
          <button class="chapter-name" @click="OnChapter(chapter.id)">{{ chapter.title.title }}</button>
        </li>
      </ul>
      <template v-if="isChapter(item) === false">
        <!--循环组件消息回传也需要建立循环。 @close="close"-->
        <BookCatalogueItem 
          v-for="child in item.divisions"
          :key="child.id"
          :inBook="props.inBook"
          :inDivision="child"
          @close="close"
        />
      </template>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';

import { useRouter } from 'vue-router';

import { Book, DivisionType } from "../ts/BookDefine";

const router = useRouter();

// 定义外部输入的属性
interface Props {
  inBook: Book;
  inDivision: Book | Division;
}

var props = withDefaults(defineProps<Props>(), {
  inBook: undefined,
  inDivision: undefined,
});

interface BookCataloguePart {
  type: DivisionType;
  divisions: Division[];
}

const bookCatalogueParts = ref<BookCataloguePart[]>()

const computeBookCatalogueParts = (inBook: Book | Division | null) => {
  var _bookCatalogueParts: BookCataloguePart[] = [];
  var _bookCataloguePart: BookCataloguePart = undefined

  for (var division of inBook.divisions){
    if (division.type != DivisionType.VOLUME && division.type != DivisionType.CHAPTER){
      console.log(`division type error: ${division}`)
      continue;
    }

    if(_bookCataloguePart && division.type != _bookCataloguePart.type){
      _bookCatalogueParts.push(_bookCataloguePart)
      _bookCataloguePart = undefined
    }

    if (_bookCataloguePart == undefined){
      _bookCataloguePart = {
        type: division.type,
        divisions: [],
      }
    }

    _bookCataloguePart.divisions.push(division);
  }

  if(_bookCataloguePart){
    _bookCatalogueParts.push(_bookCataloguePart)
    _bookCataloguePart = undefined
  }

  return _bookCatalogueParts
};

const isChapter = (bookCataloguePart: BookCataloguePart): boolean => {
  return bookCataloguePart.type == DivisionType.CHAPTER;
}

// 初始化时，导入路由跳转传递的参数
// 由于路由跳转时，组件可能未被渲染，因此，采用异步方式来接收参数
onMounted(async () => {
  await nextTick();

  bookCatalogueParts.value = computeBookCatalogueParts(props.inDivision)
});

watch(() => props.inDivision, (newDivision) => {
  if (newDivision) {
    bookCatalogueParts.value = computeBookCatalogueParts(newDivision);
  }
});

const OnExpand = (division)=>{
  division.collapse = !division.collapse;
} 

const OnChapter = (cno:number) => {
  const params: Record<string, string | number> = { bid: props.inBook.id, cid: cno };
  router.push({ path: '/Reader', query: params });
  close();
}

const emit = defineEmits([
  'close',
]);

const close = () => {
  emit('close');
}
</script>

<style scoped>
button {
  border: none;
  outline: none;
  padding: 0;
  border-radius: 0px;
  background-color: transparent;
  cursor: pointer;
}

label {
  cursor: pointer;
}

.book-catalogue {
  display: flex;
  flex-direction: column;
  width: auto;
  height: 100%;
  /*margin: 20px 0;*/
  padding: 32px 32px 32px 32px;
  outline: 1px solid transparent;
  border-radius: 10px;
  background: var(--background);
  box-shadow: 0 4px 24px var(--shadow-16);
  box-sizing: border-box;
  text-align: left;
}

.book-catalogue div {
  display: block;
  margin: 0;
  padding: 0;
}

.book-catalogue .catalogue-header {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 32px;
}
.catalogue-header .catalogue-header-infos {
  display: flex;
  flex-grow: 1;
}
.catalogue-header p {
  margin-block-start: 0px;
  margin-block-end: 0px;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
}
.catalogue-header-infos .catalogue-header-title {
  display: inline-block;
  margin-bottom: 8px;
  margin-top: 8px;
  pointer-events: none;
  font-size: 28px;
  line-height: 32px;
  font-weight: 600;
  vertical-align: top;
  color: var(--surface-gray-900);
}

.catalogue-header-infos .catalogue-header-operate {
  position: relative;
}

.catalogue-header-operate .catalogue-header-oi {
  display: inline-block;
  padding: 10px 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--surface-gray-900);
  background-color: var(--background);
}

.catalogue-header-operate .catalogue-header-oi:hover {
  border-radius: 8px;
  color: var(--primary-red-500);
  background: var(--primary-red-50);
}

.catalogue-header-operate .catalogue-header-oi .icon {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 1em;
  width: 1em;
  font-size: 20px;
  font-weight: 400;
  line-height: 1em;
  vertical-align: top;
  fill: currentColor;
}

.icon svg {
  height: 1em;
  width: 1em;
}

.book-catalogue .catalogue-all {
  flex-grow: 1; /* 让 catalogue-items 占据所有剩余空间 */
  padding: 0 16px;
  overflow: auto;
}

.book-catalogue .volume-header {
  position: relative;
  padding: 0 16px;
  margin: 0 0 10px 0;
  border-radius: 8px;
  background: var(--surface-gray-50);
}

.catalogue-volume .volume-name {
  padding: 11px 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  color: var(--surface-gray-900);
}

.catalogue-volume .volume-name .dot {
  margin: 0 3px;
}

.catalogue-volume .volume-operate {
  position: absolute;
  right: 16px;
  top: 10px;
  font-size: 0;
  z-index: 2;
}

.catalogue-volume .volume-col {
  display: inline-block;
  height: 28px;
  padding: 8px;
  margin-left: 8px;
  margin-right: -8px;
  box-sizing: border-box;
  color: var(--surface-gray-900);
}

.catalogue-volume .volume-col .icon {
  display: inline-block;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 1em;
  width: 1em;
  padding-left: 10px;
  margin-right: 10px;
  line-height: 1em;
  border-left: 1px solid var(--border-black-8);
  font-size: 14px;
  font-weight: 400;
  vertical-align: top;
  fill: currentColor;
}

.catalogue-volume .volume-chapters {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  margin-bottom: 20px;
}

.volume-chapters .chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 33.33333%;
  padding: 0 16px;
  border-radius: 8px;
  box-sizing: border-box;
}
.volume-chapters .chapter-item:hover {
  color: var(--primary-red-500);
  background: var(--primary-red-50);
}

.volume-chapters .chapter-name {
  display: block;
  padding: 8px 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 22px;
  overflow: hidden;
  color: var(--surface-gray-900);
}

.volume-chapters .chapter-item:hover .chapter-name {
  color: var(--primary-red-500);
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

</style>