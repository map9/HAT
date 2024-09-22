"""
json2dbook.py
将原来json格式定义的电子书转换为docbook格式

usage: json2dbook.py epub_dir [-h] [--output_dir OUTPUT_DIR]

optional arguments:
  -h, --help            show this help message and exit
  json_dir
                        Input json file or directory.
  --output_dir OUTPUT_DIR
                        Enter path to directory to save output. Defaults to
                        the current working directory.
"""

import pathlib
import argparse

import json
import docbook

def json2dbook(json_book: dict) -> docbook.Book:
  dbook = docbook.Book(
      title = docbook.Title(json_book["title"]),
      authors = [docbook.Author("不详")],
      dynasty = docbook.Dynasty("不详"),
      categories = [],
      source = json_book["source"],
      description = json_book["description"]
  )

  for volume in json_book["volumes"]:
    if len(volume['title']) > 0:
      dbook_division = docbook.Division(title = volume['title'], type = docbook.DivisionType.VOLUME)
      dbook.add_division(dbook_division)
    else:
      dbook_division = dbook
    for chapter in volume["chapters"]:
      dbook_chapter = docbook.Division(title = chapter['title'], type = docbook.DivisionType.CHAPTER)
      dbook_division.add_division(dbook_chapter)
      if chapter.get("paragraphs") is None:
        print(f"  -> lost chapter: {chapter['title']}.")
        continue
      for paragraph in chapter["paragraphs"]:
        content_pieces = docbook.ContentPiece(content = paragraph["content"])
        dbook_chapter.add_content_piece(content_pieces)

  return dbook

def convert(json_file_path, dbook_file_path):
  json_file_path = pathlib.Path(json_file_path)
  dbook_file_path = pathlib.Path(dbook_file_path)
  dbook_file_path = dbook_file_path / json_file_path.stem

  print(f"convert json: {json_file_path} to dbook...")

  json_book = None
  with open(json_file_path, "rb") as file:
    json_book = json.loads(file.read().decode('utf-8'))
    file.close()

  if json_book is None:
    return
  
  dbook = json2dbook(json_book)
  if dbook is None:
    print(f"json_file_path: {json_file_path}.")
    return

  docbook.BookFile.save_to_docbook(dbook_file_path.with_suffix('.dbook'), dbook, docbook.BookFileType.SINGLE_FILE)

if __name__ == "__main__":
  parser = argparse.ArgumentParser()

  parser.add_argument(
    "json_dir",
    type=str,
    help="Input json file or directory.",
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

  json_file_path = pathlib.Path(args.json_dir)
  if json_file_path.is_file():
    convert(args.json_dir, args.output_dir)
  elif json_file_path.is_dir():
    json_file_paths = list(json_file_path.rglob("*.json"))
    for json_file_path in json_file_paths:
      convert(json_file_path, args.output_dir)
  else:
    print(f"json_dir: {json_file_path} is not a file or directory.")