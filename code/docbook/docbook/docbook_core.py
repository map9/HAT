"""
docbook_core.py

docbook是为了能结构化古代文献重新定义的一种书籍格式，格式以json文件为依托，
能较好的结构化古代文献中的注释和批注。
这样可以方面表达和分析工具更好的格式化或者分析文献内容。
"""

import uuid
import json
import logging
from datetime import datetime, timezone

from typing import Union, List, Dict, Tuple
from enum import Enum
from utils import remove_html_tags, remove_useless_value, is_valid_url

logger = logging.getLogger('docbook.core')

# The `DecoderError` class is used to output decoding error messages when converting different file
# formats to docbook.
class DecoderError(Exception):
  def __init__(self, message):
    self.message = message
    super().__init__(self.message)


# The `BaseObject` class provides support for attributes manipulation similar to a dictionary for all
# subclasses in a docbook system.
class BaseObject:
  def __init__(self, attrs: Union[Dict, None] = None):
    """
    This Python function initializes an object with attributes provided in a dictionary or an empty
    dictionary if none is provided.
    @param {Union[Dict, None]} attrs - The `attrs` parameter in the `__init__` method is a dictionary or
    None. If a dictionary is provided, it will be copied to the `_attributes` attribute of the class
    instance. If None is provided, an empty dictionary will be assigned to the `_attributes` attribute.
    """
    if attrs is not None:
      self._attributes = attrs.copy()
    else:
      self._attributes = {}

  def __getitem__(self, key):
    return self._attributes[key]

  def __setitem__(self, key, value):
    self._attributes[key] = value

  def __delitem__(self, key):
    del self._attributes[key]

  def get(self, key, default=None):
    return self._attributes.get(key, default)

  def update_attrs(self, *args, **kwargs):
    self._attributes.update(*args, **kwargs)

  def clear_attrs(self):
    self._attributes.clear()

  @property
  def attrs(self):
    return self._attributes

  @attrs.setter
  def attrs(self, attrs: Union[Dict, None]):
    """
    The function `attrs` sets the attributes of an object based on a dictionary input or initializes an
    empty list if no input is provided.
    @param {Union[Dict, None]} attrs - The `attrs` parameter in the `attrs` method is expected to be a
    dictionary or `None`. If it is `None`, the method will set `self._attrs` to an empty list. If it is
    a dictionary, the method will set `self._attrs` to the provided dictionary
    """
    if attrs is None:
      self._attrs = []
    elif isinstance(attrs, Dict):
      self._attrs = attrs
    else:
      raise ValueError("Invalid Attributes Value")

  def __repr__(self) -> str:
    """
    The `__repr__` function returns a string representation of the object's attributes.
    @returns The `__repr__` method is returning the representation of the `_attributes` attribute of the
    object. This representation could be a string that provides information about the object's
    attributes in a readable format.
    """
    return repr(self._attributes)

  def __str__(self) -> str:
    """
    The `__str__` function returns the JSON representation of the object as a string.
    @returns The `__str__` method is returning the result of calling the `dump_json()` method on the
    object.
    """
    return self.dump_json()

  def to_dict(self):
    pass

  @classmethod
  def from_dict(self, params: Union[Dict, None]):
    """
    The function `from_dict` takes a dictionary or None as input and returns the result of calling
    `self` with the input parameters.
    @param {Union[Dict, None]} params - The `from_dict` method you provided takes a parameter named
    `params`, which is expected to be a dictionary or `None`. The method then attempts to call `self`
    with the `params` as an argument.
    @returns The `from_dict` method is returning a call to `self` with the `params` argument passed to
    it. This code snippet is attempting to create an instance of the class using the parameters provided
    in the dictionary `params`. However, there seems to be a mistake in the code as it is trying to call
    `self` as a function, which is not the correct way to instantiate an object
    """
    return self(params)

  def dump_json(self, ensure_ascii: bool = False, indent: Union[int, None] = None, remove_useless: bool = False) -> str:
    d = self.to_dict()
    if remove_useless:
      d = remove_useless_value(d)
    return json.dumps(d, ensure_ascii = ensure_ascii, indent = indent)

  @classmethod
  def from_json(self, params: str):
    return self.from_dict(json.loads(s=params))


