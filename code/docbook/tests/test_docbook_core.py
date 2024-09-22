import sys
import os

import logging

# 临时设置 PYTHONPATH
# sys.path.append('/Users/sunyafu/zebra/Book/Books/code/')

import docbook
import utils


def test_title():
  title = docbook.Title('钢铁是怎样炼成的', subtitle='一个人的历程')
  print(title)
  title.title = '明天的天气是怎样的'
  print(title)
  title = docbook.Title.from_array('这是另一个故事', '一个前缀的示例', '一个后缀的示例', '无用的多余')
  print(title)
  print(repr(title))
  title = docbook.Title.from_list(['主标题', '标题前缀', '标题后缀'])
  print(title)
  return title


def test_dynasty():
  dynasty = docbook.Dynasty('元')
  print(dynasty)
  return dynasty


def test_author():
  author = docbook.Author('胡三省', '注', '南宋')
  print(author)
  author = docbook.Author.from_array(
      '司馬光', '編集', '南宋', '朝散大夫|右諫議大夫|權御使中丞|充理檢使|上護軍|賜紫金魚袋')
  print(author)
  print(repr(author))
  print(author.officialPosition)
  author.dynasty = docbook.Dynasty('元')
  print(author)
  author = docbook.Author('胡三省', '注', docbook.Dynasty('元'))
  print(author)


def test_content_piece():
  content_piece = docbook.ContentPiece(
      content='<span class="name1">宋</span>槧百衲本七種　此書已由<span class="name">傅氏</span>影印行世，各本大槪具詳<span class="name">傅氏</span>後記，茲更撮錄其要，幷以<span class="name">鈺</span>所見者雜識之。'
  )
  content_piece = docbook.ContentPiece(
      content='第一種，半葉十二行，行二十四字，字體方整渾厚，避諱至「構」字止，「愼」字間有刓去痕跡。第二百四十一卷、二百四十九卷之末，均有「左文林郞知<span class="name1">紹興府嵊縣</span>丞臣<span class="name">季祐之</span>校正」字樣。此種，記刊板始末雖佚，<span class="name1">涵芬樓</span>印十一行本載有紹興二年<span class="name1">餘姚縣</span>重刊時銜名，<span class="name">祐之</span>名列校刊監視中，<span class="note">「左文林」作「右脩職」，「季」作「桂」。</span>是爲紹興二年<span class="name1">浙東</span>茶鹽公使庫刊於<span class="name1">餘姚</span>之確證。<span class="note"><span class="name1">涵芬</span>本非<span class="name1">紹興</span>本，說詳下。</span>各卷有「<span class="name1">宋</span>本」橢圓朱文，「<span class="name">焦氏</span>家藏」大方朱文，「顧從德」聯珠白朱文，「<span class="name">項子昌</span>氏」朱文，「<span class="name">毛氏</span><span class="name">九疇</span>珍玩」白文，「季振宜」長方朱文，「<span class="name">汪士鐘</span>印」白文，「藝芸主人」朱文各印。存卷數：　一至八<span class="note">內卷一、卷二各缺一葉。</span>　三十七至四十五<span class="note">內卷四十五缺一葉。</span>　九十五至一百十一<span class="note">內卷一百零六缺一葉。</span>　一百二十四至一百二十七　一百三十五至一百五十　一百五十九至一百七十六　一百八十至二百二十　二百二十二至二百三十　二百三十六至二百三十七　二百四十一至二百九十三　計一百七十六卷。　<span class="book-title">校記</span>省稱「十二行本」。'
  )

  return content_piece


def test_division():
  division = docbook.Division(
      title=['胡刻通鑑正文校宋記述略'],
      authors=[['章鈺', '民國']],
      type=docbook.DivisionType.CHAPTER
  )

  content_piece = docbook.ContentPiece(
      content='<span class="name1">宋</span>槧百衲本七種　此書已由<span class="name">傅氏</span>影印行世，各本大槪具詳<span class="name">傅氏</span>後記，茲更撮錄其要，幷以<span class="name">鈺</span>所見者雜識之。'
  )
  division.add_content_piece(content_piece)

  content_piece = docbook.ContentPiece(
      content='<span class="name1">宋</span>槧百衲本七種　此書已由<span class="name">傅氏</span>影印行世，各本大槪具詳<span class="name">傅氏</span>後記，茲更撮錄其要，幷以<span class="name">鈺</span>所見者雜識之。'
  )
  division.add_content_piece(content_piece)

  return division


def test_book():
  book = docbook.Book(
      title=["資治通鑑", "", "胡三省註版"],
      authors=[['司馬光', '編集', '北宋', '朝散大夫|右諫議大夫|權御使中丞|充理檢使|上護軍|賜紫金魚袋'],
               ['胡三省', '音注', '南宋']],
      dynasty="北宋",
      categories=['经史子集|史', '編年史', '通史'],
      source="",
      description=("《资治通鉴》是司马光奉宋英宗和宋神宗之命编撰的一部编年体通史。由司马光本人担任主编，在刘攽、刘恕和范祖禹的协助下，历时19年而编撰完成。宋神宗认为此书「鉴于往事，有资于治道」，遂赐名《资治通鉴》。"
                   "全书分为294卷，约三百多万字，记事上起周威烈王二十三年（公元前403年），截止到后周世宗显德六年（959年），按照时间顺序记载了共16朝1362年的历史。《资治通鉴》中引用的史料极为丰富，除了十七史之外，还有各种杂史、私人撰述等。据《四库提要》记载，《资治通鉴》引用前人著作322 种，可见其取材广泛，具有极高的史料价值。"
                   "司马光的《资治通鉴》与司马迁的《史记》并列为中国史学的不朽巨著。《资治通鉴》自成书以来，一直受到历代帝王将相、文人墨客的追捧，点评批注它的人数不胜数。《资治通鉴》保存了很多现在已经看不到的史料，更重要的是，它对之后的史官创作、中国的历史编撰、文献学的发展等产生了深远的影响。")
  )
  print(book)

  book.authors = ['胡三省', '注', '南宋']
  book.categories.append('测试|cCESHI')

  print(book.dump_json(ensure_ascii=False, indent=None))


# for test
if __name__ == "__main__":
  utils.setup_logging(log_file='../../logs/test.log', level=logging.INFO)
  logger = logging.getLogger("test.docbook.archive")

  test_title()
  test_dynasty()
  test_author()

  test_book()
