"""
This script creates a ETL(Extract, transform, and load) application by used LLM+AutoGen.
usage: event_etl.py file_dir [-h] [--output_dir OUTPUT_DIR]

optional arguments:
  -h, --help            show this help message and exit
  file_path
                        Input file path need to ETL.
  --output_dir OUTPUT_DIR
                        Enter path to directory to save output. Defaults to
                        the current working directory.
  --model_name
                        LLM model name. Defaults is 'gemma2'.
  --seed
                        LLM seed. Defaults is '32'.
  --temperature
                        LLM temperature. Defaults is '0.75'.
  --stream
                        LLM stream. Defaults is True.
"""

import json
import logging
import argparse
import pathlib

from termcolor import colored

from typing import Union, List, Dict, Tuple
from enum import Enum

import utils
import docbook
from eventetl import EventETL

_MODEL_NAME_ = 'llama3.3' # 27b 太大，三分钟一个字 delete
_MODEL_NAME_ = 'glm4:9b-text-q8_0' # 不理解指令 delete
_MODEL_NAME_ = 'gemma2:9b-text-q8_0' # 不理解指令 delete，text的模型不是指令模型
_MODEL_NAME_ = 'mistral-nemo:latest' # json输出中{不匹配，有的时候会缺失}，经过提示，能修改回来。
_MODEL_NAME_ = 'olmo2:13b' # 13b 不能遵循指令输出格式，比较差。
_MODEL_NAME_ = 'qwq:latest' # 增加了THINK后，思考倒是很多，很啰嗦，结果都不能按照要求输出的json格式。太差！
#_MODEL_NAME_ = 'deepscaler:latest'
_MODEL_NAME_ = 'gemma3' # 不行

_MODEL_NAME_ = 'qwen2.5:7b' # ok
_MODEL_NAME_ = 'qwen2.5:7b-instruct-q8_0' # ok
_MODEL_NAME_ = 'qwen2.5:14b' # 时间提取问题比较多
_MODEL_NAME_ = 'gemma2:27b' # 有些中文字，不识别，导致输出为字母，应该是中文字库太少的问题。
_MODEL_NAME_ = 'gemma2' # 9b 无法解决json输出中用 ” 符号代替 " 的问题，多次提示，怎么提示，均无法解决。
_MODEL_NAME_ = 'phi4' # 14b 
_MODEL_NAME_ = 'deepseek-r1:32b'
_MODEL_NAME_ = 'gemma3:12b' # 无法解决json输出中用 ” 符号代替 " 的问题，多次提示，怎么提示，均无法解决。
_MODEL_NAME_ = 'qwen3:14b' # good
_MODEL_NAME_ = 'qwen3:8b' # 
_MODEL_NAME_ = 'phi4-reasoning:latest' # 不行，出现时间不符合
#_MODEL_NAME_ = 'gpt-oss:20b'
_MODEL_NAME_ = 'gemma3:12b'

def event_etl_from_lines(eetl, lines, has_return, headlines):
  total_events_json = None
  last_result_status = True
  for result in eetl.event_etl_from_lines(lines, has_return, headlines):
    color = None
    sender = result['sender']
    if sender == 'loop' or sender == 'end':
      color = 'yellow'
    elif sender == 'initializer':
      color = None  
    elif sender == 'extractor':
      color = 'green'
    elif sender == 'editor':
      color = 'red'
    elif sender == 'summarizer':
      color = 'blue'

    if (last_result_status == True):
      print(colored(f"{result['sender']} -> {result['receiver']}", color))

    if (result['done'] == True):
      last_result_status = True
      if (sender == 'loop'):
        print(colored(f"{result['message']['startLineNo']}~{result['message']['endLineNo']} / {result['message']['lineCount']}", color))
      elif (sender == 'end'):
        total_events_json = result['message']
        json_str = json.dumps(total_events_json, ensure_ascii = False)
        print(colored(json_str, color))
      else:
        if (result['type'] == 'string'):
          print(colored(result['message'], color))
        else:
          json_str = json.dumps(result, ensure_ascii = False)
          print(colored(json_str, color))
    else:
      last_result_status = False
      print(colored(result['message'], color), end = "")
  
  if (total_events_json is None):
    logger.error(f"没有正确提取事件信息。")
  
  return total_events_json

def get_dbfile_chapter_section(content_piece):
  if (content_piece.type == docbook.DivisionType.ANNOTATION) or (len(content_piece.content) == 0):
    return []
  
  content = utils.remove_html_tags(content_piece.content)
  lines = content.split('\n')

  for content_piece in content_piece.content_pieces:
    lines += get_dbfile_chapter_section(content_piece)
  
  return lines

def event_etl_from_dbfile_chapter(eetl, chapter, headlines):
  total_events_json = None

  if (isinstance(chapter, docbook.Division) == False) or (chapter.type != docbook.DivisionType.CHAPTER):
    logger.debug(f"Invaild chapter {chapter}.")
    return total_events_json
  
  lines = []
  for index, content_piece in enumerate(chapter.divisions):
    if (isinstance(content_piece, docbook.ContentPiece) == False):
      logger.error(f"a Invalid content_piece: {chapter}.")
      break
    
    lines += get_dbfile_chapter_section(content_piece)
  total_events_json = event_etl_from_lines(eetl, lines, False, headlines)
    
  if (total_events_json is None):
    logger.error(f"没有正确提取事件信息。")
  
  return total_events_json

