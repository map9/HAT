enum MarkType {
  None,
  Blank,
  Note, // 内部注释行，编译时忽略
  /*
    # 书名
    # 前缀|书名
    # 前缀|书名|副标题
    
    # 毛诗正义

    <h1>毛诗正义</h1>
  */
  Header1, // 书

  /*
    ## 卷名
    ## 前缀|卷名
    ## 前缀|卷名|副标题
    
    ## 国风·邶风

    <h2>国风·邶风</h2>
  */
  Header2, // 卷

  /*
    ### 章名 
    ### 前缀|章名 
    ### 前缀|章名|副标题

    ### 二子乘舟 

    <h3>二子乘舟</h3>
  */
  Header3, // 章

  /*
    #### 节名 
    
    #### 序言
    
    <h4>序言</h3>
  */
  Header4, // 节

  /*
    一般在 Header1 之后
    [author] 著作者
    [author] 著作者,著作类型
    [author] 朝代,著作者,著作类型
    [author] 朝代,官职,著作者,著作类型
    [date] 春秋战国
    [category] 主类,子类

    [author] 西汉,太史令,司马迁,撰
    [date] 西汉
    [category] 史,二十四史

    <p class="author"><span class="dynasty">[西汉]</span><span class="position">太史令</span><span class="name">司马迁</span><span class="type">撰</span></p>
    <p><span class="date">西汉</span></p>
    <p><span class="category">史</span><span class="subcategory">二十四史</span></p>
  */
  Author, // 著作者
  Date, // 时代
  Category, // 分类

  /*
    一般在 Header1，Header2，Header13 之后
    [source](来源1)
    [source](来源2)
    [description] 内容描述段落1。
    [description] 内容描述段落2。

    [source](https://zh.wikisource.org/wiki/毛詩正義)
    [description] 案《汉书·艺文志》、《毛诗》二十九卷，《毛诗故训传》三十卷。然但称毛公，不著其名。《后汉书·儒林传》始云：“赵人毛长传《诗》，是为《毛诗》。”其长字不从“草”。《隋书·经籍志》载《毛诗》二十卷，汉河间太守毛苌传，郑氏笺。于是《诗传》始称毛苌。...

    <a href="https://zh.wikisource.org/wiki/毛詩正義">资料来源</a>
    <p class="description">案《汉书·艺文志》、《毛诗》二十九卷，《毛诗故训传》三十卷。然但称毛公，不著其名。《后汉书·儒林传》始云：“赵人毛长传《诗》，是为《毛诗》。”其长字不从“草”。《隋书·经籍志》载《毛诗》二十卷，汉河间太守毛苌传，郑氏笺。于是《诗传》始称毛苌。...</p>
  */
  Source, // 来源
  Description, // 描述

  /*
    正文句子，正文句子，正文句子。...，正文句子。

    二子乘舟，汎汎其景。
    <div class="paragraph-div">
      <p><span class="id">1</span></p>
      <p class="paragraph">二子乘舟，汎汎其景。</p>
    </div>
  */
  Paragraph, // 正文

  /*
    !!! 注释者1,注释方式1
    ::: 注释段落1。
        !!! 注释者2,注释方式2
        ::: 注释内容2。    

    !!! 毛亨,传
    ::: 《二子乘舟》，思伋、寿也。卫宣公之二子争相为死，国人伤而思之，作是诗也。
        !!! 陆德明,音义
        ::: ○为，于伪反。

    <div class="annotation style03">
      <p class=""><span class="annotator">毛亨</span>&nbsp;<span class="type">传</span></p>
      <p class="">《二子乘舟》，思伋、寿也。卫宣公之二子争相为死，国人伤而思之，作是诗也。
        <annotation class="annotation inner style04"><span class="type">音义</span>&nbsp;<span class="">○为，于伪反。</span>
        </annotation>
      </p>
    </div>
  */

  /*
    !!! 注释方式1
    !!! 注释者1,注释方式1

    !!! 毛亨,传
    <div class="annotation style03">
      <p class=""><span class="annotator">毛亨</span>&nbsp;<span class="type">传</span></p>
  */
  /* 文内注释头
      !!! 注释者3,注释方式3
  
        !!! 陆德明,音义
    <annotation class="annotation inner style04"><span class="type">音义</span>
    </annotation>
  */
  AnnotationHeader, // 注释头

  /*
    ::: 注释段落1。

    ::: 《二子乘舟》，思伋、寿也。卫宣公之二子争相为死，国人伤而思之，作是诗也。
    <p class="">《二子乘舟》，思伋、寿也。卫宣公之二子争相为死，国人伤而思之，作是诗也。</p>
  */
  /* 文内注释内容
        !!! 注释者3,注释方式3

        ::: ○为，于伪反。
    <annotation class="annotation inner style04"><span class="">○为，于伪反。</span>
    </annotation>
  */
  Annotation, // 注释内容

  /*
    ---

    <hr></hr>
  */
  Break, // 分隔栏
}

