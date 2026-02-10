/**
 * output-html.ts
 * 将 exportYear 输出的纯数据 JSON 转换为 HTML 字符串。
 * 格式化职责集中在此模块：yearHeaderHtml、locale标签、历书节气、警告消息等。
 */
import { YearExportData, DayExportData, ChineseCalendarType } from './types.js';

import { getWesternCalendarBookByYear, isNewMoonCloseToMidnight } from './core/index.js'
import type { ChineseCalendar } from './ChineseCalendar.js';

import { eraName } from './eras.js'
import { ChineseCalendarRender, interpolate } from './ChineseCalendarRender.js';
import { getYearInfo, getMonthInfo } from './info.js';

/**
 * 格式化小时数为HH:MM格式
 */
export function convertHoursToHHMM(hours: number): [string, string] {
  const totalHours = hours % 24;
  const hh = Math.floor(totalHours);
  const mm = Math.round((totalHours - hh) * 60);
  return [String(hh).padStart(2, '0'), String(mm).padStart(2, '0')];
}

export class ChineseCalendarHtmlRender extends ChineseCalendarRender {
  constructor(
    config = {
      locale: 'zh-Hant'
    }) {
    super(config);
  }

  render(
    calendar: ChineseCalendarType | null = ChineseCalendarType.DEFAULT,
    year: number,
    cc: ChineseCalendar): string {
      const yearExportData = cc.exportYear(calendar, year);
      if (yearExportData) {
        return this.renderYear(yearExportData);
      } else {
        return '';
      }
  }

  renderYear(yearExportData: YearExportData): string {
    let html = "";

    const heYearStrings: string[] = [];
    const eraNameStrings: string[] = [];
    yearExportData.cSpanYears.forEach(cSpanYear => {
      const heYear = cSpanYear.heYear;
      const heYearString = interpolate(this.localeData.yearExpressions['short.ganZhi'], {
          heaven: this.localeData.heavens[String(heYear[0])],
          earth: this.localeData.earths[String(heYear[1])]
        });
      heYearStrings.push(heYearString);

      let eraNameString = interpolate(this.localeData.yearExpressions['normal.ganZhi'], {
          heaven: this.localeData.heavens[String(heYear[0])],
          earth: this.localeData.earths[String(heYear[1])],
          shengxiao: this.localeData.animals[String(heYear[1])]
        });
      eraNameString += eraName(this.locale, cSpanYear.cYear, yearExportData.calendar);
      eraNameStrings.push(eraNameString);
    });

    const gCalendar = getWesternCalendarBookByYear(yearExportData.year);
    const yearString = interpolate(this.localeData.yearExpressions['short'], {
      year: this.yearToString(yearExportData.year)
    });

    html += interpolate(this.localeData.yearHtmls['gregorian'], {
      gCalendar: this.localeData.westernCalendar[String(gCalendar)],
      yearString: (yearExportData.year > 0) ? yearString : `${yearExportData.year}（${yearString}）`
    });
    
    // 公历中包含的农历年序号，最多包含三个。
    const cSpanYearCount = yearExportData.cSpanYears.length;
    if (cSpanYearCount == 1) {
      html += interpolate(this.localeData.yearHtmls['lunarSpan0'], {
        eraNameString0: eraNameStrings[0]
      });
    } else if (cSpanYearCount == 2) {
      html += interpolate(yearExportData.year === 24 ? this.localeData.yearHtmls['lunarSpan@24'] : this.localeData.yearHtmls['lunarSpan1'], {
        eraNameString0: eraNameStrings[0],
        spanMonth0: this.localeData.monthNames[String(yearExportData.cSpanYears[1].date?.month! - 1)],
        spanDay0: yearExportData.cSpanYears[1].date?.day!,
        eraNameString1: eraNameStrings[1]
      });
    } else {
      html += interpolate(this.localeData.yearHtmls['lunarSpan2'], {
        spanMonth0: this.localeData.monthNames[String(yearExportData.cSpanYears[1].date?.month! - 1)],
        spanDay0: yearExportData.cSpanYears[1].date?.day!,
        eraNameString0: eraNameStrings[0],
        spanMonth1: this.localeData.monthNames[String(yearExportData.cSpanYears[2].date?.month! - 1)],
        spanDay1Last: yearExportData.cSpanYears[2].date?.day! - 1,
        eraNameString1: eraNameStrings[1],
        spanDay1: yearExportData.cSpanYears[2].date?.day!,
        eraNameString2: eraNameStrings[2]
      });
  }

    // Add additional information after the year info
    const info = getYearInfo(yearExportData.year, yearExportData.calendar, this);
    if (info && info.length > 0) {
      html += `<h3 class="info">${info}</h3>`;
    }

    // Render month to html
    for (let month = 0; month < 12; month ++) {
      html += this.renderMonth(yearExportData, month);
    }

    return html;
  }

