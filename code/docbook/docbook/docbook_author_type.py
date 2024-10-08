"""
docbook_author_type.py

docbook的贡献者/著作者在书籍中的身份。可归并为几个大类：
  - 著，主要由自己写出来的；
  - 辑，通过收集材料汇总编辑出来的；
  - 注，给已有的书籍进行注释、批注、音义；
  - 译，将已有的书籍翻译为白话文、中文等；
  - 校，对已有的书籍进行校对，消除流转中不同版本的错误；
  - 引，是引用源。
"""

# 著, 撰
AUTHOR      = '著'
# 辑, 编
EDITOR      = '辑'
# 注, 传（给经做注解）, 音义, 笺, 批, 评, 释
ANNOTATOR   = '注'
# 译
TRANSLATOR  = '译'
# 校, 校勘, 勘误
PROOFREADER = '校'
# 引
REFERENCE   = '引'