interface IBookMarkParse {
  Parse(currentLine: string, index?: number, parseContent?: (content: string) => string): boolean;
}

class BookMarkParseHandler implements IBookMarkParse {
  constructor(
    protected readonly type: MarkType,
    protected readonly mark: string,
    protected readonly tag: string,
    protected readonly document: IHtmlParseDocument
  ) {}

  protected OpeningTag(index?: number, attachments?: string) : string {
    if(index !== undefined){
      return `<${this.tag} data-id=${index.toString()}${attachments? ' ' + attachments : ''}>`;
    } else{
      return `<${this.tag}${attachments? ' ' + attachments : ''}>`;
    }
  }

  protected ClosingTag() : string {
    return `</${this.tag}>`;
  }

  protected CanHandle(currentLine: string, downlevelMark?: string): [boolean, string, number] {
    if (downlevelMark) {
      let split = false;
      let mark = this.mark;
      let length = this.mark.length;
      let level = 0;
      let count = currentLine.length / downlevelMark.length;
      let _downlevelMark = downlevelMark;

      for (let i = 0; i < count; i++) {
        split = currentLine.startsWith(`${mark}`);
        if (split == true) {
          length = mark.length;
          level += i;
          break;
        } else {
          split = currentLine.startsWith(`${_downlevelMark}`);
          if (split == true) {
            mark = downlevelMark + mark;
            _downlevelMark = downlevelMark + _downlevelMark;
            continue;
          } else {
            return [false, "", 0];
          }
        }
      }
      if (split == false) {
        return [false, "", 0];
      }

      return [true, currentLine.substr(length), level];
    } else {
      let split = currentLine.startsWith(`${this.mark}`);
      if (split == false) {
        return [false, "", 0];
      }

      return [true, currentLine.substr(this.mark.length), 0];
    }
  }

  Parse(currentLine: string, index?: number): boolean {
    return false;
  }
}
interface ClosingTagStack {
  mark: MarkType;
  closingTag: string;
  level: number;
}

interface IHtmlParseDocument {
  getAnnotatorStyle(author: string, type?: string): string;

  getLineCount(): number;
  ResetLineCount(): void;

  getClosingTagStack(): ClosingTagStack[];
  RollbackClosingTags(reservedCount?: number): void;
  PopClosingTagStack(): void;
  AddClosingTagStack(mark: MarkType, closingTag: string, level: number): void;

  AddContent(mark: MarkType, openingTag: string, content: string, closingTag: string, level?: number): void;
  GetContent(): string;
}

// 内部注释行，编译时忽略
class HtmlParseNoteHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  Parse(currentLine: string, index?: number): boolean {
    const [canHandle] = this.CanHandle(currentLine);
    if (canHandle == false) return false;

    return true;
  }
}

// 分隔栏
class HtmlParseBreakHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  Parse(currentLine: string, index?: number): boolean {
    const [canHandle] = this.CanHandle(currentLine);
    if (canHandle == false) return false;

    this.document.RollbackClosingTags();
    this.document.AddContent(this.type, this.OpeningTag(index), ``, ``);

    return true;
  }
}

// 书名、卷名、章名、节名
class HtmlParseHeaderHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  private parseContent(content: string): string {
    let attributes: string[] = content.split(`|`);
    if (attributes.length == 2) {
      return `<span class='prefix'>${attributes[0]}</span><span class='separator'>·</span>${attributes[1]}`;
    } else if (attributes.length == 3) {
      return `<span class='prefix'>${attributes[0]}</span><span class='separator'>·</span>${attributes[1]}<span class='separator'>&nbsp;</span><span class='subtitle'>${attributes[2]}</span>`;
    } else {
      return content;
    }
  }

  Parse(currentLine: string, index?: number): boolean {
    const [canHandle, content] = this.CanHandle(currentLine);
    if (canHandle == false) return false;

    // 遇到书名、卷名、章名，重置行计数值
    this.document.ResetLineCount();

    // 回滚之前 Mark 的 HTML 尾部标签（ClosingTag）
    // 遇到书名、卷名、章名、节名全部回滚之前的尾部标签
    this.document.RollbackClosingTags();
    this.document.AddContent(this.type, this.OpeningTag(index), this.parseContent(content), this.ClosingTag());

    return true;
  }
}

