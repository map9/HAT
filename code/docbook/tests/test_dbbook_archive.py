import sys
import os
import json
import logging

import docbook
import utils

def test_load():

  dbook_archive_path = utils.convert_relativepath_to_abspath("../../../library/publish", __file__)

  dbarchive = docbook.BookArchive(dbook_archive_path)

  dbooks = dbarchive.dbooks
  for book in dbooks:
    logger.info(f"book: {book.id}, {book.title.title}, 卷/章数目:{len(book.divisions)}")

  
  dbfiles = dbarchive.dbfiles
  for dbfile in dbfiles:
    logger.info(f"file: {dbfile.path}, {dbfile.type}")

  return dbarchive

def test_load_all_chapter(dbarchive: docbook.BookArchive):
  dbfiles = dbarchive.dbfiles
  dbfiles[0].load_all_chapter()
  dbfiles[0].unload_all_chapter()
  dbfiles[0].load_all_chapter()

  division = dbfiles[0].book.divisions[0]
  logger.info(division)

def test_get_book_catalogue(dbarchive: docbook.BookArchive):
  #id = "b5a5e741-b8bc-491c-a399-c07982777821" # 老子
  #id = "3ff95383-c29e-4eca-ae1d-439b8a054e96" # 韩非子
  id = "ca546e4e-06cc-4c01-b827-0bb3cfc6c6b8" # 資治通鑑
  
  dbook = dbarchive.get_book_byid(id)
  if (dbook is None):
    logger.info(f"Can't get book, id: {id}.")
    return

  catalogue = dbook.get_catalogue()
  catalogue = utils.remove_useless_value(catalogue)
  catalogue = json.dumps(catalogue, ensure_ascii = False, indent = 2)
  logger.info(f"book: {id}\ncatalogue:{catalogue}.")

def test_get_book_chapter(dbarchive: docbook.BookArchive):
  dbook_id = "ca546e4e-06cc-4c01-b827-0bb3cfc6c6b8" # 資治通鑑
  chapter_id = "5565a4e0-5604-40c7-b653-ee077cb9e644" # 漢紀九

  dbfile = dbarchive.get_bookfile_byid(dbook_id)
  if dbfile is None:
    logger.info(f"can't find dbook file, id = {dbook_id}.")
    return

  loaded, chapter = dbfile.load_chapter_byid(chapter_id)
  if loaded == False:
    logger.info(f"load dbook chapter failed, id = {chapter_id}.")
    return

  directory = dbfile.book.get_chapter_directory_byid(chapter_id)
  logger.info('|'.join([dir.title.title for dir in directory]))

if __name__ == "__main__":
  utils.setup_logging(log_file = utils.convert_relativepath_to_abspath('../../../logs/test.log', __file__), level = logging.INFO)
  logger = logging.getLogger("test.docbook.archive")
  
  dbarchive = test_load()
  test_get_book_catalogue(dbarchive)
  test_get_book_chapter(dbarchive)