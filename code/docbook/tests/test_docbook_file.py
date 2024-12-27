import logging

from typing import Union, List, Dict, Tuple
from enum import Enum

import utils
import docbook 

def test_load():
  dbook_path = utils.convert_relativepath_to_abspath("../../../library/publish/资治通鉴·繁体竖排版 294卷全", __file__)
  dbfile = docbook.BookFile(dbook_path, False)
  chapters: list[docbook.Division] = dbfile.book.chapters
  for chapter in chapters:
    print(f"{chapter.id}, {chapter.title}")

def test_load_chapter_section(content_piece):
  if (content_piece.type == docbook.DivisionType.ANNOTATION) or (len(content_piece.content) == 0):
    return []
  
  hits: List[{str, float}] = []

  spans = content_piece.content.split('\n')
  for span in spans:
    span = utils.remove_html_tags(span)
    print(span)
    result = False
    if (result == True):
      hits.append((span, 1.0))

  for index, content_piece in enumerate(content_piece.content_pieces):
    hits += test_load_chapter_section(content_piece)
  
  return hits

def test_load_chapters():
  dbook_path = utils.convert_relativepath_to_abspath("../../../library/publish/资治通鉴·繁体竖排版 294卷全", __file__)
  dbfile = docbook.BookFile(dbook_path, False)
  chapters = dbfile.book.chapters

  for chapter in chapters:
    if (isinstance(chapter, docbook.Division) == False) or (chapter.type != docbook.DivisionType.CHAPTER):
      logger.debug(f"Invaild chapter {chapter}.")
      return None

    hits: List[{str, float}] = []
    for index, content_piece in enumerate(chapter.divisions):
      if (isinstance(content_piece, docbook.ContentPiece) == False):
        logger.error(f"a Invalid content_piece: {chapter}.")
        break
      
      hits += test_load_chapter_section(content_piece)

if __name__ == "__main__":
  utils.setup_logging(log_file = utils.convert_relativepath_to_abspath('../../../logs/test.log', __file__), level = logging.INFO)
  logger = logging.getLogger("test.docbook.file")

  #test_load()
  test_load_chapters()
  