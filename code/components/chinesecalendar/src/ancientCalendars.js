"use strict";

/**
 * 通过公历年（儒略历/逆推儒略历/格里历）获取古代中国（221 BC之前）所采用的历书。
 * 中国古代采取的历书有：
 * - 古六历：周历、鲁历、黃帝历、殷历、夏历、颛顼历，合称「古六历」。
 * 「古六历」的计算方法大致相同，但各历的年首不尽相同，用以计算历法的历元也不同。
 * 本计算方法的「古六历」是根据张培瑜、陈美东、薄树人和胡铁珠著的《中国古代历法》(中国科学出版社‧北京‧2008年3月)书中第三章第六节所述的资料复原。
 * 具体计算方法在[古六历网页](https://ytliu0.github.io/ChineseCalendar/guliuli_simp.html)叙述。  
 *   1. 黃帝历：以建子(即现在的十一月)为年首，称为正月。目前学界对于黃帝历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。有些学者认为当时以无中气的月份为闰月。
 *   2. 颛顼历：以建亥(即现在的十月)为年首，但建亥仍按夏历称为十月，颛顼历一年的月份次序是:十月、十一月、十二月、正月、二月……九月。闰月置于年终，称为「后九月」。
 *   3. 夏历：以建寅(即现在的正月)为年首，称为正月。目前学界对于黃帝历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。有些学者认为当时以无中气的月份为闰月。
 * 夏历有两个版本，在春秋时代(前722年–前481年)和战国时代(前480年–前222年)所用的版本不同，差别是计算历法时使用的历元不同。春秋时期用的夏历历元是雨水合朔齐同，战国时的夏历历元是冬至合朔齐同。
 * 秦朝和汉初(期221年–前104年)的历法也是采用颛顼历的年首和月份次序。颛顼历大约在秦昭襄王时期(公元前306–前251)开始在秦国使用。
 *   4. 殷历：以建丑(即现在的十二月)为年首，称为正月。目前学界对于黃帝历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。有些学者认为当时以无中气的月份为闰月。
 *   5. 周历：以建子(即现在的十一月)为年首，称为正月。目前学界对于周历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。
 * 有些学者认为当时以无中气的月份为闰月，这里也注明无中气的月份以供参考。
 * 周朝于周赧王五十九年(公元前256年)被秦国所灭，东周君王的纪年也到这一年为止。
 *   6. 鲁历：以建子(即现在的十一月)为年首，称为正月。目前学界对于鲁历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。
 * 有些学者认为当时以无中气的月份为闰月，这里也注明无中气的月份以供参考。
 * 鲁国于鲁顷公二十四年(公元前249年)被楚国所灭，鲁国君主的纪年也到这一年为止。
 * - 春秋历：春秋历没有固定的置闰法则，正月的月建并不固定，而是在建亥(即现在的十月)与建寅(现在的正月)之间摆动。春秋初期的正月月建多在建丑(现在的十二月)，末期则多在建子(现在的十一月)。
 * 目前学界对于春秋历的闰月的位置末有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。
 * 春秋历没有计算冬至(或其他节气)的方法，当时的冬至是靠观测而定，所以没有历书节气。
 * 由于春秋历主要在鲁国使用。现在我们只能从《春秋》这部由孔子修订的鲁国编年史书中获得当时鲁国施行历法的不完整资料。
 * 本计算方法中的春秋历是根据张培瑜、陈美东、薄树人和胡铁珠著的《中国古代历法》(中国科学出版社‧北京‧2008年 3月)书中第三章第五节的资料复原。
 * 具体计算方法在[春秋历网页](https://ytliu0.github.io/ChineseCalendar/chunqiu_simp.html)阐述。
 * @param {number} year - 公历年。
 * @returns {Array<Object>} - 返回一个包含历书信息的数组，每个对象包含以下属性：
 *   - {string} id - 历书的唯一标识符。
 *   - {string} name - 历书的英文名称/拼音名称。
 *   - {string} cname - 历书的繁体中文名称。
 *   - {string} sname - 历书的简体中文名称。
 */
export function getAncientCalendarBooksByYear(year) {
  let books = [];

  // Spring and Autumn
  // 春秋时期(公元前722年 – 前481年)各国施行不同历法，当时使用的历法有六种：春秋历、周历、殷历和夏历，这里称当时鲁国的历法为春秋历。
  if (year < -479) {
    books = [
      {id: "Chunqiu", name: "Chunqiu", cname: "春秋", sname: "春秋"},
      {id: "Zhou", name: "Zhou", cname: "周", sname: "周"},
      {id: "Yin", name: "Yin", cname: "殷", sname: "殷"},
      {id: "Spring.Xia", name: "Xia2", cname: "夏", sname: "夏"},
    ];
  }

  // Warring States
  // 战国时代(约前480年至前222年)各国施行不同历法，当时使用的历法有六种：周历、鲁历、殷历、夏历、黄帝历和颛顼历，合称「古六历」。
  else if (year >= -479 && year < -220) {
    books = [
      {id: "Zhou", name: "Zhou", cname: "周", sname: "周"},
      {id: "Lu", name: "Lu", cname: "魯", sname: "鲁"},
      {id: "Huangdi", name: "Huangdi", cname: "黃帝", sname: "黃帝"},
      {id: "Yin", name: "Yin", cname: "殷", sname: "殷"},
      {id: "Warring.Xia", name: "Xia1", cname: "夏", sname: "夏"},
      {id: "Zhuanxu", name: "Zhuanxu", cname: "顓頊", sname: "颛顼"},
    ];
  }

  // Qin and early Han
  // 秦朝及汉初(公元前221年 – 前104年)的历法沿用颛顼历的月序。颛顼历是古六历之一，据说战国后期在秦国使用。
  // 秦朝的历法与颛顼历稍有不同。汉朝建立后基本上沿用秦历，一百年间只作了少许修改，直到汉武帝太初元年(公元前104年)才颁行新历法，
  // 以建寅(正月)为年首，并把闰月置于无中气的月份，这使公元前104年的农历年有十五个农历月。
  // 秦朝为了避秦始皇名讳(正、政同音)，把正月改称「端月」，到汉朝又改回正月。本计算方法没有跟从历史，在秦朝仍称建寅为正月。
  else if (year >= -220 && year < -104) {
    books = [{id: "Zhuanxu", name: "Zhuanxu", cname: "顓頊", sname: "颛顼"}];
  }

  return books;
}

