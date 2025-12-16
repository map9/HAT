"use strict";

// Set up calendar data for the calendar page
export function setupRegionCalendar(region, y, calc_pingqi) {
  // Julian date number at noon on Dec 31, y-1
  let accleap = Math.floor(0.25 * (y + 799) + 1e-5);
  let jdc = 1429223 + accleap + 365 * (y + 799);

  let i, cmonthDate;
  switch (region) {
    case "Tki.Shu":
      cmonthDate = cmonthDate_Shu(y, jdc, calc_pingqi);
      break;
    case "Tki.Wu":
      cmonthDate = cmonthDate_Wu(y, jdc, calc_pingqi);
      break;
    // LaterQin
    case "SouthNorth.North.LaterQin":
      cmonthDate = cmonthDate_LaterQin(y, jdc, calc_pingqi);
      break;
    // NorthernLiang
    case "SouthNorth.North.NorthernLiang":
      cmonthDate = cmonthDate_NorthernLiang(y, jdc, calc_pingqi);
      break;
    // WeiZhouSui
    case "SouthNorth.North.NorthernWei":
    case "SouthNorth.North.WesternWei":
    case "SouthNorth.North.NorthernZhou":
    case "SouthNorth.North.Sui":
      cmonthDate = cmonthDate_WeiZhouSui(y, jdc, calc_pingqi);
      break;
    // WeiQi
    case "SouthNorth.North.EasternWei":
    case "SouthNorth.North.NorthernQi":
      cmonthDate = cmonthDate_WeiQi(y, jdc, calc_pingqi);
      break;
    // LiaoJinYuan
    case "SongLiaoJinYuan.Liao":
    case "SongLiaoJinYuan.Jin":
    case "SongLiaoJinYuan.Mongol":
    case "SongLiaoJinYuan.Yuan":
      return cmonthDate_LiaoJinYuan(y, jdc, calc_pingqi);
    // SouthernMing
    case "Qing.SouthernMing":
    case "Qing.Zheng":
      // use jdc-10 for Gregorian calendar
      return cmonthDate_southernMing(y, jdc - 10, calc_pingqi);
  }
  let cm = [y, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let out;
  if (calc_pingqi) {
    for (i = 0; i < 15; i++) {
      cm[i + 1] = cmonthDate.cm[i];
    }
    out = {cm: cm, pingqi: cmonthDate.pingqi};
  } else {
    for (i = 0; i < 15; i++) {
      cm[i + 1] = cmonthDate[i];
    }
    out = cm;
  }
  return out;
}

export function isDefaultRegionCalendar(region, y) {
  if (
    region == undefined || 
    region == null ||
    region == 'Tki.Wei' ||
    region == 'Jin' ||
    region == 'SouthNorth.South.Jin' ||
    region == 'SouthNorth.South.Song' ||
    region == 'SouthNorth.South.Qi' ||
    region == 'SouthNorth.South.Liang' ||
    region == 'SouthNorth.South.Chen' ||
    region == 'SongLiaoJinYuan.LaterHan' ||
    region == 'SongLiaoJinYuan.LaterZhou' ||
    region == 'SongLiaoJinYuan.Song' ||
    region == 'Qing.Qing'
  ) {
    return true;
  }

  return false;
}

// Almanac parameters
// Here lunar is the lunar cycle in days and solar is the solar 
// cycle in days.
// JDw and jd_epoch are defined as
// JD of winter solstice in year y-1 = JDw + y*solar
// JD of conjunctions = jd_epoch + i*lunar for any integer i.
function get_li_parameters(li) {
  let lunar = 0,
    solar = 0,
    jd_epoch = 0,
    JDw = 0,
    dtc_round = 0,
    dts_round = 0;
  switch (li) {
    case "Sifen":
      // 東漢四分
      lunar = 29.0 + 499.0 / 940.0;
      solar = 365.25;
      jd_epoch = 1662610.5;
      JDw = 1721050.5;
      dtc_round = 1e-3;
      dts_round = 1e-3;
      break;
    case "Qianxiang":
      // 乾象
      lunar = 29.0 + 773.0 / 1457.0;
      solar = 365.0 + 145.0 / 589.0;
      JDw = 1721050.5 + 210.0 / 589.0;
      jd_epoch = 1796295.5 + 1067.0 / 1457.0;
      dtc_round = 1e-4;
      dts_round = 1e-5;
      break;
    case "Jingchu":
      // 景初
      lunar = 29.0 + 2419.0 / 4559.0;
      solar = 365.0 + 455.0 / 1843.0;
      JDw = 1721050.5 + 220.0 / 1843.0;
      jd_epoch = 1811120.5;
      dtc_round = 1e-4;
      dts_round = 1e-5;
      break;
    case "Sanji":
      // 三紀
      lunar = 29.0 + 3217.0 / 6063.0;
      solar = 365.0 + 605.0 / 2451.0;
      JDw = 1721050.5 + 280.0 / 2451.0;
      jd_epoch = 1861292.5 + 2826.0 / 6063.0;
      dtc_round = 1e-4;
      dts_round = 1e-5;
      break;
    case "Xuanshi":
      // 玄始
      lunar = 29.0 + 47251.0 / 89052.0;
      solar = 365.0 + 1759.0 / 7200.0;
      JDw = 1721048.5 + 1189.0 / 1200.0;
      jd_epoch = 1871510.5 + 4995.0 / 89052.0;
      dtc_round = 1e-6;
      dts_round = 1e-6;
      break;
    case "Zhengguang":
      // 正光
      lunar = 29.0 + 39769.0 / 74952.0;
      solar = 365.0 + 1477.0 / 6060.0;
      JDw = 1721048.5 + 569.0 / 1515.0;
      jd_epoch = 1911671.5 + 6427.0 / 9369.0;
      dtc_round = 1e-6;
      dts_round = 1e-6;
      break;
    case "fakeMingKeRang":
      // 明克讓, lost; parameters tweaked from 正光
      // according to p. 24 in Volume 6 of 《歷代長術輯要》
      // by 汪曰楨: 此術無考，劉氏長術仍借正光術推之，但依史文移置閏月。
      // 今從其例增節氣小餘十分之四，乃與當時置閏相符。
      lunar = 29.0 + 39769.0 / 74952.0;
      solar = 365.0 + 1477.0 / 6060.0;
      JDw = 1721048.5 + 569.0 / 1515.0 + 0.4;
      jd_epoch = 1911671.5 + 6427.0 / 9369.0;
      dtc_round = 1e-6;
      dts_round = 1e-6;
      break;
    case "Xinghe":
      // 興和
      lunar = 29.0 + 110647.0 / 208530.0;
      solar = 365.0 + 4117.0 / 16860.0;
      JDw = 1721048.5 + 1118.0 / 4215.0;
      jd_epoch = 1918286.5 + 111983.0 / 208530.0;
      dtc_round = 1e-6;
      dts_round = 1e-6;
      break;
    case "Tianbao":
      // 天保
      lunar = 29.0 + 155272.0 / 292635.0;
      solar = 365.0 + 5787.0 / 23660.0;
      JDw = 1721049.5 + 193.0 / 5915.0;
      jd_epoch = 1921918.5 + 231721.0 / 292635.0;
      dtc_round = 1e-6;
      dts_round = 1e-6;
      break;
    case "Tianhe":
      // 天和
      lunar = 29.0 + 153991.0 / 290160.0;
      solar = 365.0 + 5731.0 / 23460.0;
      JDw = 1721047.5 + 1331.0 / 3910.0;
      jd_epoch = 1928976.5 + 246737.0 / 290160.0;
      dtc_round = 1e-6;
      dts_round = 1e-6;
      break;
    case "Daxiang":
      // 大象
      lunar = 29.0 + 28422.0 / 53563.0;
      solar = 365.0 + 3167.0 / 12992.0;
      JDw = 1721048.5 + 281.0 / 6496.0;
      jd_epoch = 1932520.5 + 36950.0 / 53563.0;
      dtc_round = 1e-5;
      dts_round = 1e-6;
      break;
    case "Kaihuang":
      // 開皇
      lunar = 29.0 + 96529.0 / 181920.0;
      solar = 365.0 + 25063.0 / 102960.0;
      JDw = 1721048.5 + 908.0 / 6435.0;
      jd_epoch = 1934971.5 + 19841.0 / 36384.0;
      dtc_round = 1e-6;
      dts_round = 1e-7;
      break;
    case "Xuanming":
      // 宣明 Note: only for pinqi calculation
      solar = 365.0 + 137.0 / 560.0;
      JDw = 1721047.5 + 93.0 / 140.0;
      dts_round = 1e-5;
      break;
    case "RevisedDaming":
      // 趙知微重修大明曆 Note: only for pinqi calculation
      solar = 365.0 + 637.0 / 2615.0;
      JDw = 1721048.5 + 542.0 / 2615.0;
      dts_round = 1e-5;
      break;
    case "Datong":
      // 大统 Note: only for pinqi calculation
      solar = 365.2425;
      JDw = 1721049.9175;
      dts_round = 1e-8;
      break;
    default:
      console.log("Almanac " + li + " not recognized.");
  }
  jd_epoch += dtc_round;
  JDw += dts_round;
  return {li: li, lunar: lunar, solar: solar, jd_epoch: jd_epoch, JDw: JDw, dtc_round: dtc_round, dts_round: dts_round};
}

// Given the parameters JDw and solar, compute the 24 pingqi's 
// in a sui.
// Here solar is the solar cycle in days.
// jdc: Julian day from which days are counted
function compute_pingqi(y, para, jdc) {
    let dqi = para.solar/24.0;
    let J12 = para.JDw + y*para.solar + dqi;
    // Dates of the 24 solar terms (pingqi) starting from J12 and 
    // ending on J12 in the following sui
    let stermDate = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for (let i=0; i<25; i++) {
        stermDate[i] = Math.floor(J12 + i*dqi + 0.5) - jdc;
    }
    return stermDate;
}

// Given the parameters JDw, jd_epoch, solar and lunar,
// determine all months in a Chinese year using the No Zhongqi rule.
// jdc: Julian day from which days are counted
function cmonthDate_pingshou_noZhongqi(y, para, jdc) {
    let Z1 = para.JDw + (y + 1.0/6.0)*para.solar;
    // midnight after Z1 in y+1
    let Z1b = Math.floor(Z1 + para.solar + 0.5) + 0.5; 
    let i1 = Math.floor((Math.floor(Z1 +0.5) + 0.5 - para.jd_epoch)/para.lunar);
    let m1 = para.jd_epoch + i1*para.lunar; // New year in N_y
    // has leap month?
    let leap = (m1 + 13*para.lunar > Z1b ? 0:1);
    // Number of days in N_y
    let cndays = Math.floor(m1 + (12+leap)*para.lunar + 0.5) - Math.floor(m1+0.5);
    
    // First days of months. 
    // cmonthDate[12] = First day of a leap month
    // cmonthDate[13] = leap month number
    // cmonthDate[14] = Number of days in N_y (Note: may be modified when another calendar was used in the following year)
    // If no leap month, cmonthDate[12] = cmonthDate[13] = 0.
    let cmonthDate = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,cndays];
    let i;
    if (leap==0) {
        for (i=0; i<12; i++) {
            cmonthDate[i] = Math.floor(m1 + i*para.lunar + 0.5) - jdc;
        }
    } else {
        let offset = 0;
        let dmqi = para.solar/12.0;
        for (i=0; i<12; i++) {
            let d = m1 + (i+offset)*para.lunar + 0.5;
            if (offset==0) {
                // determine if this is a leap month
                let dm = Z1 + i*dmqi + 0.5;
                if (Math.floor(dm) > Math.floor(d + para.lunar) - 0.01) {
                    // This is a leap month
                    cmonthDate[13] = i;
                    cmonthDate[12] = Math.floor(d) - jdc;
                    offset = 1; d += para.lunar;
                }
            }
            cmonthDate[i] = Math.floor(d) - jdc;
        }
        if (offset==0) {
            // leap month 12
            cmonthDate[13] = 12;
            cmonthDate[12] = Math.floor(m1 + 12*para.lunar + 0.5) - jdc;
        }
    }
    return cmonthDate;
}