  renderMonth(yearExportData: YearExportData, month: number): string {
    let html = "<table>";

    const cSpanMonths = yearExportData.cMonths[month].cSpanMonths;
    // 1. 格式化月表头
    const cSpanMonthCount = cSpanMonths.length;
    html += `<tr>`;
    // 1.1 表头公历年月
    const yearString = interpolate(this.localeData.yearExpressions['short'], {
      year: this.yearToString(yearExportData.year)
    });
    html += `<th colspan="2"${cSpanMonthCount !== 1 ? ' rowspan=' + cSpanMonthCount : ''} ><h2>${yearString}<br/>${this.localeData.monthNames[month]}</h2></th>`;
    // 1.2 表头农历年月
    for (let i = 0; i < cSpanMonthCount; i ++) {
      const cSpanMonth = cSpanMonths[i];
      const cSpanYear = yearExportData.cSpanYears[cSpanMonth.cYearIndex];

      const cYearString = interpolate(this.localeData.yearExpressions['short.ganZhi'], {
        heaven: this.localeData.heavens[String(cSpanYear.heYear[0])],
        earth: this.localeData.earths[String(cSpanYear.heYear[1])]
      });
      const cMonthString = this.lunarMonthToString(
        'full',
        cSpanYear.cYear,
        cSpanMonth.cMonth,
        cSpanMonth.heMonth, 
        cSpanMonth.cMonthSize,
        cSpanMonth.isFirstMonth,
        cSpanMonth.leap,
      );
      
      if (cSpanMonthCount > 1 && i > 0) html += "</tr>";
      html += `<th colspan="5"><h3>${cYearString} ${cMonthString}</h3></th>`;
      html += "</tr>";
    }

    // 2. 周行
    html += "<tr>";
    for (let i = 0; i < 7; i++) {
      html += `<th>${this.localeData.weeks[String(i)]}</th>`;
    }
    html += "</tr>";

    // 3. 日期
    const cDays = yearExportData.cMonths[month].cDays;
    // Determine the day of week of the first date of month
    const weekStart = cDays[0].dayOfWeek;
    if (weekStart > 0) {
      html += "<tr>";
      html += `<td colspan="${weekStart}"></td>`;
    }
    // # of days in the months
    let week;
    for (let i = 1; i <= cDays.length; i ++) {
      const cDay: DayExportData  = cDays[i - 1];
      week = cDay.dayOfWeek;
      if (week == 0) html += "<tr>";
      if (cDays.length > 25) {
        html += `<td><h3 style="text-align:center;">${i}</h3>`;
      } else {
        // Gregorian calendar reform: in 1582 Oct has only 21 days.
        // The day following Oct 4 is Oct 15
        if (i < 5) {
          html += `<td><h3 style="text-align:center;">${i}</h3>`;
        } else {
          html += `<td><h3 style="text-align:center;">${i+10}</h3>`;
        }
      }

      const cSpanMonth = cSpanMonths[cDay.chineseDate.cMonthIndex];
      const cSpanYear = yearExportData.cSpanYears[cSpanMonth.cYearIndex];
      const cMonthString = this.lunarMonthToString(
        'short',
        cSpanYear.cYear,
        cSpanMonth.cMonth,
        cSpanMonth.heMonth, 
        cSpanMonth.cMonthSize,
        cSpanMonth.isFirstMonth,
        cSpanMonth.leap,
      );
      // 农历每月的初一
      if (cDay.chineseDate.cDay === 1) { 
        html += `<p style="color:${cSpanMonth.isFirstMonth? 'red' : 'brown'};"><b>${cMonthString}${isNewMoonCloseToMidnight(yearExportData.year, month)? '<sup>*</sup>' : ''}</b></p>`;
      } else {
        let cDateString = '';
        // 公历每月的 1 号
        if (cDay.day === 1) {
          cDateString = interpolate(this.localeData.dateExpressions['normal'], {
            month: cMonthString,
            day: this.localeData.dayNumbers[String(cDay.chineseDate.cDay - 1)]
          });
        } else {
          cDateString = this.localeData.dayNumbers[String(cDay.chineseDate.cDay - 1)];
        }
        html += `<p>${cDateString}</p>`;
      }

      const heDayString = interpolate(this.localeData.dayExpressions['short.ganZhi'], {
        heaven: this.localeData.heavens[cDay.chineseDate.heDay[0]],
        earth: this.localeData.earths[cDay.chineseDate.heDay[1]]
      });
      html += `<p>${heDayString}</p>`;
      html += "</td>";
      if (week == 6) html += "</tr>";
    }
    if (week != 6) {
      html += `<td colspan="${6 - week!}"></td></tr>`;
    }

    html += "</table>";

    // Add moon phases
    const moonPhasesDetails = yearExportData.cMonths[month].moonPhasesDetails;
    if (moonPhasesDetails) {
      const moonPhaseLabel = interpolate(this.localeData.mixedExpressions['moonPhases'], {
        type: `（${String(yearExportData.cMonths[month].solarTermsType??'DE441')}）`
      });
      // year < 1734
      html += `<p class="moon_phases"><b>${moonPhaseLabel}</b>: `;

      for (let i = 0; i < moonPhasesDetails.length; i++) {
        const [hh, mm] = convertHoursToHHMM(moonPhasesDetails[i].hours);
        html += `[${this.localeData.moonPhases[String(moonPhasesDetails[i].phase)]}] ${moonPhasesDetails[i].day}<sup>d</sup>${hh}<sup>h</sup>${mm}<sup>m</sup>`;

        const eclipse = moonPhasesDetails[i].eclipse;
        if (eclipse) {
          let link = `http://ytliu.epizy.com/eclipse/one_${eclipse.type > 3 ? 'solar' : 'lunar'}_eclipse_general.html?`;
          link += `ybeg=${eclipse.ybeg}${eclipse.type > 3 ? '' : '&shrule=Danjon'}&ind=${eclipse.ind}&DE=441&ref=ccal`;
          html += `(<a href="${link}" target="_blank">${this.localeData.eclipseNames[String(eclipse.type)]}</a>)`;
        }

        if (i < moonPhasesDetails.length - 1) html += "&nbsp;&nbsp;";
      }

      html += "</p>";
    }


    // Add solar terms
    const solarTermsDetails = yearExportData.cMonths[month].solarTermsDetails;
    if (solarTermsDetails) {
      const solarTermLabel = interpolate(this.localeData.mixedExpressions['solarTerms'], {
        type: "（" + String(yearExportData.cMonths[month].solarTermsType??'DE441') + "）"
      });
      // year < 1734
      html += `<p class="solar_terms"><b>${solarTermLabel}</b>: `;

      for (let i = 0; i < solarTermsDetails.length; i ++) {
        let [hh, mm] = convertHoursToHHMM(solarTermsDetails[i].hours);
        html += `[${this.localeData.solarTermNames[solarTermsDetails[i].id]}] ${solarTermsDetails[i].day}<sup>d</sup>${hh}<sup>h</sup>${mm}<sup>m</sup>`;

        if (i < solarTermsDetails.length - 1) html += "&nbsp;&nbsp;";
      }

      html += "</p>";
    }

    // Add calendrical solar terms
    const calendricalSolarTerms = yearExportData.cMonths[month].calendricalSolarTermDetails;
    if (calendricalSolarTerms) {
      for( let i = 0; i < calendricalSolarTerms.length; i ++ ) {
        const cSolarTerms = calendricalSolarTerms[i];
        const solarTermLabel = interpolate(this.localeData.mixedExpressions['calendricalSolarTerms'], {
          name: this.localeData.calenderNames[cSolarTerms.calendarBook ?? 'calendrical'],
          type: cSolarTerms.type ? "（" + this.localeData.pingqi[String(cSolarTerms.type)] + "）" : ''
        });
        html += `<p class="solar_terms"><b>${solarTermLabel}</b>: `;

        const solarTermsDetails = calendricalSolarTerms[i].solarTermsDetails;
        for (let i = 0; i < solarTermsDetails.length; i ++) {
          html += `[${this.localeData.solarTermNames[solarTermsDetails[i].id]}] ${solarTermsDetails[i].day}<sup>d</sup>`;
          //let [hh, mm] = convertHoursToHHMM(solarTermsDetails[i].hours);
          //html += `[${this.localeData.solarTermNames[solarTermsDetails[i].id]}] ${solarTermsDetails[i].day}<sup>d</sup>${hh}<sup>h</sup>${mm}<sup>m</sup>`;

          if (i < solarTermsDetails.length - 1) html += "&nbsp;&nbsp;";
        }

        html += "</p>";
      }
    }

    const monthInfo = getMonthInfo(yearExportData.year, month + 1, yearExportData.calendar, this);
    if (monthInfo !== '') {
      html += `<p class="info"><sup>*</sup>${monthInfo}</p>`;
    }
    html += "<br/><br/>";

    return html;
  }
}