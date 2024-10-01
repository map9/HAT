"""
decoder-epub-zztj.py
将电子书《資治通鑑胡三省註版》转换为docbook格式

usage: epub2dbook-zztj.py epub_dir [-h] [--output_dir OUTPUT_DIR]

optional arguments:
  -h, --help            show this help message and exit
  epub_dir
                        Input decoded epub file directory.
  --output_dir OUTPUT_DIR
                        Enter path to directory to save output. Defaults to
                        the current working directory.
"""

import argparse
from typing import Union, List

from bs4 import BeautifulSoup, Tag

import docbook
from  tools import Converter
class ZZTJConverter(Converter):

  def __init__(self, epub_dir: str, class2labels = None, class2annotators = None):
    super().__init__(epub_dir, class2labels, class2annotators)

  def decode_item_text(self, item, content_piece, content, marked_content) -> tuple[str, str]:
    # 内容
    if item.name == None:
      content += item.text
      marked_content += item.text
    elif item.name == 'span':
      item_class = item.get('class')
      if item_class is not None:
        # 注释
        if (item_class == "note") or (item_class == "note1") or (item_class == "note4") or (item_class == "note5"):
          annotator = self.class2annotator(item_class)
          annotation = self.decode_chapter_annotation(item)
          annotation.annotator = annotator[0]
          annotation.authorship = annotator[1]
          # 有空内容却带有注释的
          annotation.position = len(content)
          content_piece.add_content_piece(annotation)
        # 特殊标签的内容
        elif (item_class == "note2") or (item_class == "note3"):
          label = self.class2label(item_class)
          content += item.text
          marked_content += f"<{label}>{item.text}</{label}>"
        # 内容，带span标签，class为number
        elif item_class == 'number':
          content_piece['number'] = int(item.text)
        # 内容，带span标签，class为name[x]
        elif ('name' in item_class) or (item_class == 'book-title'):
          label = self.class2label(item_class)
          content += item.text
          marked_content += f"<{label}>{item.text}</{label}>"
        # 内容，带span标签，class为ji
        elif item_class == 'ji':
          content += item.text
          marked_content += item.text
        # 内容，带span标签，class为kong
        elif item_class == 'kong':
          label = self.class2label(item_class)
          content += item.text
          marked_content += f"<{label}>{item.text}</{label}>"
        # 内容，带span标签，class为其他
        else:
          content += item.text
          marked_content += item.text
          print(f"unsupport span.{item_class}.")
      else:
        content += item.text
        marked_content += item.text
        print(f"unsupport span.{item_class}.")
    # 内容，带b标签
    elif item.name == 'b':
      content += item.text
      marked_content += item.text
    # 内容，带url链接标签
    elif (item.name == 'a'):
      content += item.text
      marked_content += item.text
    # 内容，带img标签
    elif (item.name == 'img'):
      content += '　'
      img_src = item.get('src')[3:]
      img_label = f"Images/{self.img2label(img_src)}"
      marked_content += f'　<img src="{img_label}"/>'
      # print(f"img_src = {img_src}, img_label = {img_label}.")
      if self._dbook.get_extra(img_label) is None:
        img_content = self._epub_book.get_item_content_by_name(img_src)
        self._dbook.add_extra(docbook.Extra(
            img_label, docbook.ExtraContentType.ITEM_IMAGE, img_label, img_content))
    # 内容，带其他标签
    else:
      content += item.text
      marked_content += item.text
      print(f"unsupport label: {item.name}.")

    return content, marked_content

  def decode_chapter_annotation(self, item) -> docbook.ContentPiece:
    content = ""
    marked_content = ""
    content_piece = docbook.ContentPiece(type=docbook.DivisionType.ANNOTATION)
    for child in item.children:
      content, marked_content = self.decode_item_text(child, content_piece, content, marked_content)
    content_piece.content = marked_content
    return content_piece

  def decode_chapter_paragraph(self, item) -> tuple[docbook.ContentPiece, int]:
    content = ""
    marked_content = ""
    section_indent = 999
    item_class = item.get('class')
    content_piece = docbook.ContentPiece()
    content_piece.type = docbook.DivisionType.PARAGRAPH
    if (item_class == 'emperor') or (item_class == 'reign-title') or (item_class == 'origin') or (item_class == "note2") or (item_class == "note3"):
      if (item_class == 'emperor'):
        content_piece.type = docbook.DivisionType.SECTION
        section_indent = 1
      elif (item_class == 'reign-title'):
        content_piece.type = docbook.DivisionType.SECTION
        section_indent = 2

      for child in item.children:
        content, marked_content = self.decode_item_text(child, content_piece, content, marked_content)
      content_piece.content = marked_content
      return content_piece, section_indent

    # 注释段落
    elif (item_class == "note") or (item_class == "note1") or (item_class == "note4") or (item_class == "note5") or (item_class == "comment"):
      annotator = self.class2annotator(item_class)
      annotation = self.decode_chapter_annotation(item)
      annotation.annotator = annotator[0]
      annotation.authorship = annotator[1]
      annotation.position = None

      content_piece.content = ''
      content_piece.add_content_piece(annotation)
      return content_piece, section_indent

    # 其他class
    else:
      print(f"unsupport p.{item.name}.")

  def decode_chapter_title(self, item) -> docbook.Division:
    content = ""
    marked_content = ""
    division = docbook.Division(type=docbook.DivisionType.CHAPTER)
    for child in item.children:
      content, marked_content = self.decode_item_text(child, division, content, marked_content)
    division.title = marked_content
    return division

  def decode_chapter(self, toc_item: dict[str, Union[str, List]]):

    def before_add_func(father_node: Union[docbook.Division, docbook.ContentPiece], node: docbook.ContentPiece) -> bool:
      """
      依据段落是否带number来决定是否将不同的正文段落合并成一个ContentPiece。
      """

      # 有独立number的段落，或者注释段落，不能作为段落来合并
      if 'number' in node.attrs:
        return True

      content_pieces = None
      if isinstance(father_node, docbook.Division):
        content_pieces = father_node.divisions
      else:
        content_pieces = father_node.content_pieces

      if (len(content_pieces) > 0) and content_pieces[-1].get('number') is not None:
        result = content_pieces[-1].concat_content_piece(node)
        return False if result == True else True

      return True

    index = toc_item['src'].find('#')
    ref = toc_item['src'] if index == -1 else toc_item['src'][:index]
    id = None if index == -1 else toc_item['src'][index+1:]

    content = self._epub_book.get_item_content_by_name(ref)
    if len(content) == 0:
      return None

    content = content.decode('utf-8')
    print(f"decode chapter, ref: {ref}, id: {id}.")

    soup = BeautifulSoup(content, "xml")
    body = soup.find("body")
    main = body.div

    if hasattr(main, 'children') == False:
      return None

    enter = True if id is None else False
    helper = docbook.Indent2SectionHelper()
    for index, child in enumerate(main.children):
      cid = child.get('id') if isinstance(child, Tag) else None
      if enter == False:
        if (cid == id) and (cid is not None) and (id is not None):
          enter = True
        else:
          continue
      else:
        if ((id is None) and (cid is not None)) or ((id is not None) and (cid is not None) and (cid != id)):
          enter = False
          continue

      if (id != None):
        if isinstance(child, Tag) and (child.get('id') == id):
          id = None
        else:
          continue

      if (child.name == 'h1') or (child.name == 'h2') or (child.name == 'h3'):
        division = self.decode_chapter_title(child)
        helper.root = division

      elif (child.name == 'p'):
        content_piece, section_indent = self.decode_chapter_paragraph(child)
        if content_piece is None:
          continue

        helper.add_content_piece(
            section_indent, content_piece, before_add_func)

      elif child.name is None:
        pass

      elif (child.name == 'hr') or (child.name == 'br'):
        pass

      elif (child.name == 'a'):
        pass

      else:
        print(f"unsupport label: {child.name}.")

    return helper.root


