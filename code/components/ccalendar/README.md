# @hat/ccalendar

Chinese Calendar TypeScript Library - 中国农历计算库

提供公元前722年至公元2200年间，公历与中国农历之间的日期转换、干支计算、月相节气、年号查询、多语言格式化输出等功能。

## 项目来源

本项目基于 [ytliu0/ChineseCalendar](https://github.com/ytliu0/ChineseCalendar) 开源项目重构而来。原项目由 [ytliu0](https://github.com/ytliu0) 开发，采用 HTML + JavaScript 实现，提供了公元前722年至公元2200年的中西历转换功能，是目前覆盖历史跨度最广、最精确的中国农历开源计算项目之一。

本次重构**未变更核心计算逻辑**，保持了与原项目一致的计算精度和数据基础。

## 重构内容

### 1. TypeScript 支持

将原项目从 JavaScript 迁移至 TypeScript，提供完整的类型定义，包括：

- 枚举类型：`ChineseCalendarType`（50+ 历史历法）、`WesternCalendarType`、`SolarTermsType`、`CalendricalSolarTermType`
- 数据结构：`LunarDate`、`LunarMonth`、`CalVars`、`MoonPhases`、`YearExportData`、`MonthExportData` 等
- 格式化配置：`ChineseDateFormatConfig`、`LocaleData`

### 2. 模块化重构

将原项目的单一 `calendar.js` 拆分为职责明确的模块，提高松耦合和可维护性：

| 模块 | 职责 |
|------|------|
| `ChineseCalendar` | 核心计算类：公历农历转换、年月信息获取、数据导出 |
| `ChineseCalendarRender` | 文本格式化：多语言农历日期字符串输出 |
| `ChineseCalendarHtmlRender` | HTML 渲染：年历/月历表格生成 |
| `core/calendar-calculate` | 核心农历年数据计算 |
| `core/calendar-id` | 历法/朝代识别与校正 |
| `core/solar-terms-calculate` | 现代天文节气计算（DE441/DE431） |
| `core/calendrical-solar-terms-calculate` | 历书节气计算（平气/定气） |
| `core/eclipses-calculate` | 日月食数据计算 |
| `core/ancient-calendars-calculate` | 古六历计算（前104年之前） |
| `core/utilities` | 共享工具函数 |
| `eras` | 年号（帝王纪年）计算 |
| `info` | 年/月提示信息与警告 |
| `locales/` | 多语言包（简体中文、繁体中文、英文） |

关键分离：
- **计算与渲染分离**：农历核心计算（`ChineseCalendar`）与格式化输出（`ChineseCalendarRender` / `ChineseCalendarHtmlRender`）解耦
- **农历计算与天文数据分离**：历法月份计算与现代天文月相、节气计算分离为独立模块

### 3. 新增 API

在原项目基础上新增以下功能函数：

- `getChineseDateFromDate(calendar, date)` — 从 JavaScript Date 对象获取农历日期
- `getChineseDateFromWesternDate(calendar, westernDate)` — 公历日期转农历日期
- `getDateFromChineseDate(calendar, cYear, cMonth, cDay, ...)` — 农历日期转 JavaScript Date
- `getWesternDateFromChineseDate(calendar, cYear, cMonth, cDay, ...)` — 农历日期转公历日期
- `getChineseYearStart(calendar, cYear)` — 获取农历年岁首对应的公历日期
- `getChineseYearMonthInfo(calendar, cYear)` — 获取农历年所有月份信息
- `exportYear(calendar, year)` — 导出公历年完整数据（含农历年、月相、节气、日月食）
- `exportMonth(year, month, calVars)` — 导出公历月数据（含每日农历对应）

## 安装

```bash
npm install @hat/ccalendar
```

## 使用

### 公历转农历

```typescript
import { ChineseCalendar, ChineseCalendarType } from '@hat/ccalendar';

const cc = new ChineseCalendar();

// 从 Date 对象转换
const lunarDate = cc.getChineseDateFromDate(
  ChineseCalendarType.DEFAULT,
  new Date(2024, 0, 1) // 2024年1月1日
);
// => { cYear: 2023, cMonth: 11, cDay: 20, heYear: [9, 3], ... }

// 从公历日期对象转换
const lunarDate2 = cc.getChineseDateFromWesternDate(
  ChineseCalendarType.DEFAULT,
  { year: 2024, month: 0, day: 1 }
);
```

### 农历转公历

```typescript
// 返回 Date 对象
const date = cc.getDateFromChineseDate(
  ChineseCalendarType.DEFAULT,
  2024, 1, 1 // 农历甲辰年正月初一
);

// 返回 WesternDate 对象
const wDate = cc.getWesternDateFromChineseDate(
  ChineseCalendarType.DEFAULT,
  2024, 1, 1
);
```

### 获取农历年信息

```typescript
// 岁首日期
const yearStart = cc.getChineseYearStart(ChineseCalendarType.DEFAULT, 2024);

// 年度所有月份信息
const months = cc.getChineseYearMonthInfo(ChineseCalendarType.DEFAULT, 2024);
```

### 导出年度完整数据

```typescript
const yearData = cc.exportYear(ChineseCalendarType.DEFAULT, 2024);
// 包含：农历年、干支、年号、12个月数据、月相、节气、日月食
```

### 格式化输出

```typescript
import { ChineseCalendarRender } from '@hat/ccalendar';

// 简体中文
const render = new ChineseCalendarRender({ locale: 'zh-Hans' });

// 格式化农历月份
const monthStr = render.lunarMonthToString(1, undefined, 'normal');

// 格式化农历日期
const dayStr = render.lunarDayToString(15, 'normal');
```

### HTML 日历渲染

```typescript
import { ChineseCalendar, ChineseCalendarHtmlRender, ChineseCalendarType } from '@hat/ccalendar';

const cc = new ChineseCalendar();
const htmlRender = new ChineseCalendarHtmlRender({ locale: 'en' });
const html = htmlRender.render(ChineseCalendarType.DEFAULT, 2024, cc);
```

### 使用历史历法

```typescript
// 使用春秋历查询
const lunarDate = cc.getChineseDateFromWesternDate(
  ChineseCalendarType.CHUNQIU,
  { year: -500, month: 0, day: 1 }
);

// 使用宋历查询
const songDate = cc.getChineseDateFromWesternDate(
  ChineseCalendarType.SONGLIAOJINYUAN_SONG,
  { year: 1100, month: 5, day: 15 }
);
```

## 支持的历法

覆盖从春秋到清末的 50+ 历史历法/政权，按时期分类：

| 时期 | 历法 |
|------|------|
| 先秦 | 黄帝历、颛顼历、夏历、殷历、周历、鲁历、春秋历 |
| 三国 | 魏、蜀、吴 |
| 晋 | 晋 |
| 南北朝（南） | 晋、宋、齐、梁、陈 |
| 南北朝（北） | 后秦、北凉、北魏、西魏、北周、隋、东魏、北齐 |
| 宋辽金元 | 后汉、后周、宋、辽、金、蒙古、元 |
| 清 | 清、南明、郑 |

## 多语言支持

内置三种语言包：

- `zh-Hans` — 简体中文
- `zh-Hant` — 繁体中文（默认）
- `en` — 英文

包含：天干地支、生肖、月份名、二十四节气、月相、日月食类型、年号、历书名称等完整翻译。

## 构建

```bash
npm run build    # TypeScript 编译
npm run dev      # 监听模式
npm run test     # 运行测试
```

## 日期范围

公元前722年（CALENDAR_RANGE_MIN_YEAR = -721）至 公元2200年（CALENDAR_RANGE_MAX_YEAR = 2200）

## 许可证

[GPL-3.0](LICENSE)，与原项目保持一致。

## 致谢

- [ytliu0/ChineseCalendar](https://github.com/ytliu0/ChineseCalendar) — 原始项目，提供了核心计算逻辑和历史历法数据