<template>
  <div class="container" :class="{ atom_one_light: true }">
    <div class="row-container">
      <div class="markdown-container">
        <textarea
          class="markdown-input"
          ref="mdInput"
          :autofocus=true
          :spellcheck=true 
          :style="{ 'white-space': textWrap ? 'pre-wrap' : 'pre' }"
          v-on:scroll=true
          v-model="markdownText"
          @input="onInputChange"
          @keydown.tab.prevent.stop="onTab"
          @keyup="onKeyUp"
          @click="onClick"
          @scroll="syncScroll('output')">
        </textarea>
        <pre class="markdown-output hljs" ref="mdOutput" :style="{ 'white-space': textWrap ? 'pre-wrap' : 'pre' }"
          @scroll="syncScroll('input')"><code v-html="highlightMarkdownText"></code></pre>
      </div>
      <div class="html-container">
        <div class="control">
          <a href="#">html</a>
          <a href="#">text</a>
          <a href="#">debug</a>
        </div>
        <div class="html" ref="htmlOutput" v-html="htmlText"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";

import hljs from 'highlight.js';

import { BookMarkdownDocument } from '../ts/BookMarkdownParser'

const textWrap = ref<boolean>(true);
const markdownText = ref<string>('');
const highlightMarkdownText = ref<string>('');
const htmlText = ref<string>('');

const mdInput = ref<HTMLTextAreaElement | null>(null);
const mdOutput = ref<HTMLElement | null>(null);
const htmlOutput = ref<HTMLElement | null>(null);

let currentLineNum: number = 0;
let cursorPosition: number = 0;

var markdownChange: BookMarkdownDocument = new BookMarkdownDocument();

const lang = "bookmarkdown";

const RenderHtmlContent = () => {
  if (markdownText.value.length) {
    htmlText.value = markdownChange.ToHtml(markdownText.value);
    //console.debug(htmlText.value);
  } else {
    htmlText.value = "<p></p>";
  }
}

