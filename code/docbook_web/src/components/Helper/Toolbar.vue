<template>
  <div class = "toolbar">
    <div class = "item" >
      <button @click="onClick('brief')">
        <span class = "icon">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M924.2624 142.1824h-255.42656c-48.4096 0-93.9008 17.88416-128.19456 50.47808-11.6736 11.06944-20.79744 23.83872-28.70272 37.0944-7.9104-13.25568-17.02912-25.9072-28.8256-37.0944-34.304-32.59392-79.79008-50.47296-128.19968-50.47296H99.7376c-13.49632 0-24.44288 10.33216-24.44288 23.22944V807.3728c0 12.89216 10.94656 23.22944 24.448 23.22944h229.75488c9.61024 0 19.34336 0.73216 29.07136 2.54976 9.85088 1.83296 19.21536 4.38272 28.09344 7.79264l116.4032 43.05408c0.24064 0.11776 0.4864 0 0.72704 0.11776 2.67776 0.85504 5.35552 1.4592 8.15104 1.4592 2.80064 0 5.46816-0.48128 8.15104-1.4592 0.11776-0.11776 0.4864-0.11776 0.60928-0.11776l111.77472-41.35424a203.5456 203.5456 0 0 1 32.96256-9.00096 197.7344 197.7344 0 0 1 34.048-3.04128h224.77312c13.50656 0 24.45312-10.46016 24.45312-23.22944V165.29408c0-12.7744-10.94656-23.10656-24.45312-23.10656zM367.4368 787.43552a220.9792 220.9792 0 0 0-37.94944-3.28704H124.06272V188.5184h230.97344c35.38944 0 68.72064 13.13792 93.7728 37.09952 25.05728 23.83872 38.92224 55.45984 38.92224 89.27744v513.39776l-83.31776-30.77632a232.15616 232.15616 0 0 0-36.97152-10.09152z m532.49536-3.28704h-200.33024c-14.592 0-29.18912 1.21344-43.04896 3.77344-14.11072 2.67264-28.22144 6.44096-41.6 11.43296l-78.57152 28.94848V314.7776c0-33.6896 13.74208-65.4336 38.79936-89.27744 25.05216-23.83872 58.38336-37.0944 93.7728-37.0944h231.09632v595.7376h-0.11776z" /></svg>        </span>
        <span class = "text">
        简介
        </span>
      </button>
    </div>
    <div class = "item" >
      <button @click="onClick('catalogue')">
        <span class = "icon">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M853.333333 218.666667a37.333333 37.333333 0 0 1 3.072 74.538666L853.333333 293.333333H362.666667a37.333333 37.333333 0 0 1-3.072-74.538666L362.666667 218.666667h490.666666zM853.333333 474.666667a37.333333 37.333333 0 0 1 3.072 74.538666L853.333333 549.333333H362.666667a37.333333 37.333333 0 0 1-3.072-74.538666L362.666667 474.666667h490.666666zM853.333333 730.666667a37.333333 37.333333 0 0 1 3.072 74.538666L853.333333 805.333333H362.666667a37.333333 37.333333 0 0 1-3.072-74.538666L362.666667 730.666667h490.666666z" /><path d="M202.666667 256m-53.333334 0a53.333333 53.333333 0 1 0 106.666667 0 53.333333 53.333333 0 1 0-106.666667 0Z" /><path d="M202.666667 512m-53.333334 0a53.333333 53.333333 0 1 0 106.666667 0 53.333333 53.333333 0 1 0-106.666667 0Z" /><path d="M202.666667 768m-53.333334 0a53.333333 53.333333 0 1 0 106.666667 0 53.333333 53.333333 0 1 0-106.666667 0Z"/></svg>
        </span>
        <span class = "text">
        目录
        </span>
      </button>
    </div>
    <div class = "item" >
      <button @click="onClick('theme')">
        <span class = "icon">
          <svg v-if="isNightMode" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M399.328031 122.215649c41.846135-13.319992 72.8069 27.854798 61.810638 62.420043-9.150064 28.761912-14.103227 59.440952-14.103227 91.353787 0 166.224671 134.751407 300.976078 300.975079 300.976078 31.913834 0 62.593873-4.953163 91.356784-14.104226 34.565245-10.996261 75.740035 19.963504 62.421042 61.809639-51.382821 161.431352-202.508238 278.450076-381.067863 278.450076C299.895134 903.121046 120.881951 724.107863 120.881951 503.282513c0-178.558626 117.016726-329.683044 278.44608-381.066864z m-28.181479 98.185116C269.798525 274.101323 200.803902 380.673249 200.803902 503.282513c0 176.685456 143.231126 319.916581 319.916582 319.916582 122.610263 0 229.182189-68.995621 282.882747-170.344648a383.80519 383.80519 0 0 1-55.59271 4.033061c-210.363567 0-380.89703-170.534462-380.89703-380.898029 0-18.866576 1.374658-37.429448 4.033061-55.588714z" /></svg>
          <svg v-else viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M510 192a32 32 0 0 1-32-32V80a32 32 0 1 1 64 0v80a32 32 0 0 1-32 32z m224.864 93.136a32 32 0 0 1 0-45.248l56.576-56.576a32 32 0 1 1 45.248 45.248l-56.56 56.56a32 32 0 0 1-45.264 0.016z m93.136 224.864a32 32 0 0 1 32-32h80a32 32 0 1 1 0 64h-80a32 32 0 0 1-32-32z m-93.136 224.864a32 32 0 0 1 45.248 0l56.56 56.56a32 32 0 1 1-45.248 45.248l-56.576-56.56a32 32 0 0 1 0.016-45.248zM510 828a32 32 0 0 1 32 32v80a32 32 0 1 1-64 0v-80a32 32 0 0 1 32-32z m-224.864-93.136a32 32 0 0 1 0 45.248l-56.56 56.56a32 32 0 0 1-45.248-45.248l56.576-56.56a32 32 0 0 1 45.232 0zM192 510a32 32 0 0 1-32 32H80a32 32 0 1 1 0-64h80a32 32 0 0 1 32 32z m93.136-224.864a32 32 0 0 1-45.248 0l-56.576-56.56a32 32 0 0 1 45.248-45.248l56.56 56.576a32 32 0 0 1 0.016 45.232zM510 272c132.544 0 240 107.456 240 240 0 132.544-107.456 240-240 240-132.544 0-240-107.456-240-240 0-132.544 107.456-240 240-240z m0 64c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176z" /></svg>
        </span>
        <span class = "text">
          {{  isNightMode? '日间' : '夜间' }}
        </span>
      </button>
    </div>
    <div class = "item" >
      <button @click="onClick('setting')">
        <span class = "icon">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M960.620725 848.835765H279.118607a127.096471 127.096471 0 0 0-122.88-94.750118c-70.113882 0-127.036235 56.621176-127.036235 126.313412s56.922353 126.373647 126.976 126.373647c59.030588 0 108.845176-40.357647 122.940235-94.750118h681.502118a31.683765 31.683765 0 1 0 0-63.247059zM156.178372 943.585882c-34.996706 0-63.488-28.310588-63.488-63.186823 0-34.816 28.491294-63.186824 63.488-63.186824 35.056941 0 63.488 28.310588 63.488 63.186824 0 34.816-28.431059 63.186824-63.488 63.186823zM961.223078 493.327059h-97.882353a127.096471 127.096471 0 0 0-245.880471 0H65.102607a31.683765 31.683765 0 0 0-31.804235 31.563294c0 17.468235 14.215529 31.563294 31.744 31.563294h552.357647a127.096471 127.096471 0 0 0 245.940706 0h97.882353a31.623529 31.623529 0 1 0 0-63.126588z m-220.822589 94.750117c-34.996706 0-63.488-28.310588-63.488-63.247058 0-34.816 28.491294-63.126588 63.488-63.126589 34.996706 0 63.488 28.310588 63.488 63.186824 0 34.816-28.491294 63.186824-63.488 63.186823zM156.178372 295.695059c59.030588 0 108.845176-40.357647 122.940235-94.750118h681.502118a31.623529 31.623529 0 1 0 0-63.186823H279.118607A127.096471 127.096471 0 0 0 29.202372 169.381647c0 69.632 56.922353 126.313412 126.976 126.313412z m0-189.500235c35.056941 0 63.488 28.310588 63.488 63.186823 0 34.816-28.431059 63.126588-63.488 63.126588-34.996706 0-63.488-28.310588-63.488-63.126588 0-34.936471 28.491294-63.247059 63.488-63.247059z" /></svg>
        </span>
        <span class = "text">
        设置
        </span>
      </button>
    </div>
    <div class = "item" >
      <button @click="onClick('top')">
        <span class = "icon">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M800 192 224 192c-17.7 0-32 14.3-32 32s14.3 32 32 32l576 0c17.7 0 32-14.3 32-32S817.7 192 800 192z"  /><path d="M534.7 297.4c-3-3-6.5-5.3-10.4-7-7.8-3.2-16.6-3.2-24.4 0-3.9 1.6-7.5 4-10.4 7l-256 256c-12.5 12.5-12.5 32.8 0 45.2s32.8 12.5 45.2 0L480 397.2 480 832c0 17.7 14.3 32 32 32s32-14.3 32-32L544 397.2l201.4 201.4c6.2 6.2 14.4 9.4 22.6 9.4s16.4-3.1 22.6-9.4c12.5-12.5 12.5-32.8 0-45.2L534.7 297.4z"  /></svg>
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue';

