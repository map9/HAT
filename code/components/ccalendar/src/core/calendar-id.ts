/**
 * 中国农历历书和政权与公历年的操作
 * 通过公历年来查找所在年存在的不同政权和使用的不同历书
 */

import { ChineseCalendarType, WesternCalendarType } from '../types.js';

/**
 * 通过给定的公历年来获得当时的公历历书名称
 * 
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @returns 公历历书名称
 */
export function getWesternCalendarBookByYear(year: number): WesternCalendarType {
  if (year > 1582) {
    return WesternCalendarType.GREGORIAN;
  } else if (year === 1582) {
    return WesternCalendarType.REFORM;
  } else if (year > 7) {
    return WesternCalendarType.JULIAN;
  } else {
    return WesternCalendarType.PROLEPTIC_JULIAN;
  }
}

/**
 * 通过公历年（儒略历/逆推儒略历/格里历）获取当年（古代中国，221 BC之前）所采用过的历书。
 * @param {number} year - 公历年（儒略历/逆推儒略历/格里历）
 * @returns 返回一个包含历书的数组
 */
export function getAncientCalendarBooksByYear(year: number): ChineseCalendarType[] {
  let books: ChineseCalendarType[] = [];

  // Spring and Autumn
  // 春秋时期(公元前722年 – 前481年)各国施行不同历法，当时使用的历法有六种：春秋历、周历、殷历和夏历，这里称当时鲁国的历法为春秋历。
  if (year < -479) {
    books = [ChineseCalendarType.CHUNQIU, ChineseCalendarType.ZHOU, ChineseCalendarType.YIN, ChineseCalendarType.SPRING_XIA];
  }

  // Warring States
  // 战国时代(约前480年至前222年)各国施行不同历法，当时使用的历法有六种：周历、鲁历、殷历、夏历、黄帝历和颛顼历，合称「古六历」。
  else if (year >= -479 && year < -220) {
    books = [ChineseCalendarType.ZHOU, ChineseCalendarType.LU, ChineseCalendarType.HUANGDI, ChineseCalendarType.YIN, ChineseCalendarType.WARRING_XIA, ChineseCalendarType.ZHUANXU];
  }

  // Qin and early Han
  // 秦朝及汉初(公元前221年 – 前104年)的历法沿用颛顼历的月序。颛顼历是古六历之一，据说战国后期在秦国使用。
  // 秦朝的历法与颛顼历稍有不同。汉朝建立后基本上沿用秦历，一百年间只作了少许修改，直到汉武帝太初元年(公元前104年)才颁行新历法，
  // 以建寅(正月)为年首，并把闰月置于无中气的月份，这使公元前104年的农历年有十五个农历月。
  // 秦朝为了避秦始皇名讳(正、政同音)，把正月改称「端月」，到汉朝又改回正月。本计算方法没有跟从历史，在秦朝仍称建寅为正月。
  else if (year >= -220 && year < -104) {
    books = [ChineseCalendarType.ZHUANXU];
  }

  return books;
}

/**
 * 通过公历年（儒略历/逆推儒略历/格里历）获取当年中国范围内所存在的采用不同历书的政权。
 * @param {number} year - 公历年（儒略历/逆推儒略历/格里历）
 * @returns 返回一个包含政权的数组
 */
