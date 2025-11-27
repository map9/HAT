"""
This script creates a ETL(Extract, transform, and load) application by used Ollama.
"""

import os
import logging
import re
import json
import pkg_resources

from typing import Union, List, Dict, Tuple
from enum import Enum

import ollama

logger = logging.getLogger('eventetl.core.logger')

def decode_json_block(json_block: str) -> Tuple[bool, str, Dict]:
  # 正则表达式匹配代码块 ``` 中的内容
  pattern = r'```json\s*([\s\S]+?)\s*```'
  matches = re.findall(pattern, json_block)

  ok = True
  message = ""
  json_result = None
  if len(matches) > 1:
    ok = False
    message = "输出内容有多个json代码块，最多只能输出一个json代码块。"
    return ok, message, json_result

  # 提取每个匹配的 JSON 数据
  try:
    if len(matches) == 0:
      json_result = json.loads(json_block)
    else:
      json_result = json.loads(matches[0])
  except json.JSONDecodeError as e:
    if len(matches) == 0:
      ok = False
      message = "输出内容没有json代码块，必须要输出一个json代码块。"
      return ok, message, json_result
    ok = False
    message = f"输出内容中的json代码块中的json代码格式不符合json格式要求。错误为：\n{e}"
    lines = matches[0].splitlines()
    message += f"\nLine: {lines[e.lineno - 1]}\nColumn: {lines[e.lineno - 1][e.colno - 1]}"
  
  return ok, message, json_result

def _check_history_events_structure(events_json: Dict) -> Tuple[bool, List[str]]:
  ok = True
  messages = []

  keys = ['序号', '时间', '地点', '人物', '概要', '原文']
  for index, event in enumerate(events_json):
    message = ""
    for key in keys:
      if (key in event.keys()) == False:
        message += f", “{key}”" if len(message) > 0 else f"“{key}”"
    if len(message) > 0:
      ok = False
      no = event[keys[0]] if keys[0] in event.keys() else index + 1
      messages.append(f"序号：{no}，修改意见：补充缺失条目{message}。")
  return ok, messages

def _check_history_events_time(events_json: dict) -> Tuple[bool, str]:
  ok = True
  messages = []
  regex = re.compile(f"(元年|[一二三四五六七八九十]+年)?(春|夏|秋|冬)?(闰月)?(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月)?(甲子|乙丑|丙寅|丁卯|戊辰|己巳|庚午|辛未|壬申|癸酉|甲戌|乙亥|丙子|丁丑|戊寅|己卯|庚辰|辛巳|壬午|癸未|甲申|乙酉|丙戌|丁亥|戊子|己丑|庚寅|辛卯|壬辰|癸巳|甲午|乙未|丙申|丁酉|戊戌|己亥|庚子|辛丑|壬寅|癸卯|甲辰|乙巳|丙午|丁未|戊申|己酉|庚戌|辛亥|壬子|癸丑|甲寅|乙卯|丙辰|丁巳|戊午|己未|庚申|辛酉|壬戌|癸亥)?")
  for event in events_json:
    time = event['时间']
    origin_text = event['原文']
    origin_matches = re.findall(regex, origin_text)

    if time == "不详":
      # 检查原文
      for index, match in enumerate(origin_matches):
        year, season, leap, month, day =  match
        parts = [part for part in match if part]
        time = "".join(parts)
        if len(time) and (len(year) >= 1 or len(leap) >= 1 or len(month) >= 1 or len(day) >= 1):
          ok = False
          messages.append(f"序号：{event['序号']}，条目：'时间'，修改意见：可能存在明确的时间。")
          break
    else:
      # 检查时间是否是正常
      time_matches = re.findall(regex, time)
      has_time = False
      for match in time_matches:
        year, season, leap, month, day = match
        parts = [part for part in match if part]
        time = "".join(parts)
        if len(time):
          has_time = True
          # 避免只提取到[春夏秋冬]的信息，其他都没有，实际上提取的信息不是代表季节的[春夏秋冬]
          # 避免出现只有多少年，但是没有年号的情况
          if (len(year) == 0 and (len(leap) > 1 or len(month) > 1 or len(day) > 1)) or (len(year) > 0 and event['时间'].startswith(year)):
            ok = False
            logger.debug(f"year={year}, season={season}, leap={leap}, month={month}, day={day}")
            messages.append(f"序号：{event['序号']}，条目：'时间'，修改意见：结合上文，补充年号，注意年、月、日时间顺序。")
          # 避免有年和日，没有月
          if len(leap) == 0 and len(month) == 0 and len(day) > 1:
            ok = False
            messages.append(f"序号：{event['序号']}，条目：'时间'，修改意见：结合上文，补充月份，注意年、月、日时间顺序。")
      if has_time == False:
        ok = False
        messages.append(f"序号：{event['序号']}，条目：'时间'，修改意见：不是准确和正确的时间描述，如果找不到，标注为“不详“。")

  return ok, messages

