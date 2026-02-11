import { describe, it, expect } from 'vitest';
import { parseTimeString, parseTimeRangeString, GANZHI } from '../src/timeParse';
import type { EraValidator } from '../src/timeParse';

describe('parseTimeString', () => {
  describe('空值处理', () => {
    it('应当处理 null', () => {
      expect(parseTimeString(null)).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('应当处理 undefined', () => {
      expect(parseTimeString(undefined)).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('应当处理空字符串', () => {
      expect(parseTimeString('')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('应当处理 "???"', () => {
      expect(parseTimeString('???')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('应当处理 "??"', () => {
      expect(parseTimeString('??')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('应当处理 "?"', () => {
      expect(parseTimeString('?')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('应当处理 "未知"', () => {
      expect(parseTimeString('未知')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('应当处理 "无"', () => {
      expect(parseTimeString('无')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });
  });

  describe('仅年份解析（calendarType 应为 unknown）', () => {
    it('应当解析公元后年份', () => {
      expect(parseTimeString('618年')).toEqual({ year: 618, month: null, day: null, calendarType: 'unknown' });
    });

    it('应当解析公元前年份', () => {
      expect(parseTimeString('前202年')).toEqual({ year: -202, month: null, day: null, calendarType: 'unknown' });
    });

    it('应当解析四位数年份', () => {
      expect(parseTimeString('1644年')).toEqual({ year: 1644, month: null, day: null, calendarType: 'unknown' });
    });
  });

  describe('农历月份解析（calendarType 应为 lunar）', () => {
    it('应当解析正月', () => {
      expect(parseTimeString('正月')).toEqual({ year: null, month: 1, day: null, calendarType: 'lunar' });
    });

    it('应当解析一月', () => {
      expect(parseTimeString('一月')).toEqual({ year: null, month: 1, day: null, calendarType: 'lunar' });
    });

    it('应当解析十一月', () => {
      expect(parseTimeString('十一月')).toEqual({ year: null, month: 11, day: null, calendarType: 'lunar' });
    });

    it('应当解析冬月(十一月别名)', () => {
      expect(parseTimeString('冬月')).toEqual({ year: null, month: 11, day: null, calendarType: 'lunar' });
    });

    it('应当解析十二月', () => {
      expect(parseTimeString('十二月')).toEqual({ year: null, month: 12, day: null, calendarType: 'lunar' });
    });

    it('应当解析腊月(十二月别名)', () => {
      expect(parseTimeString('腊月')).toEqual({ year: null, month: 12, day: null, calendarType: 'lunar' });
    });

    it('应当解析闰月为负数', () => {
      expect(parseTimeString('闰四月')).toEqual({ year: null, month: -4, day: null, calendarType: 'lunar' });
    });

    it('应当解析闰正月为负数', () => {
      expect(parseTimeString('闰正月')).toEqual({ year: null, month: -1, day: null, calendarType: 'lunar' });
    });
  });

  describe('农历日期解析', () => {
    it('应当解析初一', () => {
      expect(parseTimeString('正月初一')).toEqual({ year: null, month: 1, day: 1, calendarType: 'lunar' });
    });

    it('应当解析初五', () => {
      expect(parseTimeString('正月初五')).toEqual({ year: null, month: 1, day: 5, calendarType: 'lunar' });
    });

    it('应当解析初十', () => {
      expect(parseTimeString('正月初十')).toEqual({ year: null, month: 1, day: 10, calendarType: 'lunar' });
    });

    it('应当解析十五', () => {
      expect(parseTimeString('正月十五')).toEqual({ year: null, month: 1, day: 15, calendarType: 'lunar' });
    });

    it('应当解析二十', () => {
      expect(parseTimeString('正月二十')).toEqual({ year: null, month: 1, day: 20, calendarType: 'lunar' });
    });

    it('应当解析廿一', () => {
      expect(parseTimeString('正月廿一')).toEqual({ year: null, month: 1, day: 21, calendarType: 'lunar' });
    });

    it('应当解析廿九', () => {
      expect(parseTimeString('正月廿九')).toEqual({ year: null, month: 1, day: 29, calendarType: 'lunar' });
    });

    it('应当解析卅日(三十)', () => {
      expect(parseTimeString('正月卅日')).toEqual({ year: null, month: 1, day: 30, calendarType: 'lunar' });
    });

    it('应当解析三十日(三十)', () => {
      expect(parseTimeString('正月三十日')).toEqual({ year: null, month: 1, day: 30, calendarType: 'lunar' });
    });

    it('应当解析带"日"后缀的日期', () => {
      expect(parseTimeString('腊月初一日')).toEqual({ year: null, month: 12, day: 1, calendarType: 'lunar' });
    });
  });

  describe('农历完整时间字符串解析', () => {
    it('应当解析完整时间 "618年五月初一"', () => {
      expect(parseTimeString('618年五月初一')).toEqual({ year: 618, month: 5, day: 1, calendarType: 'lunar' });
    });

    it('应当解析完整时间 "前202年正月廿一"', () => {
      expect(parseTimeString('前202年正月廿一')).toEqual({ year: -202, month: 1, day: 21, calendarType: 'lunar' });
    });

    it('应当解析带闰月的完整时间', () => {
      expect(parseTimeString('1644年闰六月十五')).toEqual({ year: 1644, month: -6, day: 15, calendarType: 'lunar' });
    });

    it('应当解析年月无日', () => {
      expect(parseTimeString('618年五月')).toEqual({ year: 618, month: 5, day: null, calendarType: 'lunar' });
    });
  });

  describe('公历（阿拉伯数字）解析', () => {
    it('应当解析 "57年3月29日"', () => {
      expect(parseTimeString('57年3月29日')).toEqual({ year: 57, month: 3, day: 29, calendarType: 'gregorian' });
    });

    it('应当解析 "1949年10月1日"', () => {
      expect(parseTimeString('1949年10月1日')).toEqual({ year: 1949, month: 10, day: 1, calendarType: 'gregorian' });
    });

    it('应当解析带前导零 "2023年03月05日"', () => {
      expect(parseTimeString('2023年03月05日')).toEqual({ year: 2023, month: 3, day: 5, calendarType: 'gregorian' });
    });

    it('应当解析 "号" 后缀 "1949年10月1号"', () => {
      expect(parseTimeString('1949年10月1号')).toEqual({ year: 1949, month: 10, day: 1, calendarType: 'gregorian' });
    });

    it('应当解析仅年月 "57年3月"', () => {
      expect(parseTimeString('57年3月')).toEqual({ year: 57, month: 3, day: null, calendarType: 'gregorian' });
    });

    it('应当解析仅月日 "3月29日"', () => {
      expect(parseTimeString('3月29日')).toEqual({ year: null, month: 3, day: 29, calendarType: 'gregorian' });
    });
  });

  describe('格式混用检测', () => {
    it('中文月份+阿拉伯日期应返回空值', () => {
      expect(parseTimeString('五月29日')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('阿拉伯月份+中文日期应返回空值', () => {
      expect(parseTimeString('3月初一')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('闰月+阿拉伯数字应返回空值', () => {
      expect(parseTimeString('闰3月')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });

    it('闰月+阿拉伯数字日期应返回空值', () => {
      expect(parseTimeString('闰四月15日')).toEqual({ year: null, month: null, day: null, calendarType: 'unknown' });
    });
  });

  describe('年号纪年解析（calendarType 应为 era）', () => {
    it('应当解析 "明太祖洪武元年戊申"', () => {
      const result = parseTimeString('明太祖洪武元年戊申');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('明太祖洪武');
      expect(result.eraYear).toBe(1);
      expect(result.ganzhiYear).toBe('戊申');
      expect(result.month).toBeNull();
      expect(result.day).toBeNull();
    });

    it('应当解析 "元世祖至元八年辛巳月乙亥日"', () => {
      const result = parseTimeString('元世祖至元八年辛巳月乙亥日');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('元世祖至元');
      expect(result.eraYear).toBe(8);
      expect(result.ganzhiMonth).toBe('辛巳');
      expect(result.ganzhiDay).toBe('乙亥');
    });

    it('应当解析 "梁简文帝大宝二年三月十七日"', () => {
      const result = parseTimeString('梁简文帝大宝二年三月十七日');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('梁简文帝大宝');
      expect(result.eraYear).toBe(2);
      expect(result.month).toBe(3);
      expect(result.day).toBe(17);
    });

    it('应当解析 "梁简文帝大宝二年三月"', () => {
      const result = parseTimeString('梁简文帝大宝二年三月');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('梁简文帝大宝');
      expect(result.eraYear).toBe(2);
      expect(result.month).toBe(3);
      expect(result.day).toBeNull();
    });

    it('应当解析 "梁简文帝大宝二年三月戊戌日"', () => {
      const result = parseTimeString('梁简文帝大宝二年三月戊戌日');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('梁简文帝大宝');
      expect(result.eraYear).toBe(2);
      expect(result.month).toBe(3);
      expect(result.ganzhiDay).toBe('戊戌');
    });

    it('应当解析 "梁简文帝大宝二年三月戊戌"', () => {
      const result = parseTimeString('梁简文帝大宝二年三月戊戌');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('梁简文帝大宝');
      expect(result.eraYear).toBe(2);
      expect(result.month).toBe(3);
      expect(result.ganzhiDay).toBe('戊戌');
    });

    it('应当解析 "梁简文帝大宝二年三月十七戊戌日"', () => {
      const result = parseTimeString('梁简文帝大宝二年三月十七戊戌日');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('梁简文帝大宝');
      expect(result.eraYear).toBe(2);
      expect(result.month).toBe(3);
      expect(result.day).toBe(17);
      expect(result.ganzhiDay).toBe('戊戌');
    });

    it('应当解析 "梁简文帝大宝二年三月十七戊戌"', () => {
      const result = parseTimeString('梁简文帝大宝二年三月十七戊戌');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('梁简文帝大宝');
      expect(result.eraYear).toBe(2);
      expect(result.month).toBe(3);
      expect(result.day).toBe(17);
      expect(result.ganzhiDay).toBe('戊戌');
    });

    it('应当解析 "梁简文帝大宝二年三月十七日戊戌"', () => {
      const result = parseTimeString('梁简文帝大宝二年三月十七日戊戌');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('梁简文帝大宝');
      expect(result.eraYear).toBe(2);
      expect(result.month).toBe(3);
      expect(result.day).toBe(17);
      expect(result.ganzhiDay).toBe('戊戌');
    });

    it('应当解析中文数字年数 "至元八年"', () => {
      const result = parseTimeString('至元八年');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('至元');
      expect(result.eraYear).toBe(8);
    });

    it('应当解析 "贞观二十三年"', () => {
      const result = parseTimeString('贞观二十三年');
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('贞观');
      expect(result.eraYear).toBe(23);
    });
  });

  describe('年号验证器', () => {
    const validEras = ['明太祖洪武', '梁简文帝大宝', '元世祖至元', '贞观'];
    const eraValidator: EraValidator = (era) => validEras.includes(era);

    it('验证通过时应正常解析', () => {
      const result = parseTimeString('明太祖洪武元年', { eraValidator });
      expect(result.calendarType).toBe('era');
      expect(result.eraName).toBe('明太祖洪武');
    });

    it('验证失败时应返回空值', () => {
      const result = parseTimeString('虚构王朝元年', { eraValidator });
      expect(result.calendarType).toBe('unknown');
      expect(result.eraName).toBeUndefined();
    });
  });
});

describe('parseTimeRangeString', () => {
  describe('空值处理', () => {
    it('应当处理 null', () => {
      expect(parseTimeRangeString(null)).toEqual([null, null]);
    });

    it('应当处理 undefined', () => {
      expect(parseTimeRangeString(undefined)).toEqual([null, null]);
    });

    it('应当处理非字符串类型', () => {
      expect(parseTimeRangeString(123 as any)).toEqual([null, null]);
    });
  });

  describe('单一时间', () => {
    it('应当处理单一时间返回相同的起止时间（含日）', () => {
      const result = parseTimeRangeString('618年五月初一');
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1, calendarType: 'lunar' });
      expect(result[1]).toEqual({ year: 618, month: 5, day: 1, calendarType: 'lunar' });
    });

    it('应当处理单一时间返回相同的起止时间（含月）', () => {
      const result = parseTimeRangeString('618年五月');
      expect(result[0]).toEqual({ year: 618, month: 5, day: null, calendarType: 'lunar' });
      expect(result[1]).toEqual({ year: 618, month: 5, day: null, calendarType: 'lunar' });
    });

    it('应当处理单一时间返回相同的起止时间（含年）', () => {
      const result = parseTimeRangeString('618年');
      expect(result[0]).toEqual({ year: 618, month: null, day: null, calendarType: 'unknown' });
      expect(result[1]).toEqual({ year: 618, month: null, day: null, calendarType: 'unknown' });
    });
  });

  describe('区间分隔符', () => {
    it('应当区分自定义区间分隔符－', () => {
      const result = parseTimeRangeString('618年五月初一－618年六月十五', {separator: '－'});
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1, calendarType: 'lunar' });
      expect(result[1]).toEqual({ year: 618, month: 6, day: 15, calendarType: 'lunar' });
    });
    it('应当区分自定义区间分隔符~', () => {
      const result = parseTimeRangeString('618年五月初一~618年六月十五', {separator: '~'});
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1, calendarType: 'lunar' });
      expect(result[1]).toEqual({ year: 618, month: 6, day: 15, calendarType: 'lunar' });
    });
    it('应当区分自定义区间分隔符,', () => {
      const result = parseTimeRangeString('618年五月初一,618年六月十五', {separator: ','});
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1, calendarType: 'lunar' });
      expect(result[1]).toEqual({ year: 618, month: 6, day: 15, calendarType: 'lunar' });
    });
  });

  describe('农历时间区间', () => {
    it('应当解析完整的时间区间', () => {
      const result = parseTimeRangeString('618年五月初一-618年六月十五');
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1, calendarType: 'lunar' });
      expect(result[1]).toEqual({ year: 618, month: 6, day: 15, calendarType: 'lunar' });
    });

    it('应当补全终止时间缺失的年份', () => {
      const result = parseTimeRangeString('618年五月初一-六月十五');
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1, calendarType: 'lunar' });
      expect(result[1]).toEqual({ year: 618, month: 6, day: 15, calendarType: 'lunar' });
    });

    it('应当补全终止时间缺失的月份', () => {
      const result = parseTimeRangeString('618年五月初一-十五');
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1, calendarType: 'lunar' });
      expect(result[1]).toEqual({ year: 618, month: 5, day: 15, calendarType: 'lunar' });
    });

    it('应当处理跨年时间区间', () => {
      const result = parseTimeRangeString('617年十二月初一-618年正月初一');
      expect(result[0]).toEqual({ year: 617, month: 12, day: 1, calendarType: 'lunar' });
      expect(result[1]).toEqual({ year: 618, month: 1, day: 1, calendarType: 'lunar' });
    });
  });

  describe('公历时间区间', () => {
    it('应当解析公历时间区间', () => {
      const result = parseTimeRangeString('1949年10月1日-1949年10月31日');
      expect(result[0]).toEqual({ year: 1949, month: 10, day: 1, calendarType: 'gregorian' });
      expect(result[1]).toEqual({ year: 1949, month: 10, day: 31, calendarType: 'gregorian' });
    });

    it('应当补全公历终止时间缺失的年份和 calendarType', () => {
      const result = parseTimeRangeString('1949年10月1日-31日');
      expect(result[0]).toEqual({ year: 1949, month: 10, day: 1, calendarType: 'gregorian' });
      expect(result[1]).toEqual({ year: 1949, month: 10, day: 31, calendarType: 'gregorian' });
    });
  });
});

describe('GANZHI 常量', () => {
  it('应当包含10个天干', () => {
    expect(GANZHI.TIANGAN).toHaveLength(10);
    expect(GANZHI.TIANGAN[0]).toBe('甲');
    expect(GANZHI.TIANGAN[9]).toBe('癸');
  });

  it('应当包含12个地支', () => {
    expect(GANZHI.DIZHI).toHaveLength(12);
    expect(GANZHI.DIZHI[0]).toBe('子');
    expect(GANZHI.DIZHI[11]).toBe('亥');
  });

  it('应当包含60个干支组合', () => {
    expect(GANZHI.LIST).toHaveLength(60);
    expect(GANZHI.LIST[0]).toBe('甲子');
    expect(GANZHI.LIST[59]).toBe('癸亥');
  });

  it('干支组合应正确循环', () => {
    // 甲子、乙丑、丙寅...
    expect(GANZHI.LIST[0]).toBe('甲子');
    expect(GANZHI.LIST[1]).toBe('乙丑');
    expect(GANZHI.LIST[2]).toBe('丙寅');
    // 甲戌（第10个应是天干循环回甲，但地支还在戌）
    expect(GANZHI.LIST[10]).toBe('甲戌');
    // 甲申（第20个）
    expect(GANZHI.LIST[20]).toBe('甲申');
  });
});