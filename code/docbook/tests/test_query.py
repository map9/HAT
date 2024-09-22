import sys
import os
import logging

import query
import utils
import docbook

from pypinyin import pinyin, Style

def test_query():
  query_string = "h or (a and (b or c and not (f or g))) and (not e) or k or j and (i and m)"
  q = query.Query(query_string)
  logger.info(f"query: {query_string}, \nparse list: {q.query_list}.\n")

  keys = q.get_query_keys()
  logger.info(f"query: {query_string}, \nkeys: {keys}.\n")

  query_strings = [
    "((大人 or 小人) and (not 君子)) or 密云不雨",
    "(not 君子)",
    "大人",
    "not (大人 or 小人) and (君子)",
    "君子 and not (大人 or 小人)",
    "大人 or 小人 or 君子 or 圣人"]

  contents = [
    "天之爱人也，薄于圣人之爱人也；其利人也，厚于圣人之利人也。大人之爱小人也，薄于小人之爱大人也；其利小人也，厚于小人之利大人也。以臧为其亲也，而爱之，非爱其亲也；以臧为其亲也，而利之，非利其亲也。以乐为爱其子，而为其子欲之，爱其子也。以乐为利其子，而为其子求之，非利其子也。",
    "密云不雨，君子",
    "太公曰：“臣闻君子乐得其志，小人乐得其事。今吾渔甚有似也，殆非乐之也。”",
    "朝散大夫|右諫議大夫|權御使中丞|充理檢使|上護軍|賜紫金魚袋",
    ""]

  for query_string in query_strings:
    q = query.Query(query_string)
    for content in contents:
      result = q.excute_query(content)
      logger.info(f"query: {query_string}, \ncontent: {content}, \nresult: {result}.\n")

def test_get_chapter_directory():
  dbook_path = "/Users/sunyafu/zebra/Book/Books/library/publish/books/战国策.dbook"
  dbfile = docbook.BookFile(dbook_path)

  chapter_id = "9acd3206-e369-4e42-8b07-5c1c7f1b55ad"
  directory = dbfile.book.get_chapter_directory_byid(chapter_id, False)
  if (directory is not None):
    path = ' | '.join([tup[1] for tup in directory])
    logger.info(f"path: {path}")

  directory = dbfile.book.get_chapter_directory_byid(chapter_id)
  if (directory is not None):
    path = ' | '.join([dir.title.title for dir in directory])
    logger.info(f"path: {path}")

def test_get_chapters_directorys():
  dbook_path = "/Users/sunyafu/zebra/Book/Books/library/publish/books/战国策.dbook"
  dbfile = docbook.BookFile(dbook_path)

  chapter_id = "9acd3206-e369-4e42-8b07-5c1c7f1b55ad"
  directorys = dbfile.book.get_chapters_directorys()
  for directory in directorys:
    path = ' / '.join([dir.title.title for dir in directory])
    logger.info(f"path: {path}")

def sort_func(query_result_piece: docbook.QueryResultPiece):
  """
  用chapter的book title为第一排序，中文拼音排序。
  """
  directory = query_result_piece.directory
  if (directory is None):
    assert 0
    return (pinyin("", style = Style.TONE3), query_result_piece.order)
  else:
    return (pinyin(directory[-1].title.title, style = Style.TONE3), query_result_piece.order)

def test_query_book():
  dbook_path = "/Users/sunyafu/zebra/Book/Books/library/publish/books/周易.dbook"
  dbfile = docbook.BookFile(dbook_path)

  directorys = dbfile.book.get_chapters_directorys()
  query_results = docbook.search_in_chapters("君子 or 小人", directorys)
  query_results.sort_query_result_piece(sort_func)

  for query_result_piece in query_results.query_result_pieces:
    directory = query_result_piece.directory
    path = ""
    if (directory is not None):
      path = '|'.join([dir.title.title for dir in directory])
    
    for hit in query_result_piece.hits:
      logger.info(f"query: {query_results.query.query_string}, {path}, content: {hit[0]}.")

def test_query_archive():
  dbook_archive_path = "/Users/sunyafu/zebra/Book/Books/library/publish"

  dbarchive = docbook.BookArchive(dbook_archive_path)

  dbooks = dbarchive.dbbooks
  for book in dbooks:
    book.rebuild_chapters_order()

  directorys = dbarchive.get_chapters_directorys()
  query_results = docbook.search_in_chapters("君子 and 小人", directorys)
  query_results.sort_query_result_piece(sort_func)

  for query_result_piece in query_results.query_result_pieces:
    directory = query_result_piece.directory
    path = ""
    if (directory is not None):
      path = '|'.join([dir.title.title for dir in directory])
    
    for hit in query_result_piece.hits:
      logger.info(f"query: {query_results.query.query_string}, {path}, content: {hit[0]}.")

if __name__ == "__main__":
  utils.setup_logging(log_file = 'test.log', level = logging.INFO)
  logger = logging.getLogger("test.query")
  
  test_query()
  test_get_chapter_directory()
  test_get_chapters_directorys()
  test_query_book()
  test_query_archive()