# 检查历史事件内容是否符合约定的格式要求以及内容是否正确
def check_history_events(events_json_block: str) -> Tuple[bool, str, List[Dict]]:
  ok, message, events_json = decode_json_block(events_json_block)
  if events_json is None:
    return ok, [message], events_json
  if isinstance(events_json, dict):
    events_json = [events_json]

  ok, messages = _check_history_events_structure(events_json)
  ok1, messages1 = _check_history_events_time(events_json)
  if ok1 == False:
    messages.extend(messages1)
  
  return ok, messages, events_json

def check_summarizer_output(events_json: List[dict], summary_json_block: str) -> Tuple[bool, str, Dict]:
  ok, message, summary_json = decode_json_block(summary_json_block)
  if summary_json is None:
    return ok, [message], summary_json
  
  # 获取events_json中最后一个有效的历史事件时间
  time = ""
  if events_json is not None:
    for event in events_json:
      if event['时间'] == "不详":
        continue
      time = event['时间']
  
  ok = True
  messages = []
  # 检查events_json中的时间和summary_json中的最后时间是否一致
  if len(time) > 0 and (summary_json['最后时间'] == "不详" or summary_json['最后时间'] != time):
    ok = False
    messages.append(f"条目：'最后时间'，修改意见：检查一下是否是“{time}”。")

  return ok, messages, summary_json

def verify_two_check_output(last_messages, messages):
  if len(last_messages) == 0:
    return messages

  result = []
  for message in messages:
    has_same_message = False
    for last_message in last_messages:
      if message == last_message:
        has_same_message = True
        break
    if has_same_message == False:
      result.append(message)
  return result

def output_messages(messages):
  for message in messages:
    info = f"role: {message['role']}, name: {message.get('name')}\ncontent: {message['content']}"
    logger.debug(info)

def load_config_file(filename):
  try:
    # 使用 pkg_resources 访问打包的文件
    file_path = pkg_resources.resource_filename(__name__, f'data/{filename}')
    with open(file_path, 'r', encoding='utf-8') as file:
      return file.read()
  except FileNotFoundError:
    logger.error(f"{filename} file not found.")
    return ""