const MapMarkdownLineToHtmlView = (lineNum: number) => {
  if (currentLineNum == lineNum) return;
  if (htmlOutput.value) {
    const element = htmlOutput.value.querySelector(`[data-id='${lineNum}']`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    currentLineNum = lineNum;
  }
}

const handleCursorPositionChange = () => {
  if (mdInput.value && cursorPosition != mdInput.value.selectionStart) {
    cursorPosition = mdInput.value.selectionStart;
    const textBeforeCursor = markdownText.value.substring(0, cursorPosition);
    MapMarkdownLineToHtmlView((textBeforeCursor.match(/\n/g) || []).length)
  }
}

const onInputChange = () => {
  if (hljs.getLanguage(lang)) {
    try {
      highlightMarkdownText.value = hljs.highlight(markdownText.value, { language: lang, ignoreIllegals: true }).value;
      //console.log(`${highlightMarkdownText.value}`);
    } catch (__) { }
  } else {
    highlightMarkdownText.value = markdownText.value;
  }

  RenderHtmlContent();
  handleCursorPositionChange();
}

const onTab = () => {
  document.execCommand('insertText', false, '    ')
}

const onKeyUp = (e: KeyboardEvent) => {
  handleCursorPositionChange();
}

const onClick = () => {
  handleCursorPositionChange();
}

const syncScroll = (target) => {
  if (mdInput.value && mdOutput.value) {
    if (target === 'input') {
      mdInput.value.scrollTop = mdOutput.value.scrollTop;
      mdInput.value.scrollLeft = mdOutput.value.scrollLeft;
    } else {
      mdOutput.value.scrollTop = mdInput.value.scrollTop;
      mdOutput.value.scrollLeft = mdInput.value.scrollLeft;
    }
  }
};

watch(markdownText, onInputChange);

onMounted(async () => {
  const bookMarkdownLang = (hljs) => {
    const regex = hljs.regex;
    const HORIZONTAL_RULE = {
      className: 'keyword',
      begin: '^[-\\*]{3,}',
      end: '$'
    };
    const COMMENTS = {
      className: 'comment',
      begin: '^\/\/ ',
      end: '$'
    };
    const URL_SCHEME = /[A-Za-z][A-Za-z0-9+.-]*/;
    const LINK = {
      variants: [
        // too much like nested array access in so many languages
        // to have any real relevance
        {
          begin: /\[.+?\]\[.*?\]/,
          relevance: 0
        },
        // popular internet URLs
        {
          begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
          relevance: 2
        },
        {
          begin: regex.concat(/\[.+?\]\(/, URL_SCHEME, /:\/\/.*?\)/),
          relevance: 2
        },
        // relative urls
        {
          begin: /\[.+?\]\([./?&#].*?\)/,
          relevance: 1
        },
        // whatever else, lower relevance (might not be a link at all)
        {
          begin: /\[.*?\]\(.*?\)/,
          relevance: 0
        }
      ],
      returnBegin: true,
      contains: [
        {
          // empty strings for alt or link text
          match: /\[(?=\])/
        },
        {
          className: 'string',
          relevance: 0,
          begin: '\\[',
          end: '\\]',
          excludeBegin: true,
          returnEnd: true
        },
        {
          className: 'link',
          relevance: 0,
          begin: '\\]\\(',
          end: '\\)',
          excludeBegin: true,
          excludeEnd: true
        },
        {
          className: 'symbol',
          relevance: 0,
          begin: '\\]\\[',
          end: '\\]',
          excludeBegin: true,
          excludeEnd: true
        }
      ]
    };

    const HEADER = {
      className: 'section',
      begin: '^#{1,6} ',
      end: '$',
    };

    const ANNOTATIONHEADER = {
      className: 'keyword',
      begin: '^( {4})*!!! ',
      end: '$'
    };

    const ANNOTATION = {
      className: 'keyword',
      begin: '^( {4})*::: ',
      end: '$'
    };
    const ATTRIBUTES = {
      variants: [
        {
          begin: /^\[(author|date|category|source|description)\] .*?/,
          relevance: 0
        }
      ],
      returnBegin: true,
      contains: [
        {
          // empty strings for alt or link text
          match: /\[(?=\])/
        },
        {
          className: 'string',
          relevance: 0,
          begin: '^\\[',
          end: '\\] ',
          excludeBegin: true,
          returnEnd: true,
        },
        {
          className: 'link',
          relevance: 0,
          begin: '\\] \\(',
          end: '\\)',
          excludeBegin: true,
          excludeEnd: true
        },
        {
          className: 'symbol',
          relevance: 0,
          begin: '\\] ',
          end: ',|$',
          excludeBegin: true,
          returnEnd: true
        },
        {
          className: 'symbol',
          relevance: 0,
          begin: ',',
          end: ',|$',
          excludeBegin: true,
          returnEnd: true
        }
      ]
    };

    return {
      name: lang,
      aliases: [
        'bmd',
        'bmkdown',
        'bmkd'
      ],
      contains: [
        HEADER,
        ANNOTATIONHEADER,
        ANNOTATION,
        ATTRIBUTES,
        LINK,
        HORIZONTAL_RULE,
        COMMENTS,
      ]
    };
  };

  hljs.registerLanguage(lang, bookMarkdownLang);

  onInputChange();

  await nextTick();
});
</script>

<style>
@import '../theme/Book.css';
@import '../theme/atom_one_dark.scss';
@import '../theme/atom_one_light.scss';
</style>

<style scoped>
.container {
  display: block;
  width: 100%;
  height: 100%;
  padding: 25px 15px 25px 15px;
  margin-right: auto;
  margin-left: auto;
  font-size: 14px;
  /*var(--reader-font-size);*/
  font-family: var(--annotation-font-family);
  text-align: justify;
  box-sizing: border-box;
}

.row-container {
  display: block;
  height: 100%;
  box-sizing: border-box;
}

.markdown-container {
  float: left;
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  width: 50%;
  height: 100%;
  min-height: 1px;
  padding: 0 15px;
  box-sizing: border-box;
}

.html-container {
  float: left;
  position: relative;
  width: 50%;
  height: 100%;
  min-height: 1px;
  padding: 0 15px;
  box-sizing: border-box;
}

.markdown-input,
.markdown-output {
  width: 100%;
  height: 100%;
  padding: 2px;
  margin: 0 -15px;
  overflow: auto;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: inherit;
  text-align: inherit;
  line-height: inherit;
  tab-size: 4;
}

.markdown-input {
  grid-area: 1 / 1 / 2 / 2;
  background: transparent;
  color: transparent;
  caret-color: black;
  overflow: overlay;
  resize: none;
  text-align: inherit;
  z-index: 999;
}

.markdown-output {
  grid-area: 1 / 1 / 2 / 2;
  pointer-events: none;
  overflow: hidden;
}

.markdown-output code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.html {
  height: 100%;
  padding: 2px 20px 2px 30px;
  font-family: var(--annotation-font-family);
  font-size: inherit;
  overflow: auto;
  box-sizing: border-box;
  border-radius: 6px;
  border: 1px solid transparent;
  box-shadow: 0 4px 24px var(--shadow-16);
  color: var(--surface-gray-900);
  background-color: var(--background);
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAAAXNSR0IArs4c6QAAAWlJREFUeNqlloFtwzAMBFU0PxF34k5eoUtktBZVnBysixEEUWBD+idpUnrTGXNkhPvt18awXZjKyE5BE5ix8sw6IEQHfKA1kZoMF5ZNnndqy1k2vae+wTAjMBPIp+sY3QJP1JADaXtvFjv4LR1TFKA5GD4suFSQcGEhjPWRn2+zKpRLT0hBwSo3lRerdpScpbMQCgZS2cH4tHQwerJVPIQjUVBH9wFTPOMgxnRwObhWLLkKlpaJA8TnpDxBwEv1r8Uo+ImegDVX4DBXKKWt3mQnZRRMlxZ7vfxDra6j0vD8vKUtKvJ79Pt1X9W6XxZNTvphhYxcGEjneWncGVH3pM2kAs6Qlq4XDIus4x2qDKieYEsz0nTAYd96MelYZEEgElZxnJtEa4mefZpr7hHGsLLmS2uDVgPGEUadgBxwrn3zwRwGhkU2NVqy6fUEbRs1CruoCM5zlPaIIL6/biLs0edft/d7IfjhT9gfL6wnSxDYPyIAAAAASUVORK5CYII=);
}

.control {
  display: block;
  position: absolute;
  right: 20px;
  top: -18px;
  border-radius: 4px 4px 0 0;
  font-size: 12px;
  background-color: #ddd;
  box-sizing: border-box;
}

.control a:first-child {
  padding-left: 30px;
}

.control a:last-child {
  padding-right: 30px;
}

.control a {
  padding: 0 20px;
}

a {
  color: #428bca;
  text-decoration: none;
  background: transparent;
}
</style>
