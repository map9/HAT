import fs from 'fs';
import { ChineseCalendar } from '../src/index.js';

// Test JSON output for a specific year
let cc = new ChineseCalendar({lng: 'zh-Hant'});

let year = -721;
let jsonOutput = cc.exportYear(year, null, 'json');

// Parse the JSON to verify it's valid
let yearData = JSON.parse(jsonOutput);

console.log('=== Year Data Summary ===');
console.log('Year:', yearData.year);
console.log('Chinese Years:', yearData.cyears);
console.log('Number of Months:', yearData.months ? yearData.months.length : 0);

if (yearData.months && yearData.months.length > 0) {
  // Show details of the first month
  console.log('\n=== First Month (January) ===');
  let firstMonth = yearData.months[0];
  console.log('Month:', firstMonth.month, '-', firstMonth.monthName);
  console.log('Chinese Months:', firstMonth.chineseMonths);
  console.log('Number of Days:', firstMonth.days ? firstMonth.days.length : 0);

  if (firstMonth.days && firstMonth.days.length > 0) {
    console.log('\n=== First Day ===');
    console.log(JSON.stringify(firstMonth.days[0], null, 2));
  }

  console.log('\n=== Moon Phases ===');
  if (firstMonth.moonPhases) {
    firstMonth.moonPhases.forEach(phase => {
      console.log(`${phase.phaseName}: Day ${phase.day}, ${phase.time.hour}:${phase.time.minute}`);
      if (phase.eclipse) {
        console.log(`  Eclipse: ${phase.eclipse.typeName}`);
      }
    });
  }

  console.log('\n=== Solar Terms ===');
  if (firstMonth.solarTerms) {
    firstMonth.solarTerms.forEach(term => {
      console.log(`${term.name}: Day ${term.day}, ${term.time.hour}:${term.time.minute}`);
    });
  }
}

// Save to file for inspection
fs.writeFileSync(`./test-output-${year}.json`, jsonOutput, 'utf8');
console.log('\n=== Full JSON output saved to test-output.json ===');