// 著作者，时代，分类

class htmlParseAttributesHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  private parseAuthorContent(content: string): string {
    let attributes: string[] = content.split(`,`);
    if (attributes.length == 1) {
      return `<span class="name">${attributes[0]}</span>`;
    } else if (attributes.length == 2) {
      return `<span class="name">${attributes[0]}</span>&nbsp;<span class="type">${attributes[1]}</span>`;
    } else if (attributes.length == 3) {
      return `<span class="dynasty">[${attributes[0]}]</span>&nbsp;<span class="name">${attributes[1]}</span>&nbsp;<span class="type">${attributes[2]}</span>`;
    } else if (attributes.length == 4) {
      return `<span class="dynasty">[${attributes[0]}]</span>&nbsp;<span class="position">${attributes[1]}</span>&nbsp;<span class="name">${attributes[2]}</span>&nbsp;<span class="type">${attributes[3]}</span>`;
    } else {
      return content;
    }
  }

  private parseCategoryContent(content: string): string {
    let attributes: string[] = content.split(`,`);
    if (attributes.length == 1) {
      return `<span class='category'>${attributes[0]}</span>`;
    } else if (attributes.length == 2) {
      return `<span class='category'>${attributes[0]}</span><span class='separator'>·</span><span class='subcategory'>${attributes[1]}</span>`;
    } else {
      return content;
    }
  }

  private parseSourceContent(content: string): string {
    //let attributes = content.match(/(*)/g);
    //return attributes?.[0]? attributes[0] : content;
    return content;
  }

  Parse(currentLine: string, index?: number): boolean {
    const [canHandle, content] = this.CanHandle(currentLine);
    if (canHandle == false) return false;

    if (this.type == MarkType.Description){
      let closingTagStack = this.document.getClosingTagStack();
      let lastMarkType = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].mark : MarkType.None;
      let lastMarkLevel = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].level : 0;

      if(lastMarkType == MarkType.Description){
        if(index !== undefined){
          this.document.AddContent(this.type, "", `<p data-id=${index.toString()} class="description">${content}</p>`, "");
        } else{
          this.document.AddContent(this.type, "", `<p class="description">${content}</p>`, "");
        }
      } else {
        this.document.RollbackClosingTags();
        this.document.AddContent(this.type, this.OpeningTag(index, `class="description-div"`), `<p class="description">${content}</p>`, "");
        this.document.AddClosingTagStack(this.type, this.ClosingTag(), 0);
      }
    } else {
      this.document.RollbackClosingTags();

      if (this.type == MarkType.Author){
        this.document.AddContent(this.type, this.OpeningTag(index, 'class="attributes"'), this.parseAuthorContent(content), this.ClosingTag());
      } else if (this.type == MarkType.Category){
        this.document.AddContent(this.type, this.OpeningTag(index, 'class="attributes"'), this.parseCategoryContent(content), this.ClosingTag());
      } else if (this.type == MarkType.Date){
        this.document.AddContent(this.type, this.OpeningTag(index, 'class="attributes"'), `<span class='dynasty'>[${content}]</span>`, this.ClosingTag());
      } else if (this.type == MarkType.Source){
        this.document.AddContent(this.type, this.OpeningTag(index, `href=${this.parseSourceContent(content)} class="attributes"`), `[来源]`, this.ClosingTag());
      }
    }

    return true;
  }
}

class htmlParseQuoteHandler extends BookMarkParseHandler {
  constructor(
    type: MarkType,
    mark: string,
    tag: string,
    protected readonly downlevelMark: string,
    protected readonly downlevelTag: string,
    document: IHtmlParseDocument
  ) {
    super(type, mark, tag, document);
  }

  protected DownlevelOpeningTag(index?: number, attachments?: string) : string {
    if(index !== undefined){
      return `<${this.downlevelTag} data-id=${index.toString()}${attachments? ' ' + attachments : ''}>`;
    } else{
      return `<${this.downlevelTag}${attachments? ' ' + attachments : ''}>`;
    }
  }