# This Python class defines a Title object with properties for title, prefix, and subtitle, along with
# methods for initialization, conversion to dictionary, and instantiation from dictionary.
class Title(BaseObject):
  """
  标题。书籍、章节等标题。
  Title
    - title
    - prefix
    - subtitle
  """

  def __init__(
      self,
      title: str = "",
      prefix: Union[str, None] = None,
      subtitle: Union[str, None] = None,
      attrs: Dict = None
  ):
    """
    This Python function initializes a title object with optional parameters for title, prefix,
    subtitle, and attributes.
    @param {str} title - The `title` parameter is a string that represents the main title of an object
    or entity. It is used to provide a descriptive heading or name for the object.
    @param {Union[str, None]} prefix - The `prefix` parameter in the `__init__` method is used to
    specify a prefix that can be added before the main title. It is optional and can be a string or
    `None`. If a prefix is provided, it will be displayed before the main title when the title object is
    used
    @param {Union[str, None]} subtitle - The `subtitle` parameter in the `__init__` method is used to
    specify a secondary title or subheading for the object being initialized. It is an optional
    parameter that can be provided when creating an instance of the class. The `subtitle` is typically
    displayed below or alongside the main title to
    @param {Dict} attrs - The `attrs` parameter in the `__init__` method is a dictionary that stores
    additional attributes for the title object. These attributes can be used to store any extra
    information or metadata related to the title. When the title object is initialized, these attributes
    can be passed as a dictionary to provide more
    """

    # 主标题。
    self._title = title

    # 标题前缀。
    self._prefix = prefix

    # 副标题。
    self._subtitle = subtitle

    super().__init__(attrs)

  @classmethod
  def from_array(self, *params):
    return self.from_list(params)

  @classmethod
  def from_list(self, params):
    if len(params) == 1:
      return self(params[0])
    elif len(params) == 2:
      return self(params[0], params[1])
    elif len(params) >= 3:
      return self(params[0], params[1], params[2])
    else:
      return self()

  @property
  def title(self):
    return self._title

  @title.setter
  def title(self, title: str):
    if title is None:
      self._title = ""
    elif isinstance(title, str):
      self._title = title
    else:
      raise ValueError("Invalid Title Value")

  @property
  def prefix(self):
    return self._prefix

  @prefix.setter
  def prefix(self, prefix: str):
    self._prefix = prefix

  @property
  def subtitle(self):
    return self._subtitle

  @subtitle.setter
  def subtitle(self, subtitle: str):
    self._subtitle = subtitle

  def __repr__(self) -> str:
    return (f"Title({repr(self._title)}, "
            f"{'None' if self._prefix is None else repr(self._prefix)}, "
            f"{'None' if self._subtitle is None else repr(self._subtitle)}),"
            f"{'None' if self._attributes is None else repr(self._attributes)})")

  def to_dict(self):
    return {
        "title": self._title,
        "prefix": self._prefix,
        "subtitle": self._subtitle,
        "attrs": self._attributes
    }

  @classmethod
  def from_dict(self, params: Union[Dict, None]):
    if params is not None:
      return self(
          params.get('title', ''),
          params.get('prefix', None),
          params.get('subtitle', None),
          params.get('attrs', None)
      )
    else:
      return None


class Dynasty(BaseObject):
  """
  时代。封建社会主要以朝代为时代，新中国统一标注为现代。
  Dynasty
   - value
  """

  def __init__(
      self,
      dynasty: Union[str, None] = None,
      attrs: Dict = None
  ):
    """
    初始化朝代对象。
    """
    self._value = dynasty

    super().__init__(attrs)

  @property
  def value(self):
    return self._value

  @value.setter
  def value(self, dynasty):
    self._value = dynasty

  def __repr__(self) -> str:
    return (f"Dynasty({'None' if self._value is None else repr(self._value)}, "
            f"{'None' if self._attributes is None else repr(self._attributes)})")

  def to_dict(self):
    return {
        "value": self._value,
        "attrs": self._attributes
    }

  @classmethod
  def from_dict(self, params: Union[Dict, None]):
    if params is not None:
      return self(
          params.get('value', ''),
          params.get('attrs', None)
      )
    else:
      return None


class Author(BaseObject):
  """
  著作者。本书的著作者以及他参与著作的工作类型。
  Author
   - name
   - type
   - dynasty: Dynasty
   - officialPosition
  """

  def __init__(
      self,
      name: str = "",
      type: str = "著",
      dynasty: Union[Dynasty, str, None] = None,
      officialPosition: Union[str, None] = None,
      attrs: Dict = None
  ):
    """
    初始化著作者对象。
    """

    # 著作者的姓名。
    self._name = name

    # 工作类型。一般有：著、编、撰、传、译等。
    self._type = type

    # 著作者的著书所在时代。
    self._dynasty = None
    if dynasty is not None:
      self.dynasty = dynasty

    # 著作者的官职。可以有多个官职，以竖杠（|）分割。
    self._officialPosition = officialPosition

    super().__init__(attrs)

  @classmethod
  def from_array(self, *params):
    return self.from_list(params)

  @classmethod
  def from_list(self, params):
    if len(params) == 1:
      return self(params[0])
    elif len(params) == 2:
      return self(params[0], params[1])
    elif len(params) == 3:
      return self(params[0], params[1], params[2])
    elif len(params) == 4:
      return self(params[0], params[1], params[2], params[3])
    else:
      raise self()

  @property
  def name(self):
    return self._name

  @name.setter
  def name(self, name: str):
    if isinstance(name, str):
      self._name = name
    else:
      raise ValueError("Invalid Name Value")

  @property
  def type(self):
    return self._type

  @type.setter
  def type(self, type: str):
    # TODO: 过滤工作类型
    self._type = type

  @property
  def dynasty(self):
    return self._dynasty

  @dynasty.setter
  def dynasty(self, dynasty: Union[Dynasty, str]):
    if isinstance(dynasty, str):
      self._dynasty = Dynasty(dynasty)
    elif isinstance(dynasty, Dynasty):
      self._dynasty = dynasty
    else:
      raise ValueError("Invalid Dynasty Value")

  @property
  def officialPosition(self):
    return self._officialPosition

  @officialPosition.setter
  def officialPosition(self, officialPosition: str):
    self._officialPosition = officialPosition

  def __repr__(self) -> str:
    return (f"Author({repr(self._name)}, {repr(self._type)}, "
            f"{'None' if self._dynasty is None else repr(self._dynasty)}, "
            f"{'None' if self._officialPosition is None else repr(self._officialPosition)}, "
            f"{'None' if self._attributes is None else repr(self._attributes)})")

  def to_dict(self):
    return {
        "name": self._name,
        "type": self._type,
        "dynasty": None if self._dynasty is None else self._dynasty.to_dict(),
        "officialPosition": self._officialPosition,
        "attrs": self._attributes
    }

  @classmethod
  def from_dict(self, params: Union[Dict, None]):
    if params is not None:
      dynasty = params.get('dynasty', None)
      return self(
          params.get('name', ''),
          params.get('type', '著'),
          Dynasty.from_dict(dynasty),
          params.get('officialPosition', None),
          params.get('attrs', None)
      )
    else:
      return None

