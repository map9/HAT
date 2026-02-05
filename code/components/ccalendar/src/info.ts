/**
 * 农历年月日信息
 * 从 chinesecalendar 项目移植
 */
import { isDefaultRegionCalendar, correctCalendarByYear } from './core/index.js';
import { ChineseCalendarType } from './types.js';
import { ChineseCalendarRender } from './ChineseCalendarRender.js'

/**
 * 通过给定的公历年获取指定年份农历/公历变更信息
 * 
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @param calendar - 历书或者政权名称
 * @param render.locale - 语言包
 * @returns 历书变更信息
 */
export function getYearInfo(year: number, calendar: ChineseCalendarType, render: ChineseCalendarRender): string {
  const correctedCalendar = correctCalendarByYear(year, calendar);
  let info: string = '';

  // Qin and early Han dynasty
  if (year >= -220 && year <= -103) {
      if (render.locale === 'en') {
          info = "The calendars used between 221 BCE and 104 BCE were modified versions of the Zhuanxu calendar, one of the old calendars used in the third century BCE in the state of Qin. The first month was the h&#224;i month (present-day month 10). However, it was still called month 10 instead of month 1. The numerical order of the months in a year was 10, 11, 12, 1, 2, ..., 9. The intercalary month was placed at the end of a year, called post month 9. There was a major calendar reform in 104 BCE, where the first month of a year was changed to month 1 and the intercalary month was placed in the month that did not contain a major solar term. The Chinese year in 104 BCE had 15 Chinese months as a result of the change.<br />The calendars in this period are reconstructed according to the description in the article \"Researches on Calendars from Qin to early Han (246 B.C. to 104 B.C.) &mdash; centering on excavated calendrical bamboo slips\" (秦至汉初(前246至前104)历法研究&mdash;以出土历简为中心), L&#464; Zh&#333;ngl&#237;n (李忠林), in <i>Studies in Chinese History</i> (《中国史研究》), issue no. 2, pp. 17&ndash;69 (2012). Our computation method is explained on <a href='QinHanCalendars.html'>this page</a>.";
      } else if (render.locale === 'zh-Hant') {
          info = "秦朝及漢初(公元前221年 &ndash; 前104年)的曆法沿用顓頊曆的月序。顓頊曆是古六曆之一，據說戰國後期在秦國使用。顓頊曆以建亥(即今天的十月)為年首，但仍稱建亥為十月。月的數序是十月、十一月、十二月、正月、二月……九月，閏月置於年終，稱為後九月。秦朝的曆法與顓頊曆稍有不同。漢朝建立後基本上沿用秦曆，一百年間只作了少許修改，直到漢武帝太初元年(公元前104年)才頒行新曆法，以建寅(正月)為年首，並把閏月置於無中氣的月份，這使公元前104年的農曆年有十五個農曆月。秦朝為了避秦始皇名諱(正、政同音)，把正月改稱「端月」，到漢朝又改回正月。這裡沒有跟從歷史，在秦朝仍稱建寅為正月。<br />本網頁這時期的復原日曆是根據李忠林的文章「秦至汉初(前246至前104)历法研究&mdash;以出土历简为中心」，發表於《中国史研究》2012年第2期第17&ndash;69頁。具體計算方法在<a href='QinHanCalendars_chinese.html'>秦與漢初曆法網頁</a>闡述。";
      } else {
          info = "秦朝及汉初(公元前221年 &ndash; 前104年)的历法沿用颛顼历的月序。颛顼历是古六历之一，据说战国后期在秦国使用。颛顼历以建亥(即今天的十月)为年首，但仍称建亥为十月。月的数序是十月、十一月、十二月、正月、二月……九月，闰月置于年终，称为后九月。秦朝的历法与颛顼历稍有不同。汉朝建立后基本上沿用秦历，一百年间只作了少许修改，直到汉武帝太初元年(公元前104年)才颁行新历法，以建寅(正月)为年首，并把闰月置于无中气的月份，这使公元前104年的农历年有十五个农历月。秦朝为了避秦始皇名讳(正、政同音)，把正月改称「端月」，到汉朝又改回正月。这里没有跟从历史，在秦朝仍称建寅为正月。<br />本网页这时期的复原日历是根据李忠林的文章「秦至汉初(前246至前104)历法研究&mdash;以出土历简为中心」，发表于《中国史研究》2012年第2期第17&ndash;69页。具体计算方法在<a href='QinHanCalendars_simp.html'>秦与汉初历法网页</a>阐述。";
      }
  }
  
  // Xin dynasty
  if (year >= 9 && year <= 23) {
      if (render.locale === 'en') {
          info = "The Xin dynasty was established in 9 CE The ch&#466;u month (present day month 12) was designated as the first month of a year; the year&#237;n month (present day month 1) became month 2 and so on. The Chinese month numbers were shifted by one. As a result, the Chinese year in 8 CE (W&#249; ch&#233;n) had only 11 months. When the Xin dynasty was overthrown in 23 CE, the month numbers were switched back with month 1 being the year&#237;n month again.";
          if (year==23) {
              info += '<br />As a result, the Chinese year in 23 CE had two sets of calendar: one for the Xin dynasty (ch&#466;u month being the first month) and the other for the restored Han dynasty (year&#237;n month being the first month), also known as Gengshi. The two sets of calendar had 11 overlapping months: months 2-12 in the Xin calendar were the same as months 1-11 in the Gengshi calendar.';
          }
      } else if (render.locale === 'zh-Hant') {
          info = "公元9年，王莽建立新朝，改正朔以殷正建丑(即現在的十二月)為年首，故公元8年的農曆年(戊辰年)只有十一個月。農曆月的數序是:建丑為正月、建寅為二月等等，與現在通用的月序相差一個月。新朝於地皇四年(癸未年，公元23年)亡，綠林軍擁立漢淮南王劉玄为帝，改元更始元年，恢復以建寅(即現在的正月)為年首。";
          if (year==23) {
              info += '<br />地皇四年和更始元年有十一個月重疊。地皇四年用丑正、更始元年用寅正，所以地皇四年二至十二月相當於更始元年正至十一月。';
          }
      } else {
          info = "公元9年，王莽建立新朝，改正朔以殷正建丑(即现在的十二月)为年首，故公元8年的农历年(戊辰年)只有十一个月。农历月的数序是:建丑为正月、建寅为二月等等，与现在通用的月序相差一个月。新朝于地皇四年(癸未年，公元23年)亡，绿林军拥立汉淮南王刘玄为帝，改元更始元年，恢复以建寅(即现在的正月)为年首。";
          if (year==23) {
              info += '<br />地皇四年和更始元年有十一个月重叠。地皇四年用丑正、更始元年用寅正，所以地皇四年二至十二月相当于更始元年正至十一月。';
          }
      }
  }
  
  // Wei dynasty 
  if (year >= 237 && year <= 240 && isDefaultRegionCalendar(correctedCalendar, year)) {
      if (render.locale === 'en') {
          info = "In 237 CE, emperor Mingdi of the Wei dynasty declared that the ch&#466;u month (present day month 12) would be the first month of a year; the year&#237;n month (present day month 1) became month 2 and so on. The Chinese month numbers were shifted by one. The new system was imposed after month 2 in the Chinese year in 237, in which month 4 was followed by month 2. When the emperor died in 239 CE, the month numbers were switched back with month 1 being the year&#237;n month again in the following year. As a result, the Chinese year in 239 had 13 months, where month 12 appeared twice.";
      } else if (render.locale === 'zh-Hant') {
          info = "魏青龍五年（丁巳年，公元237年），魏明帝改正朔，以殷正建丑(即現在的十二月)為年首，二月後實施，並改元景初元年。所以丁巳年沒有三月份，二月後的月份是四月。農曆月的數序是:建丑為正月、建寅為二月等等，與現在通用的月序相差一個月。景初三年（公元239年）明帝駕崩,次年恢復以建寅(即現在的正月)為年首。景初三年有兩個十二月。";
      } else {
          info = "魏青龙五年（丁巳年，公元237年），魏明帝改正朔，以殷正建丑(即现在的十二月)为年首，二月后实施，并改元景初元年。所以丁巳年没有三月份，二月后的月份是四月。农历月的数序是:建丑为正月、建寅为二月等等，与现在通用的月序相差一个月。景初三年（公元239年）明帝驾崩,次年恢复以建寅(即现在的正月)为年首。景初三年有两个十二月。";
      }
  }
  
  // Empress Consort Wu
  if (year >= 689 && year<= 700) {
      if (render.locale === 'en') {
          info = "In December 689, Empress Consort Wu designated the z&#464; month (month 11) as the first month of a year. However, the month numbers did not change. The z&#464; month was named Zheng, which is usually referred to month 1; ch&#466;u month was stilled called month 12; year&#237;n month was month 1 and so on. Here the Zheng month is still labelled as month 11. The first month of a year was changed back to month 1 in February 701. The Chinese year in 689 only had 11 months (one leap month), whereas the Chinese year in 700 had 15 months (one leap month).";
      } else if (render.locale === 'zh-Hant') {
          info = "公元689年12月，武則天改正朔，以周正建子(即現在的十一月)為年首，建子改稱正月，建寅（即現在的正月）改稱一月，其他農曆月的數序不變（即正月、十二月、一月、二月⋯⋯十月）。公元701年2月又改回以建寅為年首。公元689年的農曆年（己丑年）只有十一個月（其中一個月是閏月），而公元700年的農曆年（庚子年）有十五個月（其中一個月是閏月）。";
      } else {
          info = "公元689年12月，武则天改正朔，以周正建子(即现在的十一月)为年首，建子改称正月，建寅（即现在的正月）改称一月，其他农历月的数序不变（即正月、十二月、一月、二月__十月）。公元701年2月又改回以建寅为年首。公元689年的农历年（己丑年）只有十一个月（其中一个月是闰月），而公元700年的农历年（庚子年）有十五个月（其中一个月是闰月）。";
      }
  }
  
  // Tang dynasty
  if (year==761 || year==762) {
      if (render.locale === 'en') {
          info = "In December 761, emperor Suzong of the Tang dynasty designated the z&#464; month (present day month 11) as the first month of a year; the ch&#466;u month (present day month 12) became month 2; the year&#237;n month (present day month 1) became month 3 and so on. The Chinese month numbers were shifted by two. As a result, the Chinese year in 761 (X&#299;n ch&#466;u) had only 10 months. The month numbers ware switched back to the old system in April 762. The Chinese year in 762 (R&#233;n year&#237;n) had 14 months, with two month 4s and two month 5s.";
      } else if (render.locale === 'zh-Hant') {
          info = "公元761年12月，唐肅宗改正朔，以周正建子(即現在的十一月)為年首，建子改稱正月、建丑（即現在的十二月）改稱二月、建寅（即現在的正月）改稱三月等等，與現在通用的月序相差二個月。公元762年4月又把農曆月的數序改回以建寅為正月、建卯為二月等。公元761年的農曆年（辛丑年）只有十個月,而公元762年的農曆年（壬寅年）則有十四個月，其中有兩個四月和兩個五月。";
      } else {
          info = "公元761年12月，唐肃宗改正朔，以周正建子(即现在的十一月)为年首，建子改称正月、建丑（即现在的十二月）改称二月、建寅（即现在的正月）改称三月等等，与现在通用的月序相差二个月。公元762年4月又把农历月的数序改回以建寅为正月、建卯为二月等。公元761年的农历年（辛丑年）只有十个月,而公元762年的农历年（壬寅年）则有十四个月，其中有两个四月和两个五月。";
      }
  }
  
  // Gregorian calendar reform
  if (year==1582) {
      if (render.locale === 'en') {
          info = "Gregorian calendar reform: Julian calendar was used until October 4, after which the Gregorian calendar was used. To restore the March equinox to the date it had in 325 CE (March 21), the date was advanced so that October 4 was followed by October 15.";
      } else if (render.locale === 'zh-Hant') {
          info = "格里高里曆改:公曆在10月4日及之前用儒略曆，之後用格里高里曆。為使春分的日期回復到3月21日(公元325年時的春分日期)，10月4日的下一日改為10月15日，跳了10日。";
      } else {
          info = "格里高里历改:公历在10月4日及之前用儒略历，之后用格里高里历。为使春分的日期回复到3月21日(公元325年时的春分日期)，10月4日的下一日改为10月15日，跳了10日。";
      }
  }
  
  // Calendar Case
  if (year > 1666.5 && year < 1670.5 && isDefaultRegionCalendar(correctedCalendar, year)) {
      if (render.locale === 'en') {
          info = 'Following the Calendar Case (see, e.g., <a href="https://halshs.archives-ouvertes.fr/halshs-01222267/document" target="_blank">Jami 2015</a> and <a href="https://journals.sagepub.com/doi/full/10.1177/0021828620901887" target="_blank">Cullen &amp; Jami 2020</a>), the Qing government abolished the Western system of astronomy in the calendar computation in 1667-1669. The calendars in this period were calculated by the <i>D&#224;t&#466;ng</i> system, which was used in the Ming dynasty. The 24 solar terms were calculated based on the <i>p&#237;nq&#236;</i> rule, which took into account only the mean motion of the Sun. Two sets of calendrical solar terms are provided here for reference: the X&#299;nf&#462; solar terms are based on <i>3500 Years of Calendars and Astronomical Phenomena</i>, which are recomputed using the Western system; the <i>D&#224;t&#466;ng</i> solar terms are based on the <i>D&#224;t&#466;ng</i> system. As for the lunar conjunctions, the dates calculated using the <i>D&#224;t&#466;ng</i> astronomical system are identical to those computed using the Western system in these years.<br /><i>Update in May 2024:</i> There are imperial planetary ephemerides for 1662-1671 on the <a href="https://qingarchives.npm.edu.tw/index.php" target="_blank">Digital Library of Qing Archives</a> managed by the National Palace Museum in Taiwan. The dates and times of solar terms in the ephemeris for 1667-1669 agree with the calculations by the <i>D&#224;t&#466;ng</i> system although there was a slight modification of the calculations in 1669. Readers who are interested in this issue can read <a href="http://ytliu.epizy.com/Shixian/N1667_1669.html" target="_blank">my article</a> on my analyses of the moon phases and solar terms in this period';
      } else if (render.locale === 'zh-Hant') {
          info = '康熙六年至八年清政府因<a href="https://zh.wikipedia.org/zh-hant/%E5%BA%B7%E7%86%99%E5%8E%86%E7%8B%B1" target="_blank">曆獄</a>廢除西洋新法，復用明朝《大統曆》，二十四節氣改回平氣。這裡提供兩套曆書節氣:「新法節氣」根據《三千五百年历日天象》，此乃以後的欽天監依西洋新法追推的定氣;「大統曆節氣」根據明朝《大統曆》推算。至於朔日，依明朝《大統曆》和依《西洋新法曆書》計算結果在這幾年的日期完全一致。<br /><i>2024年5月更新:</i> 臺灣國立故宮博物院的<a href="https://qingarchives.npm.edu.tw/index.php" target="_blank">清代檔案檢索系統</a>藏有若干康熙初年的《大清七政經緯躔度時憲曆》，其中康熙六年至八年所載的節氣日期和時刻符合大統曆的推步，雖然康熙八年的計算有少許修改。對這幾年清朝曆書所載之月相和節氣時刻有興趣者，可參閱拙文<a href="http://ytliu.epizy.com/Shixian/N1667_1669_chinese.html" target="_blank">康熙六年至八年(1667-1669)的月相和節氣時刻</a>。';
      } else {
          info = '康熙六年至八年清政府因<a href="https://zh.wikipedia.org/zh-cn/%E5%BA%B7%E7%86%99%E5%8E%86%E7%8B%B1" target="_blank">历狱</a>废除西洋新法，复用明朝《大统历》，二十四节气改回平气。这里提供两套历书节气:「新法节气」根据《三千五百年历日天象》，此乃以后的钦天监依西洋新法追推的定气;「大统历节气」根据明朝《大统历》推算。至于朔日，依明朝《大统历》和依《西洋新法历书》计算结果在这几年的日期完全一致。<br /><i>2024年5月更新:</i> 台湾国立故宫博物院的<a href="https://qingarchives.npm.edu.tw/index.php" target="_blank">清代档案检索系统</a>藏有若干康熙初年的《大清七政经纬躔度时宪历》，其中康熙六年至八年所载的节气日期和时刻符合大统历的推步，虽然康熙八年的计算有少许修改。对这几年清朝历书所载之月相和节气时刻有兴趣者，可参阅拙文<a href="http://ytliu.epizy.com/Shixian/N1667_1669_simp.html" target="_blank">康熙六年至八年(1667-1669)的月相和节气时刻</a>。';
      }
  }
  return info;
}

