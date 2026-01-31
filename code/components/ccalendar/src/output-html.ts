/**
 * output-html.ts
 * 将 exportYear 输出的 JSON 数据转换为 HTML 字符串。
 * 纯函数：仅依赖传入的 JSON 数据，不需要 ChineseCalendar 实例。
 */
import type { YearExportData, MonthExportData, DayData, HtmlLocaleLabels } from './types.js';

/**
 * 将年历JSON数据转换为HTML字符串
 * @param data - exportYear 输出的 JSON 数据（解析后的对象）
 * @returns HTML 字符串
 */
export function yearDataToHtml(data: YearExportData): string {
  const locale = data.locale!;
  let html = '';

  // 1. 年份头部（公历年 + 农历年信息）
  if (data.yearHeaderHtml) {
    html += data.yearHeaderHtml;
  }

  // 2. 额外信息（历史年代说明）
  if (data.additionalInfo) {
    html += `<h3 style="color:brown;line-height:26px;">${data.additionalInfo}</h3><br/><br/>`;
  }

  // 3. 每月数据
  for (const month of data.months) {
    html += monthToHtml(month, data);
  }

  return html;
}

/**
 * 将单月数据转换为 HTML
 */
function monthToHtml(month: MonthExportData, data: YearExportData): string {
  const locale = data.locale!;
  let html = '';

  // === 月历表格 ===
  html += '<table>';

  // 表头：公历年月 + 农历月
  // 使用 cmonthYearMap + cyearStrings 与原始chinesecalendar HTML行为一致
  const nMonth = month.chineseMonths.length;
  const cyearStrs = data.cyearStrings || [];
  const cmonthYearMap = data.cmonthYearMap || [];

  // 获取每个农历月的干支年名（与原始代码一致，使用顺序索引）
  const getYearStr = (idx: number): string => {
    if (cyearStrs.length > 0 && cmonthYearMap.length > idx) {
      return cyearStrs[cmonthYearMap[idx]];
    }
    return month.chineseMonths[idx]?.year || '';
  };

  if (nMonth === 1) {
    html += `<tr><th colspan="2"><h2>${data.yearText}<br/>${month.monthName}</h2></th>`;
    html += `<th colspan="5"><h3>${getYearStr(0)} ${month.chineseMonths[0].month}</h3></th></tr>`;
  } else {
    html += `<tr><th colspan="2"  rowspan="${nMonth}"><h2>${data.yearText}<br/>${month.monthName}</h2></th>`;
    html += `<th colspan="5"><h3>${getYearStr(0)} ${month.chineseMonths[0].month}</h3></th></tr>`;
    for (let i = 1; i < nMonth; i++) {
      html += `<tr><th colspan="5"><h3>${getYearStr(i)} ${month.chineseMonths[i].month}</h3></th></tr>`;
    }
  }

  // 星期行
  html += '<tr>';
  for (let i = 0; i < 7; i++) {
    html += `<th style="font-size:120%;">${locale.weeks[i]}</th>`;
  }
  html += '</tr>';

  // 日历网格
  html += renderCalendarGrid(month);

  html += '</table>';

  // === 月相 ===
  html += renderMoonPhases(month, locale);

  // === 24节气 ===
  html += renderSolarTerms(month, locale);

  // === 历书节气 ===
  if (month.calendricalSolarTerms) {
    for (const group of month.calendricalSolarTerms) {
      html += renderCalendricalSolarTerms(group);
    }
  }

  // === 警告/注释 ===
  if (month.warningMessage) {
    html += `<p style="color:red;"><sup>*</sup>${month.warningMessage}</p>`;
  }

  html += '<br/><br/><br/>';

  return html;
}

/**
 * 渲染日历网格
 */
