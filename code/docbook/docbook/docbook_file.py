"""
docbook_file.py

docbook_file以文件方式来操作docbook文件。
docbook文件以目录或者打包方式来进行管理。
"""

import uuid
import json
import logging
from datetime import datetime, timezone

from typing import Union, List, Dict, Tuple
from enum import Enum

import pathlib
from .docbook_core import Book, Division, DecoderError

logger = logging.getLogger('docbook.file')

class BookFileType(Enum):
  SINGLE_FILE       = 0
  PARTS_FILE        = 1
  # TODO: unsupport
  SINGLE_PARTS_FILE = 2
  AUTO_DETECTED     = 9

  def __str__(self):
    return self.name

class BookFile(object):
  """
  文献书籍文件定义。用于读取、存储文献书籍。
  文献书籍有三种存储结构：
  BookFile structure
    - SINGLE_FILE 文件结构。as a Book Object dump to a json file, but the file suffix is '.dbook'
    - PARTS_FILE 目录结构。
      - directory
        - book.json           toc content
        - chapters            chapter content
          - chapter_001.json  chapter json file by order
          - ...               chapter json file by order
        - images              image content
          - img_001.gif       image file by order
          - img_002.jpg       image file by order
          - ...               image file by order
    - SINGLE_PARTS_FILE 打包单文件结构。一个被zip压缩后的PARTS_FILE目录结构。
  """

  SINGLE_FILE_SUFFIX = ".dbook"
  PARTS_FILE_NAME = "book.json"
  
  def __init__(self, path: str, dynamic_load: bool = True):
    self._path: str = path
    self._type: BookFileType = BookFileType.SINGLE_FILE
    self._book: Book = None
    self.load(path, dynamic_load)

  @property
  def path(self):
    return self._path

  @property
  def type(self):
    return self._type
  @property
  def book(self):
    return self._book

  @staticmethod
  def save_to_docbook(path: str, book: Book, type: BookFileType = BookFileType.SINGLE_FILE) -> bool:
    dbook_path = pathlib.Path(path)
    book.utc_datetime = datetime.now(timezone.utc)

    # save as a whole json file, and suffix is ".dbook"
    # will be extend a zip file include a directory as a FileType.PARTS_FILE in future
    if type == BookFileType.SINGLE_FILE:
      dbook_path.parent.mkdir(parents = True, exist_ok = True)
      with open(dbook_path, 'wb') as file:
        file.write(book.dump_json(indent = 4, remove_useless = True).encode('utf-8'))
        file.close()

    # save as a directory include book.json and chapters/[chapter].json
    elif type == BookFileType.PARTS_FILE:
      for index, chapter in enumerate(book.chapters):
        ref = f"chapters/chapter_{index:03}.json"
        chapter_path = dbook_path / ref
        chapter_path.parent.mkdir(parents = True, exist_ok = True)
        with open(chapter_path, 'wb') as file:
          file.write(chapter.dump_json(indent = 4, remove_useless = True).encode('utf-8'))
          file.close()
        chapter.divisions = None
        chapter.ref = ref

      for extra in book.extras:
        if extra.content is not None:
          extra_path = dbook_path / extra.ref
          extra_path.parent.mkdir(parents = True, exist_ok = True)
          with open(extra_path, 'wb') as file:
            file.write(extra.content)
            file.close()

      chapter_path = dbook_path / BookFile.PARTS_FILE_NAME
      chapter_path.parent.mkdir(parents = True, exist_ok = True)
      with open(chapter_path, 'wb') as file:
        file.write(book.dump_json(indent = 4, remove_useless = True).encode('utf-8'))
        file.close()

    else:
      logger.info(f"Unsupported file type {type}.")
      return False

    logger.info(f"Save book id: {book.id} as '{path}', file type {type}.")
    return True

  def load(self, path: str, dynamic_load: bool = True, reload: bool = True) -> bool:
    if reload == False and self._book is not None:
      logger.info(f"BookFile already load a docbook.")
      return False

    book_file_path = pathlib.Path(path)
    if book_file_path.is_file():
      if book_file_path.suffix.lower() == BookFile.SINGLE_FILE_SUFFIX:
        self._type = BookFileType.SINGLE_FILE
      elif book_file_path.name.lower() == BookFile.PARTS_FILE_NAME:
        self._type = BookFileType.PARTS_FILE
      else:
        logger.info(f"'{path}' isn't a correct BookFile path.")
        return False
    elif book_file_path.is_dir():
      self._type = BookFileType.PARTS_FILE
      book_file_path = pathlib.Path(book_file_path) / BookFile.PARTS_FILE_NAME
    else:
      raise DecoderError(f"{book_file_path} Does Not Exist")

    # load '.dbook' or '/directory/book.json'
    with open(book_file_path, "rb") as file:
      self._book = Book.from_json(file.read().decode('utf-8'))
      file.close()

    if self._type == BookFileType.PARTS_FILE:
      self._path = book_file_path.parent.as_posix()
    else:
      self._path = book_file_path.as_posix()
    
    if dynamic_load == False:
      self.load_all_chapter()

    logger.info(f"Load dbook: '{path}', type: {'dynamic' if dynamic_load else 'all'}, success.")
    return True

  def load_all_chapter(self) -> bool:
    # 如果是一整个没有分包的文件，已经完全载入了所有章节
    # TODO：只考虑了json的整个文件，没有考虑zip后的有目录的分章节文件
    if (self._type == BookFileType.SINGLE_FILE):
      return True

    for chapter in self._book.chapters:
      if self.load_chapter(chapter) == False:
        return False

    return True

  def unload_all_chapter(self):
    for chapter in self._book.chapters:
      chapter.unload()
    
    return True

  def load_chapter(self, chapter : Division) -> bool:
    if (chapter.is_load()):
      return True

    if self._type == BookFileType.PARTS_FILE:
      book_file_path = pathlib.Path(self._path) / chapter.ref
      with open(book_file_path, "rb") as file:
        division = Division.from_json(file.read().decode('utf-8'))
        chapter.divisions = division.divisions
        file.close()

    logger.info(f"Load chapter: '{chapter.title.title}', ref: '{chapter.ref}', success.")
    return True

  def load_chapter_byid(self, id : Union[uuid.UUID, str]) -> Tuple[bool, Union[Division, None]]:
    chapter = self.book.get_chapter_byid(id)
    return (self.load_chapter(chapter), chapter) if chapter is not None else (False, None)

  def clear(self):
    self._path = None
    self._book = None
    self._type = None
  