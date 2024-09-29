import {Book, Division, DivisionType, ContentPiece, Title} from "./BookDefine";

interface HtmlContentPiece {
  type: DivisionType,
  content: string,
  annotator?: string,
  source?: string,
  position?: number,
  inserted?: boolean,
}

export class HtmlParseDocument {
  static annotatorStyles: string[] = ["style01", "style02", "style03", "style04", "style05"];
  static annotator2Style: Map<string, string> = new Map<string, string>();
  private htmlContent: string = "";

  constructor(private readonly book: Book | Division, annotatorStyles?: string[]) {
    if (annotatorStyles != undefined) {
      HtmlParseDocument.annotatorStyles = annotatorStyles;
    }
  }

  static insertAnnotations(content: string, inserts: HtmlContentPiece[]): string {
    const result: string[] = [];
    const cache: string[] = [];
    let currentPlainTextLength = 0;
    const tagRegex = /<\/?[^>]+>/g;
    let match;
    let lastIndex = 0;
    let aIndex = 0;
  
    if (inserts == undefined || inserts.length == 0){
      return content;
    }

    inserts.forEach((annotation)=>{
      annotation.inserted = false;
    });
    
    while ((match = tagRegex.exec(content)) !== null) {
      let plainText = content.substring(lastIndex, match.index);
      currentPlainTextLength += plainText.length;
  
      let insertIndex = 0;
      cache.length = 0;
      for (var i = aIndex; i < inserts.length; i++) {
        let annotation = inserts[i];
        if (annotation.position == undefined){
          console.log(`${annotation.position}, ${annotation.content}.`);
          continue;
        }
        // 检查插入位置
        if (!annotation.inserted && currentPlainTextLength >= annotation.position) {
          const _insertIndex = annotation.position - (currentPlainTextLength - plainText.length);
          result.push(plainText.substring(insertIndex, _insertIndex));
          if ((currentPlainTextLength == annotation.position) && match[0].startsWith("</")){
            cache.push(annotation.content);
          } else {
            result.push(annotation.content);
          }
          insertIndex = _insertIndex;
          annotation.inserted = true;
          aIndex = i + 1;
        }
      }
      if (insertIndex < plainText.length) {
        result.push(plainText.substring(insertIndex));
      }
      // 添加标签
      result.push(match[0]);
      // 如果添加的内容恰好在标签尾巴上，就需要先加标签，再添加插入内容。
      // ...<label>...[带插入内容]</label>...，调整为：
      // ...<label>...</label>[带插入内容]...
      if (cache.length > 0){
        result.push(...cache);
      }
      lastIndex = match.index + match[0].length;
    }
  
    // 处理最后一段无标签部分
    let plainText = content.substring(lastIndex);
    currentPlainTextLength += plainText.length;
    let insertIndex = 0;
    for (var i = aIndex; i < inserts.length; i++) {
      let annotation = inserts[i];
      if (annotation.position == undefined){
        console.log(`${annotation.position}, ${annotation.content}.`);
        continue;
      }
      // 检查插入位置
      if (!annotation.inserted && currentPlainTextLength >= annotation.position) {
        const _insertIndex = annotation.position - (currentPlainTextLength - plainText.length);
        result.push(plainText.substring(insertIndex, _insertIndex));
        result.push(annotation.content);
        insertIndex = _insertIndex;
        annotation.inserted = true;
        aIndex = i + 1;
      }
    }
    if (insertIndex < plainText.length) {
      result.push(plainText.substring(insertIndex));
    }
  
    return result.join("");
  }

  static getAnnotatorStyle(annotator?: string, type?: string): string {
    let _class: string = "";
    annotator = (annotator == undefined)? '' : annotator;
    type = (type == undefined)? '' : type;
    let author: string = annotator + type;
    if (HtmlParseDocument.annotatorStyles && HtmlParseDocument.annotatorStyles.length != 0) {
      if (HtmlParseDocument.annotator2Style.has(author) == true) {
        return HtmlParseDocument.annotator2Style.get(author) || "";
      } else {
        _class = HtmlParseDocument.annotatorStyles[HtmlParseDocument.annotator2Style.size % HtmlParseDocument.annotatorStyles.length];
        HtmlParseDocument.annotator2Style.set(author, _class);
        return _class;
      }
    }
    return _class;
  }

