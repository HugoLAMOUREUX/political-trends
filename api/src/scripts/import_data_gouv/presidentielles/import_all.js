#!/usr/bin/env node
/**
 * Script to import all presidential elections (2007, 2012, 2017, 2022)
 */

require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");

const years = ["2007", "2012", "2017", "2022"];

console.log("=".repeat(80));
console.log("🗳️  IMPORTING ALL PRESIDENTIAL ELECTIONS");
console.log("=".repeat(80));

years.forEach((year) => {
  const scriptPath = path.join(__dirname, `import_presidential_${year}.js`);
  console.log(`\n📅 Importing ${year}...`);

  try {
    execSync(`node ${scriptPath}`, { stdio: "inherit" });
  } catch (error) {
    console.error(`❌ Error importing ${year}:`, error.message);
    process.exit(1);
  }
});

console.log("\n" + "=".repeat(80));
console.log("🎉 ALL IMPORTS COMPLETED SUCCESSFULLY!");
console.log("=".repeat(80));
