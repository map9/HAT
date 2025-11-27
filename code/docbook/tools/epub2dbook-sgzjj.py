"""
decoder-epub-sgzjj.py
将电子书《三国志集解 (陈寿著，裴松之注，卢弼集解，三国志吧点校)》转换为docbook格式
三国志集解 (陈寿著，裴松之注，卢弼集解，三国志吧点校) 版本
该版本和2009年的上海古籍出版社的版本内容不同，缺少钱剑夫校注整理的内容。

usage: decoder-epub-sgzjj.py epub_dir [-h] [--output_dir OUTPUT_DIR]

optional arguments:
  -h, --help            show this help message and exit
  epub_dir
                        Input decoded epub file directory.
  --output_dir OUTPUT_DIR
                        Enter path to directory to save output. Defaults to
                        the current working directory.
"""

import json
import argparse
import logging
from typing import Union, List

from bs4 import BeautifulSoup, Tag, NavigableString

import docbook
from tools import Converter, ContentType
from utils import SimpleCSSParser, remove_html_tags

logger = logging.getLogger('epub2dbook.sgzjj')

class AnnotationStackItem:
  """栈元素，用于维护注释嵌套层级"""
  def __init__(self, content_piece: docbook.ContentPiece, annotator_info: Union[tuple, None]):
    self.content_piece = content_piece  # ContentPiece 对象
    self.annotator_info = annotator_info  # (name, authorship) 或 None
    self.content_buffer = ""  # 累积纯文本内容（不含HTML标签）
    self.marked_buffer = ""  # 累积标记内容（含HTML标签）