class EventETL():
  """
  事件提取对象。
  """

  def __init__(self, config: Dict = None, callback = None):
    self._config: Dict = {
      'model_name': 'gemma2',
      'model_options': {
        'seed': 32,
        #'num_predict': 100,
        #'top_p': 0.9,
        #'top_k': 20,
        'temperature': 0.75,
        #"repeat_penalty': 1.2,
        'num_ctx': 8000,
        #'num_thread': 8
      },
      'stream': True,
      'extractor_system_message': None,
      'summarizer_system_message': None,
      'line_step_count': -1,
      'max_piece_char_count': 500,
    }
    if config is not None:
      # Merge model_options separately to preserve defaults
      if 'model_options' in config:
        self._config['model_options'].update(config['model_options'])
        del config['model_options']
      # Update other top level config options
      for key, value in config.items():
        self._config[key] = value


    self._callback = callback
    self._extractor = ollama.Client()
    self._summarizer = ollama.Client()

    # Load system messages from files
    if self._config.get('extractor_system_message') is None:
      self._config['extractor_system_message'] = load_config_file('extractor_system_message.txt')
    if self._config.get('summarizer_system_message') is None:
      self._config['summarizer_system_message'] = load_config_file('summarizer_system_message.txt')

  @property
  def config(self) -> Dict:
    return self._config

  @config.setter
  def config(self, config: Dict):
    self._config = config

  @property
  def callback(self):
    return self._callback

  @callback.setter
  def callback(self, callback):
    self._callback = callback

  def output(self, sender: str, receiver: str, message: any, type: str = 'string', done: bool = True):
    data = {
      'sender': sender,
      'receiver': receiver,
      'type': type,
      'message': message,
      'done': done
    }

    if (not self._callback):
      return data
    else:
      return self._callback(data)

  def event_etl_from_lines(self, lines: Union[str, List], has_return: bool = True, headlines: str = None):
    line_step_count = self._config['line_step_count']
    max_piece_char_count = self._config['max_piece_char_count']

    if (lines is None):
      lines = ""

    if (isinstance(lines, List)):
      lines = ''.join(lines) if has_return else '\n'.join(lines)
    lines = lines.split('\n')
    # 清除空格行、没有内容的行
    lines = [line for line in lines if line.strip()]

    # 上一个历史文献片段获得提取的关键信息
    last_context_json = None
    # 将历史文献文件切片，分片提取历史事件信息，并合并历史事件信息
    last_time = ""
    total_events_json = []

    # 处理历史文献片段的段落步长
    # 如果line_step_count为None，则默认为要处理的文献片段为整个文献。
    if line_step_count is None:
      line_step_count = len(lines)

    start_line_no = 0
    while start_line_no < len(lines):
      # 1. 将历史文献按照line_step_count进行切片
      end_line_no = start_line_no
      # 如果line_step_count为-1，则每次处理的文献片段的行数的总的字符数接近max_piece_count。
      if line_step_count == -1:
        piece_char_count = 0
        while piece_char_count < max_piece_char_count and end_line_no < len(lines):
          piece_char_count = piece_char_count + len(lines[end_line_no])
          end_line_no += 1
        if piece_char_count != 0 and piece_char_count > max_piece_char_count:
          end_line_no = end_line_no - 1
        if end_line_no == start_line_no:
          end_line_no = end_line_no + 1
      else:
        end_line_no = start_line_no + line_step_count
        if end_line_no > len(lines):
          end_line_no = len(lines)

      current_lines = "\n".join(lines[start_line_no : end_line_no])
      if len(current_lines) == 0:
        print(f"current_lines: {current_lines} is empty")
        break

      info = f"*** No: {start_line_no + 1}~{end_line_no}/{len(lines)} ***"
      logger.info(info)
      yield self.output("loop", "loop", {
          'startLineNo': start_line_no + 1,
          'endLineNo': end_line_no,
          'lineCount': len(lines),
        }, type="json")

      # 2. 融合上一个历史文献片段中的关键信息{传记对象, 提及人物, 最后时间}到将当前历史文献片段中，以更好的提取历史事件。
      #    主要是文言文的文献，会结合上文信息，省略人物的姓，时间中的年号、第几年、月份等。
      #    如果没有上文信息，提取的历史事件会不正确。
      editor_ok_message = "通过检查，一切正常。"
      editor_redo_message = "请依据修改意见，仔细检查，重新提取结果。"
      editor_giveup_message = "与上次一样的修改意见，不再进行修改。"
      message = headlines if headlines is not None else ""
      if last_context_json is not None:
        message = message + f"<上一个文献片段总结"
        if last_context_json['提及人物'].find('不详') == -1:
          message = message + f"，提及人物有：{last_context_json['提及人物']}等"
        if last_context_json['最后时间'].find('不详') == -1:
          last_time = last_context_json['最后时间']
        if len(last_time) > 0:
          message = message + f"，最后记录的历史时间：{last_time}"  
        message = message + f">\n"
      message = message + current_lines

      # 3. 提取历史文献切片中的历史事件，并进行反复修改，直到没有修改问题
      is_ok = False
      try_count = 0
      last_check_info = []
      last_events_json = None
      messages = [{"content": self._config['extractor_system_message'], "role": "system", "name": "Extractor"}]
      messages.append({"content": message, "role": "user", "name": "Initializer"})
      while is_ok == False and try_count <= 3:
        # initializer -> extractor
        if len(messages) == 2:
          logger.info(f"initializer -> extractor\n{message}")
          yield self.output("initializer", "extractor", message)

        logger.info(f"extractor -> editor")
        try:
          response = self._extractor.chat(model = self._config['model_name'], messages = messages, stream = self._config['stream'], options = self._config['model_options'])
          events_json_block = ""
          if self._config['stream']:
            for chunk in response:
              events_json_block += chunk['message']['content']
              yield self.output("extractor", "editor", chunk['message']['content'], done=False)
            yield self.output("extractor", "editor", '')
          else:
            events_json_block = response['message']['content']
            yield self.output("extractor", "editor", events_json_block, type="json")
          logger.info(f"{events_json_block}")
        except Exception as e:
          info = f"LLM inference error, {e}"
          logger.error(info)
          yield self.output("error", "error", info)
          raise Exception(e)

        # editor -> extractor 
        is_ok, check_info, events_json = check_history_events(events_json_block)
        if is_ok:
          logger.info(f"{editor_ok_message}")
          yield self.output("editor", "extractor", editor_ok_message)
          # 假设LLM只修改了有问题的历史事件，则按照序号对原来提取的历史事件进行修改
          if last_events_json is not None:
            for event in events_json:
              num = event['序号']
              if num >= len(last_events_json):
                last_events_json[int(event['序号'])] = event
              else:
                last_events_json.append(event)
            events_json = last_events_json
        else:
          info = '\n'.join(check_info) + '\n' + editor_redo_message
          logger.info(info)
          yield self.output("editor", "extractor", info)
          if events_json is not None:
            last_events_json = events_json
        if is_ok == False:
          verify_check_info = verify_two_check_output(last_check_info, check_info)
          # 如果修改意见和上次不一样，或者extractor没有正确的输出json块，重新开始提取
          if len(verify_check_info) > 0 or events_json is None:
            del messages[2:]
            if events_json is not None:
              messages.append({"content": events_json_block, "role": "user", "name": "Extractor"})
              messages.append({"content": '\n'.join(verify_check_info) + '\n' + editor_redo_message, "role": "user", "name": "Editor"})
            else:
              messages.append({"content": events_json_block, "role": "user", "name": "Extractor"})
              messages.append({"content": '\n'.join(check_info) + '\n' + editor_redo_message, "role": "user", "name": "Editor"})
            #if silent == False:
            #  output_messages(messages)
            try_count += 1
          # 如果修改意见和上一次一样，不再进行修改。
          else:
            logger.info("extractor -> editor")
            logger.info(editor_giveup_message)
            yield self.output("editor", "extractor", editor_giveup_message)
            is_ok = True
        last_check_info = check_info

      if (is_ok == False):
        yield self.output("extractor", "editor", 'Failed to ETL this piece.')

      # 4. 合并本次历史文献切片中提取到的历史事件
      if events_json is not None:
        count = len(total_events_json) + 1
        for event in events_json:
          event['序号'] = count
          total_events_json.append(event)
          count = count + 1
      #print(json.dumps(total_events_json, ensure_ascii=False))

      # 5. 提取历史文献切片中的关键信息{传记对象, 提及人物, 最后时间}，并进行反复修改，直到没有修改问题
      is_ok = False
      try_count = 0
      last_check_info = []
      messages = [{"content": self._config['summarizer_system_message'], "role": "system", "name": "Summarizer"}]
      messages.append({"content": message, "role": "user", "name": "Initializer"})
      while is_ok == False and try_count <= 3:
        # initializer -> summarizer
        if len(messages) == 2:
          logger.info("initializer -> summarizer")
          logger.info(f"{message}")
          yield self.output("initializer", "summarizer", message)

        logger.info("summarizer -> editor")
        # chat with ollama LLM
        try:
          response = self._summarizer.chat(model = self._config['model_name'], messages = messages, stream = self._config['stream'], options = self._config['model_options'])
          summary_json_block = ""
          if self._config['stream']:
            for chunk in response:
              summary_json_block += chunk['message']['content']
              yield self.output("summarizer", "editor", chunk['message']['content'], done=False)
            yield self.output("summarizer", "editor", '')
          else:
            summary_json_block = response['message']['content']
            yield self.output("summarizer", "editor", summary_json_block, type="json", done=True)
          logger.info(summary_json_block)
        except Exception as e:
          info = f"LLM inference error, {e}"
          logger.error(info)
          yield self.output("error", "error", info)
          raise Exception(e)
        
        # editor -> summarizer 
        logger.info("editor -> summarizer")
        is_ok, check_info, summary_json = check_summarizer_output(events_json, summary_json_block)
        if is_ok:
          logger.info(editor_ok_message)
          yield self.output("editor", "summarizer", editor_ok_message)
        else:
          info = '\n'.join(check_info) + '\n' + editor_redo_message
          logger.info(info)
          yield self.output("editor", "summarizer", info)
        if is_ok == False:
          verify_check_info = verify_two_check_output(last_check_info, check_info)
          # 如果修改意见和上次不一样，或者summarizer没有正确的输出json块，重新开始提取
          if len(verify_check_info) > 0 or summary_json is None:
            del messages[2:]
            if summary_json is not None:
              messages.append({"content": summary_json_block, "role": "user", "name": "Summarizer"})
              messages.append({"content": '\n'.join(verify_check_info) + '\n' + editor_redo_message, "role": "user", "name": "Editor"})
            else:
              messages.append({"content": events_json_block, "role": "user", "name": "Summarizer"})
              messages.append({"content": '\n'.join(check_info) + '\n' + editor_redo_message, "role": "user", "name": "Editor"})
            #if silent == False:
            #  output_messages(messages)
            try_count += 1
          # 如果修改意见和上一次一样，不再进行修改。
          else:
            logger.info("summarizer -> editor")
            logger.info(editor_giveup_message)
            yield self.output("summarizer", "editor", editor_giveup_message)
            is_ok = True
        last_check_info = check_info

      if (is_ok == False):
        yield self.output("summarizer", "editor", 'Failed to Summary this piece.')
      last_context_json = summary_json
      start_line_no = end_line_no

    # 6. 保存所有提取的历史事件到event_json_file_path中
    yield self.output("end", "end", total_events_json, type="json")