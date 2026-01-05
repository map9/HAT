import * as d3 from "d3";

/**
 * This is timeline Data Processing Class
 * refrence: 
 * 1. https://observablehq.com/@anbnyc/timeline-layout-algorithm
 */

/**
 * Polyfill for Object.assign().  Assigns enumerable and own properties from
 * one or more source objects to a target object.
 *
 * @see https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 * @param {!Object} target The target object.
 * @param {...Object} var_sources The source object(s).
 * @return {!Object} The modified target object.
 */
export const assign =
  typeof Object.assign === "function"
    ? Object.assign
    : function (target, var_sources) {
        if (target === undefined || target === null) {
          throw new TypeError("Cannot convert undefined or null to object");
        }

        const output = Object(target);
        for (let i = 1, ii = arguments.length; i < ii; ++i) {
          const source = arguments[i];
          if (source !== undefined && source !== null) {
            for (const key in source) {
              if (source.hasOwnProperty(key)) {
                output[key] = source[key];
              }
            }
          }
        }
        return output;
      };

/**
 * Removes all properties from an object.
 * @param {Object} object The object to clear.
 */
export function clear(object) {
  for (const property in object) {
    delete object[property];
  }
}

/**
 * Get an array of property values from an object.
 * @param {Object<K,V>} object The object from which to get the values.
 * @return {!Array<V>} The property values.
 * @template K,V
 */
export function getValues(object) {
  const values = [];
  for (const property in object) {
    values.push(object[property]);
  }
  return values;
}

/**
 * Determine if an object has any properties.
 * @param {Object} object The object to check.
 * @return {boolean} The object is empty.
 */
export function isEmpty(object) {
  let property;
  for (property in object) {
    return false;
  }
  return !property;
}

/**
 * @classdesc
 * This is a  class for load driving data.
 *
 * @constructor
 * @struct
 * @param
 * @api
 */

export class dataProvider {
  constructor(timeline_data_url, onDataReady, opts) {
    let self = this;

    let options = assign({ debug_info: false }, opts);

    self.timeline_data_url = timeline_data_url;
    self.timeline_data = undefined;
    self.onDataReady = onDataReady || function () { };
    self.timeDomain = [Infinity, -Infinity];

    // Auto-detect data type by file extension
    const isJSON = timeline_data_url.toLowerCase().endsWith('.json');
    var data = isJSON ? d3.json(timeline_data_url) : d3.csv(timeline_data_url);
    //var other_data = d3.csv("other_data.csv")
    Promise.all([data /*, other_data*/]).then(data_ready);

    /**
     * Convert JSON time object to JavaScript Date
     * @param {Object} timeObj - {year, month, day} object
     * @returns {Date|null}
     */
    function jsonTimeToDate(timeObj) {
      if (!timeObj || timeObj.year === undefined || timeObj.year === null) {
        return null;
      }

      // Date构造函数的month参数是0-11，而gMonth是1-12，需要减1
      // 对于0-99年份，需要使用setFullYear来避免被解析为19xx或20xx年
      const date = new Date(2000, 0, 1, 0, 0, 0, 0, 0); // 临时初始化为2000年1月1日
      date.setFullYear(timeObj.year);
      date.setMonth((timeObj.month || 1) - 1);
      date.setDate(timeObj.day || 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    function data_ready(values) {
      self.timeline_data = values[0];
      /*
      self.other_data = values[1];
      */

      // Filter and convert data
      const validData = [];
      self.timeline_data.forEach(function (v, i, a) {
        // Handle different data formats
        if (isJSON) {
          // JSON format: {start_time: {year, month, day}, end_time: {year, month, day}}
          const startDate = jsonTimeToDate(v.start_time);
          const endDate = jsonTimeToDate(v.end_time);

          if (!startDate) {
            console.error(`Invalid start_time in JSON data at index ${i}:`, v);
            return; // Skip this item
          }
          if (!endDate) {
            console.error(`Invalid end_time in JSON data at index ${i}:`, v);
            return; // Skip this item
          }

          v.start_time = startDate;
          v.end_time = endDate;
        } else {
          // CSV format: {start_time: "ISO date string", end_time: "ISO date string"}
          v.start_time = new Date(Date.parse(v.start_time));
          v.end_time = new Date(Date.parse(v.end_time));

          if (isNaN(v.start_time.getTime())) {
            console.error(`Invalid start_time in CSV data at index ${i}:`, v);
            return; // Skip this item
          }
          if (isNaN(v.end_time.getTime())) {
            console.error(`Invalid end_time in CSV data at index ${i}:`, v);
            return; // Skip this item
          }
        }

        validData.push(v);
        self.timeDomain[0] = Math.min(self.timeDomain[0], v.start_time);
        self.timeDomain[1] = Math.max(self.timeDomain[1], v.end_time);
      });

      self.timeline_data = validData;
      self.timeline_data.sort(
        (a, b) => d3.ascending(a.start_time, b.start_time) || d3.ascending(a.end_time, b.end_time)
      );
      self.timeDomain = [d3.min(self.timeline_data, (d) => d.start_time), d3.max(self.timeline_data, (d) => d.end_time)];

      // for testing， verify data
      if (options.debug_info) {
        /*
          console.log("time domain:", self.time_domain);
          console.log("distance:", self.track_distance);
          console.log("vehicle stop time:", self.vehicle_stop_time);
          console.log("drive mode data:", self.driving_mode_data);
          console.log("spandistance by drive mode:", self.spandistance_by_driving_mode);
          console.log("spantime by drive mode:", self.spantime_by_driving_mode);
          console.log("vehicle motion status:", self.vehicle_motion_status);
          console.log("vehicle lightandhorn status:", self.vehicle_light_status);
          console.log("vehicle braking info:", self.vehicle_braking_info);
          console.log("vehicle accelerator info:", self.vehicle_accelerator_info);
          console.log("vehicle steering info:", self.vehicle_steering_info);
          */
      }
      // load data end
      self.onDataReady(self);
    }
  }
  getTimelineDomain() {
    return this.timeDomain;
  }
  /**
   * get track data array
   * @param {null}
   */
  getTimelineData(type = "") {
    let self = this;

    if (type == "Naive") {
      return this.timeline_data.slice().map((e, i) => ({ ...e, yIndex: i }));
    } else if (type == "StackI") {
      const stackData = [];
      let stack = [];
      this.timeline_data.slice().forEach((e) => {
        if (stack.length &&
          stack[stack.length - 1].end_time <= e.start_time &&
          stack[stack.length - 1].start_time < e.start_time) {
          stack.pop();
        }
        stackData.push({
          ...e,
          yIndex: stack.length,
        });
        stack.push(e);
      });
      return stackData;
    } else if (type == "StackII") {
      const stackData = [];
      let stack = [];
      this.timeline_data.slice().forEach((e) => {
        while (stack.length &&
          stack[stack.length - 1].end_time <= e.start_time &&
          stack[stack.length - 1].start_time < e.start_time) {
          stack.pop();
        }
        stackData.push({
          ...e,
          yIndex: stack.length,
        });
        stack.push(e);
      });
      return stackData;
    } else if (type == "Lanes") {
      const lanesData = [];
      let stack = [];
      this.timeline_data.slice().forEach((e) => {
        const lane = stack.findIndex(
          (s) => s.end_time <= e.start_time && s.start_time < e.start_time
        );
        const yIndex = lane === -1 ? stack.length : lane;
        lanesData.push({
          ...e,
          yIndex,
        });
        stack[yIndex] = e;
      });
      return lanesData;
    } else {
      return this.timeline_data.slice().map((d) => ({ ...d, yIndex: 0 }));
    }
  }
}