# save event json to file as event_json_file_path + filename + .json
def save_event_json(event_json_file_path, filename, total_events_json):
  if total_events_json is None or len(total_events_json) == 0:
    logger.info(f"没有提取到任何事件信息，无法保存。")
    return

  if pathlib.Path(event_json_file_path).is_dir():
    event_json_file_path = pathlib.Path(event_json_file_path) / f"{filename}.json"
  else:
    event_json_file_path = event_json_file_path.with_name(event_json_file_path.stem + f"_{filename}.json")

  try:
    with open(event_json_file_path, 'w') as file:
      file.write(json.dumps(total_events_json, ensure_ascii=False, indent=4))
    logger.info(f"事件信息已保存到 {event_json_file_path}")
  except IOError as e:
    logger.error(f"保存文件 {event_json_file_path} 时出现错误: {e}")

def event_etl_from_file(file_path,
                        event_json_file_path,
                        model_name, seed, temperature, max_tokens,
                        use_stream,
                        line_step_count,
                        max_piece_char_count):
  
  eetl = EventETL(config={
      'model_name': model_name,
      'model_options': {
        "seed": seed,
        "temperature": temperature,
        "num_ctx": max_tokens,
      },
      'stream': use_stream,
      'line_step_count': line_step_count,
      'max_piece_char_count': max_piece_char_count,
    })
  
  if event_json_file_path is None or len(event_json_file_path) == 0:
    event_json_file_path = pathlib.Path(file_path)
  else:
    event_json_file_path = pathlib.Path(event_json_file_path)

  # 读取待处理的历史文献文件
  dbfile = docbook.BookFile(file_path, False)
  if dbfile.isLoad():
    chapters = dbfile.book.chapters
    chapters = chapters[4:]

    book_info = None
    if dbfile.book.title.title is not None and len(dbfile.book.title.title) > 0:
      book_info = dbfile.book.title.title + "\n"
      if dbfile.book.authors is not None and len(dbfile.book.authors) > 0:
        for author in dbfile.book.authors:
          book_info = book_info + f"{author.name} {author.type}\n"
  
    for chapter in chapters:
      info = f"processing chapter:\n chapter.id: {chapter.id}\n"
      title = chapter.id
      headlines = None
      if chapter.title.title is not None and len(chapter.title.title) > 0:
        headlines = chapter.title.title + "\n" if book_info is None else book_info + chapter.title.title + "\n"
        if chapter.authors is not None and len(chapter.authors) > 0:
          for author in chapter.authors:
            headlines = headlines + f"{author.name} {author.type}\n"
        headlines = headlines + "...\n"

        info = info + "  chapter.title: {chapter.title.dump_json(remove_useless = True)}"
        title = chapter.title.title

      logger.info(f"{info}")
      print(info, end="\n\n")

      if (isinstance(chapter, docbook.Division) == False) or (chapter.type != docbook.DivisionType.CHAPTER):
        logger.debug(f"Invaild chapter {chapter}.")
      else:
        total_events_json = event_etl_from_dbfile_chapter(eetl, chapter, headlines)
        save_event_json(event_json_file_path, f"{title}_{model_name}", total_events_json)
  else:
    lines = ""
    headlines = None
    try:
      with open(file_path, 'r') as file:
        lines = file.readlines()
    except FileNotFoundError:
      logger.error(f"文件：{file_path} 不存在。")

    total_events_json = event_etl_from_lines(eetl, lines, True, headlines)
    save_event_json(event_json_file_path, model_name, total_events_json)

# usage:
# python event_etl.py ../../../library/temp/魏书·文帝纪.txt --line_step_count 4
# python event_etl.py "../../../library/publish/资治通鉴·繁体竖排版 294卷全" --line_step_count 4
if __name__ == "__main__":
  utils.setup_logging(log_file = utils.convert_relativepath_to_abspath('../../../logs/event.log', __file__), level = logging.ERROR)
  logger = logging.getLogger("eventetl.tools.eventetl")

  parser = argparse.ArgumentParser()
  parser.add_argument(
    "file_path",
    type=str,
    help="Input file path need to ETL.",
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
  parser.add_argument(
    "--model_name",
    type=str,
    default=_MODEL_NAME_,
    help="LLM model name. Defaults is 'gemma2'."
  )
  parser.add_argument(
    "--seed",
    type=int,
    default=32,
    help="LLM seed. Defaults is 32."
  )
  parser.add_argument(
    "--temperature",
    type=float,
    default=0.75,
    help="LLM temperature. Defaults is 0.75."
  )
  parser.add_argument(
    "--max_tokens",
    type=int,
    default=8000,
    help="LLM max_tokens. Defaults is 8000."
  )
  parser.add_argument(
    "--stream",
    type=bool,
    default=True,
    help="LLM stream. Defaults is True."
  )
  parser.add_argument(
    "--line_step_count",
    type=int,
    default=-1,
    help="Batch ETL line count. Defaults is -1."
  )
  parser.add_argument(
    "--max_piece_char_count",
    type=int,
    default=300,
    help="Batch ETL max piece count. Defaults is 300."
  )

  args = parser.parse_args()
  
  print(f"file_path: {args.file_path}")
  print(f"output_dir: {args.output_dir}")
  print(f"model_name: {args.model_name}")
  print(f"seed: {args.seed}")
  print(f"temperature: {args.temperature}")
  print(f"max_tokens: {args.max_tokens}")
  print(f"stream: {args.stream}")
  print(f"line_step_count: {args.line_step_count}")
  print(f"max_piece_char_count: {args.max_piece_char_count}")

  event_etl_from_file(args.file_path,
    args.output_dir,
    args.model_name, args.seed, args.temperature, args.max_tokens,
    args.stream,
    args.line_step_count,
    args.max_piece_char_count
  )