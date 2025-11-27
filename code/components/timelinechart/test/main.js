import * as d3 from "d3";
import { Lunar, LunarYear } from "lunar-javascript";

import { timelineChart, chineseCalendarAxises, timelineChartStyle, eventChart, tooltipHelper, dataProvider } from "../src/index.js"
import { eraName } from "../src/eras.js"


// 测试代码
const lunarYear = LunarYear.fromYear(1600);


const earName = eraName('zh-Hans', 419);
console.log(earName);

// 正式代码
const width = document.body.clientWidth;
const height = document.body.clientHeight;

const timeline_data_url = "./test/history001.csv";

let eChart = null;
let layout = 'Naive';

function resetTooltip() {
  if (eChart && eChart.getTooltip()) {
    // 获取元素的相对于 svg 根的变换矩阵
    // left, top, width, height 都是 svg 中 eventNode 给到外部 events 的相对 eventNode 的位置，
    // 而 tooltip 和 svg 是同一级别的元素，对 tooltip 的限制需要对应到 svg 根元素上。
    const box = eChart.getBoundBox();
    const matrix = eChart.node().getScreenCTM();
    eChart.getTooltip().setBoundBox({
      left: box.left + matrix.e,
      top: box.top + matrix.f,
      right: box.left + matrix.e + box.width,
      bottom: box.top + matrix.f + box.height
    });
    eChart.getTooltip().setWidth(width * 0.4);
  }
}

function initial(left, top, width, height, xScale) {
  eChart = new eventChart(this, { left: left, top: top, width: width, height: height }, xScale, tooltip);
  new dataProvider(timeline_data_url, (dp) => {
    layout = layout || 'Naive';
    var eventsData = dp.getTimelineData(layout);
    eChart.create(eventsData);
    resetTooltip();
  }, {
    debug_info: false
  });
  
}

function update(xScale) {
  if (eChart) eChart.update(xScale);
}

function resize(left, top, width, height) {
  if (eChart) eChart.resize(left, top, width, height);
  resetTooltip();
}

function updateTooltips(date, localDateString) {
  const lunar = Lunar.fromDate(date);
  const year = lunar.getYear();

  let s =  (year < 0)
    ? `前${Lunar.fromYmd(Math.abs(year), 1, 1).getYearInChinese()}`
    : lunar.getYearInChinese();
  s += `(${lunar.getYearInGanZhi()} ${lunar.getYearShengXiao()})年`;
  s += ` ${lunar.getMonthInChinese()}(${lunar.getMonthInGanZhi()})月`;
  s += ` ${lunar.getDayInChinese()}(${lunar.getDayInGanZhi()})日`;
  s += ` ${lunar.getTimeZhi()}时`;

  localDateString.value += '\n' + s;
}

var tooltip = tooltip || new tooltipHelper();
d3.select("#app").append(() => {
  return tooltip.node();
});

//const local = 'en-us';
const local = 'zh-cn';
var chart = new timelineChart({
  width: width,
  height: height,
  margin: {left: 20, top: 20, right: 20, bottom: 20},
  timeDomain: [new Date(-1000, 1, 1), new Date(2030, 1, 1)],
  //axises: [],
  //zoomLimited: [0.0005, 5],
  //hasIndexAxis: false,
  style: timelineChartStyle.LIGHT,
  local: local,
});

chart.on("initial", initial);
chart.on("update", update);
chart.on("resize", resize);
chart.on("updateTooltips", updateTooltips);

chart.addAxises([
  chineseCalendarAxises.yearlyAxis,
  chineseCalendarAxises.dailyAxis,
  chineseCalendarAxises.yearlyGrid,
  chineseCalendarAxises.dailyGrid
]);

d3.select("#app").append(() => {
  return chart.create();
});
//chart.setStyle(timelineChartStyle.DARK);


window.addEventListener("resize", ()=>{
  const width = document.body.clientWidth;
  const height = document.body.clientHeight;

  chart.resize(width, height);
});