/**
 * 
 */
/**
 * 通过给定的公历年/月获取指定月份农历/公历变更信息
 * 
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @param month - 月份
 * @param calendar - 历书或者政权名称
 * @param render.locale - 语言包
 * @returns 历书变更信息
 */
export function getMonthInfo(year: number, month: number, calendar: ChineseCalendarType, render: ChineseCalendarRender): string {
  const correctedCalendar = correctCalendarByYear(year, calendar);
  let info: string = '';

  if (year < 618) {
      return calendarNotesBefore618(year, month, calendar, render);
  }

  // Tang dynasty
  if (year > 617.5 && year < 908) {
      return calendarNotesTang(year, month, calendar, render);
  }

  // Ming dynasty
  if (year > 1367.5 && year < 1644.5) {
      return calendarNotesMing(year, month, calendar, render);
  }

  // Qing dynasty
  if (year > 1644.5 && year < 1911.5 && isDefaultRegionCalendar(correctedCalendar, year)) {
      return calendarNotesQing(year, month, calendar, render);
  }

  // Southern Ming and Zheng dynasty
  if (correctedCalendar === ChineseCalendarType.QING_SOUTHERNMING) {
      return SouthernMingCalendarDateNotes(year, month, calendar, render);
  }
  
  // 1912-1979
  if (year > 1911.5 && year < 1980) {
      return calendarNotes1912_1979(year, month, calendar, render);
  }

  // After 2050
  if (year > 2050) {
      return calendarNotesAfter2050(year, month, calendar, render);
  }

  return info;
}

