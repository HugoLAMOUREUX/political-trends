#!/usr/bin/env node
/**
 * Script to import 2012 presidential election data from JSON to MongoDB
 * Usage: node import_presidential_2012.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

require("../../../services/mongo");
const Election = require("../../../models/election");
const DataPoint = require("../../../models/datapoint");

async function importElectionMetadata() {
  console.log("\n" + "=".repeat(80));
  console.log("📋 Importing Election Metadata");
  console.log("=".repeat(80));

  const electionFilePath = path.join(__dirname, "presidential_2012_election.json");
  const rawData = fs.readFileSync(electionFilePath, "utf-8");
  const electionData = JSON.parse(rawData);

  console.log(`\n📊 Election: ${electionData.election_type} ${electionData.year}`);

  const deleteResult = await Election.deleteMany({ election_id: electionData.election_id });
  if (deleteResult.deletedCount > 0) console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing election record\n`);

  const election = new Election(electionData);
  await election.save();
  console.log(`✅ Successfully imported election: ${electionData.election_id}`);
  console.log(
    `   - Tour 1: ${electionData.tour_1.date} (${electionData.tour_1.inscrits_amount.toLocaleString()} inscrits)`,
  );
  console.log(
    `   - Tour 2: ${electionData.tour_2.date} (${electionData.tour_2.inscrits_amount.toLocaleString()} inscrits)`,
  );
}

async function importDataPoints() {
  console.log("\n" + "=".repeat(80));
  console.log("🗳️  Importing Candidate DataPoints");
  console.log("=".repeat(80));

  const datapointsFilePath = path.join(__dirname, "presidential_2012_datapoints.json");
  const rawData = fs.readFileSync(datapointsFilePath, "utf-8");
  const datapoints = JSON.parse(rawData);

  console.log(`\n📊 Found ${datapoints.length} datapoints to import\n`);

  const deleteResult = await DataPoint.deleteMany({
    election_id: { $in: ["presidentielle_2012_t1", "presidentielle_2012_t2"] },
  });
  console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing datapoints\n`);

  let successCount = 0;
  for (const data of datapoints) {
    const datapoint = new DataPoint(data);
    await datapoint.save();
    console.log(`✓ ${data.candidate_name} - ${data.party.join(", ")} (${data.result_pourcentage_exprime}%)`);
    successCount++;
  }

  return { success: successCount, total: datapoints.length };
}

async function main() {
  console.log("=".repeat(80));
  console.log("🗳️  PRESIDENTIAL ELECTION 2012 - JSON IMPORT");
  console.log("=".repeat(80));

  try {
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) resolve();
      else mongoose.connection.once("open", resolve);
    });

    await importElectionMetadata();
    const result = await importDataPoints();

    console.log("\n" + "=".repeat(80));
    console.log("📈 IMPORT SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Election metadata: Imported`);
    console.log(`✅ Successfully imported datapoints: ${result.success}`);
    console.log(`📊 Total datapoints: ${result.total}`);
    console.log("\n🎉 Import completed successfully!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

main();