  protected DownlevelClosingTag() : string {
    return `</${this.downlevelTag}>`;
  }
}

// 注释头
class htmlParseAnnotationHeaderHandler extends htmlParseQuoteHandler {
  constructor(
    type: MarkType,
    mark: string,
    tag: string,
    downlevelMark: string,
    downlevelTag: string,
    document: IHtmlParseDocument
  ) {
    super(type, mark, tag, downlevelMark, downlevelTag, document);
  }

  private parseContent(content: string, level: number): [string, string] {
    let parsedContent = "";
    let style = "";
    let attributes: string[] = content.split(`,`);

    if (attributes.length == 1) {
      parsedContent =
        level == 0
          ? attributes[0].length
            ? `<p><span class="type">${attributes[0]}</span></p>`
            : ""
          : attributes[0].length
          ? `<span class="type">${attributes[0]}</span>`
          : "";
      style = this.document.getAnnotatorStyle(attributes[0]);
    } else if (attributes.length == 2) {
      parsedContent =
        level == 0
          ? `<p><span class="annotator">${attributes[0]}</span>&nbsp;<span class="type">${attributes[1]}</span></p>`
          : `<span class="annotator">${attributes[0]}</span>&nbsp;<span class="type">${attributes[1]}</span>`;
      style = this.document.getAnnotatorStyle(attributes[0], attributes[1]);
    } else {
      parsedContent = ``;
    }

    return [parsedContent, style];
  }

  _Parse(content: string, level: number, index?: number): boolean {
    let closingTagStack = this.document.getClosingTagStack();
    if (closingTagStack.length == 0 && level > 0) {
      // add warning statement
      return false;
    }

    // 回滚
    let lastMarkType = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].mark : MarkType.None;
    let lastMarkLevel = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].level : 0;

    // 如果level > lastMarkLevel，当前是文内注释头，不需要回滚
    // 如果level = lastMarkLevel是一致的，需要回滚到同级别注释的上一个注释头。
    // 如果level < lastMarkLevel是下降的，也需要回滚到同级别注释上一个注释头。
    if (level <= lastMarkLevel) {
      if (lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation) {
        let count: number = closingTagStack.length;
        for (let i = count - 1; i >= 0; i--) {
          let lastMarkType = closingTagStack[closingTagStack.length - 1].mark;
          let lastMarkLevel = closingTagStack[closingTagStack.length - 1].level;

          if (level == lastMarkLevel && lastMarkType == MarkType.AnnotationHeader) {
            this.document.PopClosingTagStack();
            break;
          } else {
            this.document.PopClosingTagStack();
          }
        }
      } else {
        this.document.RollbackClosingTags();
      }
    }

    let [parsedContent, style] = this.parseContent(content, level);
    this.document.AddContent(
      this.type,
      level == 0 ? this.OpeningTag(index, `class="annotation ${style}"`) : this.DownlevelOpeningTag(index, `class="annotation inner ${style}"`),
      parsedContent,
      "",
      level
    );
    this.document.AddClosingTagStack(this.type, level == 0 ? this.ClosingTag() : this.DownlevelClosingTag(), level);

    return true;
  }

  Parse(currentLine: string, index?: number): boolean {
    const [canHandle, content, level] = this.CanHandle(currentLine, this.downlevelMark);
    if (canHandle == false) return false;

    return this._Parse(content, level, index);
  }

  InsertDefaultHeader(level: number): void {
    this._Parse("", level);
  }
}

// 注释内容
class htmlParseAnnotationHandler extends htmlParseQuoteHandler {
  constructor(
    type: MarkType,
    mark: string,
    tag: string,
    downlevelMark: string,
    downlevelTag: string,
    document: IHtmlParseDocument
  ) {
    super(type, mark, tag, downlevelMark, downlevelTag, document);
  }