function calendarNotesBefore618(year: number, month: number, calendar: ChineseCalendarType, render: ChineseCalendarRender) {
    let info = '';
    // Han calendar reform
    if (year==-103 && month==6) {
        if (render.locale === 'en') {
            info = "New calendar is displayed starting from month 5. The lunar conjunction day was one day earlier than that of the old calendar, turning month 4 into a short month.";
        } else if (render.locale === 'zh-Hant') {
            info = "五月起的日曆依太初曆，朔日比舊曆早一日，使四月變成小月。";
        } else {
            info = "五月起的日历依太初历，朔日比旧历早一日，使四月变成小月。";
        }
    } 
    
    // Xin dynasty
    if (year==9 && month==1) {
        if (render.locale === 'en') {
            info = "The ch&#466;u month was supposed to be month 12. It became month 1 by edict. Hence, there was no month 12 in the Chinese year W&#249; ch&#233;n.";
        } else if (render.locale === 'zh-Hant') {
            info = "本來十二月是建丑，改正朔後建丑變成正月，所以戊辰年沒有十二月。";
        } else {
            info = "本来十二月是建丑，改正朔后建丑变成正月，所以戊辰年没有十二月。";
        }
    }
    if (year==23 && month > 1) {
        let month_numChi = ["正","二","三","四","五","六","七","八","九","十", "十一","十二"];
        let cdates_eng = ['February 10th', 'March 11th', 'April 10th', 'May 9th', 'June 8th', 'July 7th', 'August 6th', 'September 4th', 'October 4th', 'November 2nd', 'December 2nd'];
        let cdates_chi = ['2月10日', '3月11日', '4月10日', '5月9日', '6月8日', '7月7日', '8月6日', '9月4日', '10月4日', '11月2日', '12月2日'];
        let msg = [cdates_eng[month-2]+' was the first day of month '+month+' in the Xin calendar and the first day of month '+(month-1)+' in the Gengshi calendar.', cdates_chi[month-2]+'是地皇四年'+month_numChi[month-1]+'月初一、更始元年'+month_numChi[month-2]+'月初一。', cdates_chi[month-2]+'是地皇四年'+month_numChi[month-1]+'月初一、更始元年'+month_numChi[month-2]+'月初一。'];
        if (month==12) {
            msg[0] += ' December 31st was the first day of month 12 in the Gengshi calendar.';
            msg[1] += '12月31日是更始元年十二月初一。';
            msg[2] += '12月31日是更始元年十二月初一。';
        }
        if (render.locale === 'en') {
          info = msg[0];
        } else if (render.locale === 'zh-Hant') {
          info = msg[1];
        } else {
          info = msg[2];
        }
    }
    // if (year==23 && month==12) {
    //     if (render.locale === 'en') {
    //         info = "Since month 1 was to switch back to be the year&#237;n month in the following year, there were two month 12s in this Chinese year. The first one was the z&#464; month and the second one was the ch&#466;u month. These two month 12s should not be confused as they can be distinguished by their sexagenary month cycles.";
    //     } else if (render.locale === 'zh-Hant') {
    //         info = "下一年的正月恢復為建寅，這一年的農曆有兩個十二月:建子和建丑。由於已註明了月干支，兩個十二月應不會被混淆。";
    //     } else {
    //         info = "下一年的正月恢复为建寅，这一年的农历有两个十二月:建子和建丑。由于已注明了月干支，两个十二月应不会被混淆。";
    //     }
    // }
    
    // Wei dynasty
    if (year==237 && month==2 && isDefaultRegionCalendar(calendar, year)) {
        if (render.locale === 'en') {
            info = "Note that month 12 had only 28 days. This was due to the adoption of a new version of calendar in month 1. There are discrepancies between the data in the main text and Appendix 2 in the book <i>3500 Years of Calendars and Astronomical Phenomena</i>. The main text uses the new calendar in month 1, but Appendix 2 uses the new calendar in month 6. Here the data in the main text are used, in which the first days of each month before month 6 are one day earlier.";
        } else if (render.locale === 'zh-Hant') {
            info = "由於新曆法(景初曆)於正月初一開始使用，十二月只有二十八日。《三千五百年历日天象》的正文與其附表2的資料不合，正文在正月改用景初曆，附表2在六月才改曆。這裡用正文的數據，在六月前的朔日都比附表2早一日。";
        } else {
            info = "由于新历法(景初历)于正月初一开始使用，十二月只有二十八日。。《三千五百年历日天象》的正文与其附表2的资料不合，正文在正月改用景初历，附表2在六月才改历。这里用正文的数据，在六月前的朔日都比附表2早一日。";
        }
    }
    if (year==237 && month==4 && isDefaultRegionCalendar(calendar, year)) {
        if (render.locale === 'en') {
            info = "The ch&#233;n month was supposed to be month 3. It became month 4 by edict. Hence, there was no month 3 in this Chinese year."; 
        } else if (render.locale === 'zh-Hant') {
            info = "本來三月是建辰，改正朔後變成四月，所以丁巳年沒有三月。"; 
        } else {
            info = "本来三月是建辰，改正朔后变成四月，所以丁巳年没有三月。"; 
        }
    }
    if (year==240 && month==1 && isDefaultRegionCalendar(calendar, year)) {
        if (render.locale === 'en') {
            info = "Since month 1 was to switch back to be the year&#237;n month in the year G&#275;ng sh&#275;n, there were two month 12s in the year J&#464; w&#232;i. The first one was the z&#464; month and the second one was the ch&#466;u month. These two month 12s should not be confused as they can be distinguished by their sexagenary month cycles.";
        } else if (render.locale === 'zh-Hant') {
            info = "庚申年的正月恢復為建寅，己未年的農曆有兩個十二月:建子和建丑。由於已註明了月干支，兩個十二月應不會被混淆。";
        } else {
            info = "庚申年的正月恢复为建寅，己未年的农历有两个十二月:建子和建丑。由于已注明了月干支，两个十二月应不会被混淆。";
        }
    }
    
    if (year==238 && month==11 && calendar === ChineseCalendarType.TKI_WU) {
        if (render.locale === 'en') {
            info ='In Appendix 2 of the book <i>3500 Years of Calendars and Astronomical Phenomena</i>, the sexagenary day of the leap month conjunction is listed as j&#464; ch&#466;u, corresponding to Nov. 25. This is at odds with my calculation. The result of my calculation is consistent with the data on the <a href="http://sinocal.sinica.edu.tw/" target="_blank">Chinese-Western calendar conversion website</a> created by Academia Sinica in Taiwan. The preface of the book says that the calendar data in its appendices are based on the book 《歷代長術輯要》(<i>Compilation of Historical Calendars</i>) by W&#257;ng Yu&#275;zh&#275;n (汪曰楨). I looked at the book and found that the date listed there was also the same as my calculation. I suspect that the date listed in <i>3500 Years of Calendars and Astronomical Phenomena</i> is wrong. The book also lists the sexagenary day of the month 11 conjunction as j&#464; ch&#466;u, which is certainly wrong since this date was far away from the new moon close to the beginning of month 11.'; 
        } else if (render.locale === 'zh-Hant') {
            info ='《三千五百年历日天象》附表2記閏十月己丑朔和十一月己丑朔。十一月己丑朔無疑是錯的，這裡列出的閏十月戊子朔是根據我的推步，結果與台灣中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">兩千年中西曆轉換網站</a>一致，《三千五百年历日天象》前言說其附表參照清汪曰楨的《歷代長術輯要》，翻查此書發現亦記閏十月戊子。';
        } else {
            info = '《三千五百年历日天象》附表2记闰十月己丑朔和十一月己丑朔。十一月己丑朔无疑是错的，这里列出的闰十月戊子朔是根据我的推步，结果与台湾中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">两千年中西历转换网站</a>一致，《三千五百年历日天象》前言说其附表参照清汪曰桢的《历代长术辑要》，翻查此书发现亦记闰十月戊子。';
        }
    }
    
    if (year==447 && month==12 && (
      calendar === ChineseCalendarType.SOUTHNORTH_NORTH_NORTHERNWEI ||
      calendar === ChineseCalendarType.SOUTHNORTH_NORTH_WESTERNWEI || 
      calendar === ChineseCalendarType.SOUTHNORTH_NORTH_NORTHERNZHOU || 
      calendar === ChineseCalendarType.SOUTHNORTH_NORTH_SUI
    )) {
        if (render.locale === 'en') {
            info = "According to <i>Index to Comprehensive Mirror to Aid in Governmance</i>, the month 11 conjunction occurred on a ji&#462; x&#363; day (Dec. 23). However, in <i>Compilation of Historical Calendars</i> by W&#257;ng Yu&#275;zh&#275;n, the month 12 conjunction was listed on a ji&#462; x&#363; day and is at odds with its statement that the winter solstice occurred on a ji&#462; x&#363; day in month 11. The month 12 conjunction on a ji&#462; x&#363; day is certainly a typo because a ji&#462; x&#363; day was 29 days (or 89 days) after a year&#464; s&#236; day, which was the leap month 10 conjunction date. So ji&#462; x&#363; day could only be the month 11 conjunction date. In <i>3500 Years of Calendars and Astronomical Phenomena</i> by Zh&#257;ng P&#233;iy&#250; and <i>Tables of Historical Lunar Conjunctions and Leap Months</i> by Ch&#233;n Yu&#225;n, the month 11 conjunction is mistakenly listed on Dec. 24. They were probably misled by W&#257;ng's typo. The book <i>A Sino-Western Calendar For Two Thousand Years (1-2000)</i> by Hsueh Chung-San and Ouyang Yi correctly places the month 11 conjunction on Dec. 23. Surprisingly, the <a href='http://sinocal.sinica.edu.tw/' target='_blank'>Chinese-Western calendar conversion website</a> created by Academia Sinica in Taiwan, whose ancient calendar data are based on <i>A Sino-Western Calendar For Two Thousand Years (1-2000)</i>, does not follow the book and mistakenly places the month 11 conjunction on Dec. 24.";
        } else if (render.locale === 'zh-Hant') {
            info = '《通鑑目錄》記十一月甲戌朔，汪曰楨《歷代長術輯要》卻記「十乙亥、十二甲戌朔、閏十(十甲辰小雪、十一甲戌冬至)」，沒有記閏十月朔和十一月朔干支就是說兩朔日的天干和都是乙，但是「十二甲戌」是錯的，因為閏十朔是乙巳，而甲戌在乙巳後29日(或89日)，絕不可能是十二月朔，而且與其「十一甲戌冬至」相悖，可見「十二甲戌朔」應是「十一甲戌朔」之誤，「十二甲戌朔」是宋曆而非魏曆。張培瑜《三千五百年历日天象》和陳垣《二十史朔閏表》可能被《歷代長術輯要》誤導，記十一月乙亥朔及十二月甲辰朔。薛仲三、歐陽頤的《兩千年中西曆對照表》則沒有錯，奇怪的是臺灣中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">兩千年中西曆轉換</a>卻不跟從《兩千年中西曆對照表》，也弄錯了十一月朔的日期。';
        } else {
            info ='《通鉴目录》记十一月甲戌朔，汪曰桢《历代长术辑要》却记「十乙亥、十二甲戌朔、闰十(十甲辰小雪、十一甲戌冬至)」，没有记闰十月朔和十一月朔干支就是说两朔日的天干和都是乙，但是「十二甲戌」是错的，因为闰十朔是乙巳，而甲戌在乙巳后29日(或89日)，绝不可能是十二月朔，而且与其「十一甲戌冬至」相悖，可见「十二甲戌朔」应是「十一甲戌朔」之误，「十二甲戌朔」是宋历而非魏历。张培瑜《三千五百年历日天象》和陈垣《二十史朔闰表》可能被《历代长术辑要》误导，记十一月乙亥朔及十二月甲辰朔。薛仲三、欧阳颐的《两千年中西历对照表》则没有错，奇怪的是台湾中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">两千年中西历转换</a>却不跟从《两千年中西历对照表》，也弄错了十一月朔的日期。';
        }
    }
    
    if (year==502 && month==6 && isDefaultRegionCalendar(calendar, year)) {
        if (render.locale === 'en') {
            info = "There is a discrepancy between the main text and Appendix 3 in the book <i>3500 Years of Calendars and Astronomical Phenomena</i>. The leap month in this year is listed as after month 5 in the main text but after month 4 in Appendix 3.";
        } else if (render.locale === 'zh-Hant') {
            info = "《三千五百年历日天象》的正文與其附表3的資料不一致，正文記這年閏五月，附表3則為閏四月。";
        } else {
            info = "《三千五百年历日天象》的正文与其附表3的资料不一致，正文记這年闰五月，附表3则为闰四月。";
        } 
    }
    
    if (year==575 && month==9 && isDefaultRegionCalendar(calendar, year)) {
        if (render.locale === 'en') {
            info = "There is a discrepancy between the main text and Appendix 3 in the book <i>3500 Years of Calendars and Astronomical Phenomena</i>. The leap month in this year is listed as after month 8 in the main text but after month 9 in Appendix 3.";
        } else if (render.locale === 'zh-Hant') {
            info = "《三千五百年历日天象》的正文與其附表3的資料不一致，正文記這年閏八月，附表3則為閏九月。";
        } else {
            info = "《三千五百年历日天象》的正文与其附表3的资料不一致，正文记這年闰八月，附表3则为闰九月。";
        }
    }
    
    if (year==575 && month==9 && (
      calendar == ChineseCalendarType.SOUTHNORTH_NORTH_EASTERNWEI || 
      calendar == ChineseCalendarType.SOUTHNORTH_NORTH_NORTHERNQI
    )) {
        if (render.locale === 'en') {
            info = "Appendix 3 of the book <i>3500 Years of Calendars and Astronomical Phenomena</i> lists the leap month as after month 9. This is at odds with my calculation, which agrees with the data on the <a href='http://sinocal.sinica.edu.tw/' target='_blank'>Chinese-Western calendar conversion website</a> created by Academia Sinica in Taiwan. The data in Appendix 3 are supposed to be based on the book 《歷代長術輯要》(<i>Compilation of Historical Calendars</i>) by W&#257;ng Yu&#275;zh&#275;n (汪曰楨), but that book also lists the leap month as after month 8. That's why I use my calculation here.";
        } else if (render.locale === 'zh-Hant') {
            info = "《三千五百年历日天象》附表3記這年北齊閏九月，與我計算的閏八月不一致，台灣中央研究院的<a href='http://sinocal.sinica.edu.tw/' target='_blank'>兩千年中西曆轉換網站</a>和汪曰楨的《歷代長術輯要》也記這年閏八月，所以這裡不取《三千五百年历日天象》的數據。";
        } else {
            info = '《三千五百年历日天象》附表3记这年北齐闰九月，与我计算的闰八月不一致，台湾中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">两千年中西历转换网站</a>和汪曰桢的《历代长术辑要》也记这年闰八月，所以这里不取《三千五百年历日天象》的数据。';
        }
    }

    return info;
}