// 定义外部输入的属性
interface Props {
  isNightMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isNightMode: false,
});

const isNightMode = ref<boolean>(props.isNightMode);

// 更新本地副本以匹配 prop 的当前状态
watchEffect(() => {
  isNightMode.value = props.isNightMode;
});

const emit = defineEmits([
  'notify',
]);

const onClick = (event: string) => {
  emit('notify', event);
}

</script>

<style scoped>
*, :before, :after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}

.toolbar {
  position: relative;
  display: block;
  /*padding: 12px 12px 12px 12px;*/
}

.toolbar .item {
  position: relative;
  display: flex;
}

.toolbar .item:not(:last-child) {
  margin-bottom: 8px;
} 
.toolbar .item button {
  display: flex;
  cursor: pointer;
  width: 64px;
  height: 64px;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border-radius: 8px;
  fill: var(--surface-gray-900);
  color: var(--surface-gray-900);
  background-color: var(--surface-gray-50);
  line-height: inherit;
  text-transform: none;
  font-family: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  text-align: center;
  letter-spacing: normal;
  word-spacing: normal;
  text-indent: 0px;
  text-shadow: none;
  writing-mode: horizontal-tb;
  padding: 0;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAAAXNSR0IArs4c6QAAAWlJREFUeNqlloFtwzAMBFU0PxF34k5eoUtktBZVnBysixEEUWBD+idpUnrTGXNkhPvt18awXZjKyE5BE5ix8sw6IEQHfKA1kZoMF5ZNnndqy1k2vae+wTAjMBPIp+sY3QJP1JADaXtvFjv4LR1TFKA5GD4suFSQcGEhjPWRn2+zKpRLT0hBwSo3lRerdpScpbMQCgZS2cH4tHQwerJVPIQjUVBH9wFTPOMgxnRwObhWLLkKlpaJA8TnpDxBwEv1r8Uo+ImegDVX4DBXKKWt3mQnZRRMlxZ7vfxDra6j0vD8vKUtKvJ79Pt1X9W6XxZNTvphhYxcGEjneWncGVH3pM2kAs6Qlq4XDIus4x2qDKieYEsz0nTAYd96MelYZEEgElZxnJtEa4mefZpr7hHGsLLmS2uDVgPGEUadgBxwrn3zwRwGhkU2NVqy6fUEbRs1CruoCM5zlPaIIL6/biLs0edft/d7IfjhT9gfL6wnSxDYPyIAAAAASUVORK5CYII=);
  background-attachment: scroll;
}

.toolbar .item button:hover {
  color: var(--primary-red-500);
  fill: var(--primary-red-500);
  background-image: none;
  background-color: var(--primary-red-50);
  box-shadow: 0 1px 4px var(--shadow-16);
}

.toolbar .item .icon {
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
}

.toolbar .item .text {
  color: var(--surface-gray-500);
  font-size: 14px;
  line-height: 22px;
  margin-top: 2px;
}
.toolbar .item button:hover .text {
  color: var(--primary-red-500);
}

.toolbar .item .icon svg {
  width: 1em;
  height: 1em;
}

</style>