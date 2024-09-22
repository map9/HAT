"""
epub-decoder.py
decode epub file to directory include html, image, ncx, ...

usage: epub-decoder.py epub_file [-h] [--output_dir OUTPUT_DIR]

optional arguments:
  -h, --help            show this help message and exit
  epub_file
                        Input epub file.
  --output_dir OUTPUT_DIR
                        Enter path to directory to save output. Defaults to
                        the current working directory.
"""

import json
import pathlib
import argparse
from ebooklib import epub

if __name__ == "__main__":
  parser = argparse.ArgumentParser()

  parser.add_argument(
    "epub_file",
    type=str,
    help="Input epub file.",
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

  print(f"epub_file: {args.epub_file}.")

  try:
    book = epub.read_epub(args.epub_file)
  except Exception as e:
    print(f"读写文件：{args.epub_file}出现错误，{e}")
    exit()

  book_dict = {}
  all_items = book.get_items()

  process_directory = pathlib.Path(args.output_dir)
  if len(args.output_dir) == 0:
    process_directory = pathlib.Path(args.epub_file).parent
  process_directory = process_directory / pathlib.Path(args.epub_file).stem

  #print(f"output_dir: {process_directory}.")

  # ITEM_UNKNOWN
  # ITEM_IMAGE
  # ITEM_STYLE
  # ITEM_SCRIPT
  # ITEM_NAVIGATION
  # ITEM_VECTOR
  # ITEM_FONT
  # ITEM_VIDEO
  # ITEM_AUDIO
  # ITEM_DOCUMENT
  # ITEM_COVER
  # ITEM_SMIL
  book_dict['items'] = []
  for item in book.get_items():
    path = pathlib.Path(process_directory) / item.get_name()
    #print(f"NAME: {item.get_name()}, TYPE: {item.get_type()}, {path}.")
    book_dict['items'].append(
      {
        "name" : item.get_name(),
        "type" : item.get_type()
      }
    )

    path.parent.mkdir(parents = True, exist_ok = True)

    with open(path, "wb") as file:
     file.write(item.get_content())
     file.close()
  
  path = pathlib.Path(process_directory) / "book.json"
  with open(path, "wb") as file:
    file.write(json.dumps(book_dict, ensure_ascii = False, indent = 4).encode('utf-8'))
    file.close()