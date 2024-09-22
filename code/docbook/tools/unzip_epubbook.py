
import json
import pathlib
from enum import Enum

class ContentType(Enum):
  ITEM_UNKNOWN = 0
  ITEM_IMAGE = 1
  ITEM_STYLE = 2
  ITEM_SCRIPT = 3
  ITEM_NAVIGATION = 4
  ITEM_VECTOR = 5
  ITEM_FONT = 6
  ITEM_VIDEO = 7
  ITEM_AUDIO = 8
  ITEM_DOCUMENT = 9
  ITEM_COVER = 10
  
  def __str__(self):
    return self.name

class UnzipEPubBook():
  def __init__(self, path: str):
    self._path = None
    self._book = {'items':[]}
    self.load(path)

  def load(self, path: str):
    if self._path is not None:
      self.clear()

    self._path = path
    path = pathlib.Path(self._path) / "book.json"
    with open(path, "rb") as file:
      self._book = json.loads(file.read().decode('utf-8'))
      for item in self._book['items']:
        item['type'] = ContentType(item['type'])
        #print(f"NAME: {item['name']}, TYPE: {item['type']}.")

      file.close()

  def clear(self):
    self._path = None
    self._book = {'items':[]}

  @property
  def items(self):
    return self._book['items']

  def get_toc_content(self):
    result = [item for item in self._book['items'] if item['type'] == ContentType.ITEM_NAVIGATION]
    if len(result) != 1:
      return []

    return self.get_item_content(result[0]).decode('utf-8')

  def get_item_content(self, item):
    return self.get_item_content_by_name(item['name'])

  def get_item_content_by_name(self, name):
    content = None
    with open(pathlib.Path(self._path) / name, "rb") as file:
      content = file.read()
      file.close()
    return content