function calendarNotesTang(year: number, month: number, calendar: ChineseCalendarType, render: ChineseCalendarRender) {
    let info = '';
    if (year==678 && (month==11 || month==12)) {
        if (render.locale === 'en') {
            info = 'The <i>Old Book of Tang</i> mentions leap month 10 in this year. However, the <i>New Book of Tang</i> mentions leap month 11. Many scholars adopt the data in the <i>New Book of Tang</i>. However, Huang Yi-Long, Professor in the Institute of History at the National Tsing-Hua University in Taiwan, <a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">investigated the issue</a> and concludes that the record in the <i>Old Book of Tang</i> is more reliable. His analysis places leap month 10 beginning on Nov. 19 and month 11 beginning on Dec. 19.';
        } else if (render.locale === 'zh-Hant') {
            info = '《舊唐書》有閏十月的記載，《新唐書》卻有閏十一月記載，學者一般取《新唐書》的閏月。但台灣國立清華大學歷史研究所的黃一農教授經過<a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">考證</a>後認為《舊唐書》的記載比較可信。根據他的考證，閏十月朔是癸丑(11月19日)，十一月朔是癸未(12月19日)。';
        } else {
            info = '《旧唐书》有闰十月的记载，《新唐书》却有闰十一月记载，学者一般取《新唐书》的闰月。但台湾国立清华大学历史研究所的黄一农教授经过<a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">考证</a>后认为《旧唐书》的记载比较可信。根据他的考证，闰十月朔是癸丑(11月19日)，十一月朔是癸未(12月19日)。';
        }
    }
    if (year==684 && month==1) {
        if (render.locale === 'en') {
            info = 'The New Year day was supposed to be on Jan 22, but it was moved to Jan 23 by edict.';
        } else if (render.locale === 'zh-Hant') {
            info = '正月朔本在癸未(1月22日)，但唐高宗在弘道元年八月下旨，強將十二月改為大月，使正月朔移至甲申(1月23日)。';
        } else {
            info = '正月朔本在癸未(1月22日)，但唐高宗在弘道元年八月下旨，强将十二月改为大月，使正月朔移至甲申(1月23日)。';
        }
    }
    if (year==697 && month==12) {
        if (render.locale === 'en') {
            info = 'The calendrical winter solstice was originally on Dec. 18, but Empress Consort Wu changed several calendar dates by edict. It was claimed that several predicted conjunction dates in the previous years were incorrect, resulting in the Moon being visible on the last days of lunar months. The claim was in fact incorrect and was a pretense for the empress to change calendar dates so that the winter solstice would fall on the ji&#462; z&#464; day (Dec. 20) and coincide with the lunar conjunction. After an "investigation", it was decided that the winter solstice should be moved to the ji&#462; z&#464; day (Dec. 20), which "happened to coincide" with the lunar conjunction. Because of this change, the lunar month started on Nov. 20 became a leap month and the winter solstice became the New Year day. There was originally a leap month after month 12. It had to be changed to month 12. In order to do that, the middle solar term Z12 was moved from Jan 17, 698 to Jan 18, 698.';
        } else if (render.locale === 'zh-Hant') {
            info = '曆書冬至本在壬戌(12月18日)，閏十月本為正月，但武則天為了營造正月甲子合朔冬至之罕見曆象，七月下詔強行更改曆日。詔書偽稱曆官所推合朔時刻有不合天象，出現了「晦仍見月，有爽天經」之象，經「重更尋討」後「果差一日」，於是強將原本所推冬至移後二日為正月甲子合朔冬至，使原本的正月變為閏十月，為了除消原本所推的閏十二月，又強將大寒由壬辰(698年1月17日)推遲一日至癸巳(698年1月18日)。';
        } else {
            info = '历书冬至本在壬戌(12月18日)，闰十月本为正月，但武则天为了营造正月甲子合朔冬至之罕见历象，七月下诏强行更改历日。诏书伪称历官所推合朔时刻有不合天象，出现了「晦仍见月，有爽天经」之象，经「重更寻讨」后「果差一日」，于是强将原本所推冬至移后二日为正月甲子合朔冬至，使原本的正月变为闰十月，为了除消原本所推的闰十二月，又强将大寒由壬辰(698年1月17日)推迟一日至癸巳(698年1月18日)。';
        }
    }
    if (year==698 && month==1) {
        if (render.locale === 'en') {
            info = 'The calendrical Z12 was originally on Jan. 17, but was changed to Jan. 18 in order to cancel a leap month originally calculated but was moved to after the 10th month of the previous year.';
        } else if (render.locale === 'zh-Hant') {
            info = '曆書大寒本在壬辰(1月17日)，曆官強行移後一日以除消原本所推的閏月。';
        } else {
            info = '历书大寒本在壬辰(1月17日)，历官强行移后一日以除消原本所推的闰月。';
        }
    }
    if (year==725 && month==1) {
        if (render.locale === 'en') {
            info = 'The conjunction on Jan 19 was supposed to be the New Year day for the Chinese year in 725. However, in order to prevent a solar eclipse on the New Year day, the leap month was moved to a month earlier by edict and became the last month in the Chinese year in 724 and the New Year day was moved to Feb 18, 725.';
        } else if (render.locale === 'zh-Hant') {
            info = '丙辰朔本是開元十三年正月朔，為避正旦日食，當時強將閏月推前一月，使正月丙辰朔變閏十二月丙辰朔，閏正月丙戌朔(2月18日)變正月丙戌朔。';
        } else {
            info = '丙辰朔本是开元十三年正月朔，为避正旦日食，当时强将闰月推前一月，使正月丙辰朔变闰十二月丙辰朔，闰正月丙戌朔(2月18日)变正月丙戌朔。';
        }
    }
    if (year==725 && month==2) {
        if (render.locale === 'en') {
            info = 'The month associated with the conjunction on Feb 18 was supposed to be a leap month, but the leap month was moved to a month earlier in order to prevent a solar eclipse on the New Year day. As a result, the Feb 18 conjunction became the New Year day. The calendrical Z1 was also moved from Feb 16 to Feb 18 to be consistent with the change.';
        } else if (render.locale === 'zh-Hant') {
            info = '丙戌朔本是閏正月朔，為避正旦日食，當時強將閏月推前一月，故閏正月朔變為正月朔。曆書雨水(當時稱為啟蟄)本在甲申(2月16日)，亦強進為丙戌(2月18日)。';
        } else {
            info = '丙戌朔本是闰正月朔，为避正旦日食，当时强将闰月推前一月，故闰正月朔变为正月朔。历书雨水(当时称为启蛰)本在甲申(2月16日)，亦强进为丙戌(2月18日)。';
        }
    }
    if (year==761 && month==12) {
        if (render.locale === 'en') {
            info = "The z&#464; month was supposed to be month 11, but it became month 1 by edict. There were no months 11 and 12 in the year X&#299;n ch&#466;u";
        } else if (render.locale === 'zh-Hant') {
            info = "本來建子是十一月，改正朔後變成正月。農曆辛丑年沒有十一和十二月。";
        } else {
            info = "本来建子是十一月，改正朔后变成正月。农历辛丑年没有十一和十二月。";
        }
    }
    if (year==762 && month==4) {
        if (render.locale === 'en') {
            info = "Note that there was a second month 4 and second month 5 this year because it was decided that after the first month 5, the month numbers were switched back to the year&#237;n month being month 1, month&#462;o month being month 2, ch&#233;n being month 3, s&#236; month being month 4 and so on. As a result, there were two month 4s and two month 5s in this Chinese year. They can be distinguished by their sexagenary month cycles.";
        } else if (render.locale === 'zh-Hant') {
            info = "五月之後的那個月是四月。這是因為五月後正朔改回以建寅為正月、建卯為二月、建辰為三月、建巳為四月等。農曆壬寅年因此有兩個四月（建卯和建巳）和兩個五月（建辰和建午）。由於已註明月干支，這些重複的月份應不會被混潸。";
        } else {
            info = "五月之后的那个月是四月。这是因为五月后正朔改回以建寅为正月、建卯为二月、建辰为三月、建巳为四月等。农历壬寅年因此有两个四月（建卯和建巳）和两个五月（建辰和建午）。由于已注明月干支，这些重复的月份应不会被混潸。";
        }
    }
    return info;
}

