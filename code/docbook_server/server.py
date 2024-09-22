import uuid
import logging

from flask import Flask, jsonify, request
from pypinyin import pinyin, Style

from typing import Union, List, Dict, Tuple
from enum import Enum

from utils import setup_logging, remove_useless_value
from docbook import Division, Book, BookFile, BookArchive, BookQuery
from query import QueryResultPiece

# 实例化并命名为 app 实例
app = Flask(__name__)

def sort_func(query_result_piece: QueryResultPiece):
  """
  用chapter的book title为第一排序，中文拼音排序。
  """
  directory = query_result_piece.directory
  if (directory is None):
    assert 0
    return (pinyin("", style = Style.TONE3), query_result_piece.order)
  else:
    return (pinyin(directory[-1].title.title, style = Style.TONE3), query_result_piece.order)

def directory_to_dict_func(directory):
  """
  将chapter在书籍中的路径（包含`Division`对象的List）解析成只包含`id`和`title`的dict集合。
  """
  return [{'id': dir.id, 'title': dir.title.title} for dir in directory]

# http://127.0.0.1:6060/book/search?q=大人%20and%20小人
@app.route("/book/search", methods=["GET"])
def search_in_dbarchive():
  """
  基于关键字搜索文献库中书中的内容，给出以正文段落搜索范围的搜索结果集。
  @param {str} q - 搜索关键字组合，可以用and，or，not来组合关键字。
  @param {List[str]} books - 搜索文献库中书籍的范围。+表示只搜索指定的书籍，-表示排除掉文献库中的书籍。
  @param {surround} surround - 搜索结果中，关键字附近的文字最大数量，超出的用...来省略掉。
  @param {start} start - 选出搜索结果集中的起始结果。
  @param {count} count - 从`start`开始，提供count个搜索结果。
  """
  if request.method == 'GET':
    q = request.args.get('q')
    book_list = request.args.get("book_list")
    start = request.args.get("start")
    count = request.args.get("count")
    surround = request.args.get("surround", type=int)

    logging.info(f"/book/search, q: {q}, book_list: {book_list}, start: {start}, count: {count}, surround: {surround}.")

    if start is None:
      start = 0
    
    if (q is not None):
      dbquery = BookQuery()
      dbarchive = app.dbarchive

      directorys = dbarchive.get_chapters_directorys()
      query_results = dbquery.search_in_chapters(q, directorys, limit = None)
      query_results.sort_query_result_piece(sort_func)

      for query_result_piece in query_results.query_result_pieces:
        for index, hit in enumerate(query_result_piece.hits):
          logger.info(f"query: {query_results.query.query_string}, {'' if query_result_piece.directory is None else '|'.join([dir.title.title for dir in query_result_piece.directory])}, content: {hit[0]}.")
          query_result_piece.hits[index] = (dbquery.highlights(hit[0], format = BookQuery.MARK_TEXT, keys = query_results.query.get_query_keys(), strong = True, surround = surround), hit[1])

      return jsonify(remove_useless_value(query_results.to_dict()))
    else:
      return jsonify(error = "q parameter is missing."), 400  # 使用HTTP状态码400表示错误请求

@app.route("/book/list", methods=["GET"])
def get_book_list():
  """
  基于关键字搜索文献库中书籍，给出命中的书籍对象（只包含目录）。
  """
  if request.method == 'GET':
    q = request.args.get('q')

    logging.info(f"/book/list, q: {q}.")

    dbarchive = app.dbarchive
    if (q is not None) and (len(q) > 0):
      dbquery = BookQuery()
    
      dbooks = dbquery.search_book_bytitle(q, dbarchive.dbooks, limit = None)
    else:
      dbooks = dbarchive.dbooks

    dbooks.sort(key = lambda dbook: pinyin(dbook.title.title, style = Style.TONE3))
    return jsonify({
      "query_target_count": len(dbooks),
      "result_pieces_count": len(dbarchive.dbooks), 
      "result_pieces": remove_useless_value([dbook.get_brief() for dbook in dbooks])
    })
  
