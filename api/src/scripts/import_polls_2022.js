#!/usr/bin/env node
/**
 * Script to import Presidential 2022 polls from JSON to MongoDB
 * Usage: node import_polls_2022.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const fs = require("fs");

// Use existing mongo service
require("../services/mongo");

const Poll = require("../models/poll");
const DataPoint = require("../models/datapoint");

const PARTY_MAPPING = {
  "Rassemblement national": "RN",
  "Parti socialiste": "PS",
  "France insoumise": "LFI",
  "Debout la France": "DLF",
  "EE-LV": "EELV",
  "Parti communiste": "PCF",
  Reconquête: "REC",
  LRM: "RENAISSANCE",
  "Les Républicains": "LR",
  NPA: "NPA",
  "Lutte ouvrière": "LO",
  Résistons: "RESISTONS",
  "Les Patriotes": "LP",
  UPR: "UPR",
  "Génération.s": "GS",
  PRG: "PRG",
  "Parti animaliste": "PA",
  "Place publique": "PP",
  "Nouvelle Donne": "ND",
  "Territoires de progrès": "TDP",
  Agir: "AGIR",
  "En Commun": "EC",
  "Parti radical": "PRV",
  "Mouvement démocrate": "MODEM",
};

const NUANCE_MAPPING = {
  "Marine Le Pen": "Extreme droite",
  "Anne Hidalgo": "Gauche",
  "Jean-Luc Mélenchon": "Gauche",
  "Nicolas Dupont-Aignan": "Extreme droite",
  "Arnaud Montebourg": "Gauche",
  "Yannick Jadot": "Gauche",
  "Fabien Roussel": "Gauche",
  "Eric Zemmour": "Extreme droite",
  "Emmanuel Macron": "Centre",
  "Valérie Pécresse": "Droite",
  "Philippe Poutou": "Extreme gauche",
  "Nathalie Arthaud": "Extreme gauche",
  "Jean Lassalle": "Centre",
  "Florian Philippot": "Extreme droite",
  "François Asselineau": "Autre",
  "Christiane Taubira": "Gauche",
};

const CANDIDATE_NAME_NORMALIZATION = {
  "Marine Le Pen": "Marine LE PEN",
  "Anne Hidalgo": "Anne HIDALGO",
  "Jean-Luc Mélenchon": "Jean-Luc MÉLENCHON",
  "Nicolas Dupont-Aignan": "Nicolas DUPONT-AIGNAN",
  "Arnaud Montebourg": "Arnaud MONTEBOURG",
  "Yannick Jadot": "Yannick JADOT",
  "Fabien Roussel": "Fabien ROUSSEL",
  "Eric Zemmour": "Éric ZEMMOUR",
  "Emmanuel Macron": "Emmanuel MACRON",
  "Valérie Pécresse": "Valérie PÉCRESSE",
  "Philippe Poutou": "Philippe POUTOU",
  "Nathalie Arthaud": "Nathalie ARTHAUD",
  "Jean Lassalle": "Jean LASSALLE",
  "Florian Philippot": "Florian PHILIPPOT",
  "François Asselineau": "François ASSELINEAU",
  "Christiane Taubira": "Christiane TAUBIRA",
};

async function main() {
  console.log("=".repeat(80));
  console.log("📊 PRESIDENTIAL POLLS 2022 - IMPORT");
  console.log("=".repeat(80));

  try {
    // Wait for MongoDB connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once("open", resolve);
      }
    });

    const pollFilePath = path.join(__dirname, "sondages_presidentielle_2022.json");
    if (!fs.existsSync(pollFilePath)) {
      console.error(`❌ File not found: ${pollFilePath}`);
      process.exit(1);
    }

    const rawData = fs.readFileSync(pollFilePath, "utf-8");
    const pollsData = JSON.parse(rawData);

    console.log(`\n📊 Found ${pollsData.length} polls to process\n`);

    // Clean existing data for this election
    const pollIds = pollsData.map((p) => p.id);
    await Poll.deleteMany({ poll_id: { $in: pollIds } });
    await DataPoint.deleteMany({ type: "poll", election_id: "presidentielle_2022" });

    let pollCount = 0;
    let datapointCount = 0;

    for (const pollData of pollsData) {
      // 1. Create Poll record
      const poll = new Poll({
        poll_id: pollData.id,
        nom_institut: pollData.nom_institut,
        debut_enquete: pollData.debut_enquete,
        fin_enquete: pollData.fin_enquete,
        rolling: pollData.rolling,
        media: pollData.media,
        commanditaire: pollData.commanditaire,
        lien: pollData.lien,
        echantillon: pollData.echantillon,
        population: pollData.population,
        election_type: "presidentielle",
        year: 2022,
      });

      await poll.save();
      pollCount++;

      // 2. Create DataPoint records for each tour/hypothesis/candidate
      for (const tour of pollData.tours) {
        const tourNumber = tour.tour === "Premier tour" ? 1 : 2;

        for (const hypothesis of tour.hypotheses) {
          // We only import the main hypothesis (hypothese: null) for tour 1
          // For tour 2, we might have multiple hypotheses, we'll import them all but they might overlap in charts
          // To keep it simple, if hypothese is null or if it's the most common one, we import it.
          // For now, let's import everything that has candidates.

          for (const cand of hypothesis.candidats) {
            if (cand.intentions === null || cand.intentions === undefined) continue;
            if (!cand.candidat) {
              console.warn(`⚠️ Missing candidate name in poll ${pollData.id}`);
              continue;
            }

            const normalizedName = CANDIDATE_NAME_NORMALIZATION[cand.candidat] || cand.candidat;
            const mappedParties = cand.parti.map((p) => PARTY_MAPPING[p] || p).filter((p) => p !== "");
            const nuance = NUANCE_MAPPING[cand.candidat] || "Autre";

            const dp = new DataPoint({
              type: "poll",
              election_id: "presidentielle_2022",
              election_type: "presidentielle",
              election_tour: tourNumber,
              date: pollData.fin_enquete, // Use end of poll as the reference date
              candidate_name: normalizedName,
              party: mappedParties.length > 0 ? mappedParties : ["AUTRE"],
              nuance: nuance,
              level: "national",
              city: "",
              result_pourcentage_exprime: cand.intentions,
              poll_source: pollData.id,
              poll_id: pollData.id,
              hypothese: hypothesis.hypothese,
            });

            await dp.save();
            datapointCount++;
          }
        }
      }

      if (pollCount % 50 === 0) console.log(`✅ Processed ${pollCount} polls...`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("📈 IMPORT SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Polls imported: ${pollCount}`);
    console.log(`✅ DataPoints created: ${datapointCount}`);
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