  Parse(currentLine: string, index?: number): boolean {
    const [canHandle, content, level] = this.CanHandle(currentLine, this.downlevelMark);
    if (canHandle == false) return false;

    let closingTagStack = this.document.getClosingTagStack();
    if (closingTagStack.length == 0) {
      if (level > 0) {
        // add warning statement
        return false;
      }
      let htmlParseHandle: htmlParseAnnotationHeaderHandler = new htmlParseAnnotationHeaderHandler(
        MarkType.AnnotationHeader,
        "!!! ",
        "div",
        "    ",
        "annotation",
        this.document
      );
      htmlParseHandle.InsertDefaultHeader(level);
    } else {
      for (let i = closingTagStack.length - 1; i >= 0; i--) {
        let lastMarkType = closingTagStack[i].mark;
        let lastMarkLevel = closingTagStack[i].level;

        if (lastMarkLevel <= level) {
          if (level == lastMarkLevel && (lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation)) {
            break;
          } else {
            let htmlParseHandle: htmlParseAnnotationHeaderHandler = new htmlParseAnnotationHeaderHandler(
              MarkType.AnnotationHeader,
              "!!! ",
              "div",
              "    ",
              "annotation",
              this.document
            );
            htmlParseHandle.InsertDefaultHeader(level);
            break;
          }
        } else {
          // add warning statement
          console.error(`mark: ${this.mark}, content: ${currentLine}.`);
        }
      }
    }

    // 回滚
    let lastMarkType = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].mark : MarkType.None;
    let lastMarkLevel = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].level : 0;

    // 如果level > lastMarkLevel，当前是文内注释，不需要回滚
    // 如果level = lastMarkLevel是一致的，需要回滚到同级别注释的上一个注释内容。
    // 如果level < lastMarkLevel是下降的，也需要回滚到同级别注释上一个注释内容。
    if (level <= lastMarkLevel) {
      if (lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation) {
        let count: number = closingTagStack.length;
        for (let i = count - 1; i >= 0; i--) {
          let lastMarkType = closingTagStack[closingTagStack.length - 1].mark;
          let lastMarkLevel = closingTagStack[closingTagStack.length - 1].level;

          if (level == lastMarkLevel && (lastMarkType == MarkType.Annotation || lastMarkType == MarkType.AnnotationHeader)) {
            break;
          } else {
            this.document.PopClosingTagStack();
          }
        }
      } else {
        this.document.RollbackClosingTags();
      }
    }

    this.document.AddContent(this.type, level == 0 ? this.OpeningTag(index) : this.DownlevelOpeningTag(index),  level == 0 ? `&#x3000&#x3000${content}` : `${content}`, "", level);
    this.document.AddClosingTagStack(this.type, level == 0 ? this.ClosingTag() : this.DownlevelClosingTag(), level);

    return true;
  }
}

class htmlParseParagraphHandler extends BookMarkParseHandler {
  constructor(type: MarkType, mark: string, tag: string, document: IHtmlParseDocument) {
    super(type, mark, tag, document);
  }

  Parse(currentLine: string, index?: number): boolean {
    let content = currentLine;

    let closingTagStack = this.document.getClosingTagStack();
    let lastMarkType = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].mark : MarkType.None;
    let lastMarkLevel = closingTagStack.length > 0 ? closingTagStack[closingTagStack.length - 1].level : 0;

    // 空白行，吃掉空白
    if (content.length == 0) {
      // 遇到空白行全部回滚之前的尾部标签
      this.document.RollbackClosingTags();
      return true;
    }
    // 遇到段落，需要考虑是否是新段落，还是延续之前的段落。
    // 判断的标准是，上一个 Mark 是否是注释，以及第一个 Mark 是否是段落。
    else {
      // 回滚
      let firstMarkType = closingTagStack.length ? closingTagStack[0].mark : MarkType.None;
      // 延续之前的段落
      if (
        (lastMarkType == MarkType.AnnotationHeader || lastMarkType == MarkType.Annotation) &&
        lastMarkLevel > 0 &&
        firstMarkType == MarkType.Paragraph
      ) {
        this.document.RollbackClosingTags(1);
        if(index !== undefined){
          this.document.AddContent(this.type, "", `<span data-id=${index.toString()}>${content}</span>`, "");
        } else {
          this.document.AddContent(this.type, "", `<span>${content}</span>`, "");
        }
      }
      // 新段落
      else {
        this.document.RollbackClosingTags();

        this.document.AddContent(
          this.type,
          this.OpeningTag(index, `class="paragraph-div"`),
          `<p><span class="id">${this.document.getLineCount()}</span></p><p class="paragraph">&#x3000&#x3000${content}`,
          ""
        );

        this.document.AddClosingTagStack(this.type, `</p>`+this.ClosingTag(), 0);
      }
    }

    return true;
  }
}

class HtmlParseDocument {
  private lineCount: number;
  private readonly authorClasses: Map<string, string> = new Map<string, string>();
  private readonly htmlParseHandles: BookMarkParseHandler[] = [];
  private readonly htmlParseParagraphHandler: BookMarkParseHandler = new htmlParseParagraphHandler(MarkType.Paragraph, "", "div", this);
  private htmlContent: string = "";
  private closingTagStack: ClosingTagStack[] = [];