if __name__ == "__main__":
  parser = argparse.ArgumentParser()

  parser.add_argument(
      "epub_dir",
      type=str,
      help="Input epub file directory.",
  )

  parser.add_argument(
      "--output_dir",
      type=str,
      default="",
      help=(
          "Enter path to directory to save output. "
          "Defaults to the current working directory."
      )
  )

  args = parser.parse_args()

  converter = ZZTJConverter(
      args.epub_dir,
      class2labels = {
          # title name: 人名、姓、字、號、爵位、謚號、廟號等
          'name':       docbook.BookLabel.FIGURENAME,
          # territory: 地名、部族、國、朝代、軍治地等
          'name1':      docbook.BookLabel.ENTITYNAME,
          # book name: 書名
          'book-title': docbook.BookLabel.BOOKNAME,

          # 对人名的一种表达定义，和文字内容无关
          'note2':      docbook.BookLabel.SPECIAL01,
          # 对官职的一种表达定义，和文字内容无关
          'note3':      docbook.BookLabel.SPECIAL02,

          # errata: 文字增补
          'kong':       docbook.BookLabel.ADDITIONS,

          # 找不到的类型
          'default':    docbook.BookLabel.DEFAULT
      },
      class2annotators = {
          # annotation: 章节头的注释
          'comment':    ('司马光', '评'),
          # annotation: 胡三省的辑注
          'note':       ('胡三省', '评'),
          # annotation: 章节头的注释
          'note1':      ('胡三省', '辑注'),
          # annotation: 年号的注释
          'note4':      ('', '注'),
          # errata: 文字勘误
          'note5':      ('章鈺', '校勘')
      },
  )

  dbook: docbook.Book = converter.decode_book()
  dbook.title = ["資治通鑑", "", "胡三省註版"]
  dbook.authors = [['司馬光', '編集', '北宋', '朝散大夫|右諫議大夫|權御使中丞|充理檢使|上護軍|賜紫金魚袋'],['胡三省', '音注', '南宋']]
  dbook.dynasty = "北宋"
  dbook.categories = ['经史子集|史', '編年史', '通史']
  dbook.source = ""
  dbook.description = ("《资治通鉴》是司马光奉宋英宗和宋神宗之命编撰的一部编年体通史。由司马光本人担任主编，在刘攽、刘恕和范祖禹的协助下，历时19年而编撰完成。宋神宗认为此书「鉴于往事，有资于治道」，遂赐名《资治通鉴》。"
                       "全书分为294卷，约三百多万字，记事上起周威烈王二十三年（公元前403年），截止到后周世宗显德六年（959年），按照时间顺序记载了共16朝1362年的历史。《资治通鉴》中引用的史料极为丰富，除了十七史之外，还有各种杂史、私人撰述等。据《四库提要》记载，《资治通鉴》引用前人著作322 种，可见其取材广泛，具有极高的史料价值。"
                       "司马光的《资治通鉴》与司马迁的《史记》并列为中国史学的不朽巨著。《资治通鉴》自成书以来，一直受到历代帝王将相、文人墨客的追捧，点评批注它的人数不胜数。《资治通鉴》保存了很多现在已经看不到的史料，更重要的是，它对之后的史官创作、中国的历史编撰、文献学的发展等产生了深远的影响。")

  converter.save_book(args.output_dir)
