import os
import json
import logging

from flask import Flask, Response, request, jsonify
from flask_compress import Compress
from flask_cors import CORS

from typing import Union, List, Dict, Tuple
from enum import Enum

import ollama

from utils import setup_logging, convert_relativepath_to_abspath
from eventetl import EventETL

logger = logging.getLogger("server")

_MODEL_NAME_ = 'llama3.3' # 27b 太大，三分钟一个字 delete
_MODEL_NAME_ = 'glm4:9b-text-q8_0' # 不理解指令 delete
_MODEL_NAME_ = 'gemma2:9b-text-q8_0' # 不理解指令 delete，text的模型不是指令模型
_MODEL_NAME_ = 'mistral-nemo:latest' # json输出中{不匹配，有的时候会缺失}，经过提示，能修改回来。
_MODEL_NAME_ = 'olmo2:13b' # 13b 不能遵循指令输出格式，比较差。

_MODEL_NAME_ = 'qwen2.5:7b' # ok
_MODEL_NAME_ = 'qwen2.5:7b-instruct-q8_0' # ok
_MODEL_NAME_ = 'qwen2.5:14b' # 时间提取问题比较多
_MODEL_NAME_ = 'gemma2' # 9b 无法解决json输出中用 ” 符号代替 " 的问题，多次提示，怎么提示，均无法解决。
_MODEL_NAME_ = 'gemma2:27b' # 有些中文字，不识别，导致输出为字母，应该是中文字库太少的问题。
_MODEL_NAME_ = 'phi4' # 14b 
_MODEL_NAME_ = 'deepseek-r1:32b'

# 实例化并命名为 app 实例
app = Flask(__name__)
CORS(app)
Compress(app)

# 正确格式化为SSE数据块
def make_sse_data(data: str):
  return "data: " + data.replace('\n', '&#10;').replace(' ', '&nbsp;') + "\n\n"

@app.route('/event/assistant', methods=['GET'])
def assistant():
  prompt = request.args.get('p')
  if prompt is None or prompt.strip() == "":
    return jsonify(error = "p parameter is missing."), 400  # 使用HTTP状态码400表示错误请求
  
  logger.info(f"/event/assistant, p: {prompt}.")
  
  def generate():
    try:
      for chunk in app.ollama_client.generate(model = _MODEL_NAME_, prompt = prompt, stream = True):
        yield make_sse_data(chunk['response'])
      # 在流结束时发送一个结束标志
      yield make_sse_data("[DONE]")
    except Exception as e:
      logger.error(e)
      info = f"LLM inference error, {e}"
      yield make_sse_data(info)

  return Response(generate(), content_type = "text/event-stream")

def process_result_data(data: Dict):
  json_str = json.dumps(data, ensure_ascii = False)
  return make_sse_data(json_str)

@app.route('/event/etl', methods=['GET'])
def etl():
  """
  This route handles the ETL (Extract, Transform, Load) process for events.
  It takes a prompt as a query parameter 'p' and processes it using the EventETL class.
  The response is streamed back to the client as Server-Sent Events (SSE).
  """
  prompt = request.args.get('p')
  if prompt is None or prompt.strip() == "":
    return jsonify(error = "p parameter is missing or empty."), 400  # 使用HTTP状态码400表示错误请求
  
  logger.info(f"/event/etl, p: {prompt}.")

  def generate():
    try:
      for chunk in app.eetl.event_etl_from_lines(prompt, has_return = True, headlines = None):
        # 通过app.eetl.callback = process_result_data已经将每个数据块格式化为SSE数据块
        # 因此这里不需要再次格式化
        yield chunk
      # 在流结束时发送一个结束标志
      yield make_sse_data("[DONE]")
    except Exception as e:
      logger.error(e)
  
  return Response(generate(), content_type = "text/event-stream")

def initialize():
  setup_logging(log_file = convert_relativepath_to_abspath('../../logs/event_server.log', __file__), level = logging.INFO)

  # 禁止对jsonify输出json时按照键进行排序
  app.json.ensure_ascii = False
  #app.config['JSON_SORT_KEYS'] = False
  # 禁止中文转义
  app.json.sort_keys = False
  #app.config['JSON_AS_ASCII'] = False  

  # 使用 Ollama Python 客户端
  app.ollama_client = ollama.Client()
  app.eetl = EventETL(config={
      'model_name': _MODEL_NAME_,
      'model_options': {
        "seed": 32,
        "temperature": 0.75,
        "num_ctx": 8000,
      },
      'stream': True,
    })

  print(app.eetl.callback)
  app.eetl.callback = process_result_data
  print(app.eetl.callback)

# 定义 main 入口
if __name__ == "__main__":
  initialize()
  # 调用 run 方法，设定端口号，启动服务
  app.run(port = 6080, host = "0.0.0.0", debug = True)