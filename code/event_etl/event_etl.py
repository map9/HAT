"""
This script creates a ETL(Extract, transform, and load) application by used LLM+AutoGen.
used most LLMs through Ollama OpenAI liked interfaces and library. 
some LLMs can't used by Ollama, used by it's own API and library.

pip install fire
pip install ollama

# - modify the prompt again and again, add more and more strict constraints, and limit the illusion and error output of llm.
# - fixing seed to debugging prompt.
# - used one model for extractor, another model from editor, will getting a worstest result.
# - after many test cases, the Editor always give useless or error suggestions.
# - modify the editor used Code Executor
# - remove autogen support instead by ollama api
"""

import os
import logging
import fire
import re
import json

from termcolor import colored
import ollama

import re
import json
from typing import List

logger = logging.getLogger('event_etl_logger')

def initial_logger(level):
  logger.setLevel(level)

  # 创建一个文件处理器并设置级别为DEBUG
  file_handler = logging.FileHandler('event_etl.log')
  file_handler.setLevel(level)

  # 创建一个日志格式器并将其添加到处理器
  formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
  file_handler.setFormatter(formatter)

  # 将文件处理器添加到日志器
  logger.addHandler(file_handler)


def decode_json_block(json_block: str) -> tuple[bool, str, dict]:
  # 正则表达式匹配代码块 ``` 中的内容
  pattern = r'```json\s*([\s\S]+?)\s*```'
  matches = re.findall(pattern, json_block)

  ok = True
  message = ""
  json_result = None
  if len(matches) > 1:
    ok = False
    message = "输出内容有多个json代码块，最多只能输出一个json代码块。"
  elif len(matches) == 0:
    ok = False
    message = "输出内容没有json代码块，必须要输出一个json代码块。"
  else:
    # 提取每个匹配的 JSON 数据
    try:
      json_result = json.loads(matches[0])
    except json.JSONDecodeError as e:
      ok = False
      message = "输出内容中的json代码块中的json代码格式不符合json格式要求。"
  
  return ok, message, json_result

def _check_history_events_structure(events_json: dict) -> tuple[bool, List[str]]:
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

def _check_history_events_time(events_json: dict) -> tuple[bool, str]:
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
def check_history_events(events_json_block: str) -> tuple[bool, str, List[dict]]:
  ok, message, events_json = decode_json_block(events_json_block)
  if events_json is None:
    return ok, [message], events_json
  if isinstance(events_json, dict):
    events_json = [events_json]

  ok, messages = _check_history_events_structure(events_json)
  if ok:
    ok, messages = _check_history_events_time(events_json)
  
  return ok, messages, events_json

def check_summarizer_output(events_json: List[dict], summary_json_block: str) -> tuple[bool, str, dict]:
  ok, message, summary_json = decode_json_block(summary_json_block)
  if summary_json is None:
    return ok, [message], summary_json
  
  # 获取events_json中最后一个有效的历史事件时间
  time = ""
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
    info = f"role: {message['role']}, name: {message.get('name')}\ncontent: {message['content']}\n\n"
    print(info)