function renderCalendarGrid(month: MonthExportData): string {
  const days = month.days;
  if (days.length === 0) return '';

  let html = '';
  const week1 = days[0].dayOfWeek;

  // 月初空白
  if (week1 > 0) {
    html += '<tr>';
    html += `<td colspan="${week1}"></td>`;
  }

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const week = day.dayOfWeek;

    if (week === 0) html += '<tr>';

    // 公历日期
    html += `<td><h3 style="text-align:center;">${day.day}</h3>`;

    // 农历日期
    html += renderChineseDate(day, month);

    // 干支日
    html += `<p>${day.sexagenary.dayText}</p>`;

    html += '</td>';

    if (week === 6) html += '</tr>';
  }

  // 月末空白
  const lastDay = days[days.length - 1];
  if (lastDay.dayOfWeek !== 6) {
    html += `<td colspan="${6 - lastDay.dayOfWeek}"></td></tr>`;
  }

  return html;
}

/**
 * 渲染单日的农历日期文字
 */
function renderChineseDate(day: DayData, month: MonthExportData): string {
  if (day.chineseDate.isMonthStart) {
    // 初一：显示月份名（岁首红色，非岁首棕色）
    const color = day.chineseDate.isFirstMonth ? 'red' : 'brown';
    return `<p style="color:${color};"><b>${day.chineseDate.monthShort}</b></p>`;
  }

  // 公历1月1日（非初一）：显示 月份+日期
  if (month.month === 0 && day === month.days[0]) {
    return `${day.chineseDate.monthShort}${day.chineseDate.dayText}`;
  }

  // 其他日期：显示农历日文字
  return day.chineseDate.dayText;
}

/**
 * 渲染月相信息
 */
function renderMoonPhases(month: MonthExportData, locale: HtmlLocaleLabels): string {
  const de441Suffix = locale.de441 ? ' (DE441)' : '';
  let html = `<p  style="letter-spacing:normal;"><b>${locale.moonPhasesLabel}${de441Suffix}</b>: `;

  for (let i = 0; i < month.moonPhases.length; i++) {
    const p = month.moonPhases[i];
    html += `[${p.phaseName}] ${p.day}<sup>d</sup>${String(p.time.hour).padStart(2, '0')}<sup>h</sup>${String(p.time.minute).padStart(2, '0')}<sup>m</sup>`;

    // 日食/月食链接
    if (p.eclipse) {
      const isSolar = p.eclipse.type > 3;
      let link = `http://ytliu.epizy.com/eclipse/one_${isSolar ? 'solar' : 'lunar'}_eclipse_general.html?`;
      link += `ybeg=${p.eclipse.ybeg}${isSolar ? '' : '&shrule=Danjon'}&ind=${p.eclipse.ind}&DE=441&ref=ccal`;
      html += `(<a href="${link}" target="_blank">${p.eclipse.typeName}</a>)`;
    }

    if (i < month.moonPhases.length - 1) html += '&nbsp;&nbsp;';
  }

  html += '</p>';
  return html;
}

/**
 * 渲染24节气
 */
function renderSolarTerms(month: MonthExportData, locale: HtmlLocaleLabels): string {
  const de441Suffix = locale.de441 ? '(DE441)' : '';
  let html = `<p style="letter-spacing:normal;"><b>${locale.solarTermsLabel}${de441Suffix}</b>: `;

  for (let i = 0; i < month.solarTerms.length; i++) {
    const s = month.solarTerms[i];
    html += `[${s.name}] ${s.day}<sup>d</sup>${String(s.time.hour).padStart(2, '0')}<sup>h</sup>${String(s.time.minute).padStart(2, '0')}<sup>m</sup>`;

    if (i + 1 < month.solarTerms.length) {
      html += '&nbsp;&nbsp;&nbsp;';
    }
  }

  html += '</p>';
  return html;
}

/**
 * 渲染历书节气
 */
function renderCalendricalSolarTerms(group: { label: string; terms: Array<{ name: string; day: number }> }): string {
  if (group.terms.length === 0) return '';

  let html = `<p style="letter-spacing:normal;"><b>${group.label}</b>: `;

  for (let i = 0; i < group.terms.length; i++) {
    html += `[${group.terms[i].name}] ${group.terms[i].day}<sup>d</sup>`;
    if (i + 1 < group.terms.length) {
      html += '&nbsp;&nbsp;&nbsp;';
    }
  }

  html += '</p>';
  return html;
}