function calendarNotesMing(year: number, month: number, calendar: ChineseCalendarType, render: ChineseCalendarRender) {
    let info = '';

    // Gregorian calendar reform
    if (year==1582 && month==10) {
        if (render.locale === 'en') {
            info = "Note that October 4 was followed by October 15 because of the Gregorian calendar reform.";
        } else if (render.locale === 'zh-Hant') {
            info = "由於格里高里曆改，10月4日的下一日是10月15日，跳了10日。";
        } else {
            info = "由于格里高里历改，10月4日的下一日是10月15日，跳了10日。";
        }
    }
    
    // 1462
    if (year==1462 && month==11) {
        if (render.locale === 'en') {
            info = '<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 11 on Nov. 22, which is inconsistent with the calendar issued by the Ming government (Nov. 21).';
        } else if (render.locale === 'zh-Hant') {
            info = '《三千五百年历日天象》記十一月壬辰朔(11月22日)，不合當年的《大統曆》曆書(辛卯朔, 11月21日)，見<a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">「中國史曆表朔閏訂正舉隅 &mdash; 以唐《麟德曆》行用時期為例」</a>緒言。';
        } else {
            info = '《三千五百年历日天象》记十一月壬辰朔(11月22日)，不合当年的《大统历》历书(辛卯朔, 11月21日), 见<a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">「中国史历表朔闰订正举隅 &mdash; 以唐《麟德历》行用时期为例」</a>绪言。';
        }
    }
    
    // 1581
    if (year==1581 && month==10) {
        if (render.locale === 'en') {
            info = '<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 10 on Oct. 28, which is inconsistent with the calendar issued by the Ming government (Oct. 27).';
        } else if (render.locale === 'zh-Hant') {
            info = '《三千五百年历日天象》記十月壬辰朔(10月28日)，不合當年的《大統曆》曆書(辛卯朔, 10月27日)，見《國家圖書館藏明代大統曆日彙編》第三冊第606頁。';
        } else {
            info = '《三千五百年历日天象》记十月壬辰朔(10月28日)，不合当年的《大统历》历书(辛卯朔, 10月27日)，见《国家图书馆藏明代大统历日汇编》第三册第606页。';
        }
    }
    
    // 1588, 1589
    if (year==1588 && month==3) {
        if (render.locale === 'en') {
            info = '<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 3 on Mar. 26, which is inconsistent with the calendar issued by the Ming government (Mar. 27).';
        } else if (render.locale === 'zh-Hant') {
            info = '《三千五百年历日天象》記三月癸未朔(3月26日)，不合<a href="http://catalog.digitalarchives.tw/item/00/07/ec/c9.html" target="_blank">當年的《大統曆》曆書</a>(甲申朔, 3月27日)。';
        } else {
            info = '《三千五百年历日天象》记三月癸未朔(3月26日)，不合<a href="http://catalog.digitalarchives.tw/item/00/07/ec/c9.html" target="_blank">当年的《大统历》历书</a>(甲申朔, 3月27日)。';
        }
    }
    if (year==1588 && month==4) {
        if (render.locale === 'en') {
            info = '<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 4 on Apr. 25, which is inconsistent with the calendar issued by the Ming government (Apr. 26).';
        } else if (render.locale === 'zh-Hant') {
            info = '《三千五百年历日天象》記四月癸丑朔(4月25日)，不合<a href="http://catalog.digitalarchives.tw/item/00/07/ec/c9.html" target="_blank">當年的《大統曆》曆書</a>(甲寅朔, 4月26日)。';
        } else {
            info = '《三千五百年历日天象》记四月癸丑朔(4月25日)，不合<a href="http://catalog.digitalarchives.tw/item/00/07/ec/c9.html" target="_blank">当年的《大统历》历书</a>(甲寅朔, 4月26日)。';
        }
    }
    if (year==1589 && month==1) {
        if (render.locale === 'en') {
            info = '<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 12 on Jan. 17, which is inconsistent with the calendar issued by the Ming government (Jan. 16).';
        } else if (render.locale === 'zh-Hant') {
            info = '《三千五百年历日天象》記十二月庚辰朔(1月17日)，不合當年的《大統曆》曆書(己卯朔, 1月16日)，見《國家圖書館藏明代大統曆日彙編》第四冊第175頁。';
        } else {
            info = '《三千五百年历日天象》记十二月庚辰朔(1月17日)，不合当年的《大统历》历书(己卯朔, 1月16日)，见《国家图书馆藏明代大统历日汇编》第四册第175页。';
        }
    }
    
    // 1600
    if (year==1600 && month==2) {
        if (render.locale === 'en') {
            info = '<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the New Year day on Feb. 14, which is inconsistent with the calendar issued by the Ming government (Feb. 15).';
        } else if (render.locale === 'zh-Hant') {
            info = '《三千五百年历日天象》記正月乙巳朔(2月14日)，不合當年的《大統曆》曆書(丙午朔, 2月15日)，見《國家圖書館藏明代大統曆日彙編》第四冊第445頁。';
        } else {
            info = '《三千五百年历日天象》记正月乙巳朔(2月14日)，不合当年的《大统历》历书(丙午朔, 2月15日)，见《国家图书馆藏明代大统历日汇编》第四册第445页。';
        }
    }
    
    // 1609
    if (year==1609 && month==2) {
        if (render.locale === 'en') {
            info = '<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the New Year day on Feb. 4, which is inconsistent with the calendar issued by the Ming government (Feb. 5).';
        } else if (render.locale === 'zh-Hant') {
            info = '《三千五百年历日天象》記正月癸未朔(2月4日)，不合當年的《大統曆》曆書(甲申朔, 2月5日)，見《國家圖書館藏明代大統曆日彙編》第五冊第67頁。';
        } else {
            info = '《三千五百年历日天象》记正月癸未朔(2月4日)，不合当年的《大统历》历书(甲申朔, 2月5日)，见《国家图书馆藏明代大统历日汇编》第五册第67页。';
        }
    }

    return info;
}