# The class `DivisionType` defines an enumeration for different types of divisions such as volume,
# chapter, section, paragraph, and annotation.
class DivisionType(Enum):
  VOLUME = "volume"
  CHAPTER = "chapter"
  SECTION = "section"
  PARAGRAPH = "paragraph"
  ANNOTATION = "annotation"

  def __str__(self):
    return self.name


class Division(BaseObject):
  """
  卷册章。书籍正文划分方式，一般来说，没有涉及到正文内容的，都属于卷、册、分卷、分册范围；涉及到具体的正文内容的，为章、序、跋、致谢等。节是章内的正文划分。
  Division
    - id: UUID
    - order: -1
    - title: Title
    - authors: [Author]
    - type: volume | chapter
    - ref: URL
    - divisions: [Division | ContentPiece]
  """

  def __init__(
      self,
      id: Union[str, None] = None,
      order: int = -1,
      title: Union[Title, List[str], str] = "",
      authors: Union[List[Author], List[list[str]], List[str], None] = None,
      type: DivisionType = DivisionType.VOLUME,
      ref: str = None,
      divisions: Union[List[Union['Division', 'ContentPiece']], None] = None,
      attrs: Dict = None
  ):
    """
    初始化卷册章对象。
    """

    if id is None:
      self._id = uuid.uuid4()
    else:
      try:
        self._id = uuid.UUID(id)
      except ValueError:
        raise ValueError("Invalid UUID string")

    # 卷册章显示顺序
    self._order = order

    # 卷册章标题
    self._title = None
    if title is not None:
      self.title = title

    # 卷册章著作者
    self._authors = None
    if authors is not None:
      self.authors = authors

    # 卷册章类型
    self._type = type

    # 卷册章的内容在外部引用地址，类似url
    self._ref = ref

    # 卷册章内容
    self._divisions = [] if divisions is None else divisions

    super().__init__(attrs)

  @property
  def id(self):
    return self._id

  @id.setter
  def id(self, id: Union[uuid.UUID, str]):
    if isinstance(id, str):
      try:
        self._id = uuid.UUID(id)
      except ValueError:
        raise ValueError("Invalid UUID string")
    elif isinstance(id, uuid.UUID):
      self._id = id
    else:
      raise ValueError("Invalid UUID Value")

  @property
  def order(self):
    return self._order

  @order.setter
  def order(self, order: int = -1):
    self._order = order

  @property
  def title(self):
    return self._title

  @title.setter
  def title(self, title: Union[Title, List[str], str]):
    if isinstance(title, str):
      self._title = Title(title)
    elif isinstance(title, list):
      self._title = Title.from_list(title)
    elif isinstance(title, Title):
      self._title = title
    else:
      raise ValueError("Invalid Title Value")

  @property
  def authors(self):
    return self._authors

  @authors.setter
  def authors(self, authors: Union[List[Author], List[List[str]], List[str]]):
    self._authors = []
    if isinstance(authors, List) and len(authors) > 0:
      if isinstance(authors[0], Author):
        self._authors = authors
      elif isinstance(authors[0], List):
        for author in authors:
          self._authors.append(Author.from_list(author))
      elif isinstance(authors[0], str):
        self._authors.append(Author.from_list(authors))
      else:
        raise ValueError("Invalid Authors Value")
    else:
      raise ValueError("Invalid Authors Value")

  @property
  def type(self):
    return self._type

  @type.setter
  def type(self, type: DivisionType):
    if isinstance(type, DivisionType):
      if (type == DivisionType.VOLUME) or (type == DivisionType.CHAPTER):
        self._type = type
    
    raise ValueError("Invalid DivisionType")

  @property
  def ref(self):
    return self._ref

  @ref.setter
  def ref(self, ref: Union[str, None]):
    if ref is None:
      self._ref = None
    elif isinstance(ref, str):
      if is_valid_url(ref):
        self._ref = ref
      else:
        raise ValueError("Invalid Ref Format")
    else:
      raise ValueError("Invalid Ref Value")

  @property
  def chapters(self):
    chapters = []
    if self._type == DivisionType.CHAPTER:
      chapters.append(self)
    elif self._type == DivisionType.VOLUME:
      for division in self._divisions:
        if isinstance(division, Division):
          chapters.extend(division.chapters)
          
    return chapters

  @property
  def divisions(self):
    return self._divisions

  @divisions.setter
  def divisions(self, divisions: Union[List[Union['Division', 'ContentPiece']], None]):
    if divisions is None:
      self._divisions = []
    elif isinstance(divisions, List):
      for division in divisions:
        if (isinstance(division, Division) == False) and (isinstance(division, ContentPiece) == False):
           raise ValueError("Invalid Division or ContentPiece Object")
      self._divisions = divisions
    else:
      raise ValueError("Invalid Division Object")

  def get_chapters_directorys(self, use_object: bool = True) -> Union[List[Union[Tuple[uuid.UUID, str], 'Division']], None]:
    directorys = []
    if self._type == DivisionType.CHAPTER:
      return [[self]]
    elif self._type == DivisionType.VOLUME:
      for division in self._divisions:
        if isinstance(division, Division):
          sub_directorys = division.get_chapters_directorys(use_object = use_object)
          for directory in sub_directorys:
            directory.insert(0, self) if use_object else directory.insert(0, (self._id, self._title.title))
        directorys.extend(sub_directorys)

    return directorys

  def get_chapter_directory_byid(self, id: Union[uuid.UUID, str], use_object: bool = True) -> Union[List[Union[Tuple[uuid.UUID, str], 'Division']], None]:
    """
    通过指定id，找到chapter在本Division中的路径。
    如果is_object为False，路径为：(self.id, self.title),(division.id, division.title), ... , (division.id, division.title)
    如果is_object为True，路径为：self,division, ... , division
    如果chapter不在本division下，返回None。
    """
    if id is None:
      return None
    if isinstance(id, str):
      try:
        id = uuid.UUID(id)
      except ValueError:
        logger.debug("Invalid UUID string: {id}")
        return None

    directory = None
    if self._type == DivisionType.CHAPTER:
      if self._id == id:
        if use_object:
          return [self]
        else:
          return [(self._id, self._title.title)]
      else:
        return None
    elif self._type == DivisionType.VOLUME:
      for division in self._divisions:
        directory = division.get_chapter_directory_byid(id, use_object = use_object)
        if directory is None:
          continue
        else:
          directory.insert(0, self) if use_object else directory.insert(0, (self._id, self._title.title))
          break
    
    return  None if directory is None else directory

  def get_catalogue(self) -> Dict:
    return {
        "id": str(self._id),
        "order": self._order,
        "title": self._title.to_dict(),
        "authors": None if self._authors is None else [author.to_dict() for author in self._authors],
        "type": str(self._type),
        "ref": self._ref,
        "divisions": None if ((self._divisions is None) or (self.type == DivisionType.CHAPTER)) else [division.get_catalogue() for division in self._divisions],
        "attrs": self._attributes
    }

  def add_division(self, division: Union['Division', 'ContentPiece']):
    if (self._type == DivisionType.VOLUME):
      self.add_volume_or_chapter(division)
    elif (self._type == DivisionType.CHAPTER):
      self.add_content_piece(division)
    else:
      raise ValueError("self is a Invalid Division Object")

  def add_volume_or_chapter(self, division: 'Division'):
    if (self._type != DivisionType.VOLUME):
      raise ValueError("Can't add Volume Object to a Chapter")

    if isinstance(division, Division):
      self._divisions.append(division)
    else:
      raise ValueError("Invalid Division Object")

  def add_content_piece(self, content_piece: 'ContentPiece'):
    if (self._type != DivisionType.CHAPTER):
      raise ValueError("Can't add ContentPiece Object to a Volume")

    if isinstance(content_piece, ContentPiece):
      self._divisions.append(content_piece)
    else:
      raise ValueError("Invalid ContentPiece Object")

  def __repr__(self) -> str:
    return (f"Division({repr(self._id)}, {repr(self._order)}, {repr(self._title)}, "
            f"{'None' if self._authors is None else repr(self._authors)}, "
            f"{repr(self._type)}, "
            f"{repr(self._ref)}, "
            f"{repr(self._divisions)}, "
            f"{'None' if self._attributes is None else repr(self._attributes)})")

  def to_dict(self):
    return {
        "id": str(self._id),
        "order": self._order,
        "title": self._title.to_dict(),
        "authors": None if self._authors is None else [author.to_dict() for author in self._authors],
        "type": str(self._type),
        "ref": self._ref,
        "divisions": None if self._divisions is None else [division.to_dict() for division in self._divisions],
        "attrs": self._attributes
    }

  @classmethod
  def from_dict(self, params: Union[Dict, None]):
    if params is not None and params.get('type') is not None:
      try:
        type = DivisionType[params.get('type').upper()]
      except KeyError:
        return None

      authors = params.get('authors', None)
      divisions = params.get('divisions', None)
      return self(
          params.get('id', None),
          params.get('order', -1),
          Title.from_dict(params.get('title', "")),
          None if authors is None else [
              Author.from_dict(author) for author in authors],
          type,
          params.get('ref', None),
          None if divisions is None else [Division.from_dict(division) for division in divisions] if (type == DivisionType.VOLUME) else [
              ContentPiece.from_dict(division) for division in divisions],
          params.get('attrs', None)
      )
    else:
      return None