// Shu dynasty 
function cmonthDate_Shu(y, jdc, calc_pingqi) {
    let para = get_li_parameters('Sifen');
    let out = (calc_pingqi ? {cm:cmonthDate_pingshou_noZhongqi(y, para, jdc), pingqi:compute_pingqi(y, para, jdc)}:cmonthDate_pingshou_noZhongqi(y, para, jdc));
    return out;
}

// Wu dynasty
function cmonthDate_Wu(y, jdc, calc_pingqi) {
    let li = (y < 222.5 ? 'Sifen':'Qianxiang');
    let para = get_li_parameters(li);
    let cm = cmonthDate_pingshou_noZhongqi(y, para, jdc);
    // Manually correct the dates in N_{244} month 12 and N_{247} month 9
    if (y==244) { cm[11]++;}
    if (y==247) { cm[8]--;}
    let out;
    if (calc_pingqi) {
        let pingqi = compute_pingqi(y, para, jdc);
        if (y==223) {
            // pingqi before J1 still used Sifen almanac 
            // because they were in N_{222}.
            para = get_li_parameters('Sifen');
            let pingqi2 = compute_pingqi(223, para, jdc);
            for (let i=0; i<3; i++) { pingqi[i] = pingqi2[i];}
        } 
        out = {cm:cm, pingqi:pingqi};
    } else {
        out = cm;
    }
    return out;
}