function calendarNotesQing(year: number, month: number, calendar: ChineseCalendarType, render: ChineseCalendarRender) {
    let info = '';

    // 1645
    if (year==1645 && month==7) {
        if (render.locale === 'en') {
            info = 'Note that leap month 6 contained the major solar term Z6, breaking the rule that a leap month must not contain a major solar term. W&#257;ng Yu&#275;zh&#275;n (&#27754;&#26352;&#26984;), a Chinese mathematician in the 19th century, explained that even though the solar term Z6 and the lunar conjunction associated with the month occurred on the same day, Z6 occurred earlier in the day than the lunar conjunction and was counted as a major solar term of the previous month. As a result, leap month 6 did not contain any major solar term. This "rule" was only used in this year. It was never used again after this year.';
        } else if (render.locale === 'zh-Hant') {
            info = '大暑這中氣出現在閏六月初一，違反了閏月不含中氣的規定。清朝曆算家汪曰楨解釋說雖然大暑與朔發生在同一日，大暑的時刻早於合朔時刻，屬於前月之中氣，所以閏六月不含中氣。這說法明顯不合傳統，屬於新的置閏法則，但是這新法則只在這一年用過，以後不再使用。';
        } else {
            info = '大暑这中气出现在闰六月初一，违反了闰月不含中气的规定。清朝历算家汪曰桢解释说虽然大暑与朔发生在同一日，大暑的时刻早于合朔时刻，属于前月之中气，所以闰六月不含中气。这说法明显不合传统，属于新的置闰法则，但是这新法则只在这一年用过，以后不再使用。';
        }
        return info;
    }

    // 1662
    if (year==1662 && month==2) {
        if (render.locale === 'en') {
            info = 'The Chinese New Year in 1662 was originally on Feb. 19. There was a leap month after month 7 in 1661 and two major solar terms (Z11 and Z12) in month 11. The major solar term Z1 was originally placed on the last day of month 12 in 1661, leaving the first month in 1662 without a major solar term. To avoid controversy, the New Year Day was moved to Feb. 18 so that the first month would contain Z1, thus moving the month without major solar term to the last month of 1661.';
        } else if (render.locale === 'zh-Hant') {
            info = '康熙元年正月初一本在丙子日(2月19日)，事緣順治十八年閏七月，當年十一月含冬至和大寒兩中氣，雨水本來定在十二月晦，但這使康熙元年正月不含中氣。為免遭人非議，欽天監將正月初一提前一日至乙亥日(2月18日)，使正月含雨水，無中氣月便移到十二月。';
        } else {
            info = '康熙元年正月初一本在丙子日(2月19日)，事缘顺治十八年闰七月，当年十一月含冬至和大寒两中气，雨水本来定在十二月晦，但这使康熙元年正月不含中气。为免遭人非议，钦天监将正月初一提前一日至乙亥日(2月18日)，使正月含雨水，无中气月便移到十二月。';
        }
        return info;
    }
    
    // 1670
    if (year==1670 && month==1) {
        if (render.locale === 'en') {
            info = 'The Chinese month that began on Jan 21 was a leap month according to the old calendar rule since it did not contain a major solar term. It was the first month of 1670 according to the new rule since it contained the major solar term Z1. In April 1669, the Kangxi Emperor abolished the old rule and ordered by decree to move the leap month from after the 12th month of 1669 to after the second month of 1670.';
        } else if (render.locale === 'zh-Hant') {
            info = '己丑朔(1月21日)對應的月份依舊法因不含中氣，為康熙八年閏十二月，依新法則含中氣雨水，為康熙九年正月。康熙帝在康熙八年三月下詔復用西洋新法，廢康熙八年閏十二月，改為康熙九年閏二月。';
        } else {
            info = '己丑朔(1月21日)对应的月份依旧法因不含中气，为康熙八年闰十二月，依新法则含中气雨水，为康熙九年正月。康熙帝在康熙八年三月下诏复用西洋新法，废康熙八年闰十二月，改为康熙九年闰二月。';
        }
        return info;
    }

    // 1679
    if (year==1679 && month==5) {
        if (render.locale === 'en') {
            info = "In both <i>3500 Years of Calendars and Astronomical Phenomena</i> (by Zhang Peiyu) and <i>A Chinese calendar translated into the western calendar from 1516 to 1941</i> (by Zheng Hesheng), the calendrical solar term Z4 is listed on May 20. However, the Shixian Calendar for the 18th year of Emperor Kangxi's Reign (i.e. Feb. 11, 1679 - Jan. 30, 1680), a yearly calendar issued by the Imperial Astronomical Bureau in the Qing dynasty, lists Z4 on May 21 at 9:01am in Beijing's local apparent solar time. The calendarical solar term for Z4 is listed on May 21 here based on the Shixian Calendar.";
        } else if (render.locale === 'zh-Hant') {
            info = '張培瑜《三千五百年历日天象》和鄭鶴聲《近世中西史日對照表》皆記小滿為5月20日，但《大清康熙十八年歲次己未時憲曆》則載「(四月)十二日丙子巳初初刻一分小滿四月中」，即小滿在四月十二日(公曆5月21日)九時零一分(北京地方真太陽時)。這裡根據《大清時憲曆》記曆書小滿為公曆5月21日。';
        } else {
            info = '张培瑜《三千五百年历日天象》和郑鹤声《近世中西史日对照表》皆记小满为5月20日，但《大清康熙十八年岁次己未时宪历》则载「(四月)十二日丙子巳初初刻一分小满四月中」，即小满在四月十二日(公历5月21日)九时零一分(北京地方真太阳时)。这里根据《大清时宪历》记历书小满为公历5月21日。';
        }
        return info;
    }

    // 1848
    if (year==1848 && month==12) {
        if (render.locale === 'en') {
            info = 'Z11 (December solstice) was on Dec 21 at 23:59:37 (UT1+8) according to the calculation using DE441. The calendrical Z11 was on Dec 22.';
        } else if (render.locale === 'zh-Hant') {
            info = 'DE441曆表算出的冬至時刻在12月21日23:59:57 (UT1+8)，曆書冬至在12月22日。';
        } else {
            info = 'DE441历表算出的冬至时刻在12月21日23:59:57 (UT1+8)，历书冬至在12月22日。';
        }
        return info;
    }

    // Deal with the calendrical solar terms after 1733 that didn't match solar terms 
    // computed by modern method
    let items = [{'year':1736, 'month':1, 's':'Z12', 'd':20},
              {'year':1739, 'month':1, 's':'J12', 'd':5},
              {'year':1744, 'month':7, 's':'Z6', 'd':22},
              {'year':1746, 'month':3, 's':'J2', 'd':5},
              {'year':1747, 'month':7, 's':'J6', 'd':7},
              {'year':1749, 'month':4, 's':'J3', 'd':4},
              {'year':1751, 'month':10, 's':'J9', 'd':9},
              {'year':1753, 'month':6, 's':'J5', 'd':5},
              {'year':1756, 'month':9, 's':'Z8', 'd':23},
              {'year':1760, 'month':4, 's':'Z3', 'd':19},
              {'year':1774, 'month':2, 's':'J1', 'd':3},
              {'year':1774, 'month':9, 's':'J8', 'd':8},
              {'year':1779, 'month':3, 's':'J2', 'd':5},
              {'year':1779, 'month':6, 's':'Z5', 'd':21},
              {'year':1781, 'month':12, 's':'J11', 'd':7},
              {'year':1782, 'month':4, 's':'J3', 'd':4},
              {'year':1784, 'month':10, 's':'J9', 'd':8},
              {'year':1787, 'month':2, 's':'Z1', 'd':18},
              {'year':1807, 'month':2, 's':'J1', 'd':4},
              {'year':1809, 'month':1, 's':'J12', 'd':5},
              {'year':1809, 'month':11, 's':'Z10', 'd':23},
              {'year':1812, 'month':3, 's':'J2', 'd':5},
              {'year':1815, 'month':4, 's':'J3', 'd':5},
              {'year':1817, 'month':10, 's':'J9', 'd':9},
              {'year':1820, 'month':2, 's':'Z1', 'd':19},
              {'year':1824, 'month':8, 's':'J7', 'd':8},
              {'year':1826, 'month':5, 's':'Z4', 'd':21},
              {'year':1829, 'month':11, 's':'J10', 'd':8},
              {'year':1836, 'month':9, 's':'J8', 'd':8},
              {'year':1844, 'month':6, 's':'J5', 'd':6},
              {'year':1846, 'month':11, 's':'Z10', 'd':23},
              {'year':1849, 'month':5, 's':'J4', 'd':5},
              {'year':1850, 'month':10, 's':'J9', 'd':9},
              {'year':1851, 'month':9, 's':'Z8', 'd':24},
              {'year':1851, 'month':12, 's':'J11', 'd':8},
              {'year':1855, 'month':4, 's':'Z3', 'd':20},
              {'year':1862, 'month':10, 's':'Z9', 'd':24},
              {'year':1862, 'month':11, 's':'J10', 'd':8},
              {'year':1864, 'month':7, 's':'Z6', 'd':23},
              {'year':1866, 'month':10, 's':'Z9', 'd':24},
              {'year':1867, 'month':7, 's':'J6', 'd':8},
              {'year':1867, 'month':8, 's':'Z7', 'd':24},
              {'year':1879, 'month':1, 's':'J12', 'd':6},
              {'year':1879, 'month':11, 's':'Z10', 'd':23},
              {'year':1883, 'month':10, 's':'J9', 'd':9},
              {'year':1884, 'month':9, 's':'Z8', 'd':23},
              {'year':1884, 'month':12, 's':'J11', 'd':7},
              {'year':1886, 'month':8, 's':'J7', 'd':8},
              {'year':1895, 'month':10, 's':'Z9', 'd':24},
              {'year':1895, 'month':11, 's':'J10', 'd':8},
              {'year':1898, 'month':9, 's':'J8', 'd':8},
              {'year':1899, 'month':6, 's':'Z5', 'd':22},
              {'year':1899, 'month':10, 's':'Z9', 'd':24}];
    let nitems = items.length;
    for (let i=0; i<nitems; i++) {
        if (year==items[i]['year'] && month==items[i]['month']) {
            let lab: string[] = ["J12", "Z12", "J1", "Z1", "J2", "Z2", "J3","Z3", 
                        "J4", "Z4", "J5", "Z5", "J6", "Z6", "J7", "Z7", 
                        "J8", "Z8", "J9", "Z9", "J10", "Z10", "J11", "Z11"];
            // create a solar term dictionarys
            let solarTermNames: Record<string, string> = {};
            for (let j = 0; j < 24; j ++) {
                solarTermNames[lab[j]] = render.localeData.solarTermNames[String(j)];
            }
            let solarTermName = solarTermNames[items[i]['s']]; // look up the name of the solar term
            if (render.locale === 'en') {
                let mon = ['January ', 'February ', 'March ', 'April ', 'May ', 'June ', 'July ', 'August ', 'September ', 'October ', 'November ', 'December ']
                info = 'The calendrical ' + solarTermName + ' was on ' + mon[month-1] + items[i]['d'];
            } else {
                info = (render.locale === 'zh-Hant' ? '曆書':'历书') + solarTermName + '在' + items[i]['d'] + '日。'
            }
            return info;
        }
    }

    return info;
}