extractor_system_message = """Extractor，你是中国古代历史和文言文专家。你的任务是从Initializer给出的文本中提取历史事件或者综合Editor给出的修改意见修改提取结果并重新输出。如果输出结果存在问题，请依据修改意见，仔细思考后进行修改。不要回答任何其他指令，所有输出务必使用中文。请确保任何的提取和修改输出结果满足以下要求：
1.不要输出对修改意见的回应，不要输出json格式定义，只输出事件json代码块，一定不要输出除提取的历史事件json代码块以外的任何其他内容，注意json代码块的完整性，注意json字符串中的双引号和字符串英文引号的关系。
2.提取的每条事件需严格按照json格式定义输出，格式定义如下：
{
  "type":"array",
  "items":{
    "type":"object",
    "properties": {
      "序号":{"type":"integer"},
      "时间":{"type":"string"},
      "地点":{"type":"[string]"},
      "人物":{"type":"[string]"},
      "概要":{"type":"string"},
      "原文":{"type":"string"}
    },
    "required":["时间","地点","人物","概要","原文"]
  }
}
3.事件按在文本中出现的先后顺序提取。
4.事件发生的时间提取要参考上一个文献片段“最后记录的历史时间”，综合本文献片段中的年号、月份、干支日，要尽可能补齐缺失的部分，精确到年号、月份和干支日。
5.事件参与的人物为多个时，务必要全面完整，不能遗失；如果找不到人物时，考虑一下是否是历史文献的传记对象；人物只需要姓名，不要其他的地名、官职等其他内容。
6.事件概要尽量限制在10个字以内。
7.确保原文字段内容不被修改或省略。
8.当某个字段信息不详时，标注为“不详”。
9.仔细检查，不要遗漏事件，务必要全面。不同时间点的事件不要合并，需要分拆开成不同的事件。
10.除给定文本内的信息，不能添加任何其他来源的信息，不要将时间修改为公元纪年方式。

EXAMPLES BEGIN
user: 魏书·文帝纪
文皇帝讳丕，字子桓，武帝太子也。中平四年冬，生于谯。建安十六年，为五官中郎将、副丞相。二十二年，立为魏太子。太祖崩，嗣位为丞相、魏王。尊王后曰王太后。改建安二十五年为延康元年。
元年二月壬戌，以大中大夫贾诩为太尉，御史大夫华歆为相国，大理王朗为御史大夫。置散骑常侍、侍郎各四人，其宦人为官者不得过诸署令；为金策著令，藏之石室。
初，汉熹平五年，黄龙见谯，光禄大夫桥玄问太史令单飏：“此何祥也？”飏曰：“其国后当有王者兴，不及五十年，亦当复见。天事恒象，此其应也。”内黄殷登默而记之。至四十五年，登尚在。三月，黄龙见谯，登闻之曰：“单飏之言，其验兹乎！”
已卯，以前将军夏侯惇为大将军。濊貊、扶馀单于、焉耆、于阗王皆各遣使奉献。
assistant: 
```json
[
  {
    "序号":1,
    "时间":"中平四年冬",
    "地点":["谯"],
    "人物":["丕"],
    "概要":"出生",
    "原文":"文皇帝讳丕，字子桓，武帝太子也。中平四年冬，生于谯。"
  },
  {
    "序号":2,
    "时间":"建安十六年",
    "地点":["不详"],
    "人物":["丕"],
    "概要":"任职",
    "原文":"建安十六年，为五官中郎将、副丞相。"
  },
  {
    "序号":3,
    "时间":"建安二十二年",
    "地点":["不详"],
    "人物":["丕"],
    "概要":"册立",
    "原文":"二十二年，立为魏太子。"
  },
  {
    "序号":4,
    "时间":"不详",
    "地点":["不详"],
    "人物":["丕"],
    "概要":"嗣位",
    "原文":"太祖崩，嗣位为丞相、魏王。"
  },
  {
    "序号":5,
    "时间":"延康元年二月壬戌",
    "地点":["不详"],
    "人物":["贾诩","华歆","王朗"],
    "概要":"任职",
    "原文":"元年二月壬戌，以大中大夫贾诩为太尉，御史大夫华歆为相国，大理王朗为御史大夫。"
  },
  {
    "序号":6,
    "时间":"汉熹平五年",
    "地点":["谯"],
    "人物":["桥玄","单飏"],
    "概要":"黄龙出现",
    "原文":"初，汉熹平五年，黄龙见谯，光禄大夫桥玄问太史令单飏：“此何祥也？”"
  },
  {
    "序号":7,
    "时间":"汉熹平五年",
    "地点":["不详"],
    "人物":["单飏"],
    "概要":"占卜",
    "原文":"飏曰：“其国后当有王者兴，不及五十年，亦当复见。天事恒象，此其应也。”"
  },
  {
    "序号":8,
    "时间":"延康元年三月",
    "地点":["谯"],
    "人物":["殷登"],
    "概要":"黄龙出现",
    "原文":"三月，黄龙见谯，登闻之曰：“单飏之言，其验兹乎！”"
  },
  {
    "序号":9,
    "时间":"延康元年三月已卯",
    "地点":["不详"],
    "人物":["夏侯惇"],
    "概要":"任职",
    "原文":"已卯，以前将军夏侯惇为大将军。"
  },
  {
    "序号":10,
    "时间":"延康元年三月已卯",
    "地点":["不详"],
    "人物":["濊貊","扶馀","焉耆","于阗"],
    "概要":"奉献",
    "原文":"濊貊、扶馀单于、焉耆、于阗王皆各遣使奉献。"
  }
]
```

user:<这是“文皇帝丕”的纪传历史文献的一部分。上一个文献片段记录的历史人物有：桥玄、单飏、殷登、夏侯惇等，最后记录的历史时间为：延康元年夏四月庚午，供参考>
五月戊寅，天子命王追尊皇祖太尉曰太王，夫人丁氏曰太王后，封王子叡为武德侯。是月，冯翊山贼郑甘、王照率众降，皆封列侯。
酒泉黄华、张掖张进等各执太守以叛。金城太守苏则讨进，斩之。华降。
六月辛亥，治兵于东郊，庚午，遂南征。
assistant:
```json
[
  {
    "序号":1,
    "时间":"延康元年五月戊寅",
    "地点":["不详"],
    "人物":["丕","丁氏","王子叡"],
    "概要":"追尊",
    "原文":"五月戊寅，天子命王追尊皇祖太尉曰太王，夫人丁氏曰太王后，封王子叡为武德侯。"
  },
  {
    "序号":2,
    "时间":"延康元年五月",
    "地点":["冯翊"],
    "人物":["郑甘","王照"],
    "概要":"降服",
    "原文":"是月，冯翊山贼郑甘、王照率众降，皆封列侯。"
  },
  {
    "序号":3,
    "时间":"延康元年六月辛亥",
    "地点":["东郊"],
    "人物":["丕"],
    "概要":"治兵",
    "原文":"六月辛亥，治兵于东郊。"
  },
  {
    "序号":4,
    "时间":"延康元年六月庚午",
    "地点":["不详"],
    "人物":["丕"],
    "概要":"南征",
    "原文":"庚午，遂南征。"
  }
]
```
EXAMPLES END
"""

