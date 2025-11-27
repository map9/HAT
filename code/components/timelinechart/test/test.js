import { Lunar, LunarYear, LunarMonth } from "lunar-javascript";

// 以下都是会出问题的时间
//const isoString = "-000570-01-17T10:49:05.307Z";
//const isoString = "-000513-01-28T22:21:35.710Z";
//const isoString = "-000589-01-09T11:24:16.999Z";
//const isoString = "-000809-02-19T16:15:23.049Z";
const isoString = "0001-01-17T10:49:05.307Z";

const date = new Date(isoString);

let lunar = Lunar.fromDate(date);
let lunarYear = LunarYear.fromYear(lunar.getYear());
let y = lunar.getYear();
let m = lunar.getMonth();
// 在 y 中，无法找到 m。 因此，Lunar.fromYmd会失败。
lunar = Lunar.fromYmd(y, m, 1);