// Later Qin
function cmonthDate_LaterQin(y, jdc, calc_pingqi) {
    let para = get_li_parameters('Sanji');
    let out = (calc_pingqi ? {cm:cmonthDate_pingshou_noZhongqi(y, para, jdc), pingqi:compute_pingqi(y, para, jdc)}:cmonthDate_pingshou_noZhongqi(y, para, jdc));
    return out;
}

// Northern Liang
function cmonthDate_NorthernLiang(y, jdc, calc_pingqi) {
    let para = get_li_parameters('Xuanshi');
    let cm = cmonthDate_pingshou_noZhongqi(y, para, jdc);
    // Manually correct the data in N_{430} month 2
    if (y==430) { cm[1]++;}
    let out = (calc_pingqi ? {cm:cm, pingqi:compute_pingqi(y, para, jdc)}:cm);
    return out;
}

// Northern Wei, Western Wei, Northern Zhou, Sui
function cmonthDate_WeiZhouSui(y, jdc, calc_pingqi) {
    let li;
    if (y < 451.5) {
        li = 'Jingchu';
    } else if (y < 522.5) {
        li = 'Xuanshi';
    } else if (y < 558.5) {
        li = 'Zhengguang';
    } else if (y < 565.5) {
        li = 'fakeMingKeRang';
    } else if (y < 578.5) {
        li = 'Tianhe';
    } else if (y < 583.5) {
        li = 'Daxiang';
    } else {
        li = 'Kaihuang';
    }
    let para = get_li_parameters(li);
    let cm = cmonthDate_pingshou_noZhongqi(y, para, jdc);
    // Manually correct the data in N_{430} month 2, 
    if (y==430) { cm[1]++;}
    // Correct the number of days in N_{565} caused by the change of 
    // calendar in N_{566}
    if (y==565) { cm[14]++;}
    let out;
    if (calc_pingqi) {
        let pingqi = compute_pingqi(y, para, jdc);
        // Deal with the transition years
        let i, pingqi2;
        if (y==452) {
            // Change J12, Z12 and J1
            para = get_li_parameters('Jingchu');
            pingqi2 = compute_pingqi(y, para, jdc);
            for (i=0; i<3; i++) {pingqi[i] = pingqi2[i];}
        } else if (y==523) {
            // Change J12, Z12
            para = get_li_parameters('Xuanshi');
            pingqi2 = compute_pingqi(y, para, jdc);
            for (i=0; i<2; i++) {pingqi[i] = pingqi2[i];}
        } else if (y==559) {
            // Change J12, Z12
            para = get_li_parameters('Zhengguang');
            pingqi2 = compute_pingqi(y, para, jdc);
            for (i=0; i<2; i++) {pingqi[i] = pingqi2[i];}
        } else if (y==566) {
            // Change J12, Z12 and J1
            para = get_li_parameters('fakeMingKeRang');
            pingqi2 = compute_pingqi(y, para, jdc);
            for (i=0; i<3; i++) {pingqi[i] = pingqi2[i];}
        } else if (y==579) {
            // Change J12, Z12 and J1
            para = get_li_parameters('Tianhe');
            pingqi2 = compute_pingqi(y, para, jdc);
            for (i=0; i<3; i++) {pingqi[i] = pingqi2[i];}
        } else if (y==584) {
            // Change J12, Z12 and J1
            para = get_li_parameters('Daxiang');
            pingqi2 = compute_pingqi(y, para, jdc);
            for (i=0; i<3; i++) {pingqi[i] = pingqi2[i];}
        }
        out = {cm:cm, pingqi:pingqi};
    } else {
        out = cm;
    }
    return out;
}