function SouthernMingCalendarDateNotes(year: number, month: number, calendar: ChineseCalendarType, render: ChineseCalendarRender) {
    let notes = [
        {year:1648, month:4, 
        w:['Several sources indicate that the leap month in this year was after the 6th month, which I find to be very unlikely.', 
        '王叔武"南明史料朔閏考異"引 《劫灰錄》、 《鹿樵紀聞》、 《明季南略》、 《爝火錄》說永曆二年閏六月，我認為閏六月很可能不對。', 
        '王叔武"南明史料朔闰考异"引 《劫灰录》、 《鹿樵纪闻》、 《明季南略》、 《爝火录》说永历二年闰六月，我认为闰六月很可能不对。']}, 

        {year:1649, month:2, 
        w:['Two dfferent versions of calendar in the Southern Ming dynasty were produced in the Chinese year in 1649. One of them was produced by the officials of the Yongli emperor, in which the New Year day was on February 11th, 1649. Another version was produced by the officials of the Prince of Lu, who named himself regent. The New Year day of the Lu calendar was on February 12th, 1649. According to the calculation of the Datong system, the New Year day was on February 11th, 1649.', 
        '永曆三年和魯王監國四年正月朔有異:永曆三年正月庚申朔(公曆2月11日);《魯監國大統曆》則有魯監國四年正月辛酉朔(2月12日)。依明大統曆推算此年正月朔為庚申。', 
        '永历三年和鲁王监国四年正月朔有异:永历三年正月庚申朔(公历2月11日);《鲁监国大统历》则有鲁监国四年正月辛酉朔(2月12日)。依明大统历推算此年正月朔为庚申。']},

        {year:1650, month:12, 
        w:["According to <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> by Fu Yili and <i>Y&#225;n P&#237;ng W&#225;ng H&#249; Gu&#257;n Y&#225;ng Y&#299;ng C&#243;ng Zh&#275;ng Sh&#237; L&#249;</i> (or <i>Account of the quartermaster Yang Ying's campaign with Prince Yanping</i>), the leap month in 1650 was after the 11th month in the Southern Ming calendar. This is consistent with the calculation by the Datong system. However, the Datong calendars produced by the Zheng dynasty for <a href='N1671_Zheng.html'>1671</a>, <a href='N1676_Zheng.html'>1676</a> and <a href='N1677_Zheng.html'>1677</a> recorded the leap month to be after the 12th month. Leap month 12 was probably based on an unofficial calendar expediently produced by the Zheng officials in 1649 since the official emperor calendar had not arrived in time because of war.", 
        '傅以禮《殘明大統曆》和《延平王戶官楊英從征實錄》記永曆四年閏十一月，符合大統曆的推算，但明鄭頒行的<a href="N1671_Zheng_chinese.html">永曆二十五年大統曆</a>、<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>及<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>都記永曆四年閏十二月。閏十二月或許是當年鄭氏命官員權宜頒行的大統曆推算出的。', 
        '傅以礼《残明大统历》和《延平王户官杨英从征实录》记永历四年闰十一月，符合大统历的推算，但明郑颁行的<a href="N1671_Zheng_simp.html">永历二十五年大统历</a>、<a href="N1676_Zheng_simp.html">永历三十年大统历</a>及<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>都记永历四年闰十二月。闰十二月或许是当年郑氏命官员权宜颁行的大统历推算出的。']}, 
        {year:1651, month:1, 
        w:["According to <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> by Fu Yili and <i>Y&#225;n P&#237;ng W&#225;ng H&#249; Gu&#257;n Y&#225;ng Y&#299;ng C&#243;ng Zh&#275;ng Sh&#237; L&#249;</i> (or <i>Account of the quartermaster Yang Ying's campaign with Prince Yanping</i>), the leap month in 1650 was after the 11th month in the Southern Ming calendar. This is consistent with the calculation by the Datong system. However, the Datong calendars produced by the Zheng dynasty for <a href='N1671_Zheng.html'>1671</a>, <a href='N1676_Zheng.html'>1676</a> and <a href='N1677_Zheng.html'>1677</a> recorded the leap month to be after the 12th month. Leap month 12 was probably based on an unofficial calendar expediently produced by the Zheng officials in 1649 since the official emperor calendar had not arrived in time because of war.", 
        '傅以禮《殘明大統曆》和《延平王戶官楊英從征實錄》記永曆四年閏十一月，符合大統曆的推算，但明鄭頒行的<a href="N1671_Zheng_chinese.html">永曆二十五年大統曆</a>、<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>及<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>都記永曆四年閏十二月。閏十二月或許是當年鄭氏命官員權宜頒行的大統曆推算出的。', 
        '傅以礼《残明大统历》和《延平王户官杨英从征实录》记永历四年闰十一月，符合大统历的推算，但明郑颁行的<a href="N1671_Zheng_simp.html">永历二十五年大统历</a>、<a href="N1676_Zheng_simp.html">永历三十年大统历</a>及<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>都记永历四年闰十二月。闰十二月或许是当年郑氏命官员权宜颁行的大统历推算出的。']},

        {year:1652, month:2, 
        w:["Two dfferent versions of calendar were produced in the Chinese year in 1652: emperor Yongli's and Prince Lu's version. The New Year day of the Yongli calendar was on February 10th, 1652. The New Year day of the Lu calendar was on February 9th, 1652. According to the calculation of the Datong system, the New Year day was on February 10th, 1652.", 
        '永曆六年和魯王監國七年正月朔有異:永曆六年正月甲戌朔(公曆2月10日);《魯監國大統曆》則有魯監國七年正月癸酉朔(2月9日)。依明大統曆推算此年正月朔為甲戌。', 
        '永历六年和鲁王监国七年正月朔有异:永历六年正月甲戌朔(公历2月10日);《鲁监国大统历》则有鲁监国七年正月癸酉朔(2月9日)。依明大统历推算此年正月朔为甲戌。']},

        {year:1653, month:8, 
        w:["There are discrepancies in the leap month in this year among various sources. <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> records the leap month to be after the 7th month, which is consistent with the caleculation of the Datong system. <i>Y&#225;n P&#237;ng W&#225;ng H&#249; Gu&#257;n Y&#225;ng Y&#299;ng C&#243;ng Zh&#275;ng Sh&#237; L&#249;</i> or <i>Account of the quartermaster Yang Ying's campaign with Prince Yanping</i> has the leap month after the 8th month. The chronicle <i>X&#237;ng Z&#224;i Y&#225;ng Qi&#363;</i> records the leap month to be after the 6th month. The Datong calendar produced by the Zheng dynasty for <a href='N1671_Zheng.html'>1671</a> also records leap month after the 6th month. However, in the Datong calendar for <a href='N1676_Zheng.html'>1676</a> and <a href='N1677_Zheng.html'>1677</a>, the leap month is changed to being after the 8th month. I think leap month 6 is unlikely. Both leap month 7 and 8 are possible. Here I follow <i>Datong Calendar of the Waning Ming Dynasty</i> and place the leap month after the 7th month.", 
        '此年的閏月有爭議，依大統曆推算閏七月，傅以禮《殘明大統曆》亦記閏七月，但是《延平王戶官楊英從征實錄》記閏八月，《行在陽秋》記閏六月，明鄭頒行的<a href="N1671_Zheng_chinese.html">永曆二十五年大統曆</a>也記閏六月，但是後來頒行的<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>及<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>卻改為閏八月。我認為閏六月不大可能，閏七月和閏八月機會較大，此處依《殘明大統曆》記閏七月。', 
        '此年的闰月有争议，依大统历推算闰七月，傅以礼《残明大统历》亦记闰七月，但是《延平王户官杨英从征实录》记闰八月，《行在阳秋》记闰六月，明郑颁行的<a href="N1671_Zheng_simp.html">永历二十五年大统历</a>也记闰六月，但是后来颁行的<a href="N1676_Zheng_simp.html">永历三十年大统历</a>及<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>却改为闰八月。我认为闰六月不大可能，闰七月和闰八月机会较大，此处依《残明大统历》记闰七月。']}, 

        {year:1663, month:9, 
        w:['Calendrical J8 should be on September 6th according to the calculation of the Datong system. However, <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> records J8 on September 5th, which is the date listed here.', 
        '依大統曆推算白露在八月初五(公曆9月6日)，但傅以禮《殘明大統曆》記八月初四(9月5日)，此處曆書白露依《殘明大統曆》。', 
        '依大统历推算白露在八月初五(公历9月6日)，但傅以礼《残明大统历》记八月初四(9月5日)，此处历书白露依《残明大统历》。']}, 

        {year:1671, month:2, 
        w:["The Chinese Near Year in 1671 was on February 9th according to <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i>, which also agrees with the calculation of the Datong system. However, the Datong calendar produced by the Zheng dynasty for <a href='N1671_Zheng.html'>1671</a> indicates that the New Year day was on February 10th. Even though Zheng dynasty claimed that their calendars were produced expediently and should not to be taken as official, by this time the Yongli emperor had died and the Southern Ming dynasty had already ended. Zheng's calendar became the de facto official Datong calendar of the state. So I change the New Year day to February 10th in accord with Zheng's calendar.", 
        '依大統曆推算永曆二十五正月朔在癸丑(公曆2月9日)，傅以禮《殘明大統曆》亦記正月癸丑朔，但是明鄭頒行的<a href="N1671_Zheng_chinese.html">永曆二十五年大統曆</a>記正月甲寅朔(2月10日)。雖然鄭氏奉明正朔，聲稱其大統曆乃「權宜頒行」，但是當時永曆帝已死，南明也已亡，明鄭的大統曆變相成為正統的大統曆書，所以此處依明鄭大統曆記正月甲寅朔。', 
        '依大统历推算永历二十五正月朔在癸丑(公历2月9日)，傅以礼《残明大统历》亦记正月癸丑朔，但是明郑颁行的<a href="N1671_Zheng_simp.html">永历二十五年大统历</a>记正月甲寅朔(2月10日)。虽然郑氏奉明正朔，声称其大统历乃「权宜颁行」，但是当时永历帝已死，南明也已亡，明郑的大统历变相成为正统的大统历书，所以此处依明郑大统历记正月甲寅朔。']}, 

        {year:1674, month:7, 
        w:['According to the calculation of the Datong system, the month 6 conjunction was on July 4th, which is inconsistent with the record in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> (July 3rd). July 3rd is used here.', 
        '依明大統曆推算六月朔在甲午(公曆7月4日)，此處依傅以禮《殘明大統曆》改為六月癸巳朔(7月3日)。', 
        '依明大统历推算六月朔在甲午(公历7月4日)，此处依傅以礼《残明大统历》改为六月癸巳朔(7月3日)。']}, 

        {year:1674, month:9, 
        w:['According to the calculation of the Datong system, the month 9 conjunction was on September 30th, which is inconsistent with the record in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> (September 29th). September 29th is used here.', 
        '依明大統曆推算九月朔在壬戌(公曆9月30日)，此處依傅以禮《殘明大統曆》改為九月辛酉朔(9月29日)。', 
        '依明大统历推算九月朔在壬戌(公历9月30日)，此处依傅以礼《残明大统历》改为九月辛酉朔(9月29日)。']}, 

        {year:1675, month:7, 
        w:['According to the calculation of the Datong system, a conjunction occurred on July 22nd. <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> records a conjunction on July 23rd. The one-day difference changed the leap month in this year. July 22nd conjunction resulted in a leap month after the 5th month. July 23rd conjunction resulted in a leap month after the 6th month. Leap month 6 is also recorded in the calendars produced by the Zheng dynasty for <a href="N1676_Zheng.html">1676</a> and <a href="N1677_Zheng.html">1677</a>. So I use the data in <i>Datong Calendar of the Waning Ming Dynasty</i>.', 
        '依明大統曆推算有朔日在丁巳(公曆7月22日)，對應的朔日在傅以禮《殘明大統曆》出現在下一日戊午(7月23日)。此一日之差造成閏月分歧:依大統曆推算閏五月，《殘明大統曆》則為閏六月。明鄭頒行的<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>及<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>都記永曆二十九年閏六月，所以此處朔閏依《殘明大統曆》。', 
        '依明大统历推算有朔日在丁巳(公历7月22日)，对应的朔日在傅以礼《残明大统历》出现在下一日戊午(7月23日)。此一日之差造成闰月分歧:依大统历推算闰五月，《残明大统历》则为闰六月。明郑颁行的<a href="N1676_Zheng_simp.html">永历三十年大统历</a>及<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>都记永历二十九年闰六月，所以此处朔闰依《残明大统历》。']}, 

        {year:1676, month:12,
          w:['<i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> records that Z11 (winter solstice) was on the 16th day in month 11 (Dec. 20), which is inconsistent with the calculation of the Datong system (Dec. 21). The official <a href="N1676_Zheng.html">Datong Calendar for 1676</a> records Z11 on the 17th day in month 11 (Dec. 21). So the Z11 date in <i>Datong Calendar of the Waning Ming Dynasty</i> is wrong.', 
          '《殘明大統曆》記冬至在十一月十六(公曆12月20日)，不合明大統曆的推步(十一月十七)。明鄭頒行的<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>記冬至在十一月十七(12月21日)，證實《殘明大統曆》的冬至日期錯了。', 
          '《残明大统历》记冬至在十一月十六(公历12月20日)，不合明大统历的推步(十一月十七)。明郑颁行的<a href="N1676_Zheng_simp.html">永历三十年大统历</a>记冬至在十一月十七(12月21日)，证实《残明大统历》的冬至日期错了。']},

        {year:1677, month:7, 
          w:['According to the calculation of the Datong system, month 7 conjunction was on July 29th, which is inconsistent with July 30th recorded in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or  <i>Datong Calendar of the Waning Ming Dynasty</i> and the calendar produced by the Zheng dynasty for <a href="N1677_Zheng.html">1677</a>. The Zheng calendar date is used here.', 
        '依明大統曆推算七月朔在乙亥(公曆7月29日)，不合傅以禮《殘明大統曆》及明鄭<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>的丙子朔(7月30日)。此處依《殘明大統曆》及明鄭大統曆記七月丙子朔。', 
        '依明大统历推算七月朔在乙亥(公历7月29日)，不合傅以礼《残明大统历》及明郑<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>的丙子朔(7月30日)。此处依《残明大统历》及明郑大统历记七月丙子朔。']}, 

        {year:1678, month:7, 
        w:['According to the calculation of the Datong system, the month 6 conjunction was on July 18th, inconsistent with July 19th recorded in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or  <i>Datong Calendar of the Waning Ming Dynasty</i>. July 19th is used here.', 
        '依明大統曆推算六月朔在己巳(公曆7月18日)，不合傅以禮《殘明大統曆》的庚午朔(7月19日)。此處依《殘明大統曆》記六月庚午朔。', 
        '依明大统历推算六月朔在己巳(公历7月18日)，不合傅以礼《残明大统历》的庚午朔(7月19日)。此处依《残明大统历》记六月庚午朔。']}, 

        {year:1682, month:2, 
        w:['According to the calculation of the Datong system, the Chinese New Year in 1682 was on February 8th, inconsistent with February 7th recorded in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i>. February 7th is used here.', 
        '依明大統曆推算永曆三十六年正月朔在庚戌(公曆2月8日)，不合傅以禮《殘明大統曆》的己酉朔(2月7日)。此處依《殘明大統曆》記正月己酉朔。', 
        '依明大统历推算永历三十六年正月朔在庚戌(公历2月8日)，不合傅以礼《残明大统历》的己酉朔(2月7日)。此处依《残明大统历》记正月己酉朔。']}
    ];
    
    let n = notes.length;
    let info = '';
    for (let i=0; i<n; i++) {
        if (year==notes[i].year && month==notes[i].month) {
          if (render.locale === 'en') {
            info = notes[i].w[0];
          } else if (render.locale === 'zh-Hant') {
            info = notes[i].w[1];
          } else {
            info = notes[i].w[2];
          }
          break;
        }
    }
    return info;
}