  constructor(private readonly markContent: string, private readonly authorStyles?: string[]) {
    this.lineCount = 0;
    // "# ", "## ", "### ", "#### ", "[author] ", "!!! ", "::: ", "    !!! ", "    ::: ", "// ", "---",
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header1, "# ", "h1", this));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header2, "## ", "h2", this));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header3, "### ", "h3", this));
    this.htmlParseHandles.push(new HtmlParseHeaderHandler(MarkType.Header4, "#### ", "h4", this));
    this.htmlParseHandles.push(new htmlParseAnnotationHeaderHandler(MarkType.AnnotationHeader, "!!! ", "div", "    ", "annotation", this));
    this.htmlParseHandles.push(new htmlParseAnnotationHandler(MarkType.Annotation, "::: ", "p", "    ", "span", this));
    this.htmlParseHandles.push(new htmlParseAttributesHandler(MarkType.Author, "[author] ", "p", this));
    this.htmlParseHandles.push(new htmlParseAttributesHandler(MarkType.Date, "[date] ", "p", this));
    this.htmlParseHandles.push(new htmlParseAttributesHandler(MarkType.Category, "[category] ", "p", this));
    this.htmlParseHandles.push(new htmlParseAttributesHandler(MarkType.Source, "[source] ", "a", this));
    this.htmlParseHandles.push(new htmlParseAttributesHandler(MarkType.Description, "[description] ", "div", this));
    this.htmlParseHandles.push(new HtmlParseBreakHandler(MarkType.Break, "---", "hr", this));
    this.htmlParseHandles.push(new HtmlParseBreakHandler(MarkType.Break, "***", "hr", this));
    this.htmlParseHandles.push(new HtmlParseNoteHandler(MarkType.Note, "// ", "", this));
  }

  public getAnnotatorStyle(annotator: string, type?: string): string {
    let _class: string = "";
    type = (type == undefined)? '' : type;
    let author: string = annotator + type;
    if (this.authorStyles && this.authorStyles.length != 0) {
      if (this.authorClasses.has(author) == true) {
        return this.authorClasses.get(author) || "";
      } else {
        _class = this.authorStyles[this.authorClasses.size % this.authorStyles.length];
        this.authorClasses.set(author, _class);
        return _class;
      }
    }
    return _class;
  }

  public getLineCount(): number {
    this.lineCount++;
    return this.lineCount;
  }

  public ResetLineCount() {
    this.lineCount = 0;
  }

  public getClosingTagStack(): ClosingTagStack[] {
    return this.closingTagStack;
  }

  public RollbackClosingTags(reservedCount?: number): void {
    let count: number = this.closingTagStack.length;

    if (reservedCount) {
      count -= reservedCount;
    }

    for (let i = 0; i < count; i++) {
      this.htmlContent += this.closingTagStack.pop()?.closingTag;
    }
  }

  public AddClosingTagStack(mark: MarkType, closingTag: string, level: number): void {
    this.closingTagStack.push({
      mark: mark,
      closingTag: closingTag,
      level: level,
    });
  }

  public PopClosingTagStack(): void {
    this.htmlContent += this.closingTagStack.pop()?.closingTag;
  }

  public AddContent(mark: MarkType, openingTag: string, content: string, closingTag: string, level?: number): void {
    this.htmlContent += openingTag + content + closingTag;
  }

  public GetContent(): string {
    this.RollbackClosingTags();
    return this.htmlContent;
  }

  public Parse() {
    let lines: string[] = this.markContent.split(`\n`);
    for (let index = 0; index < lines.length; index ++) {
      let parsed = false;
      for (let mark = 0; mark < this.htmlParseHandles.length; mark ++) {
        parsed = this.htmlParseHandles[mark].Parse(lines[index], index);
        if (parsed == true) {
          break;
        }
      }

      if (parsed == false) {
        this.htmlParseParagraphHandler.Parse(lines[index], index);
      }
    }
  }
}

export class BookMarkdownDocument {
  constructor() {}

  public ToHtml(content: string): string {
    let htmlParse: HtmlParseDocument = new HtmlParseDocument(content, ["style01", "style02", "style03", "style04"]);
    htmlParse.Parse();
    return htmlParse.GetContent();
  }
}
