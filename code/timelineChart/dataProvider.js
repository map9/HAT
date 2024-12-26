import * as d3 from "d3";

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

const dataProvider = function (timeline_data_url, onDataReady, opts) {
  let self = this;

  let options = assign(
    {
      debug_info: false,
    },
    opts
  );

  self.timeline_data_url = timeline_data_url;
  self.onDataReady = onDataReady || function () {};
  self.timeDomain = [Infinity, -Infinity];

  var timeline_data = d3.csv(timeline_data_url);
  //var other_data = d3.csv("other_data.csv")

  Promise.all([timeline_data/*, other_data*/]).then(data_ready);

  function data_ready(values) {
    self.timeline_data = values[0];
    /*
    self.other_data = values[1];
    */

    self.timeline_data.forEach(function (v, i, a) {
      v.startYear = new Date(Date.parse(v.startYear));
      v.endYear = new Date(Date.parse(v.endYear));
      self.timeDomain[0] = Math.min(self.timeDomain[0], v.startYear);
      self.timeDomain[1] = Math.max(self.timeDomain[1], v.endYear);
    });
    self.timeline_data.sort(
      (a, b) => d3.ascending(a.startYear, b.startYear) || d3.ascending(a.endYear, b.endYear)
    );
    self.timeDomain = [d3.min(self.timeline_data, (d) => d.startYear), d3.max(self.timeline_data, (d) => d.endYear)];

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
};

dataProvider.prototype.getTimelineDomain = function () {
  return this.timeDomain;
};

/**
 * get track data array
 * @param {null}
 */
dataProvider.prototype.getTimelineData = function (type = "") {
  let self = this;

  if (type == "Naive") {
    return this.timeline_data.slice().map((e, i) => ({...e, yIndex: i}));
  } else if (type == "StackI") {
    const stackData = [];
    let stack = [];
    this.timeline_data.slice().forEach((e) => {
      if (
        stack.length &&
        stack[stack.length - 1].endYear <= e.startYear &&
        stack[stack.length - 1].startYear < e.startYear
      ) {
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
      while (
        stack.length &&
        stack[stack.length - 1].endYear <= e.startYear &&
        stack[stack.length - 1].startYear < e.startYear
      ) {
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
        (s) => s.endYear <= e.startYear && s.startYear < e.startYear
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
    return this.timeline_data.slice().map((d) => ({...d, yIndex: 0}));
  }
};

// sort by:
// time, kind, 

export {dataProvider};