/**
 * 通过公历年（儒略历/逆推儒略历/格里历）获取当时中国范围内所存在的区域性政权。
 * @param {number} year - 公历年。
 * @returns {Array<Object>} - 返回一个包含政权信息的数组，每个对象包含以下属性：
 *   - {string} id - 政权的唯一标识符。
 *   - {string} name - 政权的英文名称/拼音名称。
 *   - {string} cname - 政权的繁体中文名称。
 *   - {string} sname - 政权的简体中文名称。
 */
export function getCalendarRegionsByYear(year) {
  let regions = [];

  // Three Kingdoms
  if (year > 220.5 && year < 280.5) {
    // 221年，魏国、蜀国建国
    regions = [
      {id: "Tki.Wei", name: "Wei", cname: "魏", sname: "魏"},
      {id: "Tki.Shu", name: "Shu", cname: "蜀", sname: "蜀"},
    ];
    // 222年，吴国建国
    if (year > 221.5) {
      regions.push({id: "Tki.Wu", name: "Wu", cname: "吳", sname: "吴"});
    }
    // 264年，蜀国被魏国灭亡
    if (year > 263.5) {
      regions.splice(1, 1);
    }
    // 265年，晋替代魏国
    if (year > 265.5) {
      regions[0] = {id: "Jin", name: "Jin", cname: "晋", sname: "晋"};
    }
  }

  // South and North
  if (year > 383.5 && year < 590.5) {
    // default: South dynasties
    if (year < 419.5) {
      regions = [{id: "SouthNorth.South.Jin", name: "Jin", cname: "晋", sname: "晋"}];
    } else if (year < 479.5) {
      regions = [{id: "SouthNorth.South.Song", name: "Song", cname: "宋", sname: "宋"}];
    } else if (year < 502.5) {
      regions = [{id: "SouthNorth.South.Qi", name: "Qi", cname: "齊", sname: "齐"}];
    } else if (year < 557.5) {
      regions = [{id: "SouthNorth.South.Liang", name: "Liang", cname: "梁", sname: "梁"}];
    } else {
      regions = [{id: "SouthNorth.South.Chen", name: "Chen", cname: "陳", sname: "陈"}];
    }

    // North dynasties
    // LaterQin
    if (year < 417.5) {
      regions.push({id: "SouthNorth.North.LaterQin", name: "LaterQin", cname: "後秦", sname: "后秦"});
    }
    // NorthernLiang
    if (year > 411.5 && year < 439.5) {
      regions.push({id: "SouthNorth.North.NorthernLiang", name: "NorthernLiang", cname: "北凉", sname: "北凉"});
    }
    // WeiZhouSui
    if (year > 397.5) {
      if (year < 534.5) {
        regions.push({id: "SouthNorth.North.NorthernWei", name: "NorthernWei", cname: "北魏", sname: "北魏"});
      } else if (year < 557.5) {
        regions.push({id: "SouthNorth.North.WesternWei", name: "WesternWei", cname: "西魏", sname: "西魏"});
      } else if (year < 580.5) {
        regions.push({id: "SouthNorth.North.NorthernZhou", name: "NorthernZhou", cname: "北周", sname: "北周"});
      } else {
        regions.push({id: "SouthNorth.North.Sui", name: "Sui", cname: "隋", sname: "隋"});
      }
    }
    // WeiQi
    if (year > 533.5 && year < 577.5) {
      if (year < 549.5) {
        regions.push({id: "SouthNorth.North.EasternWei", name: "EasternWei", cname: "東魏", sname: "东魏"});
      } else {
        regions.push({id: "SouthNorth.North.NorthernQi", name: "NorthernQi", cname: "北齊", sname: "北齐"});
      }
    }
  }

  // SongLiaoJinYuan
  if (year > 946.5 && year < 1279.5) {
    // default: South dynasties
    if (year < 950.5) {
      regions = [{id: "SongLiaoJinYuan.LaterHan", name: "LaterHan", cname: "後漢", sname: "后汉"}];
    } else if (year < 959.5) {
      regions = [{id: "SongLiaoJinYuan.LaterZhou", name: "LaterZhou", cname: "後周", sname: "后周"}];
    } else {
      regions = [{id: "SongLiaoJinYuan.Song", name: "Song", cname: "宋", sname: "宋"}];
    }

    // North dynasties
    // LiaoJinYuan
    if (year < 1125.5) {
      regions.push({id: "SongLiaoJinYuan.Liao", name: "Liao (Khitan)", cname: "遼/契丹", sname: "辽/契丹"});
    } else if (year < 1234.5) {
      regions.push({id: "SongLiaoJinYuan.Jin", name: "Jin", cname: "金", sname: "金"});
    } else if (year < 1270.5) {
      regions.push({id: "SongLiaoJinYuan.Mongol", name: "Mongol", cname: "蒙古", sname: "蒙古"});
    } else {
      regions.push({id: "SongLiaoJinYuan.Yuan", name: "Yuan (Mongol)", cname: "元", sname: "元"});
    }
  }

  // QingSouthernMing
  if (year > 1644.5 && year < 1683.5) {
    // default: Qing
    regions.push({id: "Qing.Qing", name: "Qing", cname: "清", sname: "清"});

    // SouthernMing
    if (year < 1661.5) {
      regions = [{id: "Qing.SouthernMing", name: "SouthernMing", cname: "南明", sname: "南明"}];
    } else {
      regions = [{id: "Qing.Zheng", name: "Zheng", cname: "明鄭", sname: "明郑"}];
    }
  }

  return regions;
}

/**
 * 纠正给定公历年使用的历书名称。
 * @param {number} year 公历年。
 * @param {string} id 历书名称。
 * 只能为：
 * - Huangdi 黄帝历
 * - Zhuanxu 颛顼历
 * - Spring.Xia 夏历（春秋时某些国家使用的夏历）
 * - Warring.Xia 夏历（战国时某些国家使用的夏历）
 * - Yin 殷历
 * - Zhou 周历
 * - Chunqiu 春秋历（春秋时鲁国使用的历书）
 * - Lu 鲁历（战国时鲁国使用的历书）
 * @returns 
 * - null 表示公历年year，不属于古代历书覆盖的时间范围，属于输入错误，返回null；
 * - 如果name不在当时使用的历书内，则返回当时流行的历书名称；
 * - 如果name在当时使用的历书内，则返回name。
 */
export function correctAncientCalendarBookByYear(year, id) {
  let books = getAncientCalendarBooksByYear(year);

  // 不属于古代的历书覆盖的时间
  if (books.length == 0) {
    return null;
  }

  // 判断name是否在books中
  let ret = books.find(book => book.id == id);
  if (ret == null) {
    id = null;
  }
  
  // 缺省为第一本历书
  if (id == null || id == 'default') {
    id = books[0].id;
  }

  return id;
}

