<template>
  <div class="chat-container">
    <!-- 会话浏览组件 -->
    <div class="chat-view-container" ref="chatViewDiv" >
      <div v-for="(message, index) in chatMessages" :key="index" class="chat-message" :class="message.role">
        <div class="header">
          <div v-if = "message.role == 'assistant'" class="role-icon icon">
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M966.392 448.741L851.745 249.689a27.039 27.039 0 0 0-23.431-13.544h-42.126l-78.386-135.769a27.04 27.04 0 0 0-23.417-13.52H454.539a27.039 27.039 0 0 0-23.4 13.49l-20.99 36.249-156.729 0.025a27.04 27.04 0 0 0-23.413 13.52L115.084 349.191a27.041 27.041 0 0 0 0 27.04l20.925 36.243-78.386 135.769a27.041 27.041 0 0 0 0 27.04l114.923 199.052a27.04 27.04 0 0 0 23.417 13.52h41.85l78.386 135.769a27.04 27.04 0 0 0 23.417 13.52h229.845a27.04 27.04 0 0 0 23.417-13.52l20.925-36.243h156.773a27.04 27.04 0 0 0 23.417-13.52l114.923-199.052a27.041 27.041 0 0 0 0-27.04l-20.925-36.243 78.386-135.769a27.04 27.04 0 0 0 0.015-27.016zM767.96 557.282l-219.424-0.026 82.291-142.529a4.517 4.517 0 0 0 0-4.507L462.345 118.403h219.439l84.889 147.035 0.003 0.004 84.888 147.032-83.604 144.808z m62.68-90.538h104.516l-78.388 135.767L804.51 512l26.13-45.256z m-208.921-54.27L540.73 552.748 517.204 512l27.429-47.509c0.031-0.054 0.042-0.115 0.07-0.17 0.125-0.24 0.228-0.49 0.31-0.753 0.028-0.091 0.062-0.179 0.084-0.271 0.082-0.341 0.139-0.693 0.139-1.059a4.46 4.46 0 0 0-0.139-1.059c-0.022-0.092-0.056-0.181-0.084-0.272a4.565 4.565 0 0 0-0.31-0.753c-0.029-0.055-0.039-0.116-0.07-0.17L429.711 260.932a4.509 4.509 0 0 0-3.904-2.254h-49.653l78.384-135.768 167.181 289.564zM365.744 258.678h-52.255l-52.259-90.514 156.787-0.024-52.273 90.538z m-62.664 0h-49.655a4.508 4.508 0 0 0-3.904 2.254l-82.29 142.528-23.526-40.748 109.719-190.038 49.656 86.004z m-131.946 156.05l84.891-147.036h54.856l0.009 0.001 0.009-0.001h112.307l109.718 190.039H368.347a4.508 4.508 0 0 0-3.904 2.254L195.961 751.802 86.244 561.763l84.89-147.035z m199.814 52.016h161.975l-23.527 40.749h-54.859c-0.037 0-0.073 0.014-0.11 0.015a4.484 4.484 0 0 0-2.044 0.548c-0.08 0.044-0.154 0.093-0.231 0.142a4.454 4.454 0 0 0-0.652 0.499c-0.068 0.063-0.139 0.122-0.203 0.189a4.439 4.439 0 0 0-0.662 0.86L335.712 708.799a4.515 4.515 0 0 0 0 4.506l24.828 43.003H203.769l167.179-289.564z m-5.205 298.578l26.129 45.257-52.258 90.511-78.384-135.768h104.513z m31.334 54.272l24.826 43.001a4.508 4.508 0 0 0 3.904 2.253h164.579l-23.524 40.749h-219.44l49.655-86.003z m31.331 36.241L344.82 711.052l109.719-190.038 82.288 142.528a4.508 4.508 0 0 0 3.904 2.253h336.963l-109.718 190.04H428.408z m114.923-199.053l-80.987-140.276h47.055l27.427 47.51c0.044 0.076 0.103 0.137 0.152 0.21 0.087 0.134 0.177 0.264 0.279 0.389 0.095 0.115 0.197 0.221 0.301 0.326 0.1 0.1 0.2 0.197 0.311 0.288 0.13 0.107 0.266 0.201 0.406 0.292 0.069 0.046 0.128 0.102 0.2 0.144 0.034 0.02 0.073 0.025 0.107 0.044 0.314 0.17 0.64 0.315 0.984 0.406 0.035 0.01 0.071 0.009 0.107 0.018 0.302 0.072 0.61 0.11 0.92 0.119 0.044 0.001 0.088 0.017 0.132 0.017 0.051 0 0.099-0.018 0.15-0.019 0.062 0.002 0.119 0.018 0.18 0.018l229.505 0.027a4.509 4.509 0 0 0 3.904-2.253l24.841-43.027 53.556 92.759 0.001 0.003 24.83 43.005H543.331z m292.512-199.051l24.828-43.003a4.517 4.517 0 0 0 0-4.507l-82.289-142.529h47.325l109.457 190.039h-99.321z" /></svg>
          </div>
          <div v-else class="role-icon icon">
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M164.655 68.977l0 0 0 0zM866.321 769.149q0 59.804-36.377 94.437t-96.684 34.632l-435.544 0q-60.293 0-96.684-34.632t-36.377-94.437q0-26.414 1.744-51.573t6.977-54.321 13.2-54.069 21.432-48.586 30.892-40.367 42.614-26.665 55.563-9.963q4.479 0 20.931 10.717t37.131 23.916 53.819 23.916 66.531 10.717 66.531-10.717 53.819-23.916 37.131-23.916 20.931-10.717q30.405 0 55.563 9.963t42.614 26.665 30.893 40.367 21.432 48.586 13.2 54.069 6.977 54.321 1.744 51.573zM706.846 324.131q0 79.242-56.065 135.292t-135.293 56.065-135.293-56.065-56.065-135.292 56.065-135.293 135.293-56.065 135.293 56.065 56.065 135.293z" /></svg>
          </div>
        </div>
        <div class="body" v-show="!message.collapsed" @mouseenter="showCopy($event)"  @mouseleave="hideCopy($event)" >
          <div class="content" v-html="message.content">
          </div>
          <div class="attachment">
            <div class="copy-icon icon" @click="OnCopy(message, index)">
              <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M742.4 76.8H460.8c-84.48 0-153.6 69.12-153.6 153.6h-25.6c-84.48 0-153.6 69.12-153.6 153.6v384c0 84.48 69.12 153.6 153.6 153.6h281.6c84.48 0 153.6-69.12 153.6-153.6h25.6c84.48 0 153.6-69.12 153.6-153.6V230.4c0-84.48-69.12-153.6-153.6-153.6z m-128 691.2c0 28.16-23.04 51.2-51.2 51.2H281.6c-28.16 0-51.2-23.04-51.2-51.2V384c0-28.16 23.04-51.2 51.2-51.2h281.6c28.16 0 51.2 23.04 51.2 51.2v384z m179.2-153.6c0 28.16-23.04 51.2-51.2 51.2h-25.6V384c0-84.48-69.12-153.6-153.6-153.6h-153.6c0-28.16 23.04-51.2 51.2-51.2h281.6c28.16 0 51.2 23.04 51.2 51.2v384z"  /><path d="M512 665.6h-179.2c-28.16 0-51.2 23.04-51.2 51.2s23.04 51.2 51.2 51.2h179.2c28.16 0 51.2-23.04 51.2-51.2s-23.04-51.2-51.2-51.2zM512 512h-179.2c-28.16 0-51.2 23.04-51.2 51.2s23.04 51.2 51.2 51.2h179.2c28.16 0 51.2-23.04 51.2-51.2s-23.04-51.2-51.2-51.2z"  /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入组件 -->
    <div class="input-view-container"
      :class="{ minimized: isMinimized }"
      @mouseleave="minimizeComponent"
      @mouseenter="expandComponent"
      @click="activateComponent">
      <div v-if="isMinimized == false" class="first-icon icon">
        <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M512 640c-70.592 0-128-57.408-128-128s57.408-128 128-128 128 57.408 128 128-57.408 128-128 128m0-320a192 192 0 0 0 0 384 192 192 0 0 0 0-384" fill="#202020" /><path d="M693.216 735.552a291.744 291.744 0 0 1-40.512 27.52c-1.216 0.64-2.368 1.472-3.616 2.144a286.08 286.08 0 0 1-34.048 15.392L595.488 853.6l-9.28 34.592c-0.576 0.128-1.152 0.32-1.76 0.384l-8.736 1.632c-3.52 0.64-7.104 1.088-10.656 1.6A357.152 357.152 0 0 1 512 895.552c-5.216 0-10.464-0.128-15.68-0.32l-8.64-0.48a355.936 355.936 0 0 1-28.736-2.944c-3.52-0.512-7.072-0.96-10.624-1.6a418.496 418.496 0 0 1-8.736-1.6l-1.76-0.416-9.28-34.56-19.584-73.024a286.784 286.784 0 0 1-47.84-23.776 287.488 287.488 0 0 1-30.304-21.28l-72.96 19.552-34.56 9.28-1.184-1.376a237.504 237.504 0 0 1-5.792-6.72c-2.304-2.784-4.512-5.664-6.752-8.512a315.84 315.84 0 0 1-16.928-23.424c-1.6-2.336-3.104-4.768-4.64-7.168a337.92 337.92 0 0 1-15.68-27.168 435.84 435.84 0 0 1-3.936-7.68c-1.536-3.104-3.072-6.208-4.512-9.344a362.912 362.912 0 0 1-7.296-17.024c-1.344-3.328-2.688-6.656-3.968-9.984l-2.976-8.448-0.512-1.696 25.184-25.184 53.568-53.632a292.8 292.8 0 0 1-3.68-41.28c0-1.28-0.192-2.496-0.192-3.744 0-1.28 0.192-2.464 0.192-3.744a292.8 292.8 0 0 1 3.68-41.28l-53.568-53.632-25.184-25.184a438.656 438.656 0 0 1 3.488-10.144c1.28-3.36 2.624-6.688 3.968-10.048a375.68 375.68 0 0 1 52.992-91.776c2.24-2.848 4.448-5.696 6.72-8.48 1.92-2.24 3.84-4.48 5.824-6.72l1.184-1.376 34.56 9.28 72.96 19.52c9.568-7.776 19.744-14.72 30.304-21.28l4.064-2.464a283.68 283.68 0 0 1 43.776-21.28l19.584-73.024 9.28-34.56 1.76-0.416c2.88-0.544 5.76-1.12 8.704-1.6 3.52-0.608 7.168-1.12 10.752-1.6 6.08-0.864 12.16-1.6 18.336-2.208a362.752 362.752 0 0 1 19.008-1.184c5.184-0.224 10.4-0.384 15.616-0.384 5.216 0 10.464 0.16 15.648 0.384a362.752 362.752 0 0 1 19.008 1.184c6.08 0.576 12.224 1.344 18.304 2.24 3.616 0.448 7.2 0.96 10.784 1.536l8.704 1.632 1.76 0.384 9.28 34.592 19.52 72.992c11.712 4.512 23.168 9.472 34.08 15.392 1.248 0.672 2.4 1.504 3.616 2.176 14.304 8.064 27.84 17.216 40.512 27.52l72.96-19.584 34.528-9.248 1.216 1.344c1.92 2.24 3.904 4.48 5.76 6.752 2.304 2.752 4.48 5.632 6.72 8.448a358.887 358.887 0 0 1 11.136 14.848c1.984 2.816 3.904 5.696 5.824 8.544l4.672 7.232a357.472 357.472 0 0 1 19.616 34.88A397.184 397.184 0 0 1 867.424 368c1.344 3.328 2.72 6.656 4 10.048a370.777 370.777 0 0 1 2.944 8.384c0.192 0.576 0.32 1.152 0.544 1.728l-25.184 25.184-53.6 53.6a291.084 291.084 0 0 1 3.488 36.896c0.064 2.72 0.384 5.44 0.384 8.16 0 2.752-0.32 5.44-0.384 8.16a291.136 291.136 0 0 1-3.52 36.864l53.632 53.632 25.184 25.184-0.544 1.696c-0.96 2.816-1.92 5.6-2.944 8.384-1.28 3.392-2.624 6.72-4 10.08a376.32 376.32 0 0 1-11.776 26.336 435.84 435.84 0 0 1-11.456 21.44c-2.624 4.544-5.376 8.992-8.16 13.44-1.536 2.368-3.072 4.8-4.64 7.136a315.84 315.84 0 0 1-16.96 23.456c-2.24 2.88-4.48 5.696-6.72 8.448-1.92 2.304-3.84 4.512-5.792 6.752-0.384 0.48-0.8 0.896-1.216 1.344l-34.56-9.248-72.96-19.52zM388.096 874.88c-2.624-0.896-5.28-1.728-7.872-2.688l-3.328-1.216-3.328-1.28c4.896 1.92 9.856 3.584 14.816 5.248l-0.32-0.064z m-119.424-66.368l-2.656-2.24c-2.144-1.824-4.224-3.712-6.336-5.568l-0.224-0.192c3.968 3.52 7.936 6.976 12.064 10.272l-2.88-2.24z m623.776-245.664l-0.192-0.16-0.096-0.128h-0.032l-29.184-29.216C863.36 526.24 864 519.2 864 512c0-7.232-0.64-14.272-1.056-21.376l29.184-29.184 0.128-0.128 0.192-0.192 54.72-54.72a444.032 444.032 0 0 0-18.4-57.376 449.664 449.664 0 0 0-28.8-61.024c-11.424-19.84-24.576-38.08-38.432-55.456a449.024 449.024 0 0 0-40.48-44.64l-74.752 20.032-0.064 0.032-0.224 0.064-0.16 0.032h-0.032l-39.424 10.56a348.448 348.448 0 0 0-37.472-21.376l-10.624-39.68-0.032-0.064-0.032-0.16-0.064-0.224v-0.064l-20.032-74.752a447.68 447.68 0 0 0-58.88-12.736A448.128 448.128 0 0 0 512 64c-22.912 0-45.248 2.24-67.232 5.568-20.096 3.04-39.776 7.136-58.88 12.736l-20.032 74.752-0.032 0.064-0.064 0.224-0.032 0.16v0.064l-10.656 39.68c-12.928 6.464-25.504 13.472-37.472 21.44l-39.392-10.56-0.064-0.064h-0.16l-0.224-0.096h-0.064l-74.72-20.064c-14.432 13.76-27.84 28.8-40.48 44.64A446.816 446.816 0 0 0 124.032 288c-11.456 19.84-20.672 40.32-28.8 61.024A450.496 450.496 0 0 0 76.8 406.4l54.72 54.72v0.064l0.224 0.16 0.096 0.128v0.032l29.216 29.184C160.64 497.76 160 504.8 160 512c0 7.2 0.64 14.208 1.088 21.312l-29.184 29.184-0.032 0.032-0.096 0.128-0.192 0.192-0.032 0.032L76.8 617.6c4.704 19.328 11.008 38.464 18.4 57.344 8.128 20.704 17.344 41.216 28.8 61.056 11.456 19.84 24.576 38.08 38.464 55.424 12.672 15.872 26.048 30.88 40.48 44.64l74.72-20.032h0.064l0.224-0.064 0.16-0.064h0.064l39.36-10.56c12 7.936 24.576 14.912 37.504 21.376l10.656 39.712v0.224l0.096 0.224v0.032l20.064 74.752c19.104 5.6 38.784 9.728 58.88 12.736a447.68 447.68 0 0 0 67.2 5.6c22.976 0 45.28-2.24 67.296-5.6a442.56 442.56 0 0 0 58.88-12.736l20.032-74.752 0.064-0.256 0.064-0.192 10.624-39.68c12.928-6.496 25.504-13.504 37.44-21.44l39.456 10.56v0.032l0.192 0.032 0.224 0.064h0.064l74.752 20.032c14.4-13.76 27.808-28.768 40.48-44.64A449.92 449.92 0 0 0 900 736c11.456-19.84 20.64-40.32 28.768-61.056 7.424-18.88 13.728-37.984 18.432-57.344l-54.72-54.72h-0.032z" /></svg>
      </div>
      <div v-if="isMinimized == false" class="input-container">
          <div contenteditable="true" ref="editableInputDiv" class="input-div"
            @input="updateMessage"
            @keydown.enter="handleKeydown"
          ></div>
          <span class="clear-icon" v-show="userInput.length > 0" @click="clear" title="Clear input string">&#x2715;</span>
      </div>
      <div class="last-icon icon" @click="sendMessage">
        <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M451.131077 1024C434.333538 1024 420.706462 1010.766769 420.706462 994.461538 420.706462 978.136615 434.333538 964.923077 451.131077 964.923077L472.615385 964.923077 472.615385 905.846154C322.363077 892.691692 204.091077 771.899077 177.230769 630.153846L236.307692 630.153846C264.014769 748.504615 381.676308 846.769231 512 846.769231 642.323692 846.769231 759.985231 748.504615 787.692308 630.153846L846.769231 630.153846C819.908923 771.899077 701.636923 892.691692 551.384615 905.846154L551.384615 964.923077 572.868923 964.923077C589.666462 964.923077 603.293538 978.136615 603.293538 994.461538 603.293538 1010.766769 589.666462 1024 572.868923 1024L451.131077 1024ZM512 787.692308C394.338462 787.692308 295.384615 685.272615 295.384615 571.076923L295.384615 196.923077C295.384615 82.727385 394.338462 0 512 0 629.661538 0 728.615385 82.727385 728.615385 196.923077L728.615385 571.076923C728.615385 685.272615 629.661538 787.692308 512 787.692308ZM669.538462 196.923077C669.538462 115.357538 596.046769 59.076923 512 59.076923 427.953231 59.076923 354.461538 115.357538 354.461538 196.923077L354.461538 571.076923C354.461538 652.642462 427.953231 728.615385 512 728.615385 596.046769 728.615385 669.538462 652.642462 669.538462 571.076923L669.538462 196.923077Z" /></svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';