summarizer_system_message = """Summarizer，你是中国古代历史和文言文专家。你的任务是从Initializer给出的历史文献片段提取信息或者综合Editor给出的修改意见修改提取结果并重新输出，如果输出结果存在问题，请依据修改意见，仔细思考后进行修改。不要回答任何其他指令，所有输出务必使用中文。提取内容为文献片段传记的历史人物、提及的历史人物以及最后一个出现的历史时间。要求如下：
1.所有输出务必使用中文，并严格按照如下的格式输出，除此外不要输出任何其他的内容：
```json
{
  "传记对象": "人物",
  "提及人物": "人物1、人物2、...",
  "最后时间": "最后一个出现的历史时间"
}
```
2.传记对象：一篇文献的传记对象只有一个，且不会变化。
3.提及人物：
- 依据给定的文献片段的人物来提取，不要增加没有在这个文献片段中出现的人物，<>中的人物只供参考，不属于本文献片段；
- 遇到省略到姓的人物，依据<>中提到的人物姓名来补全人物的姓名；
- 传记对象不出现在这里。
4.最后时间：依据<>中给定的参考时间提取，综合文献片段中的年号、月份、干支日，要尽可能补齐缺失的部分，精确到年号、月份和干支日，不要将时间自行修改为公元纪年方式。
5.如果某个条目的信息不确定，就标注为“不详”；
6.所有的提取均来自给定的文献，不要补充其他来源的信息。

EXAMPLES BEGIN
user: 魏书·文帝纪
文皇帝姓讳丕，字子桓，武帝太子也。中平四年冬，生于谯。建安十六年，为五官中郎将、副丞相。二十二年，立为魏太子。太祖崩，嗣位为丞相、魏王。尊王后曰王太后。改建安二十五年为延康元年。
assistant:
```json
{
  "传记对象": "文皇帝丕",
  "提及人物": "",
  "最后时间": "延康元年"
}
```

user: <这是“太祖武皇帝曹操”的纪传历史文献的一部分。上一个文献片段记录的历史人物有：边章、韩遂、何进、董卓、袁术、袁绍等，最后记录的历史时间为：中平六年冬十二月，供参考。>
初平元年春正月，后将军袁术、冀州牧韩馥、豫州刺史孔伷、兖州刺史刘岱同时俱起兵，众各数万，推绍为盟主。
assistant:
```json
{
  "传记对象": "太祖武皇帝曹操",
  "提及人物": "袁术、韩馥、孔伷、刘岱、袁绍",
  "最后时间": "初平元年春正月"
}
```

user: <这是“太祖武皇帝曹操”的纪传历史文献的一部分。上一个文献片段记录的历史人物有：董卓、袁术等，最后记录的历史时间为：初平二年春正月，供参考。>
秋七月，袁绍胁韩馥，取冀州。
黑山贼于毒、白绕、眭固等(眭，申随反)。十余万众略魏郡、东郡，王肱不能御，太祖引兵入东郡，击白绕于濮阳，破之。袁绍因表太祖为东郡太守，治东武阳。
三年春，太祖军顿丘，毒等攻东武阳。太祖乃引兵西入山，攻毒等本屯。毒闻之，弃武阳还。太祖要击眭固，又击匈奴於夫罗於内黄，皆大破之。
夏四月，司徒王允与吕布共杀卓。卓将李傕、郭汜等杀允攻布，布败，东出武关。傕等擅朝政。
青州黄巾众百万入兖州，杀任城相郑遂，转入东平。遂进兵击黄巾于寿张东。追黄巾至济北。乞降。冬，受降卒三十余万，男女百余万口，收其精锐者，号为青州兵。
assistant:
```json
{
  "传记对象": "太祖武皇帝曹操",
  "提及人物": "袁绍、韩馥、于毒、白绕、眭固、王肱、曹操、王允、吕布、董卓、李傕、郭汜、郑遂",
  "最后时间": "初平三年冬"
}
```

user: <这是“文皇帝丕”的纪传历史文献的一部分。上一个文献片段记录的历史人物有：文皇帝丕, 贾诩, 华歆, 王朗等，最后记录的历史时间为：延康元年二月壬戌，供参考>
初，汉熹平五年，黄龙见谯，光禄大夫桥玄问太史令单飏：“此何祥也？”飏曰：“其国后当有王者兴，不及五十年，亦当复见。天事恒象，此其应也。”内黄殷登默而记之。至四十五年，登尚在。三月，黄龙见谯，登闻之曰：“单飏之言，其验兹乎！”
已卯，以前将军夏侯惇为大将军。濊貊、扶馀单于、焉耆、于阗王皆各遣使奉献。
夏四月丁巳，饶安县言白雉见。庚午，大将军夏侯惇薨。
assistant:
```json
{
  "传记对象": "文皇帝丕",
  "提及人物": "桥玄、单飏、殷登、夏侯惇",
  "最后时间": "延康元年夏四月庚午"
}
```
EXAMPLES END
"""