/**
 * 纠正给定公历年，存在的政权名称。
 * @param {number} year 公历年。
 * @param {string} id 政权名称。
 * @returns 
 * - null 表示公历年year，不属于多个政权存在的时间范围，属于输入错误，返回null；
 * - 如果name不在当时存在的政权内，则返回当时正统的政权名称；
 * - 如果name在当时存在的政权内，则返回name。
 */
export function correctCalendarRegionByYear(year, id) {
  let regions = getCalendarRegionsByYear(year);

  // 不属于某个国家存在时的时间
  if (regions.length == 0) {
    return null;
  }

  // 判断name是否在regions中
  let ret = regions.find(region => region.id == id);
  if (ret == null) {
    id = null;
  }
  
  // 缺省为第一本历书
  if (id == null ) {
    id = regions[0].id;
  }

  return id;
}

export function correctCalendarByYear(year, id) {
  if (year < -104) {
    return correctAncientCalendarBookByYear(year, id);
  }
  else {
    return correctCalendarRegionByYear(year, id);
  }
}

// Calculation of the first days of months in chunqiu calendar.
// The output cmonthDate is a vector of length 12 or 13,
// containing the first days of months counted from jdc,
// with the first element being the first month and the last
// element being the last month in the chunqiu calendar.
// If the length of cmonthDate is 13, the last month is a leap month.
// cndays is the number of days in the year.
function chunqiu_cmonth(y, jdc) {
  let lunar = 29.53067185978578; // = 30328/1027
  let yEpoch = -721;
  let jdEpoch = 1457727.761054236; // Jan 16, 722 BC + 268/1027 days + 1e-4 days

  // Leap year pattern from -721 to -482
  let leapYears = [
    0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1,
    0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0,
    0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0,
    0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  ];
  // Accumulated leap years from -721 to -482
  let accLeaps = [
    0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 13,
    14, 15, 15, 16, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 24, 24, 24, 24, 24, 24, 25, 25, 26, 26, 27,
    27, 28, 28, 28, 28, 29, 29, 30, 30, 30, 30, 31, 31, 32, 32, 32, 32, 32, 33, 33, 33, 34, 35, 35, 36, 36, 36, 37, 37, 37, 38, 38, 38, 39,
    39, 39, 40, 40, 40, 41, 41, 41, 41, 42, 42, 43, 44, 44, 44, 45, 45, 45, 46, 46, 47, 47, 47, 47, 48, 48, 48, 49, 49, 49, 50, 50, 50, 51,
    51, 52, 53, 53, 53, 53, 54, 54, 55, 55, 55, 56, 56, 56, 57, 57, 57, 58, 58, 59, 59, 59, 59, 60, 60, 60, 61, 62, 62, 62, 63, 63, 63, 63,
    64, 65, 65, 65, 65, 66, 66, 67, 67, 67, 68, 68, 69, 69, 69, 70, 70, 70, 70, 71, 71, 72, 72, 73, 73, 74, 74, 74, 74, 75, 75, 75, 76, 77,
    77, 77, 77, 77, 78, 78, 79, 79, 80, 80, 80, 80, 81, 81, 82, 82, 83, 83, 83, 84, 84, 84, 85, 85, 86, 86, 86, 87, 87, 87, 88, 88,
  ];

  let i = y - yEpoch;
  let leap = i < 0 ? 0 : leapYears[i];
  let accMonths = 12 * i + (i < 0 ? 0 : accLeaps[i]);

  let m0 = jdEpoch + accMonths * lunar;
  let n = 12 + leap;
  let cmonthDate = [];
  for (let j = 0; j < n; j++) {
    let m = Math.floor(m0 + j * lunar + 0.5) - jdc;
    cmonthDate.push(m);
  }
  // Number of days in the year
  let cndays = Math.floor(m0 + (12 + leap) * lunar + 0.5) - Math.floor(m0 + 0.5);
  return {cmonthDate: cmonthDate, cndays: cndays};
}

