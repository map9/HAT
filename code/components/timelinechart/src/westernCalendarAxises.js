import * as d3 from "d3";

export const yearlyAxis = {
  name: "western-yearly",
  height: 18,
  isGrid: false,
  class: 'yearly',
  map: (hoursPerPixel, local) => {
    var year = (d) =>
      d.getTime() < new Date("0001-01-01").getTime()
        ? d.toLocaleString(local, {era: "short", year: "numeric"})
        : d.toLocaleString(local, {year: "numeric"});
        
    return [
      [
        0.03125,
        [
          d3.utcDay, (d) => {
            return d.getTime() < new Date("0001-01-01").getTime()
              ? d.toLocaleString(local, {era: "short", year: "numeric", month: "short", day: "numeric"})
              : d.toLocaleString(local, {year: "numeric", month: "short", day: "numeric"})
          },
        ]
      ],
      [
        0.25,
        [
          d3.utcDay, (d) => {
            return d.getUTCDate() === 1
              ? d.getTime() < new Date("0001-01-01").getTime()
                ? d.toLocaleString(local, {era: "short", year: "numeric", month: "short", day: "numeric"})
                : d.toLocaleString(local, {year: "numeric", month: "short", day: "numeric"})
              : d.toLocaleString(local, {month: "short", day: "numeric"})
          },
        ]
      ],
      [
        2,
        [
          d3.utcMonth, (d) => d.getTime() < new Date("0001-01-01").getTime()
            ? d.toLocaleString(local, {era: "short", year: "numeric", month: "short"})
            : d.toLocaleString(local, {year: "numeric", month: "short"})
        ]
      ],
      [
        4,
        [
          d3.utcMonth, (d) => {
            const startOfTheYear = d.getUTCMonth() === 0 && d.getUTCDate() === 1;
            return startOfTheYear
              ? d.getTime() < new Date("0001-01-01").getTime()
                ? d.toLocaleString(local, {era: "short", year: "numeric", month: "long"})
                : d.toLocaleString(local, {year: "numeric", month: "long"})
              : d.getTime() < new Date("0001-01-01").getTime()
                ? d.toLocaleString(local, {era: "short", year: "numeric", month: "short"})
                : d.toLocaleString(local, {year: "numeric", month: "short"})
          },
          d3.utcMonth, (d) => {
            const startOfTheYear = d.getUTCMonth() === 0 && d.getUTCDate() === 1;
            return startOfTheYear ? year(d) + ' - ' + d.toLocaleString(local, { month: "long" }) : year(d) + ' - ' + d.toLocaleString(local, { month: "short" });
          },
        ]
      ],
      [
        8, 
        [
          d3.utcMonth, (d) => {
            const startOfTheYear = d.getUTCMonth() === 0 && d.getUTCDate() === 1;
            return startOfTheYear
              ? d.getTime() < new Date("0001-01-01").getTime()
                ? d.toLocaleString(local, {era: "short", year: "numeric", month: "long"})
                : d.toLocaleString(local, {year: "numeric", month: "long"})
              : d.toLocaleString(local, {month: "long"})
          },
        ]
      ],
      [128, [d3.utcYear, (d) => year(d)]],
      [512, [d3.utcYear.every(5), (d) => year(d)]],
      [Infinity, [d3.utcYear.every(Math.round(hoursPerPixel / 256) * 5), (d) => year(d)]]
    ]
  }
};

export const dailyAxis = {
  name: "western-daily",
  height: 15,
  isGrid: false,
  class: 'daily',
  map: (hoursPerPixel, local)=>{
    return [
      [0.0625, [d3.utcHour.every(2), (d) => d.toLocaleString(local, { hour: "numeric" })]],
      [0.125, [d3.utcHour.every(2), ""]],
      [0.25, [d3.utcHour.every(6), ""]],
      //[0.5, [d3.utcHour.every(12), ""]],
      [0.5, [d3.utcDay, (d) => d.toLocaleString(local, { day: "numeric" })]],
      //[2, [d3.utcDay, ""]],
      //[4, [d3.utcDay, ""]],
      [8, [d3.utcDay, ""]],
      [16, [d3.utcMonth, (d) => d.toLocaleString(local, { month: "short" })]],
      [24, [d3.utcMonth, (d) => d.toLocaleString(local, { month: "narrow" })]],
      [32, [d3.utcMonth.every(3), "Q%q"]],
      //[64, [d3.utcMonth.every(6), (d, i) => d.getMonth() < 5 ? "H1" : "H2"]],
      [128, [d3.utcMonth.every(6), (d, i) => d.getMonth() < 5 ? "H1" : "H2"]],
      [256, [d3.utcYear, (d) => d.toLocaleString(local, { year: "numeric" })]],
      [512, [d3.utcYear, ""]],
      [Infinity, [d3.utcYear.every(Math.round(hoursPerPixel / 256)), (d) => d.toLocaleString(local, { year: "numeric" })]]
    ]
  }
};

export const dailyGrid = {
  name: "western-daily-grid",
  height: -1,
  isGrid: true,
  class: 'daily-grid',
  map: (hoursPerPixel, local)=>{
      return [
      [0.025, [d3.utcHour.every(2), ""]],
      [0.05, [d3.utcHour.every(6), ""]],
      [0.5, [d3.utcHour.every(12), ""]],
      [1, [d3.utcDay, ""]],
      [8, [d3.utcDay.filter(d => d.getUTCDate() === 15 || d.getUTCDate() === 1 ), ""]],
      [24, [d3.utcMonth, ""]],
      [64, [d3.utcMonth.every(6), ""]]
      ]
  }
};

export const yearlyGrid = {
  name: "western-yearly-grid",
  height: -1,
  isGrid: true,
  class: 'yearly-grid',
  map: (hoursPerPixel, local)=>{
    return [
      [0.125, [d3.utcDay, ""]],
      [8, [d3.utcMonth, ""]],
      [64, [d3.utcYear, ""]],
      [128, [d3.utcYear.every(2), ""]],
      [Infinity, [d3.utcYear.every(Math.round(hoursPerPixel / 256) * 5), ""]]
    ]
  }
};