def output_messages(messages):
  for message in messages:
    info = f"role: {message['role']}, name: {message.get('name')}\ncontent: {message['content']}"
    logger.debug(info)

def event_etl_from_file(file_path = "/Users/sunyafu/zebra/docbook/code/event_etl/魏书·文帝纪.txt",
                        event_json_file_path = None,
                        line_step_count = 3,
                        model_name = "gemma2", seed = 32, temperature = 0.75,
                        max_tokens = 8000, use_stream = True,
                        logging_level = logging.ERROR, silent = False):
  initial_logger(logging_level)

  options = {
    "seed": seed,
    #"num_predict": 100,
    #"top_p": 0.9,
    #"top_k": 20,
    "temperature": temperature,
    #"repeat_penalty": 1.2,
    "num_ctx": max_tokens,
    #"num_thread": 8
  }
  
  extractor = ollama.Client()
  summarizer = ollama.Client()
  
  # 要处理的历史文献片段
  lines = ""
  # 上一个历史文献片段获得提取的关键信息
  last_context_json = None

  # 读取待处理的历史文献文件
  try:
    with open(file_path, 'r') as file:
      lines = file.readlines()
  except FileNotFoundError:
    logger.error(f"文件：{file_path} 不存在。")

  # 处理历史文献片段的段落步长
  if line_step_count == -1:
    line_step_count = len(lines)

  # 将历史文献文件切片，分片提取历史事件信息，并合并历史事件信息
  last_time = ""
  total_events_json = []
  for index in range(0, len(lines), line_step_count):
    info = f"=== No: {(index // line_step_count) + 1}/{(len(lines) // line_step_count) + 1} ==="
    print(colored(info, "blue"), end = "\n\n")
    logger.info(info)

    # 1. 将历史文献按照line_step_count进行切片
    current_lines = "".join(lines[index : index + line_step_count])
    if len(current_lines) == 0:
      break

    # 2. 融合上一个历史文献片段中的关键信息{传记对象, 提及人物, 最后时间}到将当前历史文献片段中，以更好的提取历史事件。
    #    主要是文言文的文献，会结合上文信息，省略人物的姓，时间中的年号、第几年、月份等。
    #    如果没有上文信息，提取的历史事件会不正确。
    message = ""
    editor_ok_message = "通过检查，一切正常。"
    editor_redo_message = "请依据修改意见，仔细检查，重新提取结果。"
    editor_giveup_message = "与上次一样的修改意见，不再进行修改。"
    if last_context_json is not None:
      message = f"<这是“{last_context_json['传记对象']}”的纪传历史文献的一部分"
      if last_context_json['提及人物'].find('不详') == -1:
        message = message + f"。上一个文献片段记录的历史人物有：{last_context_json['提及人物']}等"
      if last_context_json['最后时间'].find('不详') == -1:
        last_time = last_context_json['最后时间']
      if len(last_time) > 0:
        message = message + f"，最后记录的历史时间为：{last_time}，供参考"  
      message = message + f">\n"
    message = message + current_lines

    # 3. 提取历史文献切片中的历史事件，并进行反复修改，直到没有修改问题
    is_ok = False
    last_check_info = []
    messages = [{"content": extractor_system_message, "role": "system", "name": "Extractor"}]
    messages.append({"content": message, "role": "user", "name": "Initializer"})
    while is_ok == False:
      # initializer -> extractor
      if len(messages) == 2:
        print(colored("initializer -> extractor", "blue"))
        print(colored(f"{message}", "green"))
        logger.info(f"initializer -> extractor\n{message}")
      print(colored("extractor -> editor", "blue"))
      logger.info(f"extractor -> editor")
      response = extractor.chat(model = model_name, messages = messages, stream = use_stream, options = options)
      events_json_block = ""
      if response:
        if use_stream:
          for chunk in response:
            events_json_block += chunk['message']['content']
            print(colored(f"{chunk['message']['content']}", "green"), end = "", flush = True)
          print("\n")
        else:
          events_json_block = response['message']['content']
          print(colored(f"{events_json_block}", "green"))
        logger.info(f"{events_json_block}")
      else:
        logger.error(f"LLM inference error, status code: {response.status_code}")

      # editor -> extractor 
      print(colored("editor -> extractor", "blue"))
      logger.info("editor -> extractor")
      is_ok, check_info, events_json = check_history_events(events_json_block)
      if is_ok:
        print(colored(editor_ok_message, "green"), end = "\n\n")
        logger.info(f"{editor_ok_message}")
      else:
        print(colored('\n'.join(check_info) + '\n' + editor_redo_message, "red"), end = "\n\n")
        logger.info('\n'.join(check_info) + '\n' + editor_redo_message)
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
          if silent == False:
            output_messages(messages)
        # 如果修改意见和上一次一样，不再进行修改。
        else:
          print(colored("extractor -> editor", "blue"))
          logger.info("extractor -> editor")
          print(colored(editor_giveup_message, "red"), end = "\n\n")
          logger.info(editor_giveup_message)
          is_ok = True
      last_check_info = check_info

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
    last_check_info = []
    messages = [{"content": summarizer_system_message, "role": "system", "name": "Summarizer"}]
    messages.append({"content": message, "role": "user", "name": "Initializer"})
    while is_ok == False:
      # initializer -> summarizer
      if len(messages) == 2:
        print(colored("initializer -> summarizer", "blue"))
        logger.info("initializer -> summarizer")
        print(colored(f"{message}", "green"))
        logger.info(f"{message}")
      print(colored("summarizer -> editor", "blue"))
      logger.info("summarizer -> editor")
      response = summarizer.chat(model = model_name, messages = messages, stream = use_stream, options = options)
      summary_json_block = ""
      if response:
        if use_stream:
          for chunk in response:
            summary_json_block += chunk['message']['content']
            print(colored(f"{chunk['message']['content']}", "green"), end = "", flush = True)
          print("\n")
        else:
          summary_json_block = response['message']['content']
          print(colored(f"{summary_json_block}", "green"))
        logger.info(summary_json_block)
      else:
        logger.error(f"LLM inference error, status code: {response.status_code}")
      
      # editor -> summarizer 
      print(colored("editor -> summarizer", "blue"))
      logger.info("editor -> summarizer")
      is_ok, check_info, summary_json = check_summarizer_output(events_json, summary_json_block)
      if is_ok:
        print(colored(editor_ok_message, "green"), end = "\n\n")
        logger.info(editor_ok_message)
      else:
        print(colored('\n'.join(check_info) + '\n' + editor_redo_message, "red"), end = "\n\n")
        logger.info('\n'.join(check_info) + '\n' + editor_redo_message)
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
          if silent == False:
            output_messages(messages)
        # 如果修改意见和上一次一样，不再进行修改。
        else:
          print(colored("summarizer -> editor", "blue"))
          logger.info("summarizer -> editor")
          print(colored(editor_giveup_message, "red"), end = "\n\n")
          logger.info(editor_giveup_message)
          is_ok = True
      last_check_info = check_info

    last_context_json = summary_json

  # 6. 保存所有提取的历史事件到event_json_file_path中
  if event_json_file_path is None:
    event_json_file_path = os.path.splitext(file_path)[0] + f"_{model_name}" + ".json"
  try:
    with open(event_json_file_path, 'w') as file:
      file.write(json.dumps(total_events_json, ensure_ascii = False))
  except IOError as e:
    logger.error(f"打开文件：{event_json_file_path} 出现错误 {e}")

if __name__ == "__main__":
  fire.Fire(event_etl_from_file)