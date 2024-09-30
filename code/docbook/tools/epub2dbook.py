"""
decoder-epub.py
将电子书转换为docbook格式
"""

import pathlib
import argparse
from typing import Union, List

from bs4 import BeautifulSoup

import docbook
from .unzip_epubbook import UnzipEPubBook

class Converter():
  class2labels = {
  }
  
  IMG2LABELS = {  
  }

  def __init__(self, epub_dir: str, class2labels = None):

    self._epub_dir = epub_dir
    self._epub_book: UnzipEPubBook = None
    self._dbook: docbook.Book = docbook.Book()
    if class2labels is not None:
      self.class2labels = class2labels

    try:
      self._epub_book = UnzipEPubBook(epub_dir)
    except Exception as e:
      print(f"读文件：{epub_dir}/books.json出现错误，{e}")
      exit()

  def save_book(self, dbook_dir: str, type: docbook.BookFileType = docbook.BookFileType.PARTS_FILE) -> bool:
    if self._dbook is None:
      return False

    path = ""
    if (dbook_dir is None) or (len(dbook_dir) == 0):
      path = pathlib.Path(self._epub_dir).parent
    else:
      path = pathlib.Path(dbook_dir)

    print(f"save docbook to {path}.")
    docbook.BookFile.save_to_docbook(path, self._dbook, type)
    return True

  def get_class_label(self, item_class: str) -> str:
    """
    映射epub文件中xhtml中class到docbook缺省的标签。
    """
    label = self.class2labels.get(item_class)
    
    return self.class2labels.get('blank') if label is None else label

  
  def img2label(self, img: str) -> str:
    """
    映射epub文件中xhtml中img到docbook缺省的标签，同时对文字进行重新命名。
    """
    src = self.IMG2LABELS.get(img)
    if src is None:
      index = img.rfind('.')
      src = f"img{len(self.IMG2LABELS)+1:03}.gif" if (index == -1) else f"img{len(self.IMG2LABELS)+1:03}{img[index:]}"
      self.IMG2LABELS[img] = src
    return src

  def decode_toc_item(self, item):
    """
    解码TOC文件目录子项目。
    """
    toc_item = {}
    toc_item["label"] = item.navLabel.get_text(strip = True)
    toc_item["order"] = item.attrs['playOrder']
    toc_item["src"] = item.content.attrs['src']
    toc_item["sub_items"] = []
    #print(f"label: {toc_item["label"]}, order: {toc_item["order"]}, src: {toc_item["src"]}.")

    for index, child in enumerate(item.children):
      if child.name == 'navPoint':
        sub_toc_item = self.decode_toc_item(child)
        toc_item["sub_items"].append(sub_toc_item)
    
    return toc_item

  def decode_toc(self, content):
    """
    解码TOC文件目录项目。
    """
    if len(content) == 0:
      return []

    soup = BeautifulSoup(content, "xml")
    nav = soup.find("navMap")
    if hasattr(nav,'children') == False:
      return []

    toc_items = []
    for index, child in enumerate(nav.children):
      if child.name == 'navPoint':
        sub_toc_item = self.decode_toc_item(child)
        toc_items.append(sub_toc_item)
    
    return toc_items

  def decode_item(self, item: dict[str, Union[str, List]]):
    if len(item['sub_items']) == 0:
        return self.decode_chapter(item)
    else:
      return self.decode_volume(item)

  def decode_volume(self, item: dict[str, Union[str, List]]) -> docbook.Division:
    division = docbook.Division(type = docbook.DivisionType.VOLUME)
    division.title = item['label']

    for item in item['sub_items']:
      item_division = self.decode_item(item)
      division.add_division(item_division)
    return division

  def decode_book(self) -> docbook.Book:
    content = self._epub_book.get_toc_content()
    toc_items = self.decode_toc(content)

    # Volume or Chapter
    for toc_item in toc_items:
      division = self.decode_item(toc_item)
      self._dbook.add_division(division)

    return self._dbook

  # 需要重载该函数
  def decode_chapter(self, toc_item: dict[str, Union[str, List]]) -> docbook.Division:
    pass