class ContentPiece(BaseObject):
  """
  节、正文段落、注释段落。
  节是章内的正文划分。
  正文文本段落。由一个或者多个无分行的独立文本段组成的正文内容，一般由一个文本段来构建，诗歌的正文文本段落主要会由多个文本段来组成。
  ContentPiece
    - type: section | paragraph | annotation
    - annotator
    - source
    - position
    - content
    - content_pieces: [ContentPiece]
  """

  def __init__(
      self,
      type: DivisionType = DivisionType.PARAGRAPH,
      content: str = "",
      annotator: str = None,
      source: str = None,
      position: int = None,
      content_pieces: List['ContentPiece'] = None,
      attrs: Dict = None
  ):
    """
    初始化节、正文段落、注释段落对象。
    """

    # 初始化节、正文段落、注释段落类型。
    self._type = type

    # 卷册章内容。
    self._content = content

    # 节、正文段落、注释段落。
    self._content_pieces = content_pieces if content_pieces is not None else []

    # 初始化其他属性
    self._annotator = annotator
    self._source = source
    self._position = position

    super().__init__(attrs)

  @property
  def annotator(self):
    return self._annotator

  @annotator.setter
  def annotator(self, annotator: str):
    self._annotator = annotator

  @property
  def source(self):
    return self._source

  @source.setter
  def source(self, source: str):
    self._source = source

  @property
  def position(self):
    return self._position

  @position.setter
  def position(self, position: int):
    self._position = position

  @property
  def type(self):
    return self._type

  @type.setter
  def type(self, type: DivisionType):
    if isinstance(type, DivisionType):
      if (type == DivisionType.SECTION) or (type == DivisionType.PARAGRAPH) or (type == DivisionType.ANNOTATION):
        self._type = type
        return
    raise ValueError("Invalid ContentType")

  @property
  def content(self):
    return self._content

  @content.setter
  def content(self, content: str):
    self._content = content

  @property
  def content_pieces(self):
    return self._content_pieces

  @content_pieces.setter
  def content_pieces(self, content_pieces: List['ContentPiece']):
    if isinstance(content_pieces, List):
      for content_piece in content_pieces:
        if isinstance(content_piece, ContentPiece) == False:
           raise ValueError("Invalid ContentPiece Object")
      self._content_pieces = content_pieces
    else:
      raise ValueError("Invalid ContentPiece Object")

  def add_content_piece(self, content_piece: 'ContentPiece'):
    if isinstance(content_piece, ContentPiece):
      self._content_pieces.append(content_piece)
    else:
      raise ValueError("Invalid ContentPiece Object")

  def concat_content_piece(self, content_piece: 'ContentPiece'):
    """
    将两个类型一致，且非SECTION的content_piece合并成为一个content_piece。
    """

    if isinstance(content_piece, ContentPiece):
      if (self._type != DivisionType.SECTION) and (self._type == content_piece.type):
        content_length = len(remove_html_tags(self._content)) + 1
        self._content = f"{self._content}\n{content_piece._content}"
        for content_piece in content_piece.content_pieces:
          content_piece.position += content_length
          self._content_pieces.append(content_piece)
    else:
      raise ValueError("ContentPiece Object Type Error")

  def __repr__(self) -> str:
    return (f"ContentPiece({repr(self._type)}, {repr(self._content)}, "
            f"{'None' if self._annotator is None else repr(self._annotator)}, "
            f"{'None' if self._source is None else repr(self._source)}, "
            f"{'None' if self._position is None else repr(self._position)}, "
            f"{'None' if self._content_pieces is None else repr(self._content_pieces)}), "
            f"{'None' if self._attributes is None else repr(self._attributes)})")

  def to_dict(self):
    return {
        "type": str(self._type),
        "content": self._content,
        "annotator": self._annotator,
        "source": self._source,
        "position": self._position,
        "content_pieces": None if self._content_pieces is None else [content_piece.to_dict() for content_piece in self._content_pieces],
        "attrs": self._attributes
    }

  @classmethod
  def from_dict(self, params: Union[Dict, None]):
    if params is not None and params.get('type') is not None:
      try:
        type = DivisionType[params.get('type').upper()]
      except KeyError:
        return None

      content_pieces = params.get('content_pieces', None)
      return self(
          type,
          params.get('content', ""),
          params.get('annotator', None),
          params.get('source', None),
          params.get('position', None),
          None if content_pieces is None else [ContentPiece.from_dict(
              content_piece) for content_piece in content_pieces],
          params.get('attrs', None)
      )
    else:
      return None


