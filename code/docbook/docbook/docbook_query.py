"""
docbook_query.py

docbook_query搜索docbook对象内容，并将搜索结果保存在QueryResult中。
"""

import re
import json
import logging

from typing import Union, List, Dict, Tuple
from enum import Enum

from concurrent.futures import ThreadPoolExecutor
import threading

from query import Query, QueryResults, QueryResultPiece
from docbook import Book, Division, ContentPiece, DivisionType 
from utils import remove_html_tags

logger = logging.getLogger('docbook.query')

class BookQuery(object):
  # 在被检索到的文字之前和之后显示更多上下文
  #SURROUND = 60

  # 色谱
  COLOR_MAP = ['red', 'blue', 'green', 'yellow', 'pink']

  # 普通文本
  PLAIN_TEXT = 0
  # Html文本
  HTML_TEXT = 1
  # Markdown文本
  MARKDOWN_TEXT = 2
  # Mark文本
  MARK_TEXT = 3

  QUERY_MAX_RESULT_NUM: int = 100
  QUERY_THREAD_NUM: int = 10

  # Global variables for result tracking
  global_result_count = 0
  result_count_lock = threading.Lock()
  stop_search_event = threading.Event()

  @staticmethod
  def highlights(text, format: int = PLAIN_TEXT, keys: List[str] = [], strong = False, color_map = None, surround = None):    
    if (format != BookQuery.HTML_TEXT) and (format != BookQuery.MARKDOWN_TEXT) and (format != BookQuery.MARK_TEXT):
      format = BookQuery.PLAIN_TEXT   
    if ((format == BookQuery.PLAIN_TEXT) and (surround is None)):
      return text
    if (keys is None) or (len(keys) == 0):
      return text
    
    if color_map is None:
      color_map = BookQuery.COLOR_MAP

    pattern = '|'.join(re.escape(key) for key in keys)
    pattern = f'({pattern})'
    matches = re.finditer(pattern, text)
    
    last_match = None
    highlighted_text = ''
    for match in matches:
      keyword = match.group(0)
      index = keys.index(keyword)
      color = color_map[index % len(color_map)]

      if format == BookQuery.HTML_TEXT or format == BookQuery.MARKDOWN_TEXT:
        if strong:
          keyword = f'<span style="color: {color}; font-weight: bold;">{keyword}</span>'
        else:
          keyword = f'<span style="color: {color};">{keyword}</span>'
      elif format == BookQuery.MARK_TEXT:
          keyword = f'<mark>{keyword}</mark>'

      if last_match is None:
        start = max(0, match.start() - surround) if surround else 0
        before_text = text[start : match.start()]
        if start > 0:
          before_text = '...' + before_text
        highlighted_text = highlighted_text + before_text + keyword
      else:
        between = (match.start() - last_match.end())
        if surround is None or between < 2 * surround + 3:
          highlighted_text = highlighted_text + text[last_match.end() : match.start()] + keyword
        else:
          after_text = text[last_match.end() : last_match.end() + surround]
          after_text = after_text + '...'
          before_text = text[match.start() - surround : match.start()]
          highlighted_text = highlighted_text + after_text + before_text + keyword
      last_match = match

    end = min(len(text), last_match.end() + surround) if surround else len(text)
    after_text = text[last_match.end() : end]
    if end < len(text):
        after_text = after_text + '...'
    
    if (format == BookQuery.HTML_TEXT) or (format == BookQuery.MARKDOWN_TEXT):
      highlighted_text = f'<p>{highlighted_text + after_text}</p>'
    else:
      highlighted_text = highlighted_text + after_text
    
    return highlighted_text
  
  @staticmethod
  def dump_query_results(query_results: QueryResults, format: int = PLAIN_TEXT, keys = None, strong = False, color_map = None, surround = None):
    if format == BookQuery.HTML_TEXT:
      output_string = ("<table border='1'>\n"
                      f"<tr><th>NO</th><th>书籍</th><th>章节·段落</th><th>内容</th></tr>")
    elif format == BookQuery.MARKDOWN_TEXT:
      output_string = ("|NO|书籍|章节·段落|内容|\n"
                      "|--|--|--|--|\n")
    else:
      output_string = ''

    index = 0
    for query_result_piece in query_results._query_result_pieces:
      divisions = query_result_piece.directory
      book_title = divisions[0]
      book_chapters = ''.join(divisions[1:], '·') if len(divisions) > 1 else ""
      if format == BookQuery.HTML_TEXT:
        for hit in query_result_piece.hits:
          index += 1
          output_string += ("<tr>"
                            f"<td>{index:04}</td><td>{book_title}</td><td>{book_chapters}</td>"
                            f"<td>{query_results.highlights(hit[0], format = format, keys = keys, strong = strong, color_map = color_map, surround = surround)}</td>"
                            "</tr>")
        output_string += "</table>"
      elif format == BookQuery.MARKDOWN_TEXT:    
        for hit in query_result_piece.hits:
          index += 1
          output_string += (f"|{index:04}|{book_title}|{book_chapters}|"
                            f"{query_results.highlights(hit[0], format = format, keys = keys, strong = strong, color_map = color_map, surround = surround)}|\n")
      else:
        for hit in query_result_piece.hits:
          index += 1
          output_string += (f"{index:04} . {book_title} {book_chapters}\n"
                            f"{query_results.highlights(hit, format = format, keys = keys, strong = strong, color_map = color_map, surround = surround)}\n")

    return output_string

  @staticmethod
  def __search_in_chapter_section(q: Query, content_piece: ContentPiece, limit: int = None, annotation: bool = False) -> List[Tuple[str, float]]:
    if (annotation == False) and (content_piece.type == DivisionType.ANNOTATION):
      return []

    hits: List[{str, float}] = []

    #logger.info(f"search string: {q.query_string}, content: {content_piece.content}")
    # 检索范围定义为一个正文段落
    # TODO: 值得商榷，不同的范围定义，能搜索到的信息也是不一样的。
    #       关于语义的搜索，可以考虑采用LLM来进行搜索匹配
    spans = content_piece.content.split('\n')
    for span in spans:
      span = remove_html_tags(span)
      result = q.excute_query(span)
      if (result == True):
        hits.append((span, 1.0))

    for index, content_piece in enumerate(content_piece.content_pieces):
      hits += BookQuery.__search_in_chapter_section(q, content_piece, limit, annotation)
    
    return hits

  @staticmethod
  def __search_in_chapter(q: Union[Query, str], directory: List[Union[Division, Book]], limit: int = None, annotation: bool = False) -> Union[QueryResultPiece, None]:
    if (q is None) or (directory is None) or (len(directory) == 0) or BookQuery.stop_search_event.is_set():
      return None
    if isinstance(q, str):
      q = Query(q)

    chapter: Division = directory[-1]
    if (isinstance(chapter, Division) == False) or (chapter.type != DivisionType.CHAPTER):
      logger.debug(f"Invaild chapter {chapter}.")
      return None

    hits: List[{str, float}] = []
    for index, content_piece in enumerate(chapter.divisions):
      if BookQuery.stop_search_event.is_set():
        return None
      if (isinstance(content_piece, ContentPiece) == False):
        logger.error(f"a Invalid content_piece: {chapter}.")
        break
      
      hits += BookQuery.__search_in_chapter_section(q, content_piece, limit, annotation)

    if len(hits) > 0:
      with BookQuery.result_count_lock:
        if limit is not None and BookQuery.global_result_count + len(hits) > limit:
          BookQuery.stop_search_event.set()
          hits = hits[:limit - BookQuery.global_result_count]
        BookQuery.global_result_count += len(hits)
        #logger.info(f"BookQuery.global_result_count: {BookQuery.global_result_count}")
        query_results_piece = QueryResultPiece(directory, hits = hits, order = chapter.order)
      return query_results_piece
    else:
      return None

  @staticmethod
  def search_in_chapter(q: Union[Query, str], directory: List[Union[Division, Book]], limit = QUERY_MAX_RESULT_NUM, annotation: bool = False) -> Union[QueryResults, None]:
    if (q is None) or (directory is None) or (len(directory) == 0):
      return None
    if isinstance(q, str):
      q = Query(q)

    query_results: QueryResults = QueryResults(q)

    BookQuery.global_result_count = 0
    BookQuery.stop_search_event.clear()

    query_results_piece = BookQuery.__search_in_chapter(q, directory, limit, annotation)
    if query_results_piece is not None:
      query_results.add_query_result_piece(query_results_piece)
    
    # 不主动排序
    #query_results.sort_query_result_piece()
    return query_results

  @staticmethod
  def search_in_chapters(q: Union[Query, str], directorys: List[List[Union[Division, Book]]], limit: int = QUERY_MAX_RESULT_NUM, annotation: bool = False) -> Union[QueryResults, None]:
    """
    The `search_in_chapters` function searches for a query string in chapters and returns the
    results.

    :param query_string: The query string is the string that you want to search for in the chapters. It
    can be any text or keyword that you want to find in the chapters
    :param search_book_string: The `search_book_string` parameter is used to filter the books to be
    searched. It is a string that specifies the books to include or exclude from the search
    :param limit: The `limit` parameter is used to specify the maximum number of search results to
    return. By default, it is set to `QUERY_MAX_RESULT_NUM`, which is a constant value defined
    elsewhere in the code. You can change the value of `limit` to control the number of search results
    returned
    :return: a QueryResults object.
    """
    if (q is None) or (directorys is None) or (len(directorys) == 0):
      return None
    if isinstance(q, str):
      q = Query(q)

    query_results = QueryResults(q)

    # Reset global variables
    BookQuery.global_result_count = 0
    BookQuery.stop_search_event.clear()
    
    # 创建一个锁对象
    lock = threading.Lock()

    # 使用 ThreadPoolExecutor 对每个chapters的搜索启动一个线程进行处理
    with ThreadPoolExecutor(max_workers = BookQuery.QUERY_THREAD_NUM, thread_name_prefix = 'chapter_searcher') as executor:
      futures = [executor.submit(lambda p: BookQuery.__search_in_chapter(*p), (q, directory, limit, annotation)) for directory in directorys]

      # 等待每个线程执行完毕
      for future in futures:
        query_results_piece = future.result()
        #logger.info(f"query_results_piece.hits: {len(query_results_piece.hits) if query_results_piece is not None else None}")
        # 避免线程冲突
        with lock:
          if query_results_piece is not None:
            query_results.add_query_result_piece(query_results_piece)
        if limit is not None:
          if BookQuery.stop_search_event.is_set() and (query_results.query_result_count >= limit):
            break

    #query_results.sort_query_result_piece()
    return query_results

  @staticmethod
  def search_book_bytitle(q: Union[Query, str], dbooks: List[Book], limit: int = QUERY_MAX_RESULT_NUM) -> Union[List[Book], None]:
    if (q is None) or (dbooks is None) or (len(dbooks) == 0):
      return None
    if isinstance(q, str):
      q = Query(q)

    result_dbooks = []
    for dbook in dbooks:
      title = (f"{'' if dbook.title.prefix is None else dbook.title.prefix} . "
              f"{'' if dbook.title is None else dbook.title} . "
              f"{'' if dbook.title.subtitle is None else dbook.title.subtitle}")
      result = q.excute_query(title)
      if (result == True):
        result_dbooks.append(dbook)

    return result_dbooks