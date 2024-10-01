"""
decoder-epub-zztj.py
将电子书《史记三家注》转换为docbook格式

usage: epub2dbook-sjsjz.py epub_dir [-h] [--output_dir OUTPUT_DIR]

optional arguments:
  -h, --help            show this help message and exit
  epub_dir
                        Input decoded epub file directory.
  --output_dir OUTPUT_DIR
                        Enter path to directory to save output. Defaults to
                        the current working directory.
"""

import re
import argparse
from typing import Union, List

from bs4 import BeautifulSoup, Tag

import docbook
from  tools import Converter

# 漢川草廬 http://www.sidneyluo.net/
# 网站内容格式化定义
# div.feature为章节块内容
#   h5 书名
#   span.style2 章名前缀
#   span.style9 章名
#   span.style11 作者名
#   p 正文段落
#   p.style7 注释段落
#   p.style8 注释段落/总结性质
#     span.style7 文内注释
#   table.style10
#     tbody tr.style4

class ZZTJConverter(Converter):

  def __init__(self, epub_dir: str, class2labels = None, class2annotators = None):
    super().__init__(epub_dir, class2labels, class2annotators)

  def decode_item_text_to_annotations(self, content):
    sections = re.split(r'【(.*?)】', content)

    if (len(sections)%2 == 1):
      if (len(sections[0]) != 0):
        #print(f"Noname: {sections[0]}, total: {content}.")
        sections.insert(0, '集解')
      else:
        sections.pop(0)

    return [{ "annotator": sections[i], "content": sections[i + 1]} for i in range(0, len(sections), 2)]

  def decode_item_text(self, item, content_piece, content, marked_content) -> tuple[str, str]:
    # 内容
    if item.name == None:
      content += item.text
      marked_content += item.text
    elif item.name == 'span':
      item_class = item.get('class')
      if item_class is not None:
        # 注释
        if (item_class == "style7") or (item_class == "style8"):
          texts = self.decode_item_text_to_annotations(item.text)
          for t in texts:
            annotation = docbook.ContentPiece(type=docbook.DivisionType.ANNOTATION)
            annotation.annotator = t['annotator']
            annotation.position = -1 if len(content) == 0 else len(content)
            annotation.content = t['content']
            content_piece.add_content_piece(annotation)
        else:
          content += item.text
          marked_content += item.text
          print(f"unsupport span.{item_class}.")
      else:
        content += item.text
        marked_content += item.text
        print(f"unsupport span.{item_class}.")
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

  #   p 正文段落
  #   p.style7 注释段落
  #   p.style8 注释段落/总结性质
  #     span.style7 文内注释
  def decode_chapter_paragraph(self, item) -> tuple[docbook.ContentPiece, int]:
    content = ''
    marked_content = ''
    section_indent = 999

    item_class = item.get('class')
    content_piece = docbook.ContentPiece()    
    # 正文段落
    if (item_class == None):
      content_piece.type = docbook.DivisionType.PARAGRAPH

      for child in item.children:
        content, marked_content = self.decode_item_text(child, content_piece, content, marked_content)
      content_piece.content = marked_content
      return content_piece, section_indent

    # 注释段落
    elif (item_class == 'style7') or (item_class == 'style8'):
      content_piece.type = docbook.DivisionType.PARAGRAPH
      content_piece.content = content
      if (item_class == 'style8'):
        annotation = docbook.ContentPiece(type=docbook.DivisionType.ANNOTATION)
        annotation.annotator = '索隱'
        annotation.authorship = '述贊'
        annotation.position = len(content)
        annotation.content = item.text
        content_piece.add_content_piece(annotation)
      else:
        texts = self.decode_item_text_to_annotations(item.text)
        for t in texts:
          annotation = docbook.ContentPiece(type=docbook.DivisionType.ANNOTATION)
          annotation.annotator = t['annotator']
          annotation.position = len(content)
          annotation.content = t['content']
          content_piece.add_content_piece(annotation)
      return content_piece, section_indent

    # 其他标签
    else:
      print(f"unsupport p.{item_class}.")

  # 漢川草廬 http://www.sidneyluo.net/
  # 网站内容格式化定义
  # div.feature为章节块内容
  #   h5 书名
  #   span.style2 章名前缀
  #   span.style9 章名
  #   span.style11 作者名
  #   p 正文段落
  #   p.style7 注释段落
  #   p.style8 注释段落/总结性质
  #     span.style7 文内注释
  #   table.style10
  #     tbody tr.style4
  def decode_chapter(self, toc_item: dict[str, Union[str, List]]):

    ref = toc_item['src']
    content = self._epub_book.get_item_content_by_name(ref)
    if len(content) == 0:
      print(f"Can't read chapter content, name: {toc_item['label']}, src: {toc_item['src']}.")
      return None

    content = content.decode('utf-8')
    print(f"Decode chapter, name: {toc_item['label']}, src: {toc_item['src']}.")

    soup = BeautifulSoup(content, "xml")
    # div class='feature'为章节块内容
    main = soup.find("div", class_="feature")
    if main is None or not hasattr(main, 'children'):
      print("Can't find chapter content, div.feature.")
      return None

    title = ['','','']
    author = ''
    helper = docbook.Indent2SectionHelper()
    for child in main.children:
      # 检查是否为 NavigableString
      if isinstance(child, str):
        continue  # 跳过字符串

      item_class = child.get('class')
      #print(f"decode label, name: {child.name}, class: {item_class}, text: {child.text}.")  
      
      # h5 书名
      if (child.name == 'h5'):
        pass

      # span.style2 章名前缀
      # span.style9 章名
      # span.style11 作者名
      elif (child.name == 'span'):
        if (item_class == 'style2'):
          title[1] = child.text
        elif (item_class == 'style9'):
          title[0] = child.text
        elif (item_class == 'style11'):
          author = child.text
        else:
          print(f"unsupport span.{item_class}.")

      # p 正文段落
      elif (child.name == 'p'):
        content_piece, section_indent = self.decode_chapter_paragraph(child)
        if content_piece is None:
          continue

        if helper.has_root() == False:
          division = docbook.Division(type = docbook.DivisionType.CHAPTER, title=title, authors=[author])
          helper.root = division
        helper.add_content_piece(section_indent, content_piece)

      elif child.name is None:
        pass

      elif (child.name == 'hr') or (child.name == 'br'):
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
      class2labels={
          # annotation: 章节头的注释
          'style7':     '三家注释',
          # annotation: 年号的注释
          'style8':     '索隱述贊',
      }
  )

  dbook: docbook.Book = converter.decode_book()
  dbook.title = ["史記", "", "三家註"]
  dbook.authors = [['司馬遷', '撰', '西漢', '太史令'],['裴駰', '集解', '南朝宋', '南中郎|外兵曹參軍'],['司馬貞', '索隱', '唐', '國子博士|弘文館學士'], ['張守節', '正義', '唐', '諸王侍讀|率府長史']]
  dbook.dynasty = "西漢"
  dbook.categories = ['经史子集|史', '纪传史', '二十四史']
  dbook.source = ""
  dbook.description = ("")

  converter.save_book(args.output_dir)