// Eastern Wei and Northern Qi
function cmonthDate_WeiQi(y, jdc, calc_pingqi) {
    let li;
    if (y < 539.5) {
        li = 'Zhengguang';
    } else if (y < 550.5) {
        li = 'Xinghe';
    } else {
        li = 'Tianbao';
    }
    let para = get_li_parameters(li);
    let cm = cmonthDate_pingshou_noZhongqi(y, para, jdc);
    let out;
    if (calc_pingqi) {
        let pingqi = compute_pingqi(y, para, jdc);
        // Deal with the transition years
        let i, pingqi2;
        if (y==540) {
            // Change J12, Z12
            para = get_li_parameters('Zhengguang');
            pingqi2 = compute_pingqi(y, para, jdc);
            for (i=0; i<2; i++) {pingqi[i] = pingqi2[i];}
        } else if (y==551) {
            // Change J12, Z12
            para = get_li_parameters('Xinghe');
            pingqi2 = compute_pingqi(y, para, jdc);
            for (i=0; i<2; i++) {pingqi[i] = pingqi2[i];}
        }
        out = {cm:cm, pingqi:pingqi};
    } else {
        out = cm;
    }
    return out;
}

// Correction for the Liao, Jun, Mongol/Yuan calendars in 947-1279.
// As explained in calendar.js, the calendar data in the default 
// dynasities are stored in a 2D array. Let's call it cdate[][].
// cdate[] is a 1D array of length 16 storing the calendar info 
// in a particular Chinese year N_y. The array stores y, month 1 
// conjunction date, month 2 conjunction date, ..., month 12 conj. 
// date, leap month conj. date, leap month number, 
// and the number of days in that Chinese year. The following 
// function return a js object with properties yxxxx containing 
// the correction to cdate[] in order to convert it to the calendar 
// in Liao, Jin or Mongol/Yuan dynasty. Take the property y1270 as 
// an example. It contains the array [11,319,13,349,14,11]. It means 
// that in the Chinese year N_{1270}, cdate[] needs to be 
// modified according to cdate[k][11]=319, cdate[k][13]=349, 
// and cdate[k][14]=11. Here k denotes the index in the array 
// cdate[][] corresponding to the Chinese year N_{1270}.
function LiaoJinYuanCorrection() { return {y949:[10,298], y955:[8,232], y958:[9,288], y959:[12,366], y961:[3,78], y964:[4,135,6,195,7,224], y965:[5,153], y973:[4,125], y985:[9,290,13,260,14,8], y986:[2,72,7,220], y993:[15,383], y994:[1,44,15,355], y999:[4,109,13,138,14,4], y1000:[15,354], y1001:[1,27,10,292,12,381,13,352,14,11,15,384], y1012:[3,86], y1015:[7,200,13,229,14,7], y1020:[5,147], y1021:[12,370], y1024:[12,369], y1025:[7,209], y1029:[3,77,13,107,14,3], y1039:[6,176], y1040:[5,165,12,371], y1044:[11,328], y1045:[3,81], y1049:[12,361], y1053:[2,53], y1056:[6,198], y1059:[4,134,6,194,12,371], y1064:[6,170,13,199,14,6], y1070:[8,251], y1073:[5,160], y1074:[15,354], y1075:[1,19,15,385], y1077:[13,382,14,12,15,384], y1078:[1,46,13,0,14,0,15,355], y1080:[9,290,13,260,14,8], y1093:[15,355], y1094:[1,20,15,384], y1102:[10,317], y1103:[8,247], y1105:[3,77,13,107,14,3], y1113:[10,315], y1121:[9,287], y1129:[4,111], y1134:[12,352], y1145:[11,321], y1147:[3,93,7,211], y1152:[4,128], y1155:[9,272], y1163:[8,244], y1168:[10,307], y1175:[15,384], y1176:[1,44,15,354], y1178:[10,315], y1184:[9,281], y1198:[11,335], y1207:[5,148,11,325], y1208:[15,385], y1209:[1,38,15,354], y1239:[8,242], y1250:[4,123], y1251:[4,112,7,201,11,349,15,383], y1252:[1,42,15,355], y1253:[9,267], y1256:[7,205], y1258:[8,242,12,360], y1263:[2,71,10,307,11,337], y1270:[11,319,13,349,14,11], y1273:[6,167], y1276:[2,47]}; }