class Indent2SectionHelper(object):
  """
  在编排Chapter中的ContentPiece的包含关系时，帮助更好的通过指定indent，编排好不同的indent的ContentPiece的相互包含关系。
  # indent, section
  # - 0, chapter
  #   - 1, section
  #     - 999, paragraph|annotation
  #       - annotation
  #         - annotation
  #     - 2, section
  #       - 3, section
  #         - 999, paragraph|annotation
  #         - 999, paragraph|annotation
  #   - 1, section
  #       - 3, section         不支持，缺少中间的section。只会直接挂在最近的section下，成为直接的下一级，而不是夸级的section。
  #         - 999, paragraph|annotation
  #         - 999, paragraph|annotation
  #     - 2, section
  #        - 999, paragraph|annotation
  #       - 3, section
  #         - 999, paragraph|annotation
  #     - 999, paragraph       不支持。只会挂在最近的section下。
  """

  def __init__(self):
    self._indent2sections = []

  @property
  def root(self):
    if self.has_root():
      return self._indent2sections[0]['section']
    else:
      return None

  @root.setter
  def root(self, division: Division):
    self.set_root(division)

  def reset(self):
    self._indent2sections = []

  def has_root(self) -> bool:
    return (
        (len(self._indent2sections) > 0) and
        (self._indent2sections[0]['indent'] == 0) and
        isinstance(self._indent2sections[0]['section'], Division)
    )

  def set_root(self, division: Division) -> bool:
    if len(self._indent2sections) > 0:
      raise DecoderError("Already has a root chapter object.")

    self._indent2sections.append({'indent': 0, 'section': division})

  def add_content_piece(self, indent: int, content_piece: ContentPiece, before_add_func = None) -> bool:
    if self.has_root() == False:
      raise DecoderError("No root chapter object.")

    # self._indent2sections.sort(key = lambda indent2section: indent2section["indent"])
    is_paragraph = (
        (indent == 999) or
        (content_piece.type == DivisionType.ANNOTATION) or
        (content_piece.type == DivisionType.PARAGRAPH)
    )

    for index, indent2section in enumerate(self._indent2sections):
      current_indent = indent2section['indent']
      if indent <= current_indent:
        self._indent2sections = self._indent2sections[:index]
        break

    if before_add_func is None or before_add_func(self._indent2sections[-1]['section'], content_piece):
      self._indent2sections[-1]['section'].add_content_piece(content_piece)

    if is_paragraph == False:
      self._indent2sections.append(
          {'indent': indent, 'section': content_piece})

    return True