  //  标题
  //  <span class="prefix">{{ title.prefix }}</span>
  //  <span class='separator'>·</span>
  //  {{ title.title }}
  //  <span class='separator'>·</span>
  //  <span class="subtitle">{{ title.subtitle }}</span>
  static parseTitle(title?: Title): string {
    const items: string[] = [];
  
    if (title == undefined || title.title == undefined || title.title.length == 0){
      return "";
    }
  
    if (title.prefix != undefined && title.prefix.length > 0){
      items.push(`<span class='prefix'>${title.prefix}</span>`);
    }
    
    items.push(title.title);
  
    if (title.subtitle != undefined && title.subtitle.length > 0){
      items.push(`<span class='subtitle'>${title.subtitle}</span>`);
    }
  
    return items.join(`<span class='separator'>·</span>`);
  }

  static parseContentPiece(contentPiece: ContentPiece, index: number, level: number = -1): HtmlContentPiece {
    let htmlString: string = "";
    const childs: HtmlContentPiece[] = [];
    const output: HtmlContentPiece[] = [];
  
    contentPiece.content_pieces?.forEach((contentPiece, _index) => {
      childs.push(this.parseContentPiece(contentPiece, _index, (level == -1)? level : (level + 1)));
    });

    //  节，节标题（和书、卷、章的标题不是一个类型，更类似为文本）中包含正文文本段落内的注释。
    //  <div class="db-section" key="">
    //    <div class="db-column"></div>
    //      <div class="number"></div>
    //      <div class="content">
    //        <h4>{{ section.content }}</h4>
    //      </div> 
    //    </div> 
    //    <div class="paragraph" key="">...</div>
    //    <div class="paragraph" key="">...</div>
    //    <div class="paragraph annotation" key="">...</div>
    //  </div>  
    if (contentPiece.type == DivisionType.SECTION){
      const inserts: HtmlContentPiece[] = [];
      for(let i = 0; i < childs.length; i ++){
        const htmlContentPiece: HtmlContentPiece = childs[i];
        if (htmlContentPiece.type == DivisionType.ANNOTATION && htmlContentPiece.position && htmlContentPiece.position != 0 ) {
          inserts.push(htmlContentPiece);
        } else {
          output.push(htmlContentPiece);
        }
      }
      htmlString += `<div class="db-section" key="${index}">`;
      htmlString += `<div class="db-column">`;
      htmlString += `<div class="number"></div>`;
      htmlString += `<div class="content">`;
      const sectionTitleString: string = HtmlParseDocument.insertAnnotations(contentPiece.content, inserts);
      htmlString += `<h${level}>${sectionTitleString}</h${level}>`;
      htmlString += `</div></div>`;
      htmlString += output.map((v)=>v.content).join("");
      htmlString += `</div>`;
    }
    //  正文文本段落，包含正文文本段落内的注释。
    //  <div class="db-column db-paragraph" key="">
    //    <div class="number"><p>{{ paragraph.index }}</p></div>
    //    <div class="content">
    //      <p>{{ parseAnnotation(paragraph.content[0]) }}</p>
    //      <p>{{ parseAnnotation(paragraph.content[1]) }}</p>
    //      <p>{{ parseAnnotation(paragraph.content[.]) }}</p>
    //    </div>
    //  </div>
    else if (contentPiece.type == DivisionType.PARAGRAPH) {
      htmlString += `<div class="db-column db-paragraph" key="${index}">`;
      htmlString += `<div class="number"><p>${index}</p></div>`;
      htmlString += `<div class="content">`;
      const paragraphString: string = HtmlParseDocument.insertAnnotations(contentPiece.content, childs);
      const items: string[] = paragraphString.split('\n');
      items.forEach((item) => {
        htmlString += `<p>${item}</p>`;
      });
      htmlString += `</div></div>`;
    }
    //  注释文本段落，包含注释文本段落内的注释。
    //  <div class="db-column db-annotation" key="">
    //    <div class="number">{{ annotation.index }}</div>
    //    <div class="content annotation">
    //      <p><span class="annotator">{{ annotation.annotator }}</span><span class="type">{{ annotation.source }}</span></p>
    //      <p>{{ parseAnnotation(annotation.content[0]) }}</p>
    //      <p>{{ parseAnnotation(annotation.content[1]) }}</p>
    //      <p>{{ parseAnnotation(annotation.content[.]) }}</p>
    //    </div>
    //  </div>
    else if (contentPiece.type == DivisionType.ANNOTATION) {
      //console.log(contentPiece);
      // 注释文本段落
      if ((contentPiece.position == undefined || contentPiece.position == 0)) {
        htmlString += `<div class="db-column db-annotation" key="${index}">`;
        htmlString += `<div class="number"><p>${index}</p></div>`;
        htmlString += `<div class="content ${HtmlParseDocument.getAnnotatorStyle(contentPiece.annotator, contentPiece.source)}">`;

        const paragraphString: string = HtmlParseDocument.insertAnnotations(contentPiece.content, childs);
        const items: string[] = paragraphString.split('\n');
        items.forEach((item, index) => {
          if (index == 0){
            htmlString += `<p>`;
            htmlString += ((contentPiece.annotator == undefined) || (contentPiece.annotator.length == 0))? '' : `<span class="annotator">${contentPiece.annotator}</span>`;
            htmlString += ((contentPiece.source == undefined) || (contentPiece.source.length == 0))? '' : `<span class="type">${contentPiece.source}</span>`;
            htmlString += `${item}`;
            htmlString += `</p>`;    
          } else {
            htmlString += `<p>${item}</p>`;
          }
        });
        htmlString += `</div></div>`;
        //console.log(htmlString);
      }
      // 正文文本段落、注释文本段落内的注释。
      //  <annotation class="style04" key="">
      //    <span class="annotator">{{ annotation.annotator }}</span>
      //    <span class="type">{{ annotation.source }}</span>
      //    <span>{{ parseAnnotation(annotation.content) }}</span>
      //  </annotation>    
      else {
        if (contentPiece.content && contentPiece.content.length > 0){
          htmlString += `<annotation class="${HtmlParseDocument.getAnnotatorStyle(contentPiece.annotator, contentPiece.source)}" key="${index}">`;
          htmlString += ((contentPiece.annotator == undefined) || (contentPiece.annotator.length == 0))? '' : `<span class="annotator">${contentPiece.annotator}</span>`;
          htmlString += ((contentPiece.source == undefined) || (contentPiece.source.length == 0))? '' : `<span class="type">${contentPiece.source}</span>`;
          
          const annotationString: string = HtmlParseDocument.insertAnnotations(contentPiece.content, childs);
          htmlString += `<span>${annotationString}</span>`;
          htmlString += `</annotation>`;
        } else {
          htmlString += childs.map((v)=>v.content).join("");
        }
      }
    }
    else {
      //console.log(contentPiece);
    }

    return {
      type: contentPiece.type,
      content: htmlString,
      annotator: contentPiece.annotator,
      source: contentPiece.source,
      position: contentPiece.position,
    };
  }

