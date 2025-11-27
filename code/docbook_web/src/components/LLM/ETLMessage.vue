<template>
  <div class="start-section">
    <div class="start-section-title"  :style="(collapse === false || inResultMessage !== undefined)? { borderRadius: '8px 8px 0px 0px' } : { borderRadius: '8px 8px 8px 8px' }" @click="toggleCollapse()">
      <svg class="loading-svg" viewBox="0 0 50 50" v-if="inResultMessage === undefined">
        <circle cx="25" cy="25" r="20" fill="none" stroke="#3498db" stroke-width="8" stroke-linecap="round" stroke-dasharray="80" stroke-dashoffset="60">
          <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>
      <p class="start">{{ processStatus }}</p>
      <div class="operate">
        <label class="collapse">
          <i class="icon">
            <svg :style="(collapse === false)? { transform: 'rotate(180deg)' } : { transform: 'rotate(0deg)' }" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M512 685.248L233.376 406.624l45.248-45.248L512 594.752l233.376-233.376 45.248 45.248z" /></svg>
          </i>
        </label>
      </div>
    </div>
    <div class="body" v-show="collapse === false">
      <div v-for="(innerChatSet, index) in inInnerChatSets" :key="index" class="loop-section">
        <p class="loop">提取第<span class='order'>{{ innerChatSet.startLineNo }}</span>~<span class='order'>{{ innerChatSet.endLineNo }}</span>行，共<span class='order'>{{ innerChatSet.lineCount }}</span>行</p>
        <div v-for="(message, index) in innerChatSet.messages" :key="index" class="chat-section">
          <p class="middle"><span :class="message.sender">{{ message.sender }}</span>&nbsp;&nbsp;-&gt;&nbsp;&nbsp;<span :class="message.receiver">{{ message.receiver }}</span></p>
          <div class="text" v-if= "message.type == 'string' || message.done == false"  v-html="md.render(message.message)">
          </div>
          <div v-else class="atom_one_light">
            <pre><code class="hljs" v-html="hljs.highlight(JSON.stringify(message.message, null, 2), { language: 'json', ignoreIllegals: true }).value"></code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="inResultMessage != undefined" class="end-section">
    <p class="end" v-show="collapse === false">提取结果</p>
    <div class="text" v-if= "inResultMessage.type == 'string' || inResultMessage.done == false" v-html="md.render(inResultMessage.message)">
    </div>
    <div v-else class="atom_one_light">
      <pre><code class="hljs" v-html="hljs.highlight(JSON.stringify(inResultMessage.message, null, 2), { language: 'json', ignoreIllegals: true }).value"></code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import markdownit from 'markdown-it'
  import hljs from 'highlight.js'

  import { ETLInnerChat, ETLInnerChatMessage } from '../ts/LLMHelper'

  interface Props {
    inInnerChatSets?: ETLInnerChat[];
    inResultMessage?: ETLInnerChatMessage | undefined;
  }

  const props = withDefaults(defineProps<Props>(), {
    inInnerChatSets: undefined,
    inResultMessage: undefined,
  });

  const collapse = ref<boolean>(true);
  const processStatus = computed<string>(() => {
    let status = '正在提取...';
    if (props.inResultMessage === undefined) {
      if (props.inInnerChatSets !== undefined) {
        const innerChatSet = props.inInnerChatSets[props.inInnerChatSets.length - 1];
        if (innerChatSet !== undefined) {
          status = `提取第${innerChatSet.startLineNo}~${innerChatSet.endLineNo}行，共${innerChatSet.lineCount}行...`;
        }
      }
    } else {
      if (props.inResultMessage.message === undefined || props.inResultMessage.message === null ) {
        status = '提取失败';
      } else {
        // 获取inResultMessage.message中的记录数，同时要判断inResultMessage.message是否是数组
        if (typeof props.inResultMessage.message === 'object' && Object.keys(props.inResultMessage.message).length > 0) {
          status = `提取完成，共提取${props.inResultMessage.message.length}个记录`;
        } else {
          status = '提取完成';
        }
      }
    }

    return status;
  });

  const md = markdownit({
    html: true,
    breaks: true,  // 将换行符转成 <br>
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

  function toggleCollapse() {
    collapse.value = !collapse.value;
  }

</script>

<style>
@import '../theme/atom_one_dark.scss';
@import '../theme/atom_one_light.scss';
</style>

<style scoped>
.loading-svg {
  width: 20px;
  height: 20px;
  margin: 12px 0px 10px 10px;
}

.start-section {
  position: relative;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.start-section-title {
  display: flex;
  align-items: left;
  border-radius: 8px 8px 0px 0px;
  background: var(--border-black-8);
}

p.start {
  color: black;
  font-weight: bold;
  font-size: 18px;
  padding: 10px;
}

.start-section .operate {
  position: absolute;
  right: 16px;
  top: 8px;
  font-size: 0;
}

.start-section .operate .collapse {
  display: inline-block;
  height: 28px;
  padding: 8px;
  margin-left: 8px;
  margin-right: -8px;
  box-sizing: border-box;
  color: var(--surface-gray-900);
}

.start-section .operate .collapse .icon {
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

.start-section .body {
  padding: 10px 5px 10px 10px;
  border-left: 1px solid var(--border-black-8);  
  border-right: 1px solid var(--border-black-8);
}

.loop-section,
.end-section, 
.chat-section {
  display: fixed;
}

.loop-section {
  border: 1px solid var(--border-black-8);
}

.chat-section {
  margin: 20px 25px;
  padding: 0px 0px 30px 0px;
}

.end-section {
  padding: 0px 0px 0px 0px;
}

.loop-section .chat-section:nth-child(n+1):nth-last-child(n+2){
  border-bottom: 1px solid var(--border-black-8);
}

:deep(.start-section p),
:deep(.loop-section p),
:deep(.end-section p), 
:deep(.chat-section p) {
  margin-block-start: 0em;
  margin-block-end: 0em;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  font-size: var(--font-size-small);
}

p.loop {
  color: black;
  font-weight: bold;
  font-size: 16px;
  padding: 10px 10px;
  background: var(--surface-gray-50);
}

p.middle {
  padding: 0px 0px 10px 0px;
}

p.end {
  font-weight: bold;
  font-size: 16px;
  padding: 10px 10px;
  font-size: 16px;
  background: var(--border-black-8);
}

.start-section .text,
.loop-section .text,
.chat-section .text,
.end-section .text {
  text-wrap: wrap;
}

p .initializer {
  color: gray;
  font-weight: bold;
}

p .extractor {
  color: green;
  font-weight: bold;
}

p .editor {
  color: crimson;
  font-weight: bold;
}

p .summarizer {
  color: darkblue;
  font-weight: bold;
}

:deep(.chat-section pre),
.end-section pre {
  margin: 0px 0px;
  padding: 20px 25px;
  font-size: .8em;
  text-wrap: wrap;
}

.atom_one_light pre {
  background: #edf2f4
}

.atom_one_dark pre {
  background: #282c34;
}

</style>