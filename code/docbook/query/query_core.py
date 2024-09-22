"""
query_core.py


"""

import re
import logging

from typing import Union, List, Dict, Tuple
from enum import Enum

logger = logging.getLogger('query.core')

class Query(object):
  """
  查询条件对象，负责对给定的内容判断是否符合查询语句条件。
  """

  def __init__(self, query_string: str = None):
    """
    初始化QueryObject对象。

    :param query_string: 查询语句。
    """
    self._query_string = None if query_string is None else query_string
    self._query_list = None if query_string is None else self.parse_query(query_string)

  @property
  def query_string(self):
    return self._query_string

  @query_string.setter
  def query_string(self, query_string: str = None):
    self._query_string = None if query_string is None else query_string
    self._query_list = None if query_string is None else self.parse_query(query_string)

  @property
  def query_list(self):
    return self._query_list

  def __parse_nestedbrackets_to_list(self, s: str, i: int = 0, level: int = 0) -> Tuple[int, List[str], int]:
    """
    对带小括号的字符串解码为嵌套的list。
    比如：s = "(大人 or 小人) and not 君子", 或者s = "a and and b or c",
    或者s = "h or (a and (b or c and not (f or g))) and (not e) or k or j and (i and m)"

    本函数为迭代函数，因此，每次输出都返回解码到第几个字符，下一次迭代需要解码的字符串以及嵌套层数。

    :param s: 带嵌套小括号的字符串
    :param i: 第几个字符开始解码，外部调用不用定义
    :param level: 当前为嵌套第几层，外部调用不用定义
    :return:
      tuple: 包含三个元素的元组。
      第一个元素，下一次迭代从第几个字符开始解码；
      第二个元素，下一次迭代的字符串；
      第三个元素，下一次迭代的嵌套层数。

    示例:
    >>> s = "h or (a and (b or c and not (f or g))) and (not e) or k or j and (i and m)"
    >>> _parse_nestedbrackets_to_list(s)
    (74,
    ['h or ',
      ['a and ', ['b or c and not ', ['f or g']]],
      ' and ',
      ['not e'],
      ' or k or j and ',
      ['i and m']],
    0)

    reference from: stackoverflow.com/questions/14952113/how-can-i-match-nested-brackets-using-regex
    """
    result = []
    content = ''
    while i < len(s):
      if s[i] == '(':
        if len(content):
          logger.debug(f"L{level}, {content}")
          result.append(content)
          content = ''
        i, r, level = self.__parse_nestedbrackets_to_list(s, i + 1, level + 1)
        result.append(r)
      elif s[i] == ')':
        if len(content):
          logger.debug(f"L{level}, {content}")
          result.append(content)
        return i + 1, result, level - 1
      else:
        content += s[i]
        i += 1
        logger.debug(f"L{level}, {content}")
    if len(content):
      logger.debug(f"L{level}, {content}")
      result.append(content)
      content = ''
    return i, result, level

  def __judge_condition(self, conditiona: Union[bool, None], conditionb: Union[bool, None], operator: str) -> bool:
    """
    输出对两个条件进行操作符指定操作后的结果。

    :param conditiona: 条件A
    :param conditiona: 条件B
    :param operator: 条件操作符号，AND, OR
    :return: 输出条件执行后的结果。
    """
    if conditiona is None and conditionb is not None:
      return conditionb
    if conditionb is None and conditiona is not None:
      return conditiona

    # assert operator == 'AND' or operator == 'OR'
    if operator == 'AND':
      return conditiona and conditionb
    elif operator == 'OR':
      return conditiona or conditionb
    else:
      return conditiona and conditionb
      # logger.error(f"Error in A: {conditiona}, B: {conditionb}, operator: {operator}.")

  def __excute_single_query(self,
      query: str,
      content: str,
      last_condition: Union[bool, None] = None,
      operator: Union[str, None] = None,
      not_operator: bool = False,
      level: int = 0
  ) -> Tuple[Union[bool, None], str, bool]:
    """
    对给定的content，执行query查询，并和last_condition进行条件操作。

    :param query: 非嵌套的查询语句，有三种形式，如：
      1. query type1 = condition + operator + [query type1]
      2. query type2 = operator
      3. query type3 = operator + condition + [query type2 | query type3]
      其中,
      query中的operator = AND | OR | NOT | AND + NOT | OR + NOT
    :param last_condition: 上一个查询条件结果。
    :param operator: 上一个查询条件和本次查询条件的条件操作符。
    :param not_operator: 本次条件是否是包含not前缀操作符。
    :return:
      tuple: 包含三个元素的元组。
      第一个元素，执行条件查询后的结果；
      第二个元素，未执行完成的条件操作符；
      第三个元素，未执行完成的条件操作符是否是包含not前缀操作符。
    NOTE: 应该处理当条件已经变成FALSE后，就不应该在往下处理。
    """
    operator = operator
    not_operator = not_operator
    last_condition = last_condition
    result = last_condition
    condition = None
    for index, word in enumerate(query):
      if len(word) == 0:
        continue
      upper_word = word.upper()
      if upper_word == 'AND' or upper_word == 'OR':
        operator = upper_word
      elif upper_word == 'NOT':
        not_operator = True
      else:
        match = [m.start() for m in re.finditer(word, content)]
        condition = True if len(match) else False

        if not_operator:
          condition = not condition
          not_operator = False
        if last_condition is not None:
          result = self.__judge_condition(last_condition, condition, operator)
          operator = None
          last_condition = result
        else:
          last_condition = condition
          condition = None
      logger.debug(
          f"{'': <{level*2}}{index}: {word}, A: {last_condition}, B: {condition}, operator: {operator}, not: {not_operator}.")
    return last_condition, operator, not_operator

  def __excute_query(self,
      querylist: List[str],
      content: str,
      last_condition: Union[bool, None] = None,
      operator: Union[str, None] = None,
      not_operator: bool = False,
      level: int = 0
  ) -> Tuple[Union[bool, None], str, bool, int]:
    """
    对给定的content，执行querylist嵌套查询，并和last_condition进行条件操作。

    :param querylist: 嵌套查询对象。
    :param last_condition: 上一个查询条件结果。
    :param operator: 上一个查询条件和本次查询条件的条件操作符。
    :param not_operator: 本次条件是否是包含not前缀操作符。
    :return:
      tuple: 包含三个元素的元组。
      第一个元素，执行条件查询后的结果；
      第二个元素，未执行完成的条件操作符；
      第三个元素，未执行完成的条件操作符是否是包含not前缀操作符。
    NOTE: 应该处理当条件已经变成FALSE后，就不应该在往下处理。
    """
    last_condition = last_condition
    operator = operator
    not_operator = not_operator
    level = level
    for q in querylist:
      if isinstance(q, list):
        logger.debug(f"{'': <{level*2}}L{level}, sub-query begin: {q}")
        sub_last_condition, sub_operator, sub_not_operator, _ = self.__excute_query(
            q, content, last_condition=None, operator=None, not_operator=False, level=level+1)

        if not_operator:
          sub_last_condition = not sub_last_condition
        not_operator = sub_not_operator
        if last_condition is not None:
          result = self.__judge_condition(
              last_condition, sub_last_condition, operator)
          operator = sub_operator
          last_condition = result
        else:
          last_condition = sub_last_condition
        logger.debug(
            f"{'': <{level*2}}L{level}, sub-query end: L: {last_condition}, operator: {operator}, not: {not_operator}.")
      else:
        result = q.split(" ")  # 以空格为分隔符分割字符串 "apple banana cherry"
        logger.debug(f"{'': <{level*2}}L{level}, query begin: " +
                     "/".join(result))  # 输出结果为 ['apple', 'banana', 'cherry']
        last_condition, operator, not_operator = self.__excute_single_query(
            result, content, last_condition=last_condition, operator=operator, not_operator=not_operator, level=level)
        logger.debug(
            f"{'': <{level*2}}L{level}, query end: L: {last_condition}, operator: {operator}, not: {not_operator}.")
    return last_condition, operator, not_operator, level

  def get_query_keys(self, query_string: Union[str, None] = None) -> List[str]:
    """
    获取查询语句中的关键字。

    :param query_string:
      查询语句字符串。
      缺省为空，默认为QueryObject对象初始化时的查询语句。
    :return:
      list，包含关键字的字符串数组。

    示例:
      >>> qo = Query("大人 and 小人 not 君子")
      >>> qo.get_query_keys()
    ['大人', '小人', '君子']

    原则上'君子'是不应该输出的。因为，君子在查询语句中是否定条件。
    """
    query_string = query_string if query_string is not None else self._query_string
    if query_string is None:
      return []

    operators = ['and', 'AND', 'or', 'OR', 'not', 'NOT', '(', ')']
    for operator in operators:
      query_string = query_string.replace(operator, '')

    keys = query_string.split(' ')
    keys = [key for key in keys if len(key)]
    return keys

  def parse_query(self, query_string: str) -> List[str]:
    """
    将查询语句解码成包含嵌套关系的list。

    :param query_string:
      查询语句字符串。
    :return:
      list，为包含非嵌套逻辑的查询语句嵌套关系的list。

    示例:
      >>> qo = Query()
      >>> qo.parse_query("(大人 and 小人) not (君子 or 圣人)")
      [['大人 and 小人'],
        'not',
        ['君子 or 圣人']
      ]
    """
    _, query_list, _ = self.__parse_nestedbrackets_to_list(query_string)
    return query_list

  def excute_query(self, content: str, query_list: Union[List[str], None] = None) -> bool:
    """
    对给定的内容，判断是否符合查询条件。

    :param content: 给定的内容字符串。
    :param query_list:
      查询语句列表。
      缺省为空，默认为QueryObject对象初始化时的查询语句解码后的查询语句列表。

    :return:
      boolean，True符合查询条件；False，不符合查询条件。

    示例:
      >>> qo = Query('君子 and 小人')
      >>> qo.excute_query('初六：童观，小人无咎，君子吝。')
      True
    """
    query_list = self._query_list if query_list is None else query_list
    if query_list is not None:
      result, _, _, _ = self.__excute_query(query_list, content)
      return result
    else:
      logger.warning(f"no query string...")
      return False