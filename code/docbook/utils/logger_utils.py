import logging

def setup_logging(log_file = 'app.log', level = logging.DEBUG):
  """
  设置日志记录，输出到控制台和文件，同时设置日志级别。

  :param log_file: 日志文件的路径
  :param level: 日志级别
  """
  # 创建一个 Logger 对象
  logger = logging.getLogger()
  logger.setLevel(level)

  # 创建控制台处理器
  console_handler = logging.StreamHandler()
  console_handler.setLevel(level)
  console_formatter = logging.Formatter('%(asctime)s - %(name)s - %(funcName)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
  console_handler.setFormatter(console_formatter)

  # 创建文件处理器
  file_handler = logging.FileHandler(log_file)
  file_handler.setLevel(level)
  file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(funcName)s - %(levelname)s - %(message)s')
  file_handler.setFormatter(file_formatter)

  # 将处理器添加到 Logger 对象
  logger.addHandler(console_handler)
  logger.addHandler(file_handler)