/*
辽金在近三百年间行用了四部历法。辽初用后晋司天监马重绩的《调元历》，辽圣宗统和十二年(994年)改用贾俊的《大明历》，用至国亡。
金灭辽后，天会五年（1127年）司天杨级造《大明历》，天会十五年（1137年）颁行。
后来日食屡次预报不准，金世宗命司天监赵知微重修大明历，大定廿二年（1182年）颁行，蒙古灭金后仍沿用，到至元十八年(1281年)才被《授时历》取代，其时元朝已灭南宋统一中国。
五代及宋朝的情况却十分复杂，在这三百多年间行用了超过二十部历法！这里就不一一列出了。
虽然这段期间历法修改频繁，但在天文学上并无大进展。

这里的数据直接采用《三千五百年历日天象》张培瑜附表4的资料，该书前言说这时期的资料参照清朝历算家汪曰桢著的《历代长术辑要》。
《调元历》和贾俊的《大明历》已失传，元朝史官修《辽史‧历象志》时不知贾俊《大明历》的内容，竟然说是几百年前祖冲之的《大明历》，然后转抄了《宋书》所载祖冲之的《大明历》!
对于失传了的历法，汪曰桢只能用他认为相近的历法替代。《历代长术辑要》以《宣明历》替代《调元历》;以金赵知微的《重修大明历》替代贾俊的《大明历》，然后根据《辽史》调整闰月。
杨级的《大明历》史书记载不详，只知其上元积年数及日法，汪曰桢用赵知微《重修大明历》的数据替代所缺之数据。有学者认为汪曰桢的替代法不可信赖邱靖嘉。

《三千五百年历日天象》附表4没有载辽金元历法的二十四节气。对于金朝杨级的《大明历》和赵知微的《重修大明历》不成问题，因为可以根据《金史‧历志上》所给出的岁实和上元积年计算节气。
杨级的《大明历》有上元积年但没有岁实，如果假设岁实和《重修大明历》一样，可以推出其节气的推算时刻和《重修大明历》完全一样(合朔时刻则有微小差异)。
《辽史‧历象志下》记载宋元丰元年十二月(公元1079年1月)，司天监奉命考察辽及高丽、日本历法和宋《奉元历》之异同，发现辽己未岁(即宋元丰二年)气朔与《宣明历》同。
另外，严敦杰在《辽历志疑》严敦杰说汪曰桢《历代长术辑要》所推气朔不合者十二例中，改用《宣明历》验算后有十一例与辽历相符，可见贾俊的《大明历》与《宣明历》比较接近，两者可能有渊源。
清朝以前的历法用平气法计算节气和无中气法置闰，中气和月序有一一对应的关系，例如正月必含雨水，二月必含春分等等。
我用《宣明历》计算每岁的十二中气，然后比较《三千五百年历日天象》符表4给出的辽金朔日，发现在947年至1136年间有18个中气不在所属之月，其中有12个在1088年及以后。
用《重修大明历》计算发现在947年至1136年间有25个中气不在所属之月，全部都在1080年或以前。
用《重修大明历》计算1137年至1279年的中气则全部在所属月之内，显示我的节气计算法完全符合这段时期给出的朔日数据。
为了使中气尽量符合月序，在年历网页里我用《宣明历》计算947年至1085年辽历的历书节气，用《重修大明历》计算1085年以后的辽金元历法的历书节气。
这样在947年至1279年间只有六个中气不在所属之月，然后人为调整这六个中气使之符合月序。
用这方法计算出的历书节气当然不能保证在947-1136年间与当时的历法完全吻合，但是既然历法已失传，也就聊胜于无了。
*/
// Liao, Jun, Mongol/Yuan calendars in 947-1279
function cmonthDate_LiaoJinYuan(y, jdc, calc_pingqi) {
    let cdate = ChineseToGregorian();
    let cm = cdate[y - cdate[0][0]];
    cdate = null;
    let corr = LiaoJinYuanCorrection();
    let prop = 'y'+y.toString();
    if (prop in corr) {
        // Correction for year y
        let corr_array = corr[prop], n = corr_array.length;
        for (let i=0; i<n; i += 2) {
            cm[corr_array[i]] = corr_array[i+1];
        }
    }
    
    let out;
    if (calc_pingqi) {
        let li = (y < 1085.5 ? 'Xuanming':'RevisedDaming');
        let para = get_li_parameters(li);
        let pingqi = compute_pingqi(y, para, jdc);
        // Correction to pingqi
        if (y==999) { pingqi[9]--;}
        if (y==1015) { pingqi[15]--;}
        if (y==1029) { pingqi[7]--;}
        if (y==1064) { pingqi[13]--;}
        if (y==1067) { pingqi[5]--; pingqi[7]--;}
        out = {cm:cm, pingqi:pingqi};
    } else {
        out = cm;
    }
    
    return out;
}