  //  章
  //  <div class="db-section" key="">
  //    <div class="db-column"></div>
  //      <div class="number"></div>
  //      <div class="content">
  //        <h4>{{ parseTitle(chapter.title) }}</h4>
  //      </div>
  //    </div>  
  //    <div class="section" key="">...</div>
  //    <div class="paragraph" key="">...</div>
  //    <div class="paragraph" key="">...</div>
  //    <div class="section" key="">...</div>
  //  </div>  
  static ParseChapter(chapter: Division): string {
    let htmlString: string = "";
    const childs: HtmlContentPiece[] = [];
    const output: HtmlContentPiece[] = [];

    const level = 3; // 章：第3级别
    chapter.divisions?.forEach((contentPiece, _index) => {
      childs.push(this.parseContentPiece(contentPiece as ContentPiece, _index, (level + 1)));
    });

    const inserts: HtmlContentPiece[] = [];
    for(let i = 0; i < childs.length; i ++) {
      const htmlContentPiece: HtmlContentPiece = childs[i];
      if (htmlContentPiece.type == DivisionType.ANNOTATION && htmlContentPiece.position && htmlContentPiece.position != 0 ) {
        inserts.push(htmlContentPiece);
      } else {
        output.push(htmlContentPiece);
      }
    }
    const chapterTitleString: string = chapter.title? HtmlParseDocument.insertAnnotations(chapter.title?.title, inserts) : "";
    htmlString += `<div class="db-section" key="${chapter.id}">`;
    htmlString += `<div class="db-column">`;
    htmlString += `<div class="number"></div>`;
    htmlString += `<div class="content">`;
    htmlString += `<h${level}>${chapterTitleString}</h${level}>`;
    htmlString += `</div></div>`;
    htmlString += output.map((v)=>v.content).join("");
    htmlString += `</div>`;
    return htmlString;
  }

  public GetContent(): string {
    return this.htmlContent;
  }

  public Parse() {
  }
}

export class DocBookDocument {
  constructor() {}

  public ToHtml(book: Book | Division): string {
    let htmlParse: HtmlParseDocument = new HtmlParseDocument(book, ["style01", "style02", "style03", "style04"]);
    htmlParse.Parse();
    return htmlParse.GetContent();
  }
}