class SGZJJConverter(Converter):

  def __init__(self, epub_dir: str, class2labels = None, class2annotators = None):
    super().__init__(epub_dir, class2labels, class2annotators)

  def _process_span_content(self, span) -> tuple[str, str]:
    """
    处理 span 内的内容，返回 (纯文本, 带标签文本)。

    处理特殊标签如 img，并递归处理子元素。
    """
    plain_text = ""
    marked_text = ""

    for child in span.children:
      if child.name is None:
        # NavigableString - 纯文本
        text = str(child)
        plain_text += text
        marked_text += text

      elif child.name == 'img':
        # 图片标签
        plain_text += '　'  # 占位符
        img_src = child.get('src', '')
        if img_src.startswith('../'):
          img_src = img_src[3:]
        img_label = f"Images/{self.img2label(img_src)}"
        marked_text += f'<img src="{img_label}"/>'

        # 注册图片到 docbook
        if self._dbook.get_extra(img_label) is None:
          try:
            img_content = self._epub_book.get_item_content_by_name(img_src)
            self._dbook.add_extra(docbook.Extra(
              img_label,
              docbook.ExtraContentType.ITEM_IMAGE,
              img_label,
              img_content
            ))
          except Exception as e:
            logger.warning(f"无法加载图片 {img_src}: {e}")

      elif child.name == 'b' or child.name == 'a':
        # 粗体或链接，直接提取文本
        text = child.text
        plain_text += text
        marked_text += text

      else:
        # 其他标签，递归处理
        sub_plain, sub_marked = self._process_span_content(child)
        plain_text += sub_plain
        marked_text += sub_marked

    return plain_text, marked_text

  def _process_special_span_classes(self, span_class: str, text: str) -> tuple[str, str, bool]:
    """
    处理特殊的 span class（非注释类）。

    Returns:
        (plain_text, marked_text, is_handled)
        is_handled=True 表示已处理，不需要进一步处理
    """
    # 特殊标签的内容
    if (span_class == "note2") or (span_class == "note3"):
      label = self.class2label(span_class)
      return text, f"<{label}>{text}</{label}>", True

    # 名称标签
    elif ('name' in span_class) or (span_class == 'book-title'):
      label = self.class2label(span_class)
      return text, f"<{label}>{text}</{label}>", True

    # ji 标签（直接输出）
    elif span_class == 'ji':
      return text, text, True

    # kong 标签
    elif span_class == 'kong':
      label = self.class2label(span_class)
      return text, f"<{label}>{text}</{label}>", True

    return text, text, False

  def decode_item_text(self, item, content_piece, content, marked_content) -> tuple[str, str]:
    content += item.text
    marked_content += item.text

    return content, marked_content

  def _parse_content_with_nested_annotations(self, item, root_piece, default_annotator=None):
    """
    核心方法：使用栈算法解析内容并处理嵌套注释

    Args:
        item: BeautifulSoup Tag（<p> 或其他容器）
        root_piece: 根 ContentPiece（PARAGRAPH 或 ANNOTATION），会被直接修改
        default_annotator: 默认注释者信息 (name, authorship) 或 None

    Returns:
        None（直接修改 root_piece）
    """
    # 初始化栈
    stack = [AnnotationStackItem(root_piece, default_annotator)]

    # 遍历子元素
    for child in item.children:
      # 获取文本和注释者信息
      if child.name is None:
        # NavigableString - 纯文本
        plain_text = str(child)
        marked_text = plain_text
        current_annotator = default_annotator

      elif child.name == 'span':
        span_class = child.get('class')
        if isinstance(span_class, list):
          span_class = span_class[0] if span_class else None

        current_annotator = self.class2annotator(span_class) if span_class else default_annotator

        # 检查是否是特殊类（number）- 只在 PARAGRAPH 类型时处理
        if span_class == 'number' and root_piece.type == docbook.DivisionType.PARAGRAPH:
          try:
            root_piece['number'] = int(child.text)
          except:
            pass
          continue

        # 处理特殊 span classes
        if span_class:
          text = child.text
          plain_text, marked_text, is_handled = self._process_special_span_classes(span_class, text)
          if is_handled and not current_annotator:
            stack[-1].content_buffer += plain_text
            stack[-1].marked_buffer += marked_text
            continue

        # 提取内容
        plain_text, marked_text = self._process_span_content(child)

      elif child.name == 'b' or child.name == 'a':
        text = child.text
        plain_text = text
        marked_text = text
        current_annotator = default_annotator

      elif child.name == 'img':
        plain_text = '　'
        img_src = child.get('src', '')
        if img_src.startswith('../'):
          img_src = img_src[3:]
        img_label = f"Images/{self.img2label(img_src)}"
        marked_text = f'<img src="{img_label}"/>'
        current_annotator = default_annotator

        # 注册图片
        if self._dbook.get_extra(img_label) is None:
          try:
            img_content = self._epub_book.get_item_content_by_name(img_src)
            self._dbook.add_extra(docbook.Extra(
              img_label,
              docbook.ExtraContentType.ITEM_IMAGE,
              img_label,
              img_content
            ))
          except Exception as e:
            logger.warning(f"无法加载图片 {img_src}: {e}")

      else:
        # 其他标签
        plain_text = child.text if child.text else ''
        marked_text = plain_text
        current_annotator = default_annotator
        if not plain_text:
          logger.debug(f"未处理的标签: {child.name}")
          continue

      # === 栈算法：逐字符处理文本，识别 【 和 】 ===
      i = 0
      while i < len(plain_text):
        char = plain_text[i]

        if char == '【':
          # 保存之前累积的文本到当前栈顶
          if stack[-1].content_buffer or stack[-1].marked_buffer:
            stack[-1].content_piece.content += stack[-1].marked_buffer
            stack[-1].content_buffer = ""
            stack[-1].marked_buffer = ""

          # 创建新注释
          new_annotation = docbook.ContentPiece(type=docbook.DivisionType.ANNOTATION)

          # 计算 position（基于父级的纯文本内容长度）
          parent_plain_content = remove_html_tags(stack[-1].content_piece.content)
          new_annotation.position = len(parent_plain_content)

          # 设置注释者信息
          if current_annotator:
            new_annotation.annotator = current_annotator[0]
            new_annotation.authorship = current_annotator[1]
            logger.debug(f"开始注释: {current_annotator[0]}, position={new_annotation.position}")

          # 新注释入栈
          new_item = AnnotationStackItem(new_annotation, current_annotator)
          new_item.content_buffer = '【'
          new_item.marked_buffer = '【'
          stack.append(new_item)

        elif char == '】':
          # 添加结束符
          stack[-1].content_buffer += '】'
          stack[-1].marked_buffer += '】'

          # 弹出栈
          if len(stack) > 1:
            completed = stack.pop()
            # 追加最后的 buffer 到 content，而不是覆盖
            if completed.content_buffer or completed.marked_buffer:
              completed.content_piece.content += completed.marked_buffer

            # 添加到父级
            stack[-1].content_piece.add_content_piece(completed.content_piece)
            logger.debug(f"完成注释: {completed.annotator_info}")
          else:
            # 栈只剩根节点（整段注释的结束标记）
            pass

        else:
          # 普通字符：累积到栈顶 buffer
          stack[-1].content_buffer += char
          if i < len(marked_text):
            stack[-1].marked_buffer += marked_text[i]

        i += 1

    # 处理栈中剩余内容（未闭合注释）
    while len(stack) > 1:
      logger.warning(f"发现未闭合的注释: {stack[-1].annotator_info}, {stack[-1].content_buffer}")
      completed = stack.pop()
      # 追加最后的 buffer 到 content
      if completed.content_buffer or completed.marked_buffer:
        completed.content_piece.content += completed.marked_buffer
      stack[-1].content_piece.add_content_piece(completed.content_piece)

    # 保存根节点的剩余内容
    if stack[0].marked_buffer:
      stack[0].content_piece.content += stack[0].marked_buffer

  def decode_chapter_section(self, item) -> tuple[docbook.ContentPiece, int]:
    content = ""
    marked_content = ""
    section_indent = 999
    content_piece = docbook.ContentPiece()
    content_piece.type = docbook.DivisionType.SECTION
    if (item.name == 'h2'):
      section_indent = 1
    elif (item.name == 'h3'):
      section_indent = 2

    for child in item.children:
      content, marked_content = self.decode_item_text(child, content_piece, content, marked_content)
    content_piece.content = marked_content
    return content_piece, section_indent

  def _parse_annotation_content(self, item, parent_annotator=None):
    """
    解析注释内容，支持嵌套。

    Args:
        item: BeautifulSoup Tag 或 NavigableString
        parent_annotator: 父级注释者信息（用于整段注释的情况）

    Returns:
        ContentPiece (ANNOTATION)
    """
    annotation = docbook.ContentPiece(type=docbook.DivisionType.ANNOTATION)

    if parent_annotator:
      annotation.annotator = parent_annotator[0]
      annotation.authorship = parent_annotator[1]

    # 调用核心方法处理嵌套
    self._parse_content_with_nested_annotations(item, annotation, parent_annotator)

    return annotation

  def decode_chapter_paragraph(self, item) -> tuple[docbook.ContentPiece, int]:
    """
    解析段落，支持嵌套注释。

    使用栈算法：
    - 根据 【 开启新注释
    - 根据 】 关闭当前注释
    - 正确计算每级注释的 position
    """
    section_indent = 999

    if len(item.get_text().strip()) == 0:
      return None, section_indent

    # 检查整个段落是否是注释段落
    item_class = item.get('class')
    if item_class is not None:
      # BeautifulSoup returns class as a list, extract first element
      if isinstance(item_class, list):
        item_class = item_class[0] if item_class else None

      annotator = self.class2annotator(item_class) if item_class else None
      if annotator is not None:
        # 整段都是注释，使用注释解析方法
        annotation = self._parse_annotation_content(item, annotator)
        annotation.position = None  # 整段注释没有 position

        content_piece = docbook.ContentPiece(type=docbook.DivisionType.PARAGRAPH)
        content_piece.content = ''
        content_piece.add_content_piece(annotation)
        return content_piece, section_indent

    # === 混合段落：基于栈的嵌套注释解析 ===

    # 初始化根 ContentPiece (PARAGRAPH)
    root_piece = docbook.ContentPiece(type=docbook.DivisionType.PARAGRAPH)

    # 调用核心方法处理嵌套
    self._parse_content_with_nested_annotations(item, root_piece, None)

    return root_piece, section_indent

  def decode_chapter_title(self, item) -> docbook.Division:
    content = ""
    marked_content = ""
    division = docbook.Division(type=docbook.DivisionType.CHAPTER)
    for child in item.children:
      content, marked_content = self.decode_item_text(child, division, content, marked_content)
    division.title = marked_content
    print(f"  chapter title: {division.title}.")
    return division

  def decode_chapter(self, html_elements: List[Union[Tag, NavigableString]]):
    if (len(html_elements) == 0):
      return

    helper = docbook.Indent2SectionHelper()
    for index, item in enumerate(html_elements):
      if (item.name == 'h1'):
        division = self.decode_chapter_title(item)
        helper.root = division

      elif (item.name == 'h2' or item.name == 'h3' or item.name == 'p'):
        content_piece, section_indent = None, 999
        if (item.name == 'h2' or item.name == 'h3'):
          content_piece, section_indent = self.decode_chapter_section(item)
        else:
          content_piece, section_indent = self.decode_chapter_paragraph(item)
        
        if content_piece is None:
          continue

        helper.add_content_piece(section_indent, content_piece)

      elif item.name is None:
        pass

      elif (item.name == 'hr') or (item.name == 'br'):
        pass

      elif (item.name == 'a'):
        pass

      else:
        print(f"unsupport label: {item.name}.")

    self._dbook.add_division(helper.root)

  def _merge_all_html_bodies(self) -> BeautifulSoup:
    """
    极简版：合并多个HTML的body内容到一个新BS4对象
    :param html_sources: HTML字符串列表（支持文件路径或HTML文本）
    :return: 合并后的BS4对象
    """
    # 1. 创建新HTML骨架
    new_soup = BeautifulSoup('<html><head></head><body></body></html>', 'html.parser')
    new_body = new_soup.find('body')

    # 通过 _epub_book 中的 items 顺序获取章节内容
    for item in self._epub_book.items:
      if (item['type'] != ContentType.ITEM_DOCUMENT or item['name'] == 'titlepage.xhtml'):
        continue
      html_content = self._epub_book.get_item_content_by_name(item['name']).decode('utf-8')
      soup = BeautifulSoup(html_content, 'html.parser')

      body = soup.find('body')
      # 遍历 body 子节点，过滤 None 和纯空文本
      for child in body.contents:
        # 1. 过滤 None 节点
        if child is None:
          continue
        
        # 2. 文本节点：过滤纯空白
        if isinstance(child, NavigableString):
          # 判断是否为纯空白（strip() 后为空字符串）
          if child.strip():
            new_body.append(child)
        
        # 3. 标签节点（如 <div>、<h1> 等）：直接保留
        elif isinstance(child, Tag):
            new_body.append(child)

    return new_soup

  # h1 chapter 纪、传
  #    span.text_125 卷一·魏书一·
  #    span.text_126 武帝纪第一
  # 使用 h1 标签区分，span 的 class 没有使用意义
  # h2 section 篇
  # p.span.text_xxx.color
  #    #00F, #36F 蓝色：卢注文
  #    #F00 红色：裴注文
  #    #808000, #948A54 茶色：志吧校文
  #    #333 深灰色：陈志正文
  def decode_custom(self) -> docbook.Division:
    toc_content = self._epub_book.get_toc_content()
    toc_items = self.decode_toc(toc_content)
    #self.print_toc_items(toc_items)

    self._class2annotators = {}
    # 按照 css 中的颜色定义注释者
    css_content = self._epub_book.get_item_content_by_name('stylesheet.css')
    #print(f"Parse CSS content:\n{css_content}")
    parser = SimpleCSSParser()
    css_items = parser.css_to_json(css_content.decode('utf-8'))
    #print(json.dumps(css_items, indent=4, ensure_ascii=False))
    for css_rule in css_items['rules']:
      #print(f"selectors: {css_rule['selectors']}, properties: {css_rule['properties']}.")
      class_name = css_rule['selectors'][0][1:]
      if 'color' in css_rule['properties'] and len(css_rule['selectors']) > 0:
        color_value = css_rule['properties']['color']
        for class_name in css_rule['selectors']:
          if (color_value == '#F00'):
              self._class2annotators[class_name[1:]] = ('裴松之', '注')
          elif (color_value == '#00F') or (color_value == '#36F'):
            self._class2annotators[class_name[1:]] = ('卢弼', '集解')
          elif (color_value == '#808000') or (color_value == '#948A54'):
            self._class2annotators[class_name[1:]] = ('三国志吧', '点校')
    #print(f"class2annotators: {self._class2annotators}.")

    # 通过 _epub_book 中的 items 顺序获取章节内容
    merged_soup = self._merge_all_html_bodies()
    body = merged_soup.find('body')

    if hasattr(body, 'children') == False:
      return None

    print(f"  main has {len(list(body.children))} children.")

    chapter_index = 0
    html_elements = []
    for index, child in enumerate(body.children):
      if (child.name == 'h1'):
        chapter_index += 1
        self.decode_chapter(html_elements)
        html_elements = []
        #if (chapter_index == 2):
        #  break
      html_elements.append(child)
    self.decode_chapter(html_elements)

    return self._dbook
    
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

  converter = SGZJJConverter(
      args.epub_dir
  )

  dbook: docbook.Book = converter.decode_custom()
  
  dbook.title = ["三国志", "", "集解"]
  dbook.authors = [['陈寿', '著', '西晋', '平阳侯相'],['裴松之', '注', '南宋', '中书侍郎|西乡侯'],['卢弼', '集解', '民国'], ['三国志吧', '点校', '现代']]
  dbook.dynasty = "西晋"
  dbook.categories = ['经史子集|史', '纪传史', '二十四史']
  dbook.source = ""
  dbook.description = ("")

  chapters: List[docbook.Division] = dbook.chapters
  # 胡刻通鑑正文校宋記述略
  #chapters[0].authors = [['章鈺', '序', '民國']]
  # 新註資治通鑑序
  #chapters[1].authors = [['胡三省', '序', '南宋']]
  # 興文署新刊資治通鑑序
  #chapters[2].authors = [['王磐', '序', '元']]
  # 興文署新刊資治通鑑序
  #chapters[3].authors = [['趙頊', '序', '北宋']]

  converter.save_book(args.output_dir)
