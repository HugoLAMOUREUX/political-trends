#!/usr/bin/env node
/**
 * Script to import all European elections (2009, 2014, 2019, 2024)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../../.env") });
const { execSync } = require("child_process");

const years = ["2009", "2014", "2019", "2024"];

console.log("=".repeat(80));
console.log("🗳️  IMPORTING ALL EUROPEAN ELECTIONS");
console.log("=".repeat(80));

years.forEach((year) => {
  const scriptPath = path.join(__dirname, `import_europeennes_${year}.js`);
  console.log(`\n📅 Importing European Elections ${year}...`);

  try {
    execSync(`node ${scriptPath}`, { stdio: "inherit" });
  } catch (error) {
    console.error(`❌ Error importing ${year}:`, error.message);
    process.exit(1);
  }
});

console.log("\n" + "=".repeat(80));
console.log("🎉 ALL EUROPEAN IMPORTS COMPLETED SUCCESSFULLY!");
console.log("=".repeat(80));
