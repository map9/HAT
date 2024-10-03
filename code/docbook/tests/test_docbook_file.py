import logging

import utils
import docbook

def test_load():
  dbook_path = utils.convert_relativepath_to_abspath("../../../library/publish/资治通鉴·繁体竖排版 294卷全", __file__)
  dbfile = docbook.BookFile(dbook_path, False)
  chapters: list[docbook.Division] = dbfile.book.chapters
  for chapter in chapters:
    print(f"{chapter.id}, {chapter.title}")

if __name__ == "__main__":
  utils.setup_logging(log_file = utils.convert_relativepath_to_abspath('../../../logs/test.log', __file__), level = logging.INFO)
  logger = logging.getLogger("test.docbook.file")

  test_load()
  
  