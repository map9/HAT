import { UUID } from "crypto";

// 标题。书籍、章节等标题。
export interface Title {
  title: string;
  prefix?: string;
  subtitle?: string;
}

// 时代。封建社会主要以朝代为时代，新中国统一标注为现代。
export interface Dynasty {
  value: string;
}

// 著作者。本书的著作者以及他参与著作的工作类型。
export interface Author {
  id: UUID;
  name: string;
  type: string;
  dynasty?: Dynasty;
  officialPosition?: string;
}

// 书籍分段类型。卷，章，节，段落：正文段落，注释段落。
export enum DivisionType {
  VOLUME = "VOLUME",
  CHAPTER = "CHAPTER",
  SECTION = "SECTION",
  PARAGRAPH = "PARAGRAPH",
  ANNOTATION = "ANNOTATION",
}

// 卷册章。书籍正文划分方式，一般来说，没有涉及到正文内容的，都属于卷、册、分卷、分册范围；涉及到具体的正文内容的，为章、序、跋、致谢等。节是章内的正文划分。
export interface Division {
  id: UUID;
  order: number;
  title?: Title;
  authors?: Author[];
  type: DivisionType;
  ref?: string;
  divisions?: (Division | ContentPiece)[];
}

// 节、正文段落、注释段落。节是章内的正文划分。
// 正文文本段落。由一个或者多个无分行的独立文本段组成的正文内容，一般由一个文本段来构建，诗歌的正文文本段落主要会由多个文本段来组成。
export interface ContentPiece {
  type: DivisionType,
  content: string,
  annotator?: string,
  source?: string,
  position?: number,
  content_pieces?: ContentPiece[],
}

// 文献书籍。
export interface Book {
  id: UUID,
  title: Title,
  authors?: Author[],
  dynasty?: Dynasty,
  categories?: string[],
  source?: string,
  description?: string,
  divisions?: Division[],
}

export interface Figure {
  id: UUID;
  name: string;
  // 所在朝代
  dynasty?: Dynasty,
  // 简介
  description?: string;
  // 生卒时间
  life?: string;
}

// 定义接口来描述searchRangeOptions中的对象
export interface SearchRangeOption {
  value: string;
  label: string;
}

export enum SearchRange {
  book = 'Book',
  content = 'Content',
}

export interface DirectoryTuple {
  id: UUID,
  title: string,
}

export interface HitTuple {
  content: string,
  relevance: number,
}

// 搜索结果集
export interface QueryResultPiece {
  directory: DirectoryTuple[],
  hits: HitTuple[],
}

// 搜索结果集合
export interface QueryResults {
  query_target_count: number;
  query_result_count: number;
  result_pieces?: QueryResultPiece[];
};

// 搜索结果目录统计
export interface QueryResultsDirectory {
  id: UUID,
  title: string,
  hitCount: number,
  checkStatus: true,
  childs: QueryResultsDirectory[]
};

// 图书章节集合
export interface BookReaderChapter {
  directory: DirectoryTuple[],
  content: Division,
}
