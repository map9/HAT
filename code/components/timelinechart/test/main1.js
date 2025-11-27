import * as d3 from "d3";

import {timelineChart, dataProvider} from "../src/index.js"

const timeline_data_url = "./test/history001.csv";

new dataProvider(timeline_data_url, (dp) => {
  const width = document.body.clientWidth;
  const height = document.body.clientHeight;
  var [chartNode, tooltipNode] = timelineChart(dp, {
    width: width,
    height: height,
    margin: {left: 20, top: 20, right: 20, bottom: 20},
    //timeDomain: [new Date("1900-03-12"), new Date("1956-06-02")],
    //timeDomain: [new Date(-120, 0, 1), new Date("1956-06-02")],
    timeDomain: [new Date(-1000, 1, 1), new Date("2025-01-01")],
  });

  d3.select("#app").append(() => {
    return chartNode;
  });
  d3.select("#app").append(() => {
    return tooltipNode;
  });

  window.addEventListener("resize", ()=>{
    console.log("resize");
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    //d3.select(chartNode).setSize(width, height);
  });
}, {
  debug_info: false
});