class ExtraContentType(Enum):
  ITEM_UNKNOWN = 0
  ITEM_IMAGE = 1
  ITEM_COVER = 10
  
  def __str__(self):
    return self.name

class Extra(BaseObject):

  """
  定义Book中的除正文外的其他内容。包含：
  - 正文中插入的图片文件，比如：无法显示的字符用图片代替、封面图片等等；
  - ...
  Extra包含
    - name
    - type
    - ref
    - content
  """

  def __init__(
      self,
      name: str = "",
      type: ExtraContentType = ExtraContentType.ITEM_UNKNOWN,
      ref: str = None,
      content: bytes = None,
      attrs: Dict = None
  ):
  
    # 附加内容的名称，用于文章章节内容的标签内
    self._name = name
    # 类型
    self._type = type
    # 附加内容在外部引用地址，类似url
    self._ref = ref
    # 附加内容的实际内容，如果非None，表示内容已经被载入到内容中
    self._content = content
    super().__init__(attrs)

  @property
  def name(self):
    return self._name

  @name.setter
  def name(self, name):
    self._name = name

  @property
  def type(self):
    return self._type

  @type.setter
  def type(self, type):
    self._type = type

  @property
  def ref(self):
    return self._ref

  @ref.setter
  def ref(self, ref: Union[str, None]):
    if ref is None:
      self._ref = None
    elif isinstance(ref, str):
      if is_valid_url(ref):
        self._ref = ref
      else:
        raise ValueError("Invalid Ref Format")
    else:
      raise ValueError("Invalid Ref Value")

  @property
  def content(self):
    return self._content

  @content.setter
  def content(self, content):
    self._content = content

  def __repr__(self) -> str:
    return (f"Extra({repr(self._name)}, {repr(self._type)}, {repr(self._ref)}, "
            f"{'None' if self._attributes is None else repr(self._attributes)})")

  def to_dict(self):
    return {
        "name": str(self._name),
        "type": str(self._type),
        "ref": self._ref,
        "attrs": self._attributes
    }

  @classmethod
  def from_dict(self, params: Union[Dict, None]):
    if params is not None and params.get('type') is not None:
      try:
        type = ExtraContentType[params.get('type').upper()]
      except KeyError:
        return None

      return self(
          params.get('name', None),
          type,
          params.get('ref', None),
          params.get('attrs', None)
      )
    else:
      return None

