"use strict";

// Traditional Chinese Calendar
// 中国的传统历法通常被称为农历，但它实际上是阴阳合历，结合了太阳和月亮的运行规律。
export const tcYear = function timeInterval() {
  /**
   * 计算该公历date下的中国农历年份。
   * @param {Date} date - 一个公历日期，UTC时间。
   * @returns {Object} - 返回一个农历年对象。对象包含以下属性：
   * - {Array} he - 农历年干支数组，从0开始，0为'甲'或者'子';
   * - {number} zodiac - 农历年生肖，从0开始，0为'鼠';
   * - {number} jian - 农历年月建起始月份，从0开始，0为夏历的一月;
   * - {Array<Object>} eranames - 农历年纪年;
   * @example
   */
  function tcYear(date) {
    return new Year();
  }

  tcYear.range = (start, stop, step) => {
    const range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    let previous;
    do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
    while (previous < start && start < stop);
    return range;
  };

  return tcYear;
}