// Set up the information for the chunqiu calendar to be
// used for the calendar main page
function calDataYear_info_chunqiu(y, jdc, ndays) {
  // current year
  let cmdate = chunqiu_cmonth(y, jdc);
  // the following year
  let cmdate2 = chunqiu_cmonth(y + 1, jdc);

  let cmonthDate = [],
    cmonthJian = [],
    cmonthNum = [],
    cmonthLong = [],
    cmonthYear = [];
  // cmonthXiaYear: Chinese year according to the Xia standard
  // (yin month being the first month); 0 means previous year, 1 current year.
  let cmonthXiaYear = [];

  // Determine the first month before Jan 1, y
  let i,
    m,
    d,
    j = 0;
  if (cmdate.cmonthDate[0] > 1) {
    // previous year
    let cmdate0 = chunqiu_cmonth(y - 1, jdc);
    let n = cmdate0.cmonthDate.length;
    for (i = 5; i < n; i++) {
      if (cmdate0.cmonthDate[i] > 1) {
        j = i - 1;
        m = i;
        d = cmdate0.cmonthDate[i] - cmdate0.cmonthDate[j];
        cmonthDate.push(cmdate0.cmonthDate[j]);
        cmonthXiaYear.push(0); // doesn't matter since it's not used
        cmonthYear.push(0);
        cmonthJian.push(1); // doesn't matter since it's not used
        cmonthNum.push(m);
        cmonthLong.push(d == 30 ? 1 : 0);
        break;
      }
    }
    if (j == 0) {
      // first month before Jan 1, y is the last month in the previous year
      m = cmdate0.cmonthDate.length;
      d = cmdate.cmonthDate[0] - cmdate0.cmonthDate[m - 1];
      cmonthDate.push(cmdate0.cmonthDate[m - 1]);
      if (m == 13) {
        m = -12;
      }
      cmonthXiaYear.push(0); // doesn't matter since it's not used
      cmonthYear.push(0);
      cmonthJian.push(1); // doesn't matter since it's not used
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    } else {
      // Rest of the months in y-1
      let n = cmdate0.cmonthDate.length;
      for (i = j + 1; i < n; i++) {
        m = i + 1;
        if (m == 13) {
          m = -12;
        }
        if (i == n - 1) {
          d = cmdate0.cmonthDate[i + 1] - cmdate0.cmonthDate[i];
        } else {
          d = cmdate.cmonthDate[0] - cmdate0.cmonthDate[i];
        }
        cmonthDate.push(cmdate0.cmonthDate[i]);
        cmonthXiaYear.push(0); // doesn't matter since it's not used
        cmonthYear.push(0);
        cmonthJian.push(1); // doesn't matter since it's not used
        cmonthNum.push(m);
        cmonthLong.push(d == 30 ? 1 : 0);
      }
    }
  } else {
    // first month before Jan 1, y is in the current year
    for (i = 1; i < 10; i++) {
      if (cmdate.cmonthDate[i] > 1) {
        j = i - 1;
        m = i;
        d = cmdate.cmonthDate[i] - cmdate.cmonthDate[j];
        cmonthDate.push(cmdate.cmonthDate[j]);
        cmonthXiaYear.push(0); // doesn't matter since it's not used
        cmonthYear.push(1);
        cmonthJian.push(11); // doesn't matter since it's not used
        cmonthNum.push(m);
        cmonthLong.push(d == 30 ? 1 : 0);
        break;
      }
    }
  }

  // The rest of the months in Chinese year y
  let n = 12 + (cmdate.cmonthDate.length == 12 ? 0 : 1);
  for (i = 0; i < n; i++) {
    if (cmdate.cmonthDate[i] > 1) {
      m = i + 1;
      if (m == 13) {
        m = -12;
      }
      if (i < n - 1) {
        d = cmdate.cmonthDate[i + 1] - cmdate.cmonthDate[i];
      } else {
        d = cmdate2.cmonthDate[0] - cmdate.cmonthDate[i];
      }
      cmonthDate.push(cmdate.cmonthDate[i]);
      cmonthXiaYear.push(1); // doesn't matter since it's not used
      cmonthYear.push(1);
      cmonthJian.push(11); // doesn't matter since it's not used
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }
  // The months in the following year
  for (i = 0; i < 5; i++) {
    if (cmdate2.cmonthDate[i] < ndays + 0.9) {
      d = cmdate2.cmonthDate[i + 1] - cmdate2.cmonthDate[i];
      cmonthDate.push(cmdate2.cmonthDate[i]);
      cmonthXiaYear.push(1); // doesn't matter since it's not used
      m = i + 1;
      cmonthYear.push(2);
      cmonthJian.push(11); // doesn't matter since it's not used
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }

  return {
    cmonthDate: cmonthDate,
    cmonthXiaYear: cmonthXiaYear,
    cmonthJian: cmonthJian,
    cmonthNum: cmonthNum,
    cmonthYear: cmonthYear,
    cmonthLong: cmonthLong,
    firstMonthNum: 1,
    leap: "leap",
  };
}

// Calculation of the first days of months in guliuli in general.
// The output cmonthDate is a vector of length 12 or 13,
// containing the first days of months counted from jdc,
// with the first element being the zi month and the last
// element being the month before the following zi month.
// yEpoch is the epoch Julian year;
// jdEpoch is the epoch Julian date number for winter solstice;
// dEpoch_lunar is the epoch Julian date number for lunar conjunction
function guliuli_cmonth(y, jdc, yEpoch, jdEpoch, jdEpoch_lunar) {
  let solar = 365.25,
    lunar = 29.0 + 499.0 / 940.0;
  let dy = y - yEpoch - 1;
  let w0 = jdEpoch + dy * solar; // winter solstice (pingqi) in year y-1
  let w1 = w0 + solar; // winter solstice (pingqi) in year y
  let i = Math.floor((Math.floor(w0 + 1.5) - 0.5 - jdEpoch_lunar) / lunar);
  let m0 = jdEpoch_lunar + i * lunar;
  let m1 = m0 + 13.0 * lunar;
  let n = Math.floor(m1 + 0.5) < Math.floor(w1 + 0.5) + 0.1 ? 13 : 12;
  let cmonthDate = [];
  let noZhong = -1; // index of the month without major solar term; -1 means no such month
  for (let j = 0; j < n; j++) {
    let m = m0 + j * lunar;
    cmonthDate.push(Math.floor(m + 0.5) - jdc);
    let mdnext = Math.floor(m + lunar + 0.5);
    let k = (12.0 / solar) * (Math.floor(m + 0.5) - 0.5 - w0);
    k = Math.floor(k + 1);
    let qi = Math.floor(w0 + (k * solar) / 12.0 + 0.5);
    if (qi > mdnext - 0.1) {
      // nozhong qi
      noZhong = j;
    }
  }
  return {cmonthDate: cmonthDate, noZhong: noZhong};
}

// Compute the dates of pingqi's in guliuli counted from jdc
function guliuli_pingqi(y, jdc, yEpoch, jdEpoch) {
  let solar = 365.25,
    lunar = 29.0 + 499.0 / 940.0;
  let dy = y - yEpoch - 1;
  let sol0 = jdEpoch + dy * solar; // winter solstice (pingqi) in year y-1
  let stermDate = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let j = 0; j < 24; j++) {
    let jd = sol0 + ((j + 1) * solar) / 24.0;
    stermDate[j] = Math.floor(jd + 0.5) - jdc;
  }
  return stermDate;
}

// Parameters for the calendars in guliuli
function guliuli_calendar_parameters(li) {
  let solar = 365.25,
    lunar = 29.0 + 499.0 / 940.0;
  let yEpoch,
    jdEpoch,
    jdEpoch_lunar,
    ziOffset = 0;
  switch (li) {
    case "Zhou":
      yEpoch = -104;
      jdEpoch = 1683430.5001; // Dec 25, -104 + 1e-4 days
      jdEpoch_lunar = jdEpoch;
      break;
    case "Huangdi":
      yEpoch = 170;
      jdEpoch = 1783510.5001; // Dec 27, 170 + 1e-4 days
      jdEpoch_lunar = jdEpoch;
      break;
    case "Yin":
      ziOffset = 1; // first month of a year is the chou month
      yEpoch = -47;
      jdEpoch = 1704250.5001; // Dec 26, -47 + 1e-4 days
      jdEpoch_lunar = jdEpoch;
      break;
    case "Lu":
      yEpoch = -481;
      jdEpoch = 1545730.5001; // Dec 25, -481 + 1e-4 days
      jdEpoch_lunar = jdEpoch - lunar / 19.0; // runyu = 1/19 *(29 + 499/940) days
      break;
    case "Zhuanxu":
      ziOffset = -1; // first month of a year is the hai month
      yEpoch = 14;
      jdEpoch_lunar = 1726575.5001; // Feb 9, 15 + 1e-4 days
      jdEpoch = jdEpoch_lunar - solar / 8.0; // J1 -> Z11
      break;
    case "Spring.Xia":
      ziOffset = 2; // first month of a year is the yin month
      yEpoch = 444;
      jdEpoch_lunar = 1883650.5001; // Feb 26, 445 + 1e-4 days
      jdEpoch = jdEpoch_lunar - solar / 6.0; // Z1 -> Z11
      break;
    case "Warring.Xia":
      ziOffset = 2; // first month of a year is the yin month
      yEpoch = 444;
      jdEpoch = 1883590.5001; // Dec 28, 444 + 1e-4 days
      jdEpoch_lunar = jdEpoch;
      break;
    default:
      console.log("Error in subroutine guliuli_out.");
      console.log("Calendar " + li + " not recognized.");
  }
  return {yEpoch: yEpoch, jdEpoch: jdEpoch, jdEpoch_lunar: jdEpoch_lunar, ziOffset: ziOffset};
}

// Compute the first days of months in a particular calendar in guliuli
// counted from Julian date jdc.
// The output cmonthDate is a vector of length 12 or 13,
// containing the first days of months counted from jdc, with the
// first element being the first month of the year in that particular
// calendar in guliuli. If there are 13 months, the last month is a leap month.
// noZhong: the index in which the month does not contain a major solar term
// cndays: number of days in the year for the particular calendar in guliuli.
function guliuli_calendar_cmonth(li, y, jdc) {
  let para = guliuli_calendar_parameters(li);
  let cm1 = guliuli_cmonth(y, jdc, para.yEpoch, para.jdEpoch, para.jdEpoch_lunar);
  let cmonthDate = [];
  //noZhong: index of the month without major solar term, -1 means no such month
  // cndays: number of days in the year
  let i,
    cndays,
    noZhong = -1;
  if (para.ziOffset == 0) {
    cmonthDate = cm1.cmonthDate;
    noZhong = cm1.noZhong;
    let cm2 = guliuli_cmonth(y + 1, jdc, para.yEpoch, para.jdEpoch, para.jdEpoch_lunar);
    cndays = cm2.cmonthDate[0] - cm1.cmonthDate[0];
  } else if (para.ziOffset == -1) {
    let cm0 = guliuli_cmonth(y - 1, jdc, para.yEpoch, para.jdEpoch, para.jdEpoch_lunar);
    let ilast = cm0.cmonthDate.length - 1;
    cmonthDate.push(cm0.cmonthDate[ilast]);
    if (cm0.noZhong == ilast) {
      noZhong = cmonthDate.length - 1;
    }
    let n = cm1.cmonthDate.length - 1;
    for (i = 0; i < n; i++) {
      cmonthDate.push(cm1.cmonthDate[i]);
      if (cm1.noZhong == i) {
        noZhong = cmonthDate.length - 1;
      }
    }
    cndays = cm1.cmonthDate[cm1.cmonthDate.length - 1] - cmonthDate[0];
  } else {
    let n = cm1.cmonthDate.length;
    // start with index ziOffset if there is no leap month in year y-1;
    // othereise, start with ziOffset+1
    let istart = n == 12 ? para.ziOffset : para.ziOffset + 1;
    for (i = istart; i < n; i++) {
      cmonthDate.push(cm1.cmonthDate[i]);
      if (cm1.noZhong == i) {
        noZhong = cmonthDate.length - 1;
      }
    }
    let cm2 = guliuli_cmonth(y + 1, jdc, para.yEpoch, para.jdEpoch, para.jdEpoch_lunar);
    // determine the number of remaining months left in the year:
    // ziOffset if no leap month; ziOffset+1 if there is a leap month
    n = cm2.cmonthDate.length == 12 ? para.ziOffset : para.ziOffset + 1;
    for (i = 0; i < n; i++) {
      cmonthDate.push(cm2.cmonthDate[i]);
      if (cm2.noZhong == i) {
        noZhong = cmonthDate.length - 1;
      }
    }
    cndays = cm2.cmonthDate[n] - cmonthDate[0];
  }
  return {cmonthDate: cmonthDate, noZhong: noZhong, cndays: cndays};
}

// Set up the information for a particular calendar in guliuli to be
// used for the calendar main page
function calDataYear_info_guliuli(li, y, jdc, ndays) {
  let para = guliuli_calendar_parameters(li);

  // current sui
  let cmdate = guliuli_cmonth(y, jdc, para.yEpoch, para.jdEpoch, para.jdEpoch_lunar);
  // the following sui
  let cmdate2 = guliuli_cmonth(y + 1, jdc, para.yEpoch, para.jdEpoch, para.jdEpoch_lunar);

  let cmonthDate = [],
    cmonthJian = [],
    cmonthNum = [],
    cmonthLong = [],
    cmonthYear = [];
  // cmonthXiaYear: Chinese year according to the Xia calendar
  // (yin month being the first month); 0 means previous year, 1 current year.
  let cmonthXiaYear = [];

  // noZhong: index of the month without major solar term, -1 means no such month
  let noZhong = -1;

  // Determine the first month before Jan 1, y
  let i,
    j,
    m,
    d,
    jian,
    yearOffset = 0;
  let leap = cmdate.cmonthDate.length == 12 ? 0 : 1; // leap sui?
  for (i = 1; i < 12; i++) {
    if (cmdate.cmonthDate[i] > 1) {
      j = i - 1; // note that j can only be 0 or 1
      m = i;
      jian = 11 + j;
      if (para.ziOffset == -1) {
        m = 11 + j;
      } else if (para.ziOffset > 0) {
        yearOffset = -1;
        m = 13 - para.ziOffset + j;
        // m can only be 11, 12 or 13.
        if (m == 13) {
          if (leap == 0) {
            m = 1;
            yearOffset = 0;
          } else {
            m = -12;
            jian = -12;
          }
        }
      }
      d = cmdate.cmonthDate[i] - cmdate.cmonthDate[j];
      cmonthDate.push(cmdate.cmonthDate[j]);
      cmonthXiaYear.push(0);
      cmonthYear.push(1 + yearOffset);
      cmonthJian.push(jian);
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
      if (cmdate.noZhong == j) {
        noZhong = cmonthDate.length - 1;
      }
      break;
    }
  }
  // The rest of the months in the sui
  let n = 12 + leap;
  for (i = j + 1; i < n; i++) {
    yearOffset = 0;
    let XiaYear = 0;
    m = i + 1;
    jian = 11 + i;
    if (jian > 12) {
      jian -= 12;
      XiaYear = 1;
    }
    if (m == 13) {
      m = -12;
      jian = -10;
    }
    if (para.ziOffset == -1) {
      m = 11 + i;
      if (m > 12) {
        m -= 12;
      }
      if (m > 9 + leap) {
        yearOffset = 1;
      }
      if (m == 10 && leap == 1) {
        m = -9;
        jian = -9;
      }
      if (m == 11) {
        m = 10;
      }
    } else if (para.ziOffset > 0) {
      XiaYear = i > leap + 1 ? 1 : 0;
      m = 13 - para.ziOffset + i;
      if (m < 13) {
        yearOffset = -1;
      }
      if (m == 13) {
        if (leap == 0) {
          m = 1;
        } else {
          m = -12;
          jian = -12;
          yearOffset = -1;
        }
      }
      if (m > n) {
        m -= n;
        jian -= leap;
      }
    }
    if (i < n - 1) {
      d = cmdate.cmonthDate[i + 1] - cmdate.cmonthDate[i];
    } else {
      d = cmdate2.cmonthDate[0] - cmdate.cmonthDate[i];
    }
    cmonthDate.push(cmdate.cmonthDate[i]);
    cmonthXiaYear.push(XiaYear);
    cmonthYear.push(1 + yearOffset);
    cmonthJian.push(jian);
    cmonthNum.push(m);
    cmonthLong.push(d == 30 ? 1 : 0);
    if (cmdate.noZhong == i) {
      noZhong = cmonthDate.length - 1;
    }
  }
  // The months in the following sui
  leap = cmdate2.cmonthDate.length == 12 ? 0 : 1; // leap sui?
  for (i = 0; i < 5; i++) {
    yearOffset = 0;
    if (cmdate2.cmonthDate[i] < ndays + 0.9) {
      // note that i can only be 0 or 1
      d = cmdate2.cmonthDate[i + 1] - cmdate2.cmonthDate[i];
      cmonthDate.push(cmdate2.cmonthDate[i]);
      if (cmdate2.noZhong == i) {
        noZhong = cmonthDate.length - 1;
      }
      cmonthXiaYear.push(1);
      m = i + 1;
      jian = 11 + i;
      if (para.ziOffset == -1) {
        m = 11 + i;
      } else if (para.ziOffset == 1) {
        yearOffset = -1;
        m = 12 + i;
        if (m == 13) {
          if (leap == 1) {
            m = -12;
            jian = -12;
          } else {
            m = 1;
            yearOffset = 0;
          }
        }
      } else if (para.ziOffset == 2) {
        m = 11 + i;
        yearOffset = -1;
      }
      cmonthYear.push(2 + yearOffset);
      cmonthJian.push(jian);
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }

  // pingqi
  let pingqi = guliuli_pingqi(y, jdc, para.yEpoch, para.jdEpoch);

  leap = para.ziOffset == -1 ? "post 9" : "leap";
  let firstM = para.ziOffset == -1 ? 10 : 1;

  return {
    cmonthDate: cmonthDate,
    cmonthXiaYear: cmonthXiaYear,
    cmonthJian: cmonthJian,
    cmonthNum: cmonthNum,
    cmonthYear: cmonthYear,
    cmonthLong: cmonthLong,
    firstMonthNum: firstM,
    leap: leap,
    pingqi: pingqi,
    noZhong: noZhong,
  };
}

// *** These were experimental during the code development.
//     They are not currently used and are commented out. ***
// Compute the the Qin and early Han Zhuan Xu calendar in
// Julian year y following
// the Zhuanxu epoch with the "add half day" rule to the time of
// lunar conjunction, and then add correction to reconstruct the
// calendar table provided by Zhang Peiyu's paper
// "A Study of the Qin and early Han Calendars based on the newly unearthed
//   bamboo and wooden slips" by Zhang Peiyu in Zhongyuan Wenwu,
//   Volume 5 pp.64-79, (2007).
//
// jdc: Julian day from which days are counted
//function HanZhuanXu_Zhang(y,jdc) {
//   let solar = 365.25, lunar = 29.0 + 499.0/940.0;
//   let jdEpoch = 1587780.5001;
//   let yEpoch = -365;
//   // JD of the winter solstice in the year
//   let sol0 = jdEpoch + (y-yEpoch)*solar - 3*solar/24.0;
//
//   let qi0 = sol0 + (y > -163 ? solar/12.0:0.0);
//   let qi1 = qi0 + solar;
//   // Calculate the JD of month 11 (y <= -163) or 12 (y > -163) using the
//   // "add half day" rule.
//   let i = Math.floor( (Math.floor(qi0 + 1.5) - jdEpoch - 1.0)/lunar);
//   let m0 = jdEpoch + 0.5 + i*lunar;
//   let m1 = m0 + 13.0*lunar;
//   // leap month in the year?
//   let leap = (Math.floor(m1 + 0.5) < Math.floor(qi1 + 0.5)+0.1 ? 1:0);
//
//   // Reset m0 to be the lunar conjunction time associated with month 11
//   m0 -= (y > - 163 ? lunar:0.0);
//
//   // Correction of the days of first month to be consistent
//   // with the calendar table in the paper
//   // "A Study of the Qin and early Han Calendars based on the newly unearthed
//   //  bamboo and wooden slips" by Zhang peiyu in Zhongyuan Wenwu, Volume 5
//    // pp.64-79 (2007).
//   let correction = HanZhuanXu_correction(y);
//   // Number of days in the year
//   let cndays = Math.floor(m0 + (11+leap)*lunar + 0.5) - Math.floor(m0 - lunar + 0.5) + correction[13] - correction[0];
//   let jd, hour, yyyy, mm, dd, j;
//   // noZhong: index of the month without major solar term, -1 if no such month
//   let noZhong = -1;
//   let n = 12 + leap;
//   // First day of a month starting from month 10 ending on post month 9.
//   // If there is no post month 9, it's set to 0.
//   let cmonthDate = [0,0,0,0,0,0,0,0,0,0,0,0,0];
//   for (j=0; j<n; j++) {
//      jd = m0 + (j-1)*lunar;
//      cmonthDate[j] = Math.floor(jd+0.5) - jdc + correction[j];
////      let mdnext = Math.floor(jd + lunar + 0.5);
////      let k = 12.0/solar*(Math.floor(jd+0.5) - 0.5 - sol0);
////      k = Math.floor(k+1);
////      let qi = Math.floor(sol0 + k*solar/12.0 + 0.5);
////      if (qi > mdnext-0.1) {
////            // nozhong qi
////            noZhong = j;
////      }
//   }
//
//   return {cmonthDate:cmonthDate, noZhong:noZhong, cndays:cndays};
//}

// Correction to the first days of the Qin and early Han Zhuanxu calendar
// Return an array of length 14 containing the number of days the first days
//  should be added in order to reproduce the calendar table in the paper
//  "A Study of the Qin and early Han Calendars based on the newly unearthed
//   bamboo and wooden slips" by Zhang Peiyu in Zhongyuan Wenwu,
//   Volume 5 pp.64-79, (2007).
// The elements in the returned array, cor, corresponds to the correction to
// months 10, 11, 12, 1, 2, ..., 9, post 9 and month 10 of the following year.
// The redundancy in the last element of cor[] is for the efficiency of
// calculating the number of days in a calendar year.
//function HanZhuanXu_correction(y) {
//    let cor = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
//    // 10:0, 11:1, 12:2, 1:3, 2:4, 3:5, 4:6, 5:7, 6:8, 7:9, 8:10,
//    // 9:11, post 9:12 10:13
//    if (y==-220) { cor[4]=1; cor[6]=1; cor[8]=1;}
//    if (y==-219) { cor[8]=1; cor[10]=1; cor[13]=1;}
//    if (y==-218) { cor[0] = 1; cor[11]=1;}
//    if (y==-217) { cor[1]=1; cor[3]=1;}
//    if (y==-216) { cor[3]=1; cor[5]=1; cor[7]=1;}
//    if (y==-215) { cor[6] = 1; cor[8]=1; cor[10]=1;}
//    if (y==-214) { cor[10]=1; cor[13]=1;}
//    if (y==-213) { cor[0]=1; cor[2]=1;}
//    if (y==-212) { cor[3] = 1; cor[5]=1; cor[7]=1;}
//    if (y==-211) { cor[5] = 1; cor[7]=1; cor[9]=1;}
//    if (y==-210) { cor[10] = 1; cor[13]=1;}
//    if (y==-209) { cor[0] = 1; cor[2] = 1; cor[13]=1;}
//    if (y==-208) { cor[0] = 1; cor[2] = 1; cor[4] = 1;}
//    if (y==-207) { cor[5] = 1; cor[7]=1; cor[9]=1;}
//    if (y==-206) { cor[9] = 1; cor[11]=1;}
//    if (y==-205) { cor[1] = 1;}
//    if (y==-203) { cor[8] = 1;}
//    if (y==-199) { cor[8] = 1;}
//    if (y==-196) { cor[3] = 1;}
//    if (y==-192) { cor[2] = 1;}
//    if (y==-190) { cor[10] = 1;}
//    if (y==-186) { cor[9] = 1;}
//    if (y==-179) { cor[4] = 1;}
//    if (y==-173) { cor[10] = 1;}
//    if (y==-169) { cor[10] = 1;}
//    if (y==-166) { cor[5] = 1;}
//    if (y==-162) { cor[4] = 1;}
//    if (y==-156) { cor[11] = 1;}
//    if (y==-149) { cor[5] = 1;}
//    if (y==-143) { cor[13]=1;}
//    if (y==-142) { cor[0]=1;}
//    // if (y==-112) { cor[2] = -1;}
//    // if (y==-106) { cor[9] = -1;}
//    return cor;
//}

// Compute the the Qin and early Han Zhuan Xu calendar in
// Julian year y according to Li Zhonglin's paper
// "Researches on Calendars from Qin to early Han (246 B.C. to 104 B.C.)
//   --centering on excavated calendrical bamboo slips", in Zhong guo shi
// yan jiu (Studies in Chinese History), issue no. 2, pp. 17–69 (2012).
//
// jdc: Julian day from which days are counted
function HanZhuanXu(y, jdc) {
  let lunar = 29.0 + 499.0 / 940.0;
  // Calendar A data
  let jdEpoch = 1589523.5001;
  let accMonEpoch = 1670;
  if (y >= -162) {
    // Calendar C data
    jdEpoch = 1646163.5001;
    accMonEpoch = 321;
  } else if (y > -201) {
    // Calendar B data
    jdEpoch = 1633701.5001;
    accMonEpoch = 174;
  }

  let yEpochLeap = y < -162 ? -225 : -179;

  let leapCycle = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1];
  let accMonCycle = [0, 12, 24, 37, 49, 61, 74, 86, 98, 111, 123, 136, 148, 160, 173, 185, 197, 210, 222];

  let yInCycle = (y - yEpochLeap) % 19;
  let accMons = 235 * Math.floor((y - yEpochLeap) / 19) + accMonCycle[yInCycle] + accMonEpoch;
  let leap = leapCycle[yInCycle];

  let m0 = accMons * lunar + jdEpoch;

  // Number of days in the year
  // Verified that it still works around the years
  // when calendar rules were changed.
  let cndays = Math.floor(m0 + (12 + leap) * lunar + 0.5) - Math.floor(m0 + 0.5);
  let jd, hour, yyyy, mm, dd, j;
  // noZhong: index of the month without major solar term, -1 if no such month
  let noZhong = -1;
  let n = 12 + leap;
  // First day of a month starting from month 10 ending on post month 9.
  // If there is no post month 9, it's set to 0.
  let cmonthDate = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (y == -201) {
    for (j = 0; j < 3; j++) {
      jd = m0 + j * lunar;
      cmonthDate[j] = Math.floor(jd + 0.5) - jdc;
    }
    m0 = 1633701.5001 + 470 * lunar;
    for (j = 3; j < n; j++) {
      jd = m0 + j * lunar;
      cmonthDate[j] = Math.floor(jd + 0.5) - jdc;
    }
  } else {
    for (j = 0; j < n; j++) {
      jd = m0 + j * lunar;
      cmonthDate[j] = Math.floor(jd + 0.5) - jdc;
      //      let mdnext = Math.floor(jd + lunar + 0.5);
      //      let k = 12.0/solar*(Math.floor(jd+0.5) - 0.5 - sol0);
      //      k = Math.floor(k+1);
      //      let qi = Math.floor(sol0 + k*solar/12.0 + 0.5);
      //      if (qi > mdnext-0.1) {
      //            // nozhong qi
      //            noZhong = j;
      //      }
    }
  }

  return {cmonthDate: cmonthDate, noZhong: noZhong, cndays: cndays};
}

// Compute the pingqi for the Zhuan Xu calendar in Julian year y
// jdc: Julian day from which days are counted
function ZhuanXu_pingqi(y, jdc) {
  let solar = 365.25;
  let jdEpoch = 1587780.5001;
  let yEpoch = -365;
  // JD of the winter solstice in the year
  let sol0 = jdEpoch + (y - yEpoch) * solar - (3 * solar) / 24.0;
  // Dates of the 24 solar terms (pingqi) starting from J12 and ending on Z11
  let stermDate = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let j = 0; j < 24; j++) {
    let jd = sol0 + ((j + 1) * solar) / 24.0;
    stermDate[j] = Math.floor(jd + 0.5) - jdc;
  }

  return stermDate;
}