export function getCalendarRegionsByYear(year: number): ChineseCalendarType[] {
  let regions: ChineseCalendarType[] = [];

  // Three Kingdoms
  if (year > 220.5 && year < 280.5) {
    // 221年，魏国、蜀国建国
    regions = [ChineseCalendarType.TKI_WEI, ChineseCalendarType.TKI_SHU];
    // 222年，吴国建国
    if (year > 221.5) {
      regions.push(ChineseCalendarType.TKI_WU);
    }
    // 264年，蜀国被魏国灭亡
    if (year > 263.5) {
      regions.splice(1, 1);
    }
    // 265年，晋替代魏国
    if (year > 265.5) {
      regions[0] = ChineseCalendarType.JIN;
    }
  }

  // South and North
  if (year > 383.5 && year < 590.5) {
    // default: South dynasties
    if (year < 419.5) {
      regions = [ChineseCalendarType.SOUTHNORTH_SOUTH_JIN];
    } else if (year < 479.5) {
      regions = [ChineseCalendarType.SOUTHNORTH_SOUTH_SONG];
    } else if (year < 502.5) {
      regions = [ChineseCalendarType.SOUTHNORTH_SOUTH_QI];
    } else if (year < 557.5) {
      regions = [ChineseCalendarType.SOUTHNORTH_SOUTH_LIANG];
    } else {
      regions = [ChineseCalendarType.SOUTHNORTH_SOUTH_CHEN];
    }

    // North dynasties
    // LaterQin
    if (year < 417.5) {
      regions.push(ChineseCalendarType.SOUTHNORTH_NORTH_LATERQIN);
    }
    // NorthernLiang
    if (year > 411.5 && year < 439.5) {
      regions.push(ChineseCalendarType.SOUTHNORTH_NORTH_NORTHERNLIANG);
    }
    // WeiZhouSui
    if (year > 397.5) {
      if (year < 534.5) {
        regions.push(ChineseCalendarType.SOUTHNORTH_NORTH_NORTHERNWEI);
      } else if (year < 557.5) {
        regions.push(ChineseCalendarType.SOUTHNORTH_NORTH_WESTERNWEI);
      } else if (year < 580.5) {
        regions.push(ChineseCalendarType.SOUTHNORTH_NORTH_NORTHERNZHOU);
      } else {
        regions.push(ChineseCalendarType.SOUTHNORTH_NORTH_SUI);
      }
    }
    // WeiQi
    if (year > 533.5 && year < 577.5) {
      if (year < 549.5) {
        regions.push(ChineseCalendarType.SOUTHNORTH_NORTH_EASTERNWEI);
      } else {
        regions.push(ChineseCalendarType.SOUTHNORTH_NORTH_NORTHERNQI);
      }
    }
  }

  // SongLiaoJinYuan
  if (year > 946.5 && year < 1279.5) {
    // default: South dynasties
    if (year < 950.5) {
      regions = [ChineseCalendarType.SONGLIAOJINYUAN_LATERHAN];
    } else if (year < 959.5) {
      regions = [ChineseCalendarType.SONGLIAOJINYUAN_LATERZHOU];
    } else {
      regions = [ChineseCalendarType.SONGLIAOJINYUAN_SONG];
    }

    // North dynasties
    // LiaoJinYuan
    if (year < 1125.5) {
      regions.push(ChineseCalendarType.SONGLIAOJINYUAN_LIAO);
    } else if (year < 1234.5) {
      regions.push(ChineseCalendarType.SONGLIAOJINYUAN_JIN);
    } else if (year < 1270.5) {
      regions.push(ChineseCalendarType.SONGLIAOJINYUAN_MONGOL);
    } else {
      regions.push(ChineseCalendarType.SONGLIAOJINYUAN_YUAN);
    }
  }

  // QingSouthernMing
  if (year > 1644.5 && year < 1683.5) {
    // default: Qing
    regions = [ChineseCalendarType.QING_QING];

    // SouthernMing
    if (year < 1661.5) {
      regions.push(ChineseCalendarType.QING_SOUTHERNMING);
    } else {
      regions.push(ChineseCalendarType.QING_ZHENG);
    }
  }

  return regions;
}

/**
 * 纠正给定公历年使用的历书名称。
 * @param {number} year 公历年（儒略历/逆推儒略历/格里历）
 * @param {ChineseCalendarType} id 历书名称。
 * 只能为：
 * - Huangdi 黄帝历
 * - Zhuanxu 颛顼历
 * - Spring.Xia 夏历（春秋时某些国家使用的夏历）
 * - Yin 殷历
 * - Zhou 周历
 * - Chunqiu 春秋历（春秋时鲁国使用的历书）
 * - Warring.Xia 夏历（战国时某些国家使用的夏历）
 * - Lu 鲁历（战国时鲁国使用的历书）
 * @returns 
 * - 如果name不在当时使用的历书内，则返回主流的历书名称；
 * - 如果name在当时使用的历书内，则返回name。
 */
