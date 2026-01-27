# time-helper

中国古代/现代时间字符串解析库，支持农历、公历和帝王年号干支纪年。

## 安装

```bash
npm install
npm run build
```

## 功能

解析中文时间字符串，自动识别日历类型并返回结构化数据。

### 支持的格式

| 类型 | 示例 | calendarType |
|------|------|--------------|
| 农历 | `618年五月初一`、`闰四月十五`、`正月廿三` | `lunar` |
| 公历 | `1949年10月1日`、`57年3月29号` | `gregorian` |
| 年号纪年 | `明太祖洪武元年戊申`、`贞观二十三年`、`梁简文帝大宝二年三月十七日` | `era` |

## 使用

```typescript
import { parseTimeString, parseTimeRangeString } from 'time-helper';

// 农历
parseTimeString('618年五月初一');
// { year: 618, month: 5, day: 1, calendarType: 'lunar' }

// 公历
parseTimeString('1949年10月1日');
// { year: 1949, month: 10, day: 1, calendarType: 'gregorian' }

// 年号纪年
parseTimeString('明太祖洪武元年戊申');
// {
//   year: null,
//   month: null,
//   day: null,
//   calendarType: 'era',
//   eraName: '明太祖洪武',
//   eraYear: 1,
//   ganzhiYear: '戊申'
// }

// 时间区间
parseTimeRangeString('618年五月初一-六月十五');
// [{ year: 618, month: 5, day: 1, ... }, { year: 618, month: 6, day: 15, ... }]
```

### 年号验证器

可传入自定义验证函数校验年号是否有效：

```typescript
const validator = (era: string) => ['明太祖洪武', '贞观'].includes(era);

parseTimeString('明太祖洪武元年', { eraValidator: validator });
// 验证通过，正常解析

parseTimeString('虚构王朝元年', { eraValidator: validator });
// 验证失败，返回 { calendarType: 'unknown', ... }
```

## 返回类型

```typescript
interface ParsedTime {
  year: number | null;        // 公元年（年号纪年时为 null）
  month: number | null;       // 月份（闰月为负数）
  day: number | null;         // 日期
  calendarType: CalendarType; // 'lunar' | 'gregorian' | 'era' | 'unknown'
  // 年号纪年专用
  eraName?: string;           // 帝王+年号
  eraYear?: number;           // 年数
  ganzhiYear?: string;        // 干支年
  ganzhiMonth?: string;       // 干支月
  ganzhiDay?: string;         // 干支日
}
```

## 特殊规则

- **闰月**：返回负数月份，如 `闰四月` → `month: -4`
- **公元前**：返回负数年份，如 `前202年` → `year: -202`
- **格式混用**：中文月日与阿拉伯数字月日混用时返回空值
- **元年**：解析为 `eraYear: 1`

## 导出

```typescript
// 函数
export { parseTimeString, parseTimeRangeString };

// 类型
export type { CalendarType, ParsedTime, EraValidator, ParseOptions };

// 干支常量
export { GANZHI };
// GANZHI.TIANGAN: ['甲', '乙', '丙', ...]
// GANZHI.DIZHI: ['子', '丑', '寅', ...]
// GANZHI.LIST: ['甲子', '乙丑', ...] (60个)
```

## 测试

```bash
npm test
```