// Southern Ming and Zheng calendar data generated by my C++ code.
// It's much simpler to do a table lookup than porting the C++ code here.
function southernMingCalendarData() {return [[1644,39,69,98,127,157,186,215,245,275,304,334,364,0,0,355],[1645,28,57,87,116,145,175,233,263,292,322,352,382,204,6,384],[1646,47,76,106,135,164,194,223,252,282,311,341,371,0,0,354],[1647,36,65,95,125,154,183,213,242,271,301,330,360,0,0,354],[1648,25,54,84,143,173,202,232,261,290,320,349,379,114,3,383],[1649,42,72,102,131,161,191,220,250,279,308,338,367,0,0,355],[1650,32,61,91,121,150,180,209,239,269,298,328,386,357,11,384],[1651,51,80,110,139,169,198,228,258,287,317,347,376,0,0,355],[1652,41,70,99,129,158,188,217,247,276,306,336,366,0,0,354],[1653,29,59,88,117,147,176,205,264,294,324,354,384,235,7,384],[1654,48,78,107,136,166,195,224,254,283,313,343,373,0,0,354],[1655,37,67,97,126,155,185,214,243,273,302,332,362,0,0,354],[1656,26,56,86,115,145,204,233,262,292,321,351,380,174,5,384],[1657,44,74,104,133,163,192,222,251,280,310,339,369,0,0,354],[1658,33,63,93,122,152,182,211,241,270,299,329,358,0,0,355],[1659,23,82,111,141,171,200,230,259,289,318,348,377,52,1,384],[1660,42,71,101,130,160,189,219,249,278,308,337,367,0,0,354],[1661,30,60,89,119,148,177,207,237,266,296,355,385,326,10,385],[1662,50,79,108,138,167,196,226,255,285,315,345,374,0,0,354],[1663,39,69,98,127,157,186,215,245,274,304,334,363,0,0,354],[1664,28,58,87,117,146,176,234,264,293,323,352,382,205,6,384],[1665,46,76,105,135,164,194,223,252,282,311,341,370,0,0,354],[1666,35,65,94,124,154,183,213,242,271,301,330,360,0,0,354],[1667,24,54,83,113,172,202,231,261,290,320,349,379,143,4,384],[1668,43,73,102,132,161,191,221,250,280,309,339,368,0,0,355],[1669,32,61,91,120,150,179,209,238,268,298,327,357,386,12,384],[1670,51,80,110,139,168,198,227,257,287,317,346,376,0,0,355],[1671,41,70,99,129,158,187,217,246,276,306,335,365,0,0,354],[1672,30,59,89,118,148,177,206,236,295,324,354,384,265,8,384],[1673,48,77,107,136,166,195,224,254,283,313,342,372,0,0,354],[1674,37,66,96,126,155,184,214,243,272,302,331,361,0,0,354],[1675,26,55,85,115,145,174,233,262,292,321,351,380,204,6,384],[1676,45,74,104,134,163,193,222,252,281,311,340,370,0,0,354],[1677,33,63,92,122,151,181,211,240,270,299,329,358,0,0,355],[1678,23,52,111,140,170,200,229,259,289,318,348,377,82,2,384],[1679,42,71,101,130,159,189,218,248,278,307,337,367,0,0,354],[1680,31,61,90,120,149,178,208,237,267,296,356,386,326,10,384],[1681,49,79,108,138,167,196,226,255,284,314,344,374,0,0,354],[1682,38,68,98,127,157,186,215,245,274,303,333,363,0,0,354],[1683,27,57,87,117,146,176,234,264,293,322,352,382,205,6,384],[1684,46,76,106,135,165,194,224,253,283,312,341,371,0,0,355]];}

// Southern Ming and Zheng calendars in 1645-1683
function cmonthDate_southernMing(y, jdc, calc_pingqi) {
    let cm = southernMingCalendarData()[y - 1644];
    let out;
    if (calc_pingqi) {
        let para = get_li_parameters('Datong');
        let pingqi = compute_pingqi(y, para, jdc);
        // Correction to J8 in 1663
        if (y==1663) { pingqi[16]--;}
        out = {cm:cm, pingqi:pingqi};
    } else {
        out = cm;
    }
    return out;
}