import { useToast } from "vue-toastification";
import markdownit from 'markdown-it'
import hljs from 'highlight.js'

const toast = useToast();

interface ChatMessage {
  role: string;
  content: string;
  collapsed: Boolean;
}

const userInput = ref<string>("");
const chatMessages = ref<ChatMessage[]>([]);
const isMinimized = ref<Boolean>(true);
const editableInputDiv = ref<HTMLElement | null>(null);
const chatViewDiv = ref<HTMLElement | null>(null);

let eventSource: EventSource | null = null;
const md = markdownit({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs">' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }

    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

onBeforeUnmount(() => {
  if (eventSource) {
    eventSource.close();
  }
});

onMounted(() => {
  if (editableInputDiv.value)
    editableInputDiv.value.focus();
});

function minimizeComponent() {
  isMinimized.value = true;
}

function expandComponent() {
  isMinimized.value = false;
  //editableInputDiv.value.focus();
}

function activateComponent() {
  isMinimized.value = false;
}

const handleKeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

const updateMessage = () => {
  userInput.value = editableInputDiv.value? editableInputDiv.value.innerText : '';
};

const clear = () => {
  userInput.value = '';
  editableInputDiv.value?.focus();
}

function sendMessage() {
  // 处理发送消息逻辑
  console.log('Message sent:', userInput.value);
  if (userInput.value.trim() === "") return;
  
  const message = {
    role: "user",
    content: userInput.value,
    collapsed: false,
  };
  chatMessages.value.push(message);

  userInput.value = '';
  if (editableInputDiv.value)
    editableInputDiv.value.innerText = '';

  const responseMessage = {
    role: "assistant",
    content: "正在生成结果...",
    collapsed: false,
  };
  chatMessages.value.push(responseMessage);

  if (eventSource) {
    eventSource.close();
  }
  
  eventSource = new EventSource(`/llm/event/etl?p=${encodeURIComponent(message.content)}`);

  receiveResponse(eventSource);
}

interface ETLMessageObject {
  sender: string;
  receiver: string;
  message;
  type: string;
  done: boolean;
}

interface ETLChatSet {
  index: number;
  count: number;
  messages: ETLMessageObject[];
}

class ResultPieceHtmlParse {
  private htmlContent: string = "";
  private closingTagStack: string[] = [];

  constructor(private lastResponse: ETLMessageObject = {
    sender: '-',
    receiver: '-',
    message: '',
    type: 'string',
    done: true,
  }) {
  }
  
  public praseResponse(sseData: string) {
    //console.log("sseData: ", sseData);
    //console.log("htmlContent: ", this.htmlContent);
    //console.log("closingTagStack: ", this.closingTagStack);
    //if not same (sender and receiver)
    //  close old chat
    //  start a new chat

    //if done is true
    //  if last_message is undone
    //    close undone message
    //  render message
    //  last_message is done
    //else
    //  if last_message is done
    //    start undone message
    //  render message
    //  last_message is undone

    try {
      const ro: ETLMessageObject = JSON.parse(sseData);
      //console.log(rp);

      // not same (sender and receiver)
      if ((this.lastResponse.sender != ro.sender) || (this.lastResponse.receiver != ro.receiver)){
        //assert(this.lastResponse.done == true);
        // close old chat
        // start a new chat

        // start a new time-section
        if (ro.sender == 'start') {
          this.RollbackClosingTags();
          this.htmlContent += `<div class='start-section'>`
          this.closingTagStack.push("</div>")
          this.htmlContent += `<p class='${ro.sender}'>提取第<span class='order'>${ro.message.index}</span>个片段，共<span class='order'>${ro.message.count}</span>个片段</p>`;
        }
        // end all
        else if (ro.sender == 'end') {
          this.RollbackClosingTags(1);
          this.htmlContent += `<div class='end-section atom_one_dark'>`
          this.htmlContent += `<p  class='${ro.sender}'>提取结果</p>`
          
          const jsonString = JSON.stringify(ro.message, null, 2);
          const markdownString = `\`\`\`json\n${jsonString}\n\`\`\``;
          this.htmlContent += md.render(markdownString);  
          this.htmlContent += `</section>`;
        }
        else {
          this.RollbackClosingTags(1);
          this.htmlContent += `<div class='chat-section'>`;
          this.closingTagStack.push("</div>");
          this.htmlContent += `<p class="title"><span class='${ro.sender}'>${ro.sender}</span>&nbsp;&nbsp;->&nbsp;&nbsp;<span class='${ro.receiver}'>${ro.receiver}</span></p>`
        }
      }

      //if done is true
      //  if last_message is undone
      //    close undone message
      //  render message
      //  last_message is done
      if (ro.done) {
        // close last undone response
        if (this.lastResponse.done == false){
          this.htmlContent += this.closingTagStack.pop();
        }
        
        if (ro.sender != 'start' && ro.sender != 'end') {
          if (ro.type.toLowerCase() == 'string'){
            this.htmlContent += `<p>${ro.message}</p>`;
          }
          else {
            const jsonString = JSON.stringify(ro.message, null, 2);
            const markdownString = `\`\`\`json\n${jsonString}\n\`\`\``;
            this.htmlContent += md.render(markdownString);
          }
        }
      } 
      //else
      //  if last_message is done
      //    start undone message
      //  render message
      //  last_message is undone
      else {
        // start a undone response
        if (this.lastResponse.done){
          this.htmlContent += `<p>`;
          this.closingTagStack.push("</p>")
        }
        this.htmlContent += ro.message;
      }
      this.lastResponse = ro;
    } catch (error) {
      console.error("解析 JSON 时出错:", error);
      return ""
    }
  }

  public RollbackClosingTags(reservedCount?: number): void {
    let count: number = this.closingTagStack.length;

    if (reservedCount) {
      count -= reservedCount;
    }

    for (let i = 0; i < count; i++) {
      this.htmlContent += this.closingTagStack.pop();
    }
  }

  public GetContent(): string {
    return this.htmlContent + [...this.closingTagStack].reverse().join('');
  }
}

class ETLMessageContent {
  private chatMessageSets: ETLChatSet[] = [];
  private etlResultMessage: ETLMessageObject | undefined = undefined;
  
  constructor(private lastResponse: ETLMessageObject = {
    sender: '-',
    receiver: '-',
    message: '',
    type: 'string',
    done: true,
  }) {
  }

  public getResultMessage(): ETLMessageObject | undefined {
    return this.etlResultMessage;
  }

  public addResponse(sseData: string) {
    try {
      const ro: ETLMessageObject = JSON.parse(sseData);

      // not same (sender and receiver)
      if ((this.lastResponse.sender != ro.sender) || (this.lastResponse.receiver != ro.receiver)){
        // start a ChatMessageSet
        if (ro.sender == 'start') {
          this.chatMessageSets.push({
            index: ro.message.index,
            count: ro.message.count,
            messages: [],
          });
        }
        // end all
        else if (ro.sender == 'end') {
          this.etlResultMessage = ro;
        }
        else {
          this.chatMessageSets.at(-1)?.messages.push(ro);
        }
      }
      else {
        if (ro.done) {
          if (this.lastResponse.done == false){
            const lastChatSet = this.chatMessageSets.at(-1);
            if (lastChatSet) {
              const lastMessage = lastChatSet.messages.at(-1);
              if (lastMessage) {
                lastMessage.message += ro.message;
                lastMessage.done = ro.done;
              }
            }
          } else {
            this.chatMessageSets.at(-1)?.messages.push(ro);
          }
        } 
        else {
          if (this.lastResponse.done){
            this.chatMessageSets.at(-1)?.messages.push(ro);
          } else {
            const lastChatSet = this.chatMessageSets.at(-1);
            if (lastChatSet) {
              const lastMessage = lastChatSet.messages.at(-1);
              if (lastMessage) {
                lastMessage.message += ro.message;
              }
            }
          }
        }
      }
      this.lastResponse = ro;
    } catch (error) {
      console.error("解析 JSON 时出错:", error);
      return ""
    }
  }
}

let etlMessageContent: ETLMessageContent | undefined = undefined;

/* for assistant
function receiveResponse(eventSource) {
  let responseBuffer = "";
  eventSource.onmessage = async (event) => {
    let sseData = event.data;
    // SSE只能传输单行数据，且无法识别空格和换行，因此需要将空格和回车替换为占位符
    sseData = sseData.replaceAll("&nbsp;", " ").replaceAll("&#10;", "\n")
    //console.log(sseData);

    // 检查是否是结束标志
    if (sseData === "[DONE]") {
      if (eventSource) {
        eventSource.close();
      }
      responseBuffer = "";
      return;
    }

    responseBuffer += sseData;
    try {
      const htmlString = md.render(responseBuffer);

      // 强制重新赋值以确保响应式系统检测到更改
      chatMessages.value[chatMessages.value.length - 1].content = htmlString;
      // 如果Vue没有检测到响应式更改，可以尝试以下方法
      chatMessages.value = [...chatMessages.value];
      await nextTick();
      scrollToBottom();
    }
    catch (__) {
    }
  };

  eventSource.onerror = () => {
    if (eventSource.readyState === EventSource.CLOSED) {
      //console.log("连接已关闭");
    } else {
      console.error('连接出现错误');
    }
    eventSource.close();
  };

  eventSource.onopen = () => {
  };
}
*/

// for ETL
function receiveResponse(eventSource) {
  const parseObject: ResultPieceHtmlParse = new ResultPieceHtmlParse();
  etlMessageContent = new ETLMessageContent()

  eventSource.onmessage = async (event) => {
    let sseData = event.data;
    // SSE只能传输单行数据，且无法识别空格和换行，因此需要将空格和回车替换为占位符
    sseData = sseData.replaceAll("&nbsp;", " ").replaceAll("&#10;", "\n")
    //console.log(sseData);

    // 检查是否是结束标志
    if (sseData === "[DONE]") {
      if (eventSource) {
        eventSource.close();
      }
      return;
    }

    try {
      parseObject.praseResponse(sseData);
      etlMessageContent?.addResponse(sseData);
      console.log(etlMessageContent);

      const htmlString = parseObject.GetContent();
      //console.log(htmlString)
      
      // 强制重新赋值以确保响应式系统检测到更改
      chatMessages.value[chatMessages.value.length - 1].content = htmlString;
      // 如果Vue没有检测到响应式更改，可以尝试以下方法
      chatMessages.value = [...chatMessages.value];
      await nextTick();
      scrollToBottom();
    }
    catch (__) {
    }
  };

  eventSource.onerror = () => {
    if (eventSource.readyState === EventSource.CLOSED) {
      //console.log("连接已关闭");
    } else {
      console.error('连接出现错误');
    }
    eventSource.close();
  };

  eventSource.onopen = () => {
  };
}

function scrollToBottom() {
  if (chatViewDiv.value) {
    chatViewDiv.value.scrollTo({ top: chatViewDiv.value.scrollHeight, behavior: 'smooth' });
  }
}

function toggleCollapse(index) {
  chatMessages.value[index].collapsed = !chatMessages.value[index].collapsed;
}

const showCopy = (event) => {
  const copyIcon = event.currentTarget.querySelector('.copy-icon');
  if (copyIcon) {
    copyIcon.style.display = 'block';
  }
} 

const hideCopy = (event) => {
  const copyIcon = event.currentTarget.querySelector('.copy-icon');
  if (copyIcon) {
    copyIcon.style.display = 'none';
  }
} 

const OnCopy = async (message: ChatMessage, index) => {
  try {
    await navigator.clipboard.writeText(message.content);
    toast.success("内容已复制到剪贴板。");
  } catch (err) {
    toast.error(`复制失败！${err}`);
  }
}

</script>

<style>
@import '../theme/chat_message.scss';
@import '../theme/atom_one_dark.scss';
@import '../theme/atom_one_light.scss';
</style>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  width: 500px;
  height: 500px;
  border: 1px solid #ccc;
  border-radius: 10px;
  overflow: hidden;
}

.chat-view-container {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  text-align: justify;
  overflow-y: auto;
}

.chat-message {
  display: flex;
  margin: 10px 10px;
  border-radius: 8px;
  background-color: var(--background);
}

.chat-message .header {
  display: flex;
  flex: 0 0 auto;
  margin-top: 8px;
  padding: 5px 10px;
  justify-content: center;
  color: var(--surface-gray-500);
}

.chat-message.user .header {
  flex: 0 0 30%;
  justify-content: right;
}

.chat-message .body {
  flex: 1;
  flex-direction: column;
  width: 100%;
  margin: 5px 0px;
}

.body .content {
  font-size: var(--font-size-normal);
}

.chat-message.user .body .content {
  padding: 10px 10px;
  background-color: var(--surface-gray-50);
  border-radius: 8px;
}

.chat-message.assistant .body .content {
  padding: 0px 0px 10px 10px;
}

.chat-message .attachment {
  height: 20px;
  padding: 5px 5px;
}

.input-view-container {
  display: flex;
  margin: 0 auto;
  align-items: center;
  width: auto;
  height: auto;
  min-width: 50px;
  min-height: 44px;
  border-radius: 22px;
  background: var(--background);
  border: 1px solid var(--surface-gray-50);
}

.input-view-container:hover {
  border: 1px solid transparent;
  box-shadow: 0 4px 12px var(--shadow-16);
  border-color: var(--border-black-8);
}

.input-view-container:focus-within {
  border: 1px solid transparent;
  box-shadow: 0 2px 8px 1px var(--shadow-16);
}

.input-view-container.minimized {
  cursor: pointer;
  justify-content: center;
  opacity: 0.8;
  border: 1px solid var(--primary-red-500);
}

.input-view-container:not(.minimized) {
  opacity: 1;
}

.input-container {
  position: relative;
  display: inline-block;
  flex-grow: 1;
}

.input-div {
  flex: 1;
  font-size: 16px;
  min-height: 20px;
  max-height: 150px;
  min-width: 50px;
  max-width: 300px;
  overflow-y: auto;
  text-align: left;
  outline: none;
  border: none;
  color: var(--surface-gray-900);
  background: transparent;
}

.clear-icon {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--surface-gray-500);
  cursor: pointer;
}

.clear-icon:hover {
  color: var(--primary-red-500);
}

.icon {
  color: var(--surface-gray-900);
}

.icon svg {
  height: 1.3em;
  width: 1.3em;
  fill: currentColor;
}

.first-icon,
.last-icon,
.role-icon {
  display: flex;
  height: 2em;
  width: 2em;
  padding: 5px 5px;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
}

.last-icon {
  color: var(--primary-red-500);
}

.role-icon {
  height: 1em;
  width: 1em;
  color: var(--surface-gray-900);
  border-radius: 50%;
  border: 1px solid var(--surface-gray-100);
}

.copy-icon {
  height: 1em;
  width: 1em;
  color: var(--surface-gray-500);
  margin-right: auto;
  cursor: pointer;
  display: none;
}

</style>