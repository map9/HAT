import { describe, it, expect } from 'vitest';
import { parseTimeString, parseTimeRangeString } from '../src/timeParse';

describe('parseTimeString', () => {
  describe('空值处理', () => {
    it('应当处理 null', () => {
      expect(parseTimeString(null)).toEqual({ year: null, month: null, day: null });
    });

    it('应当处理 undefined', () => {
      expect(parseTimeString(undefined)).toEqual({ year: null, month: null, day: null });
    });

    it('应当处理空字符串', () => {
      expect(parseTimeString('')).toEqual({ year: null, month: null, day: null });
    });

    it('应当处理 "???"', () => {
      expect(parseTimeString('???')).toEqual({ year: null, month: null, day: null });
    });

    it('应当处理 "??"', () => {
      expect(parseTimeString('??')).toEqual({ year: null, month: null, day: null });
    });

    it('应当处理 "?"', () => {
      expect(parseTimeString('?')).toEqual({ year: null, month: null, day: null });
    });

    it('应当处理 "未知"', () => {
      expect(parseTimeString('未知')).toEqual({ year: null, month: null, day: null });
    });

    it('应当处理 "无"', () => {
      expect(parseTimeString('无')).toEqual({ year: null, month: null, day: null });
    });
  });

  describe('年份解析', () => {
    it('应当解析公元后年份', () => {
      expect(parseTimeString('618年')).toEqual({ year: 618, month: null, day: null });
    });

    it('应当解析公元前年份', () => {
      expect(parseTimeString('前202年')).toEqual({ year: -202, month: null, day: null });
    });

    it('应当解析四位数年份', () => {
      expect(parseTimeString('1644年')).toEqual({ year: 1644, month: null, day: null });
    });
  });

  describe('月份解析', () => {
    it('应当解析正月', () => {
      expect(parseTimeString('正月')).toEqual({ year: null, month: 1, day: null });
    });

    it('应当解析一月', () => {
      expect(parseTimeString('一月')).toEqual({ year: null, month: 1, day: null });
    });

    it('应当解析十一月', () => {
      expect(parseTimeString('十一月')).toEqual({ year: null, month: 11, day: null });
    });

    it('应当解析冬月(十一月别名)', () => {
      expect(parseTimeString('冬月')).toEqual({ year: null, month: 11, day: null });
    });

    it('应当解析十二月', () => {
      expect(parseTimeString('十二月')).toEqual({ year: null, month: 12, day: null });
    });

    it('应当解析腊月(十二月别名)', () => {
      expect(parseTimeString('腊月')).toEqual({ year: null, month: 12, day: null });
    });

    it('应当解析闰月为负数', () => {
      expect(parseTimeString('闰四月')).toEqual({ year: null, month: -4, day: null });
    });

    it('应当解析闰正月为负数', () => {
      expect(parseTimeString('闰正月')).toEqual({ year: null, month: -1, day: null });
    });
  });

  describe('日期解析', () => {
    it('应当解析初一', () => {
      expect(parseTimeString('正月初一')).toEqual({ year: null, month: 1, day: 1 });
    });

    it('应当解析初五', () => {
      expect(parseTimeString('正月初五')).toEqual({ year: null, month: 1, day: 5 });
    });

    it('应当解析初十', () => {
      expect(parseTimeString('正月初十')).toEqual({ year: null, month: 1, day: 10 });
    });

    it('应当解析十五', () => {
      expect(parseTimeString('正月十五')).toEqual({ year: null, month: 1, day: 15 });
    });

    it('应当解析二十', () => {
      expect(parseTimeString('正月二十')).toEqual({ year: null, month: 1, day: 20 });
    });

    it('应当解析廿一', () => {
      expect(parseTimeString('正月廿一')).toEqual({ year: null, month: 1, day: 21 });
    });

    it('应当解析廿九', () => {
      expect(parseTimeString('正月廿九')).toEqual({ year: null, month: 1, day: 29 });
    });

    it('应当解析卅日(三十)', () => {
      expect(parseTimeString('正月卅日')).toEqual({ year: null, month: 1, day: 30 });
    });

    it('应当解析三十日(三十)', () => {
      expect(parseTimeString('正月三十日')).toEqual({ year: null, month: 1, day: 30 });
    });

    it('应当解析带"日"后缀的日期', () => {
      expect(parseTimeString('腊月初一日')).toEqual({ year: null, month: 12, day: 1 });
    });
  });

  describe('完整时间字符串解析', () => {
    it('应当解析完整时间 "618年五月初一"', () => {
      expect(parseTimeString('618年五月初一')).toEqual({ year: 618, month: 5, day: 1 });
    });

    it('应当解析完整时间 "前202年正月廿一"', () => {
      expect(parseTimeString('前202年正月廿一')).toEqual({ year: -202, month: 1, day: 21 });
    });

    it('应当解析带闰月的完整时间', () => {
      expect(parseTimeString('1644年闰六月十五')).toEqual({ year: 1644, month: -6, day: 15 });
    });

    it('应当解析年月无日', () => {
      expect(parseTimeString('618年五月')).toEqual({ year: 618, month: 5, day: null });
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
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1 });
      expect(result[1]).toEqual({ year: 618, month: 5, day: 1 });
    });

    it('应当处理单一时间返回相同的起止时间（含月）', () => {
      const result = parseTimeRangeString('618年五月');
      expect(result[0]).toEqual({ year: 618, month: 5, day: null });
      expect(result[1]).toEqual({ year: 618, month: 5, day: null });
    });
    it('应当处理单一时间返回相同的起止时间（含年）', () => {
      const result = parseTimeRangeString('618年');
      expect(result[0]).toEqual({ year: 618, month: null, day: null });
      expect(result[1]).toEqual({ year: 618, month: null, day: null });
    });
  });

  describe('时间区间', () => {
    it('应当解析完整的时间区间', () => {
      const result = parseTimeRangeString('618年五月初一-618年六月十五');
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1 });
      expect(result[1]).toEqual({ year: 618, month: 6, day: 15 });
    });

    it('应当补全终止时间缺失的年份', () => {
      const result = parseTimeRangeString('618年五月初一-六月十五');
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1 });
      expect(result[1]).toEqual({ year: 618, month: 6, day: 15 });
    });

    it('应当补全终止时间缺失的月份', () => {
      const result = parseTimeRangeString('618年五月初一-十五');
      expect(result[0]).toEqual({ year: 618, month: 5, day: 1 });
      expect(result[1]).toEqual({ year: 618, month: 5, day: 15 });
    });

    it('应当处理跨年时间区间', () => {
      const result = parseTimeRangeString('617年十二月初一-618年正月初一');
      expect(result[0]).toEqual({ year: 617, month: 12, day: 1 });
      expect(result[1]).toEqual({ year: 618, month: 1, day: 1 });
    });
  });
});