"""
docbook_label.py

docbook的标题、正文文本中，可以对内容加入一下标签，这些标签能帮助阅读者快读的理解文献的内容。
比如：人名、地名、官职等，勘误、增补等。
"""

# title name: 人名、姓、字、號、爵位、謚號、廟號等
FIGURENAME  = 'fn'
# territory: 地名、部族、國、朝代、軍治地等
ENTITYNAME  = 'tn'
# book name: 書名
BOOKNAME    = 'bn'

# errata/proofreading/corrections: 文字勘误
CORRECTIONS = 'e1'
# addendum/supplement/additions: 文字增补
ADDITIONS   = 'e2'
# text gap/text deficiency: 文字缺失
TEXTGAP     = 'e3'