function calendarNotes1912_1979(year: number, month: number, calendar: ChineseCalendarType, render: ChineseCalendarRender) {
    let notes = [{'year':1912, 'month':11, 
        'n':['The calendrical Z10 was on Nov 23.', 
              '曆書小雪在23日。', '历书小雪在23日。']}, 
        {'year':1913, 'month':9,
          'n':['The calendrical Z8 (September equinox) was on Sep 24.',
              '曆書秋分在24日。', '历书秋分在24日。']},
        {'year':1917, 'month':12,
        'n':['The calendrical J11 was on Dec 7.',
              '曆書大雪在7日。', '历书大雪在7日。']},
        {'year':1927, 'month':9,
        'n':['The calendrical J8 was on Sep 8.',
              '曆書白露在8日。', '历书白露在8日。']},
        {'year':1928, 'month':6,
        'n':['The calendrical Z5 (June solstice) was on June 21.',
              '曆書夏至在21日。', '历书夏至在21日。']},
        {'year':1979, 'month':1,
        'n':['Z12 calculated by DE441 was at 23:59:54 (UTC+8) on Jan. 20. <i>Chinese Astronomical Almanac for the Year 1979</i> lists Z12 at 00:00 (UTC+8) on Jan 21, so the calendrical Z12 was on Jan 21.',
              'DE441曆表推算的大寒時刻是1月20日23:59:54 (UTC+8)，《一九七九年中国天文年历》載大寒時刻為1月21日00:00 (UTC+8)，故曆書大寒在1月21日。',
              'DE441历表推算的大寒时刻是1月20日23:59:54 (UTC+8)，《一九七九年中国天文年历》载大寒时刻为1月21日00:00 (UTC+8)，故历书大寒在1月21日。']}];
    let n = notes.length;
    let info = '';
    for (let i=0; i<n; i++) {
        if (year==notes[i]['year'] && month==notes[i]['month']) {
          if (render.locale === 'en') {
            info = notes[i]['n'][0];
          } else if (render.locale === 'zh-Hant') {
            info = notes[i]['n'][1];
          } else {
            info = notes[i]['n'][2];
          }
          break;
        }
    }

    return info;
}

function calendarNotesAfter2050(year: number, month: number, calendar: ChineseCalendarType, render: ChineseCalendarRender) {
    let suffix_eng = " is close to the midnight. The actual date may be off by one day.";
    let suffix_chi = "的時刻接近午夜零時，實際日期或會與所示日期有一日之差。";
    let suffix_sim = "的时刻接近午夜零时，实际日期或会与所示日期有一日之差。";
    let info = '';

    if (year==2051) {
        if (month==3) {
            if (render.locale === 'en') {
                info = "The time of Z2 (March equinox)"+suffix_eng;
            } else {
                info = "春分"+(render.locale === 'zh-Hant' ? suffix_chi:suffix_sim);
            }
        }
    }
    
    if (
      (year==2057 && month==9) ||
      (year==2097 && month==8) ||
      (year==2133 && month==9) ||
      (year==2165 && month==12) ||
      (year==2172 && month==10)
    ) {
      if (render.locale === 'en') {
        info = "The lunar conjunction/new moon (Q0) is close to the midnight. The start day of the month may be one day earlier.";
      } else if (render.locale === 'zh-Hant') {
        info = "朔的時刻接近午夜零時，初一或會提早一天。";
      } else {
        info = "朔的时刻接近午夜零时，初一或会提早一天。";
      }
    }

    if (
      (year==2089 && month==9) ||
      (year==2015 && month==2) ||
      (year==2016 && month==5) ||
      (year==2089 && month==9) ||
      (year==2116 && month==5)      
    ) {
      if (render.locale === 'en') {
        info = "The lunar conjunction/new moon (Q0) is close to the midnight. The start day of the month may be one day later.";
      } else if (render.locale === 'zh-Hant') {
        info = "朔的時刻接近午夜零時，初一或會推遲一天。";
      } else {
        info = "朔的时刻接近午夜零时，初一或会推迟一天。";
      }
    }

    if (year==2083) {
        if (month==2) {
            if (render.locale === 'en') {
                info = "The time of J1"+suffix_eng;
            } else {
                info = "&#31435;&#26149;"+(render.locale === 'zh-Hant' ? suffix_chi:suffix_sim);
            }
        }
    }
    
    if (year==2084) {
        if (month==3) {
            if (render.locale === 'en') {
                info = "The time of Z2 (March equinox)"+suffix_eng;
            } else {
                info = "&#26149;&#20998;"+(render.locale === 'zh-Hant' ? suffix_chi:suffix_sim);
            }
        }
    }
            
    if (year==2114) {
        if (month==11) {
            if (render.locale === 'en') {
                info = "The time of Z10"+suffix_eng;
            } else {
                info = "小雪"+(render.locale === 'zh-Hant' ? suffix_chi:suffix_sim);
            }
        }
    }
    
    if (year==2142) {
        if (month==9) {
            if (render.locale === 'en') {
                info = "The time of J8"+suffix_eng;
            } else {
                info = "白露"+(render.locale === 'zh-Hant' ? suffix_chi:suffix_sim);
            }
        }
    }
    
    if (year==2155) {
        if (month==10) {
            if (render.locale === 'en') {
                info = "The time of Z9"+suffix_eng;
            } else {
                info = "霜降"+(render.locale === 'zh-Hant' ? suffix_chi:suffix_sim);
            }
        }
    }
    
    if (year==2157) {
        if (month==12) {
            if (render.locale === 'en') {
                info = "The time of Z11 (December solstice)"+suffix_eng;
            } else {
                info = "冬至"+(render.locale === 'zh-Hant' ? suffix_chi:suffix_sim);
            }
        }
    }
    
    
    if (year==2183) {
        if (month==3) {
            if (render.locale === 'en') {
                info = "The time of Z2 (March equinox)"+suffix_eng;
            } else {
                info = "春分"+(render.locale === 'zh-Hant' ? suffix_chi:suffix_sim);
            }
        }
    }
    
    if (year==2186) {
        if (month==2) {
            if (render.locale === 'en') {
                info = "The time of J1"+suffix_eng;
            } else {
                info = "立春"+(render.locale === 'zh-Hant' ? suffix_chi:suffix_sim);
            }
        }
    }

    return info;
}