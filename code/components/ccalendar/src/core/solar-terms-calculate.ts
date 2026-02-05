/**
 * 24节气计算模块
 * 
 * 基于现代天文数据计算24节气
 */
import { SolarTermsType, SolarTermDetails } from '../types.js'
import { nDaysofGregJul, decompressTime } from './utilities.js';

// @ts-ignore - 导入原始 JS 模块
import { solarTermMoonPhase_ystart, offsets_sunMoon, solarTerms } from './calendarData.js';
// @ts-ignore
import { decompress_solarTerms } from './decompressSunMoonData.js';

/**
 * 基于现代天文数据计算24节气（定气），独立于历书和政权
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @returns 24节气时间数组（天数，从1月1日零点UTC+8起算）
 * 24节气时间
 * 中国农历的24节气时间，从'小寒'开始到'小寒'结束，单位: 天数，从距离Gregorian/Julian的1月1日零点零分(UTC+8)开始计算
 * 一共24个数据项
 * like [8.35625, 23.20347222222222, 38.15486111111111, ...],
 */
export function calSolarTerms(year: number, solarTermsType: SolarTermsType): number[] {
  const ndays = nDaysofGregJul(year);
  const offsets: any = offsets_sunMoon();
  const solarAll: any = solarTerms();
  const inds: number = year - solarTermMoonPhase_ystart();
  let solar: any = solarAll[inds];
  let solar2: any = [solar.pop()];
  solar = decompress_solarTerms(year, 1, offsets.solar, solar, (solarTermsType === SolarTermsType.DE441) ? 441 : 431);

  if (solar[0] < 4323) {
    solar2.push(solarAll[inds + 1][0]);
  }
  solar2 = decompress_solarTerms(year + 1, 0, offsets.solar, solar2, (solarTermsType === SolarTermsType.DE441) ? 441 : 431);
  for (let i = 0; i < solar2.length; i++) {
    solar.push(solar2[i] + ndays * 1441);
  }
  return decompressTime(solar);
}

/**
 * 获取指定公历月份的24节气数据
 * 
 * @param year - 公历 / 儒略历年
 * @param month - 月份
 * @param mday - year的月累计天数数组
 * @param solarTerms - year的24节气数据 
 * @returns 节气数据数组
 * - id 月相。 0：'小寒'，2：'大寒'，...，23: '冬至'
 * - time 距离月初的天数。
 */
export function getSolarTermsByMonth(
  year: number,
  month: number,
  mday: number[],
  solarTerms: number[]
): Array<SolarTermDetails> {
  const m0 = mday[month];
  const m1 = mday[month + 1];

  const solars: Array<SolarTermDetails> = [];
  for (let i = 0; i < solarTerms.length; i++) {
    const dd = Math.floor(solarTerms[i]);
    if (dd > m0 && dd <= m1) {
      const h = 24.0 * (solarTerms[i] - dd);
      let d = dd - m0;
      // Correct for Gregorian calendar reform
      if (m1 - m0 < 25) {
        d += d > 4 ? 10 : 0;
      }
      solars.push({ id: i, day: d, hours: h });
    }
  }

  return solars;
}
