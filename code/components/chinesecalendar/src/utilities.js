"use strict";

// Compute JD at midnight UT
export function getJD(yyyy, mm, dd) {
  let m1 = mm, yy = yyyy;
  if (m1 <= 2) {
    m1 += 12;
    yy--;
  }
  
  let b;
  if (10000 * yy + 100 * m1 + dd <= 15821004) {
    // Julian calendar
    b = -2 + Math.floor((yy + 4716) / 4) - 1179;
  } else {
    // Gregorian calendar
    b = Math.floor(yy / 400) - Math.floor(yy / 100) + Math.floor(yy / 4);
  }
  
  let jd = 365 * yy - 679004 + b + Math.floor(30.6001 * (m1 + 1)) + dd + 2400000.5;
  return jd;
}

// Number of days in a Gregorian/Julian year
export function nDaysofGregJul(year) {
  let ndays = (year == 1582 ? 355 : 365) + (Math.abs(year) % 4 == 0 ? 1 : 0);

  if (year > 1582) {
    ndays += (year % 100 == 0 ? -1 : 0) + (year % 400 == 0 ? 1 : 0);
  }

  return ndays;
}