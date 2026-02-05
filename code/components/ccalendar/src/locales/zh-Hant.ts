/**
 * 繁体中文语言包
 */
import type { LocaleData } from '../types.js';

export const zhHant: LocaleData = {
  monthNames: {
    '0': '1 月', '1': '2 月', '2': '3 月', '3': '4 月',
    '4': '5 月', '5': '6 月', '6': '7 月', '7': '8 月',
    '8': '9 月', '9': '10 月', '10': '11 月', '11': '12 月'
  },
  weeks: {
    '0': '星期日', '1': '星期一', '2': '星期二', '3': '星期三',
    '4': '星期四', '5': '星期五', '6': '星期六'
  },
  heavens: {
    '0': '甲', '1': '乙', '2': '丙', '3': '丁', '4': '戊',
    '5': '己', '6': '庚', '7': '辛', '8': '壬', '9': '癸'
  },
  earths: {
    '0': '子', '1': '丑', '2': '寅', '3': '卯', '4': '辰', '5': '巳',
    '6': '午', '7': '未', '8': '申', '9': '酉', '10': '戌', '11': '亥'
  },
  animals: {
    '0': '鼠', '1': '牛', '2': '虎', '3': '兔', '4': '龍', '5': '蛇',
    '6': '馬', '7': '羊', '8': '猴', '9': '雞', '10': '狗', '11': '豬'
  },
  monthNumbers: {
    '-1': '一', '0': '正', '1': '二', '2': '三', '3': '四', '4': '五',
    '5': '六', '6': '七', '7': '八', '8': '九', '9': '十', '10': '十一', '11': '十二'
  },
  dayNumbers: {
    '0': '初一', '1': '初二', '2': '初三', '3': '初四', '4': '初五',
    '5': '初六', '6': '初七', '7': '初八', '8': '初九', '9': '初十',
    '10': '十一', '11': '十二', '12': '十三', '13': '十四', '14': '十五',
    '15': '十六', '16': '十七', '17': '十八', '18': '十九', '19': '二十',
    '20': '廿一', '21': '廿二', '22': '廿三', '23': '廿四', '24': '廿五',
    '25': '廿六', '26': '廿七', '27': '廿八', '28': '廿九', '29': '三十'
  },
  moonPhases: {
    '0': '朔', '1': '上弦', '2': '望', '3': '下弦'
  },
  monthSizes: {
    '0': '小', '1': '大'
  },
  solarTermNames: {
    '0': '小寒', '1': '大寒', '2': '立春', '3': '雨水', '4': '驚蟄', '5': '春分',
    '6': '清明', '7': '穀雨', '8': '立夏', '9': '小滿', '10': '芒種', '11': '夏至',
    '12': '小暑', '13': '大暑', '14': '立秋', '15': '處暑', '16': '白露', '17': '秋分',
    '18': '寒露', '19': '霜降', '20': '立冬', '21': '小雪', '22': '大雪', '23': '冬至',
    '24': '小寒'
  },
  eclipseNames: {
    '0': '日偏食', '1': '日環食', '2': '日全食', '3': '日全環食',
    '4': '半影月食', '5': '月偏食', '6': '月全食'
  },
  leap: {
    'leap': '閏', 'post': '後', 'post9': '後九'
  },
  westernCalendar: {
    'prolepticJulian': '逆推儒略曆',
    'julian': '儒略曆',
    'reform': '儒略曆/格里曆',
    'gregorian': '格里曆'
  },
  chineseCalendar: {
    'Huangdi': '黃帝',
    'Zhuanxu': '顓頊',
    'Spring.Xia': '夏',
    'Yin': '殷',
    'Zhou': '周',
    'Chunqiu': '春秋',
    'Lu': '鲁',
    'Warring.Xia': '夏',
    'HanZhuanxu': '漢顓頊',
    "Tki.Wei": '魏',
    "Tki.Shu": '蜀',
    "Tki.Wu": '吳',
    "Jin": '晋',
    "SouthNorth.South.Jin": '东晋',
    "SouthNorth.South.Song": '宋',
    "SouthNorth.South.Qi": '齊',
    "SouthNorth.South.Liang": '梁',
    "SouthNorth.South.Chen": '陳',
    "SouthNorth.North.LaterQin": '後秦',
    "SouthNorth.North.NorthernLiang": '北凉',
    "SouthNorth.North.NorthernWei": '北魏',
    "SouthNorth.North.WesternWei": '西魏',
    "SouthNorth.North.NorthernZhou": '北周',
    "SouthNorth.North.Sui": '隋',
    "SouthNorth.North.EasternWei": '東魏',
    "SouthNorth.North.NorthernQi": '北齊',
    "SongLiaoJinYuan.LaterHan": '後漢',
    "SongLiaoJinYuan.LaterZhou": '後周',
    "SongLiaoJinYuan.Song": '宋',
    "SongLiaoJinYuan.Liao": '遼/契丹',
    "SongLiaoJinYuan.Jin": '金',
    "SongLiaoJinYuan.Mongol": '蒙古',
    "SongLiaoJinYuan.Yuan": '元',
    "Qing.Qing": '清',
    "Qing.SouthernMing": '南明',
    "Qing.Zheng": '明鄭'
  },

  yearExpressions: {
    'ce': '{{year}}',
    'bce': '前{{year}}',
    'short': '{{year}}年',
    'short.ganZhi': '{{heaven}}{{earth}}年',
    'normal': '{{year}}（{{shengxiao}}）年',
    'normal.ganZhi': '{{heaven}}{{earth}}（{{shengxiao}}）年',
    'full': '{{year}}（{{heaven}}{{earth}}，{{shengxiao}}）年'
  },
  monthExpressions: {
    'short': '{{month}}月',
    'short.ganZhi': '{{heaven}}{{earth}}月',
    'normal': '{{month}}月{{size}}',
    'normal.ganZhi': '{{heaven}}{{earth}}月{{size}}',
    'full': '{{month}}月{{size}}（建{{heaven}}{{earth}}）',
    'full.noZhong': '{{month}}月{{size}}（無中氣）'
  },
  dayExpressions: {
    'short': '{{day}}',
    'short.ganZhi': '{{heaven}}{{earth}}',
    'normal': '{{day}}',
    'normal.ganZhi': '{{heaven}}{{earth}}',
    'full': '{{day}} ({{heaven}}{{earth}})'
  },
  dateExpressions: {
    'normal': '{{month}}{{day}}',
    'full': '{{year}}{{month}}{{day}}'
  },

  pingqi: {
    'pingqi': '平氣', 'dingqi': '定氣'
  },
  calenderNames: {
    'calendrical': '曆書',
    'xinfa': '新法',
    'datong': '大統曆',
  },
  mixedExpressions: {
    'moonPhases': '月相{{type}}',
    'solarTerms': '二十四節氣{{type}}',
    'calendricalSolarTerms': '{{name}}節氣{{type}}',
  },
  yearHtmls: {
    'gregorian': '<h1>公曆年（{{gcal}}）：{{yearc}}</h1>',
    'lunarSpan0': '<h1>公曆年：</h1><h2>{{eraNameString0}}</h2>',
    'lunarSpan1': '<h1>公曆年：</h1><h2>{{spanMonth0}}{{spanDay0}}日前: {{eraNameString0}},<br/>{{spanMonth0}}{{spanDay0}}日及以后：{{eraNameString1}}</h2>',
    'lunarSpan2': '<h1>公曆年：</h1><h2>{{spanMonth0}}{{spanDay0}}日前: {{eraNameString0}},<br/>{{spanMonth0}}{{spanDay0}}日至{{spanMonth1}}{{day1l}}日: {{eraNameString1}},<br/>{{spanMonth1}}{{spanDay1}}日及以后: {{eraNameString2}}</h2>',
    'lunarSpan@24': '<h1>公曆年：</h1><h2>{{spanMonth0}}{{spanDay0}}日前: 癸未(羊)漢更始元年,<br/>{{spanMonth0}}{{spanDay0}}日及以后：{{eraNameString1}}</h2>'
  }
};
