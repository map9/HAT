"""
docbook_archive.py

docbook_archive操作包含docbook文件的目录。
"""

import uuid
import json
import logging

from typing import Union, List, Dict, Tuple
from enum import Enum

import pathlib
import utils
from docbook import BookFile, Book, Division

logger = logging.getLogger('docbook.archive')

class BookArchive(object):
  #  DocBookArchive
  #  - path
  #  - archive
  #    - items[]
  #      - ref
  #  - files[]
  
  """
  docbook文献库对象。
  """  
  ROOT_FILE_NAME = "archive.json"

  def __init__(self, path: str, dynamic_load: bool = True):
    self._path = None
    self._archive = None
    self._dbfiles: List[BookFile] = []
    self.load(path, dynamic_load)

  @property
  def dbfiles(self):
    return self._dbfiles

  @property
  def dbooks(self):
    return [dbfile.book for dbfile in self._dbfiles]

  @property
  def book_count(self):
    return len(self._dbfiles)

  @property
  def chapters(self):
    chapters = []
    for dbfile in self._dbfiles:
      chapters.extend(dbfile.book.chapters)
    return chapters

  def get_chapters_directorys(self) -> List[List[Union['Division', 'Book']]]:
    directorys = []
    for dbfile in self._dbfiles:
      directorys.extend(dbfile.book.get_chapters_directorys())
    return directorys

  def get_chapter_directory_byid(self, id: Union[uuid.UUID, str]) -> List[List[Union['Division', 'Book']]]:
    if id is None:
      return None
    if isinstance(id, str):
      try:
        id = uuid.UUID(id)
      except ValueError:
        logger.debug("Invalid UUID string: {id}")
        return None

    directory = None
    for dbook in self.dbooks:
      directory = dbook.get_chapter_directory_byid(id)
      if directory is None:
        continue
      else:
        break
      
    return  directory

  def get_book_byid(self, id: Union[uuid.UUID, str]) -> Book:
    if id is None:
      return None
    if isinstance(id, str):
      try:
        id = uuid.UUID(id)
      except ValueError:
        logger.debug("Invalid UUID string: {id}")
        return None

    for dbfile in self._dbfiles:
      if (dbfile.book.id == id):
        return dbfile.book

    return None

  def get_bookfile_byid(self, id: Union[uuid.UUID, str]) -> BookFile:
    if id is None:
      return None
    if isinstance(id, str):
      try:
        id = uuid.UUID(id)
      except ValueError:
        logger.debug("Invalid UUID string: {id}")
        return None

    for dbfile in self._dbfiles:
      if (dbfile.book.id == id):
        return dbfile

    return None

  def load(self, path: str, dynamic_load: bool = True) -> bool:
    archive_file_path = pathlib.Path(path)

    # 如果给定的path没有BookArchive.ROOT_FILE_NAME，则自动创建一个
    if archive_file_path.is_dir():
      archive_file_path = archive_file_path / BookArchive.ROOT_FILE_NAME
      if archive_file_path.is_file() == False:
        self.create_archive(archive_file_path.parent.as_posix())
    
    if self.__load_from_file(archive_file_path.as_posix(), dynamic_load) == True:
      self._path = archive_file_path.as_posix()
      return True
    else:
      return False

  def __load_from_file(self, path: str, dynamic_load: bool = True) -> bool:
    with open(path, "rb") as file:
      self._archive = json.loads(file.read().decode('utf-8'))
      file.close()

    # 先转绝对路径
    path = pathlib.Path(path).resolve()
    path = path.parent
    for item in self._archive['items']:
      dbfile = BookFile(utils.convert_relativepath_to_abspath(item['ref'], path.as_posix()), dynamic_load)
      self._dbfiles.append(dbfile)
    return True

  @staticmethod
  def create_archive(path):
    path = pathlib.Path(path).resolve()
    dbook_files = list(path.rglob(BookFile.PARTS_FILE_NAME))
    dbook_files.extend(list(path.rglob(f"*{BookFile.SINGLE_FILE_SUFFIX}")))

    archive: dict = {}
    archive['items'] = [{'ref': str(dbfile.relative_to(path))} for dbfile in dbook_files]

    archive_path = path / BookArchive.ROOT_FILE_NAME
    archive_path.parent.mkdir(parents = True, exist_ok = True)
    with open(archive_path, 'wb') as file:
      file.write(json.dumps(archive, ensure_ascii = False, indent = 4).encode('utf-8'))
      file.close()

  def load_all_books(self) -> bool:
    for dbfile in self._dbfiles:
      dbfile.load_all_chapter()
    return True

  def clear(self):
    self._path = None
    self._archive = None
    self._dbfiles = None

  #  - path
  #  - archive
  #    - items[]
  #      - ref
  #  - files[]

  def __repr__(self) -> str:
    return (f"BookArchive({repr(self._path)}, "
            f"{'None' if self._archive is None else repr(self._archive)}, "
            f"{'None' if self._dbfiles is None else repr(self._dbfiles)})")

  