class Book(BaseObject):

  """
  文献书籍定义。  
  Book
    - id: UUID
    - title: Title
    - authors: [Author]
    - dynasty: Dynasty
    - categories: [str]
    - source
    - description
    - date
    - divisions: [Division]
    - extras: [Extra]
  """

  def __init__(
      self,
      id: Union[str, None] = None,
      title: Union[Title, List[str], str] = "",
      authors: Union[List[Author], List[List[str]], List[str], None] = None,
      dynasty: Union[Dynasty, str, None] = None,
      categories: List[str] = None,
      source: str = None,
      description: str = None,
      date: Union[datetime, str] = None,
      divisions: Division = None,
      extras: List[Extra] = None,
      attrs: Dict = None
  ):
    """
    初始化一本文献书籍。
    """
    if id is None:
      self._id = uuid.uuid4()
    else:
      try:
        self._id = uuid.UUID(id)
      except ValueError:
        raise ValueError("Invalid UUID string")

    # 书籍名称。
    self._title = None
    self.title = title

    # 书籍著作者。
    self._authors = None
    self.authors = authors

    # 书籍初次出版的时代。一般以第一个著作者的朝代为书籍出版时代。
    self._dynasty = None
    self.dynasty = dynasty

    # 书籍分类集合。
    # 一个category包含主分类|次分类|细分类...,用｜分割的分类序列。
    # 一本书籍可以有多个分类范畴。
    # ['主分类|次分类|细分类', '主分类', '主分类|次分类', ... ]
    self._categories = categories

    # 来源。书籍的文字来源，包含但不限于：网页链接、实体或者电子书籍的ISBN号等。
    self._source = source

    # 描述。书籍的概要介绍。
    self._description = description

    # 入库时间。书籍的入库时间。
    self._utc_datetime = None
    self.utc_datetime = date

    # 卷册章内容。书籍的卷册章内容内容。
    self._divisions = [] if divisions is None else divisions

    # 附加内容
    self.extras = [] if extras is None else extras

    super().__init__(attrs)

  @property
  def id(self):
    return self._id

  @id.setter
  def id(self, id: Union[uuid.UUID, str]):
    if isinstance(id, str):
      try:
        self._id = uuid.UUID(id)
      except ValueError:
        raise ValueError("Invalid UUID string")
    elif isinstance(id, uuid.UUID):
      self._id = id
    else:
      raise ValueError("Invalid UUID Value")

  @property
  def title(self):
    return self._title

  @title.setter
  def title(self, title: Union[Title, List[str], str]):
    if isinstance(title, str):
      self._title = Title(title)
    elif isinstance(title, list):
      self._title = Title.from_list(title)
    elif isinstance(title, Title):
      self._title = title
    else:
      raise ValueError("Invalid Title Value")

  @property
  def authors(self):
    return self._authors

  @authors.setter
  def authors(self, authors: Union[List[Author], List[List[str]], List[str]]):
    if authors is None:
      self._authors = []
    elif isinstance(authors, List) and len(authors) > 0:
      if isinstance(authors[0], Author):
        self._authors = authors
      elif isinstance(authors[0], List):
        self._authors = []
        for author in authors:
          self._authors.append(Author.from_list(author))
      elif isinstance(authors[0], str):
        self._authors = []
        self._authors.append(Author.from_list(authors))
      else:
        raise ValueError("Invalid Authors Value")
    else:
      raise ValueError("Invalid Authors Value")

  @property
  def dynasty(self):
    return self._dynasty

  @dynasty.setter
  def dynasty(self, dynasty: Union[Dynasty, str]):
    if dynasty is None:
      self._dynasty = None
    elif isinstance(dynasty, str):
      self._dynasty = Dynasty(dynasty)
    elif isinstance(dynasty, Dynasty):
      self._dynasty = dynasty
    else:
      raise ValueError("Invalid Dynasty Value")

  @property
  def categories(self):
    return self._categories

  @categories.setter
  def categories(self, categories: List[str]):
    self._categories = categories if categories is not None else []

  @property
  def source(self):
    return self._source

  @source.setter
  def source(self, source: str):
    self._source = source

  @property
  def description(self):
    return self._description

  @description.setter
  def description(self, description: str):
    self._description = description

  @property
  def utc_datetime(self):
    return self._utc_datetime

  @description.setter
  def utc_datetime(self, date: Union[datetime, str]):
    if isinstance(date, datetime):
      self._utc_datetime = date
    elif isinstance(date, str):
      self._utc_datetime = datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ")
    else:
      self._utc_datetime = None

  @property
  def chapters(self):
    return [chapter for division in self._divisions for chapter in division.chapters]

  @property
  def divisions(self):
    return self._divisions

  @divisions.setter
  def divisions(self, divisions: List[Division]):
    if isinstance(divisions, List):
      for division in divisions:
        if isinstance(division, Division) == False:
           raise ValueError("Invalid Divisions Object")
      self._divisions = divisions
    else:
      raise ValueError("Invalid Divisions Object")

  @property
  def extras(self):
    return self._extras

  @extras.setter
  def extras(self, extras: List[Extra]):
    if isinstance(extras, List):
      for extra in extras:
        if isinstance(extra, Extra) == False:
           raise ValueError("Invalid Extras Object")
      self._extras = extras
    else:
      raise ValueError("Invalid Extras Object")

  def get_chapters_directorys(self, use_object: bool = True) -> Union[List[Union[Tuple[uuid.UUID, str], Union['Division', 'Book']]], None]:
    directorys = []
    for division in self._divisions:
      if isinstance(division, Division):
        sub_directorys = division.get_chapters_directorys(use_object = use_object)
        for directory in sub_directorys:
          directory.insert(0, self) if use_object else directory.insert(0, (self._id, self._title.title))
      directorys.extend(sub_directorys)

    return directorys

  def get_chapter_directory_byid(self, id: Union[uuid.UUID, str], use_object: bool = True) -> Union[List[Union[Tuple[uuid.UUID, str], Union['Division', 'Book']]], None]:
    if id is None:
      return None
    if isinstance(id, str):
      try:
        id = uuid.UUID(id)
      except ValueError:
        logger.debug("Invalid UUID string: {id}")
        return None

    directory = None
    for division in self._divisions:
      directory = division.get_chapter_directory_byid(id, use_object = use_object)
      if directory is None:
        continue
      else:
        if use_object:
          directory.insert(0, self)
        else:
          directory.insert(0, (self._id, self._title.title))
        break
    
    return  None if directory is None else directory

  def get_chapter_byid(self, id) -> Division:
    if id is None:
      return None
    if isinstance(id, str):
      try:
        id = uuid.UUID(id)
      except ValueError:
        logger.debug("Invalid UUID string: {id}")
        return None

    for chapter in self.chapters:
      if chapter.id == id:
        return chapter

    return None

  def get_brief(self) -> Dict:
    return {
        "id": str(self._id),
        "title": self._title.to_dict(),
        "authors": None if self._authors is None else [author.to_dict() for author in self._authors],
        "dynasty": None if self._dynasty is None else self._dynasty.to_dict(),
        "categories": self._categories,
        "source": self._source,
        "description": self._description,
        "date": None if self._utc_datetime is None else self._utc_datetime.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "attrs": self._attributes
    }

  def get_catalogue(self) -> Dict:
    return {
        "id": str(self._id),
        "title": self._title.to_dict(),
        "authors": None if self._authors is None else [author.to_dict() for author in self._authors],
        "dynasty": None if self._dynasty is None else self._dynasty.to_dict(),
        "categories": self._categories,
        "source": self._source,
        "description": self._description,
        "date": None if self._utc_datetime is None else self._utc_datetime.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "divisions": None if self._divisions is None else [division.get_catalogue() for division in self._divisions],
        "attrs": self._attributes
    }

  def add_division(self, division: Division):
    if isinstance(division, Division):
      self._divisions.append(division)
    else:
      raise ValueError("Invalid Division Object")

  def rebuild_chapters_order(self):
    """
    按照chapter章节在dbook书籍中出现的顺序，对chapter的order值进行赋值。
    一般针对创建之初的书籍，默认给予chapter章节为-1的情况下，基于加入到书本中顺序，来进行order的赋值。
    """
    for index, chapter in enumerate(self.chapters):
      chapter.order = index

  def resort_chapters(self):
    """
    依据chapter章节的order数值，按照升序来重新组织
    """    
    pass

  def add_extra(self, extra: Extra):
    if isinstance(extra, Extra):
      for e in self._extras:
        if e.name == extra.name:
          raise ValueError("Extra Object Already Exist")    
      self._extras.append(extra)
    else:
      raise ValueError("Invalid Extra Object")

  def set_extra(self, extra: Extra):
    if isinstance(extra, Extra):
      for index, e in enumerate(self._extras):
        if e.name == extra.name:
          self._extras[index] = extra
          return
      self._extras.append(extra)
    else:
      raise ValueError("Invalid Extra Object")

  def get_extra(self, name: str) -> Extra:
    for index, e in enumerate(self._extras):
      if e.name == name:
        return self._extras[index]
    return None

  def __repr__(self) -> str:
    return (f"Book({repr(self._id)}, {repr(self._title)}, {repr(self._authors)}, "
            f"{'None' if self._dynasty is None else repr(self._dynasty)}, "
            f"{'None' if self._categories is None else repr(self._categories)}, "
            f"{'None' if self._source is None else repr(self._source)}, "
            f"{'None' if self._description is None else repr(self._description)}), "
            f"{'None' if self._utc_datetime is None else repr(self._utc_datetime)}), "
            f"{'None' if self._divisions is None else repr(self._divisions)}), "
            f"{'None' if self._extras is None else repr(self._extras)}), "
            f"{'None' if self._attributes is None else repr(self._attributes)})")

  def to_dict(self):
    return {
        "id": str(self._id),
        "title": self._title.to_dict(),
        "authors": None if self._authors is None else [author.to_dict() for author in self._authors],
        "dynasty": None if self._dynasty is None else self._dynasty.to_dict(),
        "categories": self._categories,
        "source": self._source,
        "description": self._description,
        "date": None if self._utc_datetime is None else self._utc_datetime.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "divisions": None if self._divisions is None else [division.to_dict() for division in self._divisions],
        "extras": None if self._extras is None else [extra.to_dict() for extra in self._extras],
        "attrs": self._attributes
    }

  @classmethod
  def from_dict(self, params: Union[Dict, None]):
    if params is not None:
      authors = params.get('authors', None)
      divisions = params.get('divisions', None)
      extras = params.get('extras', None)
      return self(
          params.get('id', ""),
          Title.from_dict(params.get('title', None)),
          None if authors is None else [
              Author.from_dict(author) for author in authors],
          Dynasty.from_dict(params.get('dynasty', None)),
          params.get('categories', None),
          params.get('source', None),
          params.get('description', None),
          params.get('date', None),
          None if divisions is None else [
              Division.from_dict(division) for division in divisions],
          None if extras is None else [
              Extra.from_dict(extra) for extra in extras],
          params.get('attrs', None)
      )
    else:
      return None