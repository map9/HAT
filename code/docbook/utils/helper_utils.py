"""
helper_utils.py

提供一些独立的函数。
"""
import re

from typing import Union, List, Dict, Tuple
from enum import Enum
from urllib.parse import urlparse

def remove_useless_value(data) -> any:
  """
  The `remove_useless_value` function removes None values, empty lists, empty dictionaries, and
  strings of length 0 from a given data object to reduce the output data size.
  @param data - The function `remove_useless_value` is designed to remove None values, empty lists,
  empty dictionaries, and strings with length 0 from the `data` object to reduce the amount of data
  being output.
  @returns The `remove_useless_value` function is designed to remove None values, empty lists, empty
  dictionaries, and strings with length 0 from the `data` object to reduce the output data size.
  """
  if isinstance(data, Dict):
    # 递归处理字典
    return {k: remove_useless_value(v) for k, v in data.items() if v is not None and ((not isinstance(v, Dict) and not isinstance(v, list) and not isinstance(v, str)) or len(v) > 0)}
  elif isinstance(data, list):
    # 递归处理列表
    return [remove_useless_value(item) for item in data if item is not None and ((not isinstance(item, Dict) and not isinstance(item, list) and not isinstance(item, str)) or len(item) > 0)]
  else:
    # 直接返回非字典、非列表的值
    return data

def is_valid_url(url) -> bool:
  """
  The `is_valid_url` function uses regular expressions to check if a URL is valid, supporting both
  absolute and relative paths.
  @param url - The `is_valid_url` function you provided is a Python function that checks whether a
  given URL is valid. It first checks if the URL is an absolute URL using a regular expression
  pattern, and if not, it then checks if it is a relative path.
  @returns The `is_valid_url` function returns a boolean value - `True` if the input URL is valid
  (either an absolute URL or a relative path), and `False` if the input URL is invalid.
  """
  # 绝对 URL 的正则表达式
  absolute_url_regex = re.compile(
    r'^(?:http|ftp)s?://'  # http:// or https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,}|[A-Z0-9-]{2,})|'  # domain...
    r'localhost|'  # localhost...
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|'  # ...or ipv4
    r'\[?[A-F0-9]*:[A-F0-9:]+\]?)'  # ...or ipv6
    r'(?::\d+)?'  # optional port
    r'(?:/?|[/?]\S*)$', re.IGNORECASE)  # path and query

  # 检查绝对 URL
  if re.match(absolute_url_regex, url):
    return True

  # 处理相对路径
  parsed = urlparse(url)
  # 如果 URL 中没有协议部分（scheme），则认为是相对路径
  if not parsed.scheme:
    # 相对路径的正则表达式
    relative_path_regex = re.compile(
      r'^[^/\0]+(?:/[^/\0]*)*(?:\?[^\0]*)?(?:#[^\0]*)?$')
    return relative_path_regex.match(url) is not None

  return False

def remove_html_tags(text: str) -> str:
  """
  The function `remove_html_tags` removes HTML tags from a given text string using regular
  expressions.
  @param {str} text - The `text` parameter in the `remove_html_tags` function is a string that
  contains HTML tags. The function uses a regular expression to match and replace these HTML tags with
  an empty string, effectively removing them from the text.
  @returns The function `remove_html_tags` returns the input text with all HTML tags removed.
  """
  # 使用正则表达式匹配并替换 HTML 标签
  clean_text = re.sub(r'<[^>]+>', '', text)
  return clean_text
