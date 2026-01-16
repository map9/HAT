/**
 * Western (Gregorian) calendar axis configurations
 * Ported from TimelineChart
 */
import * as d3 from 'd3';

export const yearlyAxis = {
  name: 'western-yearly',
  height: 18,
  isGrid: false,
  class: 'yearly',
  map: (hoursPerPixel, locale) => {
    const year = (d) =>
      d.getTime() < new Date('0001-01-01').getTime()
        ? d.toLocaleString(locale, { era: 'short', year: 'numeric' })
        : d.toLocaleString(locale, { year: 'numeric' });

    return [
      [
        0.03125,
        [
          d3.utcDay,
          (d) => {
            return d.getTime() < new Date('0001-01-01').getTime()
              ? d.toLocaleString(locale, { era: 'short', year: 'numeric', month: 'short', day: 'numeric' })
              : d.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
          }
        ]
      ],
      [
        0.25,
        [
          d3.utcDay,
          (d) => {
            return d.getUTCDate() === 1
              ? d.getTime() < new Date('0001-01-01').getTime()
                ? d.toLocaleString(locale, { era: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                : d.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
              : d.toLocaleString(locale, { month: 'short', day: 'numeric' });
          }
        ]
      ],
      [
        2,
        [
          d3.utcMonth,
          (d) =>
            d.getTime() < new Date('0001-01-01').getTime()
              ? d.toLocaleString(locale, { era: 'short', year: 'numeric', month: 'short' })
              : d.toLocaleString(locale, { year: 'numeric', month: 'short' })
        ]
      ],
      [
        4,
        [
          d3.utcMonth,
          (d) => {
            const startOfTheYear = d.getUTCMonth() === 0 && d.getUTCDate() === 1;
            return startOfTheYear
              ? d.getTime() < new Date('0001-01-01').getTime()
                ? d.toLocaleString(locale, { era: 'short', year: 'numeric', month: 'long' })
                : d.toLocaleString(locale, { year: 'numeric', month: 'long' })
              : d.getTime() < new Date('0001-01-01').getTime()
                ? d.toLocaleString(locale, { era: 'short', year: 'numeric', month: 'short' })
                : d.toLocaleString(locale, { year: 'numeric', month: 'short' });
          }
        ]
      ],
      [
        8,
        [
          d3.utcMonth,
          (d) => {
            const startOfTheYear = d.getUTCMonth() === 0 && d.getUTCDate() === 1;
            return startOfTheYear
              ? d.getTime() < new Date('0001-01-01').getTime()
                ? d.toLocaleString(locale, { era: 'short', year: 'numeric', month: 'long' })
                : d.toLocaleString(locale, { year: 'numeric', month: 'long' })
              : d.toLocaleString(locale, { month: 'long' });
          }
        ]
      ],
      [128, [d3.utcYear, (d) => year(d)]],
      [512, [d3.utcYear.every(5), (d) => year(d)]],
      [Infinity, [d3.utcYear.every(Math.round(hoursPerPixel / 256) * 5), (d) => year(d)]]
    ];
  }
};

export const dailyAxis = {
  name: 'western-daily',
  height: 15,
  isGrid: false,
  class: 'daily',
  map: (hoursPerPixel, locale) => {
    return [
      [0.0625, [d3.utcHour.every(2), (d) => d.toLocaleString(locale, { hour: 'numeric' })]],
      [0.125, [d3.utcHour.every(2), '']],
      [0.25, [d3.utcHour.every(6), '']],
      [0.5, [d3.utcDay, (d) => d.toLocaleString(locale, { day: 'numeric' })]],
      [8, [d3.utcDay, '']],
      [16, [d3.utcMonth, (d) => d.toLocaleString(locale, { month: 'short' })]],
      [24, [d3.utcMonth, (d) => d.toLocaleString(locale, { month: 'narrow' })]],
      [32, [d3.utcMonth.every(3), 'Q%q']],
      [128, [d3.utcMonth.every(6), (d) => (d.getMonth() < 5 ? 'H1' : 'H2')]],
      [256, [d3.utcYear, (d) => d.toLocaleString(locale, { year: 'numeric' })]],
      [512, [d3.utcYear, '']],
      [Infinity, [d3.utcYear.every(Math.round(hoursPerPixel / 256)), (d) => d.toLocaleString(locale, { year: 'numeric' })]]
    ];
  }
};

export const dailyGrid = {
  name: 'western-daily-grid',
  height: -1,
  isGrid: true,
  class: 'daily-grid',
  map: (hoursPerPixel, locale) => {
    return [
      [0.025, [d3.utcHour.every(2), '']],
      [0.05, [d3.utcHour.every(6), '']],
      [0.5, [d3.utcHour.every(12), '']],
      [1, [d3.utcDay, '']],
      [8, [d3.utcDay.filter((d) => d.getUTCDate() === 15 || d.getUTCDate() === 1), '']],
      [24, [d3.utcMonth, '']],
      [64, [d3.utcMonth.every(6), '']]
    ];
  }
};

export const yearlyGrid = {
  name: 'western-yearly-grid',
  height: -1,
  isGrid: true,
  class: 'yearly-grid',
  map: (hoursPerPixel, locale) => {
    return [
      [0.125, [d3.utcDay, '']],
      [8, [d3.utcMonth, '']],
      [64, [d3.utcYear, '']],
      [128, [d3.utcYear.every(2), '']],
      [Infinity, [d3.utcYear.every(Math.round(hoursPerPixel / 256) * 5), '']]
    ];
  }
};
