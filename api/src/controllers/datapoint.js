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

router.post("/search", async (req, res) => {
  try {
    const { election_types, tours, start_date, end_date, parties, nuances, candidates, level, city, group_by } =
      req.body;
    const matchQuery = {};
    if (election_types && election_types.length > 0) matchQuery.election_type = { $in: election_types };
    if (tours && tours.length > 0) matchQuery.election_tour = { $in: tours };
    if (start_date || end_date) {
      matchQuery.date = {};
      if (start_date) matchQuery.date.$gte = new Date(start_date);
      if (end_date) matchQuery.date.$lte = new Date(end_date);
    }
    if (parties && parties.length > 0) matchQuery.party = { $in: parties };
    if (nuances && nuances.length > 0) matchQuery.nuance = { $in: nuances };
    if (candidates && candidates.length > 0) matchQuery.candidate_name = { $in: candidates };
    if (level) matchQuery.level = level;
    if (city) matchQuery.city = city;

    const groupByField = group_by || "party";

    // 1st Grouping Key: Includes poll_id/hypothese to sum candidates within the same poll
    // (e.g. if we group by nuance, and there are multiple candidates of same nuance in one poll)
    const firstGroupId = {
      date: "$date",
      type: "$type",
      election_id: "$election_id",
      // Include poll identifiers to group candidates from same poll together first
      poll_id: "$poll_id",
      hypothese: "$hypothese",
    };
    if (groupByField !== "nuance") firstGroupId[groupByField] = `$${groupByField}`;
    firstGroupId.nuance = "$nuance";

    // 2nd Grouping Key: Groups by Day + Type + GroupField (aggregates multiple polls on same day)
    const secondGroupId = {
      date: "$_id.date",
      type: "$_id.type",
      election_id: "$_id.election_id",
      nuance: "$_id.nuance",
    };
    if (groupByField !== "nuance") secondGroupId[groupByField] = `$_id.${groupByField}`;

    const pipeline = [
      { $match: matchQuery },
      // Step 1: Sum percentages within each poll/result context
      // This handles "Total Gauche" in one poll (sum of candidates)
      // And handles "Total Gauche" in election result (sum of candidates)
      {
        $group: {
          _id: firstGroupId,
          sub_result_pourcentage: { $sum: "$result_pourcentage_exprime" },
          sub_result_amount: { $sum: "$result_amount" },
        },
      },
      // Step 2: Average the totals across multiple polls on the same day
      // This handles "Average of 3 polls on May 1st"
      // For results, there is usually only 1 result per day, so avg(x) = x.
      {
        $group: {
          _id: secondGroupId,
          avg_result_pourcentage: { $avg: "$sub_result_pourcentage" },
          // For amount, we also average to represent the "typical poll size" or "result size"
          avg_result_amount: { $avg: "$sub_result_amount" },
        },
      },
      {
        $project: {
          _id: 1,
          sum_result_pourcentage_exprime: "$avg_result_pourcentage",
          sum_result_amount: "$avg_result_amount",
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

router.post("/", async (req, res) => {
  try {
    const { dataPoints } = req.body;
    if (!Array.isArray(dataPoints)) return res.status(400).send({ ok: false, code: ERROR_CODES.INVALID_BODY });
    const created = await DataPoint.insertMany(dataPoints);
    return res.status(201).send({ ok: true, data: created });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

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
