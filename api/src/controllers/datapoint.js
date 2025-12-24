const express = require("express");
const router = express.Router();
const DataPoint = require("../models/datapoint");
const ERROR_CODES = require("../utils/errorCodes");

// Get all filter options
router.get("/filters", async (req, res) => {
  try {
    const [parties, nuances, candidates, cities, electionTypes] = await Promise.all([
      DataPoint.distinct("party"),
      DataPoint.distinct("nuance"),
      DataPoint.distinct("candidate_name"),
      DataPoint.distinct("city"),
      DataPoint.distinct("election_type"),
    ]);

    return res.status(200).send({
      ok: true,
      data: {
        parties: parties.sort(),
        nuances: nuances.sort(),
        candidates: candidates.sort(),
        cities: cities.filter((c) => c).sort(),
        election_types: electionTypes.sort(),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

// Search data points with filters and aggregation
router.post("/search", async (req, res) => {
  try {
    const { election_types, start_date, end_date, parties, nuances, candidates, level, city, group_by } = req.body;

    // Build match query
    const matchQuery = {};

    if (election_types && election_types.length > 0) {
      matchQuery.election_type = { $in: election_types };
    }

    if (start_date || end_date) {
      matchQuery.date = {};
      if (start_date) matchQuery.date.$gte = new Date(start_date);
      if (end_date) matchQuery.date.$lte = new Date(end_date);
    }

    if (parties && parties.length > 0) {
      matchQuery.party = { $in: parties };
    }

    if (nuances && nuances.length > 0) {
      matchQuery.nuance = { $in: nuances };
    }

    if (candidates && candidates.length > 0) {
      matchQuery.candidate_name = { $in: candidates };
    }

    if (level) {
      matchQuery.level = level;
    }

    if (city) {
      matchQuery.city = city;
    }

    const groupByField = group_by || "party";

    // Build group _id based on groupBy field
    const groupId = {
      date: "$date",
      type: "$type",
      election_id: "$election_id", // Add election_id to group per election
    };

    // Only add the groupBy field if it's not nuance (since nuance is always included)
    if (groupByField !== "nuance") {
      groupId[groupByField] = `$${groupByField}`;
    }

    // Always add nuance for coloring
    groupId.nuance = "$nuance";

    // Aggregation pipeline
    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: groupId,
          sum_value: { $sum: "$value" }, // Use SUM instead of AVG when grouping by nuance
        },
      },
      { $sort: { "_id.date": 1 } },
    ];

    const data = await DataPoint.aggregate(pipeline);

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

// Create multiple data points (for seeding)
router.post("/", async (req, res) => {
  try {
    const { dataPoints } = req.body;

    if (!Array.isArray(dataPoints)) {
      return res.status(400).send({ ok: false, code: ERROR_CODES.INVALID_BODY });
    }

    const created = await DataPoint.insertMany(dataPoints);

    return res.status(201).send({ ok: true, data: created });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

// Delete all data points (for testing)
router.delete("/all", async (req, res) => {
  try {
    await DataPoint.deleteMany({});

    return res.status(200).send({ ok: true, message: "All data points deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

module.exports = router;