// Set up the data for year y for the Han Zhuan Xu calendar.
// To be used for the calendar main page
function calDataYear_HanZhuanXu(y, jd0, ndays, mday, solar, Q0, Q1, Q2, Q3) {
  // current year
  let cmdate = HanZhuanXu(y, jd0 + 1);
  // the following year
  let cmdate2 = HanZhuanXu(y + 1, jd0 + 1);

  let cmonthDate = [],
    cmonthJian = [],
    cmonthNum = [],
    cmonthLong = [],
    cmonthYear = [];
  // cmonthXiaYear: Chinese year according to the Xia calendar
  // (yin month being the first month); 0 means previous year, 1 current year.
  let cmonthXiaYear = [];

  // Determine the first month before Jan 1, y
  let i, j, m, d;
  // noZhong: index of the month without major solar term, -1 if no such month
  let noZhong = -1;
  for (i = 1; i < 12; i++) {
    if (cmdate.cmonthDate[i] > 1) {
      j = i - 1;
      m = 10 + j;
      d = cmdate.cmonthDate[i] - cmdate.cmonthDate[j];
      cmonthDate.push(cmdate.cmonthDate[j]);
      if (cmdate.noZhong == j) {
        noZhong = cmonthDate.length - 1;
      }
      cmonthXiaYear.push(0);
      cmonthYear.push(1);
      cmonthJian.push(m);
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
      break;
    }
  }
  // The rest of the months in Chinese year y
  let n = 12 + (cmdate.cmonthDate[12] == 0 ? 0 : 1);
  for (i = j + 1; i < n; i++) {
    m = 10 + i;
    if (m > 12) {
      m -= 12;
    }
    if (i == 12) {
      m = -9;
    }
    if (i < n - 1) {
      d = cmdate.cmonthDate[i + 1] - cmdate.cmonthDate[i];
    } else {
      d = cmdate2.cmonthDate[0] - cmdate.cmonthDate[i];
    }
    cmonthDate.push(cmdate.cmonthDate[i]);
    if (cmdate.noZhong == i) {
      noZhong = cmonthDate.length - 1;
    }
    cmonthXiaYear.push(m > 9 ? 0 : 1);
    cmonthYear.push(1);
    cmonthJian.push(m);
    cmonthNum.push(m);
    cmonthLong.push(d == 30 ? 1 : 0);
  }
  // months in the following Chinese year
  for (i = 0; i < 5; i++) {
    if (cmdate2.cmonthDate[i] < ndays + 0.9) {
      m = 10 + i;
      d = cmdate2.cmonthDate[i + 1] - cmdate2.cmonthDate[i];
      cmonthDate.push(cmdate2.cmonthDate[i]);
      if (cmdate2.noZhong == i) {
        noZhong = cmonthDate.length - 1;
      }
      cmonthXiaYear.push(1);
      cmonthYear.push(2);
      cmonthJian.push(m);
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }

  // pingqi
  let pingqi = ZhuanXu_pingqi(y, jd0 + 1);

  let leap = "post 9";

  return {
    jd0: jd0,
    mday: mday,
    cmonthDate: cmonthDate,
    cmonthXiaYear: cmonthXiaYear,
    noZhong: noZhong,
    cmonthJian: cmonthJian,
    cmonthNum: cmonthNum,
    cmonthYear: cmonthYear,
    cmonthLong: cmonthLong,
    firstMonthNum: 10,
    leap: leap,
    pingqi: pingqi,
    solar: solar,
    Q0: Q0,
    Q1: Q1,
    Q2: Q2,
    Q3: Q3,
    year: y,
  };
}

// Driver for setting up the calender data for years < -104
// 如果li = null, 春秋时期默认为Chunqiu历，也就是当时的鲁历；战国时期默认为Zhou历
export function calDataYear_ancient(y, jd0, ndays, mday, solar, Q0, Q1, Q2, Q3, li) {
  // Qin and early Han calendar
  if (y >= -220 && y < -104) {
    return calDataYear_HanZhuanXu(y, jd0, ndays, mday, solar, Q0, Q1, Q2, Q3);
  }

  let i, c;
  // Warring state period
  if (y >= -479 && y < -220) {
    if (li == null || li == undefined || li == 'default') {
      li = "Zhou";
    }
    c = calDataYear_info_guliuli(li, y, jd0 + 1, ndays);
    return {
      jd0: jd0,
      mday: mday,
      cmonthDate: c.cmonthDate,
      cmonthXiaYear: c.cmonthXiaYear,
      noZhong: c.noZhong,
      cmonthJian: c.cmonthJian,
      cmonthNum: c.cmonthNum,
      cmonthYear: c.cmonthYear,
      cmonthLong: c.cmonthLong,
      firstMonthNum: c.firstMonthNum,
      leap: c.leap,
      pingqi: c.pingqi,
      solar: solar,
      Q0: Q0,
      Q1: Q1,
      Q2: Q2,
      Q3: Q3,
      year: y,
    };
  }

  // Spring and Autumn period
  if (y < -479) {
    if (li == null || li == undefined || li == 'default') {
      li = "Chunqiu";
    }
    if (li == "Chunqiu") {
      c = calDataYear_info_chunqiu(y, jd0 + 1, ndays);
      // Note: no pingqi
      return {
        jd0: jd0,
        mday: mday,
        cmonthDate: c.cmonthDate,
        cmonthXiaYear: c.cmonthXiaYear,
        cmonthJian: c.cmonthJian,
        cmonthNum: c.cmonthNum,
        cmonthYear: c.cmonthYear,
        cmonthLong: c.cmonthLong,
        firstMonthNum: c.firstMonthNum,
        leap: c.leap,
        solar: solar,
        Q0: Q0,
        Q1: Q1,
        Q2: Q2,
        Q3: Q3,
        year: y,
      };
    } else {
      c = calDataYear_info_guliuli(li, y, jd0 + 1, ndays);
      return {
        jd0: jd0,
        mday: mday,
        cmonthDate: c.cmonthDate,
        cmonthXiaYear: c.cmonthXiaYear,
        noZhong: c.noZhong,
        cmonthJian: c.cmonthJian,
        cmonthNum: c.cmonthNum,
        cmonthYear: c.cmonthYear,
        cmonthLong: c.cmonthLong,
        firstMonthNum: c.firstMonthNum,
        leap: c.leap,
        pingqi: c.pingqi,
        solar: solar,
        Q0: Q0,
        Q1: Q1,
        Q2: Q2,
        Q3: Q3,
        year: y,
      };
    }
  }
}