export function correctAncientCalendarBookByYear(year: number, id: ChineseCalendarType | null): ChineseCalendarType {
  const books: ChineseCalendarType[] = getAncientCalendarBooksByYear(year);

  // 不属于古代的历书覆盖的时间
  if (books.length == 0) {
    return ChineseCalendarType.DEFAULT;
  }

  // 判断name是否在books中
  const ret = books.find(book => book == id);
  if (ret === undefined) {
    id = null;
  }
  
  // 缺省为第一本历书
  if (id == null || id == ChineseCalendarType.DEFAULT) {
    id = books[0];
  }

  return id;
}

/**
 * 纠正给定公历年，存在的政权名称。
 * @param {number} year 公历年（儒略历/逆推儒略历/格里历）
 * @param {ChineseCalendarType} id 政权名称。
 * @returns 
 * - 如果name不在当时存在的政权内，则返回当时正统的政权名称；
 * - 如果name在当时存在的政权内，则返回name。
 */
export function correctCalendarRegionByYear(year: number, id: ChineseCalendarType | null): ChineseCalendarType {
  const regions = getCalendarRegionsByYear(year);

  // 不属于某个国家存在时的时间
  if (regions.length == 0) {
    return ChineseCalendarType.DEFAULT;
  }

  // 判断name是否在regions中
  const ret = regions.find(region => region == id);
  if (ret === undefined) {
    id = null;
  }
  
  // 缺省为第一个区域
  if (id == null || id == ChineseCalendarType.DEFAULT ) {
    id = regions[0];
  }

  return id;
}

/**
 * 纠正给定公历年，存在的历书/政权名称。
 * @param {number} year 公历年（儒略历/逆推儒略历/格里历）
 * @param {ChineseCalendarType} id 历书/政权名称。
 * @returns 
 * - 如果name不在当时存在的政权内，则返回当时正统的政权名称；
 * - 如果name在当时存在的政权内，则返回name。
 */
export function correctCalendarByYear(year: number, id: ChineseCalendarType | null): ChineseCalendarType {
  if (year < -104) {
    return correctAncientCalendarBookByYear(year, id);
  }
  else {
    return correctCalendarRegionByYear(year, id);
  }
}

/**
 * 给定公历年，存在的政权名称，判断是是否是当时主流的政权。
 * @param year 公历年（儒略历/逆推儒略历/格里历）
 * @param region 政权
 * @returns
 */
export function isDefaultRegionCalendar(region: ChineseCalendarType | null, year: number): boolean {
  if (
    region == undefined || 
    region == null ||
    region == ChineseCalendarType.DEFAULT ||
    // 魏
    region == ChineseCalendarType.TKI_WEI ||

    // 晋，宋，齐，梁，陈
    region == ChineseCalendarType.JIN ||
    region == ChineseCalendarType.SOUTHNORTH_SOUTH_JIN ||
    region == ChineseCalendarType.SOUTHNORTH_SOUTH_SONG ||
    region == ChineseCalendarType.SOUTHNORTH_SOUTH_QI ||
    region == ChineseCalendarType.SOUTHNORTH_SOUTH_LIANG ||
    region == ChineseCalendarType.SOUTHNORTH_SOUTH_CHEN ||

    // 后汉，后周，宋
    region == ChineseCalendarType.SONGLIAOJINYUAN_LATERHAN ||
    region == ChineseCalendarType.SONGLIAOJINYUAN_LATERZHOU ||
    region == ChineseCalendarType.SONGLIAOJINYUAN_SONG ||

    // 清
    region == ChineseCalendarType.QING_QING
  ) {
    return true;
  }

  return false;
}