@app.route("/book/catalogue", methods=["GET"])
def get_book_catalogue():
  if request.method == 'GET':
    bid = request.args.get('bid')

    logging.info(f"/book/catalogue, bid: {bid}.")

    if (bid is not None):
      dbarchive: BookArchive = app.dbarchive
      dbook: Book = dbarchive.get_book_byid(bid)

      if dbook is not None:
        return jsonify(remove_useless_value(dbook.get_catalogue()))
      else:
        return jsonify(error = f"can't find book: {bid}."), 400  # 使用HTTP状态码400表示错误请求
    else:
      return jsonify(error = "bid parameter is missing."), 400  # 使用HTTP状态码400表示错误请求

@app.route("/book/chapter", methods=["GET"])
def get_book_chapter():
  if request.method == 'GET':
    bid = request.args.get('bid')
    cid = request.args.get('cid')

    logging.info(f"/book/chapter, bid: {bid}, cid: {cid}.")

    if (bid is not None):
      dbarchive: BookArchive = app.dbarchive
      dbfile: BookFile = dbarchive.get_bookfile_byid(bid)

      if (dbfile is not None):
        chapter = None
        isloaded = False 
        if (cid is not None):
          isloaded, chapter = dbfile.load_chapter_byid(cid)
        else:
          isloaded, chapter = dbfile.load_chapter_byid(dbfile.book.chapters[0].id) if dbfile.book.chapters is not None else (False, None)

        if chapter is not None:
          return jsonify(remove_useless_value(chapter.to_dict()))
        else:
          return jsonify(error = f"can't find book chapter: {bid, cid}."), 400  # 使用HTTP状态码400表示错误请求
      else:
        return jsonify(error = f"can't find book: {bid}."), 400  # 使用HTTP状态码400表示错误请求
    else:
      return jsonify(error = "bid parameter is missing."), 400  # 使用HTTP状态码400表示错误请求

@app.route("/book/chapters", methods=["GET"])
def get_book_chapters():
  if request.method == 'GET':
    bid = request.args.get('bid')
    cid = request.args.get('cid')

    logging.info(f"/book/chapters, bid: {bid}, cid: {cid}.")

    if (bid is not None):
      dbarchive: BookArchive = app.dbarchive
      dbfile: BookFile = dbarchive.get_bookfile_byid(bid)

      if (dbfile is not None):
        chapter = None
        isloaded = False 
        if (cid is not None):
          isloaded, chapter = dbfile.load_chapter_byid(cid)
          cid = uuid.UUID(cid)
        else:
          isloaded, chapter = dbfile.load_chapter_byid(dbfile.book.chapters[0].id) if dbfile.book.chapters is not None else (False, None)
          cid = chapter.id

        directorys: List[Union['Division', 'Book']] = dbfile.book.get_chapters_directorys(True)
        chapters = []
        for (index, directory) in enumerate(directorys):
          chapters.append({
              'directory': [{'id': dir.id, 'title': dir.title.title} for dir in directory],
              'content': None if (chapter is None) or (directory[-1].id != cid) else chapter.to_dict()
            }
          )
        return jsonify(remove_useless_value(chapters))
      else:
        return jsonify(error = f"can't find book: {bid}."), 400  # 使用HTTP状态码400表示错误请求
    else:
      return jsonify(error = "bid parameter is missing."), 400  # 使用HTTP状态码400表示错误请求

# 定义 main 入口
if __name__ == "__main__":
  setup_logging(log_file = 'server.log', level = logging.INFO)
  logger = logging.getLogger("server")

  # 禁止对jsonify输出json时按照键进行排序
  app.json.ensure_ascii = False
  #app.config['JSON_SORT_KEYS'] = False
  # 禁止中文转义
  app.json.sort_keys = False
  #app.config['JSON_AS_ASCII'] = False  

  # load all books from library path
  app.dbarchive = BookArchive('/Users/sunyafu/zebra/docbook/library/publish', True)
  for book in app.dbarchive.dbooks:
    book.rebuild_chapters_order()

  QueryResultPiece.DIRECTORY_TO_DICT_FUNC = directory_to_dict_func

  # 调用 run 方法，设定端口号，启动服务
  app.run(port = 6060, host = "0.0.0.0", debug = True)