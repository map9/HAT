"""
query_result.py

定义搜索结果（QueryResultPiece）和搜索结果集（QueryResults）。
"""

import json
import logging

from typing import Union, List, Dict, Tuple
from enum import Enum

from utils import remove_useless_value
from query import Query

logger = logging.getLogger('docbook.query')

class QueryResultPiece(object):
#  QueryResultPiece
#  - directory: []
#  - hits: [(content, relevance)]

  DIRECTORY_TO_DICT_FUNC = None

  def __init__(
      self, 
      directory: Union[List[str], None] = None,
      hits: List[Tuple[str, float]] = None,
      order: int = -1
  ):
    self._directory = [] if directory is None else directory
    self._hits = [] if hits is None else hits
    self._order = order

  @property
  def directory(self):
    return self._directory

  @directory.setter
  def directory(self, directory: Union[List[str], None] = None):
    self._directory = [] if directory is None else directory

  @property
  def hits(self):
    return self._hits

  @hits.setter
  def hits(self, hits: List[Tuple[str, float]] = None):
    self._hits = [] if hits is None else hits

  @property
  def order(self):
    return self._order

  @order.setter
  def order(self, order: int = -1):
    self._order = order

  @staticmethod
  def set_directory_to_dict_func(func):
    DIRECTORY_TO_DICT_FUNC = func

  def to_dict(self):
    return {
      "directory": (None if self._directory is None else str(self._directory)) if QueryResultPiece.DIRECTORY_TO_DICT_FUNC is None else QueryResultPiece.DIRECTORY_TO_DICT_FUNC(self._directory),
      "order": self._order,
      "hits": [{'content': hit[0], 'relevance': hit[1]} for hit in self._hits]
    }
  
  def dump_json(self, ensure_ascii: bool = False, indent: Union[int, None] = None, remove_useless: bool = False) -> str:
    d = self.to_dict()
    if remove_useless:
      d = remove_useless_value(d)
    return json.dumps(d, ensure_ascii = ensure_ascii, indent = indent)

  def __str__(self) -> str:
    return self.dump_json()


class QueryResults(object):
#  QueryResults
#  - query: Query
#  - query_result_pieces: [QueryResultPiece]

  def __init__(self, q: Union[str, Query, None] = None):
    # 查询结果对应的查询对象
    if isinstance(q, Query):
      self._query: Query = q
    else:
      self._query: Query = Query(q)

    # 查询结果数量，缺省的情况下，和_result_pieces的数量一致
    # 但limit后，查询结果的数量应该大于_result_pieces的数量
    self._query_target_count = None

    # 查询结果集合
    self._query_result_pieces: QueryResultPiece = []

  @property
  def query(self):
    return self._query

  @property
  def query_result_count(self):
    query_result_count = 0
    for query_result_piece in self._query_result_pieces:
      query_result_count += len(query_result_piece.hits)
    return query_result_count

  @property
  def query_target_count(self):
    if self._query_target_count is None:
      return self.query_result_count
    return self._query_target_count
  
  @query_target_count.setter
  def query_target_count(self, count: int):
    self._query_target_count = count

  @property
  def query_result_pieces(self):
    return self._query_result_pieces

  def to_dict(self):
    return {
      "query": self._query.query_string,
      "query_target_count": self.query_target_count,
      "query_result_count": self.query_result_count,
      "result_pieces": [query_result_piece.to_dict() for query_result_piece in self._query_result_pieces]
    }
  
  def dump_json(self, ensure_ascii: bool = False, indent: Union[int, None] = None, remove_useless: bool = False) -> str:
    d = self.to_dict()
    if remove_useless:
      d = remove_useless_value(d)
    return json.dumps(d, ensure_ascii = ensure_ascii, indent = indent)

  def __str__(self) -> str:
    return self.dump_json()

  def add_query_result_piece(self, query_result_piece: QueryResultPiece) -> List[QueryResultPiece]:
    if query_result_piece is not None:
      self._query_result_pieces.append(query_result_piece)
    return self._query_result_pieces

  def add_query_result_pieces(self, query_result_pieces: List[QueryResultPiece]) -> List[QueryResultPiece]:
    if query_result_pieces is not None:
      self._query_result_pieces.extend(query_result_pieces)
    return self._query_result_pieces

  def sort_query_result_piece(self, sort_func = None):
    if self._query_result_pieces is None:
      return

    # 默认为directory的第一个对象为第一排序，order为第二排序
    if sort_func is not None:
      self._query_result_pieces.sort(key = sort_func)
    else:
      self._query_result_pieces.sort(key = lambda query_result_piece: (str(query_result_piece.directory[0]), query_result_piece.order))

  def limit(self, limit) -> 'QueryResults':
    query_results = QueryResults(self._query)
    query_results.add_query_result_piece(self._query_result_pieces[:limit])
    query_results.query_target_count = self.query_result_count
    return query_results
    
  def sub(self, start: int, end: int) -> 'QueryResults':
    query_results = QueryResults(self._query)
    query_results.add_query_result_piece(self._query_result_pieces[start:end])
    query_results.query_target_count = self.query_result_count
    return query_results