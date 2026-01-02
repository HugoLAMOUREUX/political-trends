#!/usr/bin/env node
/**
 * Script to import all Legislative elections (2017, 2022, 2024)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../../.env") });
const { execSync } = require("child_process");

const years = ["2007", "2012", "2017", "2022", "2024"];

console.log("=".repeat(80));
console.log("🗳️  IMPORTING ALL LEGISLATIVE ELECTIONS");
console.log("=".repeat(80));

years.forEach((year) => {
  const scriptPath = path.join(__dirname, `import_legislatives_${year}.js`);
  console.log(`\n📅 Importing Legislative Elections ${year}...`);

  try {
    execSync(`node ${scriptPath}`, { stdio: "inherit" });
  } catch (error) {
    console.error(`❌ Error importing ${year}:`, error.message);
    process.exit(1);
  }
});

console.log("\n" + "=".repeat(80));
console.log("🎉 ALL LEGISLATIVE IMPORTS COMPLETED SUCCESSFULLY!");
console.log("=".repeat(80));
