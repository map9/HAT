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
from eventetl import EventETL

_MODEL_NAME_ = 'llama3.3' # 27b 太大，三分钟一个字 delete
_MODEL_NAME_ = 'glm4:9b-text-q8_0' # 不理解指令 delete
_MODEL_NAME_ = 'gemma2:9b-text-q8_0' # 不理解指令 delete，text的模型不是指令模型
_MODEL_NAME_ = 'mistral-nemo:latest' # json输出中{不匹配，有的时候会缺失}，经过提示，能修改回来。

_MODEL_NAME_ = 'gemma2' # 9b 无法解决json输出中用 ” 符号代替 " 的问题，多次提示，怎么提示，均无法解决。
_MODEL_NAME_ = 'gemma2:27b' # 有些中文字，不识别，导致输出为字母，应该是中文字库太少的问题。
_MODEL_NAME_ = 'qwen2.5:7b' # ok
_MODEL_NAME_ = 'qwen2.5:7b-instruct-q8_0' # ok
_MODEL_NAME_ = 'qwen2.5:14b' # 时间提取问题比较多

def event_etl_from_file(file_path,
                        event_json_file_path,
                        line_step_count,
                        model_name, seed, temperature,
                        max_tokens, use_stream):
  
  eetl = EventETL(config={
      'model_name': model_name,
      'stream': use_stream,
      'options': {
        "seed": seed,
        "temperature": temperature,
        "num_ctx": max_tokens,
      }      
    })
    
  lines = ""
  # 读取待处理的历史文献文件
  try:
    with open(file_path, 'r') as file:
      lines = file.readlines()
  except FileNotFoundError:
    logger.error(f"文件：{file_path} 不存在。")

  total_events_json = None
  last_result_status = True
  for result in eetl.event_etl_from_lines(lines, line_step_count):
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
        print(colored(f"{result['message']['index']} / {result['message']['count']}", color))
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
    return

  # 保存所有提取的历史事件到event_json_file_path中
  if event_json_file_path is None or len(event_json_file_path) == 0:
    event_json_file_path = pathlib.Path(file_path)
    event_json_file_path = event_json_file_path.parent / (event_json_file_path.name + f"_{model_name}.json")
    event_json_file_path = event_json_file_path.as_posix()
  try:
    with open(event_json_file_path, 'w') as file:
      file.write(json.dumps(total_events_json, ensure_ascii = False, indent=4))
  except IOError as e:
    logger.error(f"打开文件：{event_json_file_path} 出现错误 {e}")

if __name__ == "__main__":
  utils.setup_logging(log_file = utils.convert_relativepath_to_abspath('../../../logs/event.log', __file__), level = logging.ERROR)
  logger = logging.getLogger("eventetl.tools.eventetl")

  file_path = utils.convert_relativepath_to_abspath("../../../library/temp/魏书·文帝纪.txt", __file__)
  parser = argparse.ArgumentParser()
  parser.add_argument(
    "file_path",
    type=str,
    default=file_path,
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
    "--line_step_count",
    type=int,
    default=3,
    help="Batch ETL line count. Defaults is 3."
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

  args = parser.parse_args()
  
  print(f"file_path: {args.file_path}")
  print(f"output_dir: {args.output_dir}")
  print(f"line_step_count: {args.line_step_count}")
  print(f"model_name: {args.model_name}")
  print(f"seed: {args.seed}")
  print(f"temperature: {args.temperature}")
  print(f"max_tokens: {args.max_tokens}")
  print(f"stream: {args.stream}")

  event_etl_from_file(args.file_path, args.output_dir,
    args.line_step_count,
    args.model_name, args.seed, args.temperature, args.max_tokens, args.stream)