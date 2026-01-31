/**
 * 语言包导出
 */
import type { LocaleData, SupportedLocale } from '../types.js';
import { zhHans } from './zh-Hans.js';
import { zhHant } from './zh-Hant.js';
import { en } from './en.js';

export { zhHans, zhHant, en };

/** 获取语言包 */
export function getLocale(lng: SupportedLocale): LocaleData {
  switch (lng) {
    case 'zh-Hans':
      return zhHans;
    case 'zh-Hant':
      return zhHant;
    case 'en':
      return en;
    default:
      return zhHans;
  }
}
