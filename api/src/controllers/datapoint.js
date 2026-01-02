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
    const groupId = { date: "$date", type: "$type", election_id: "$election_id" };
    // Only group polls by poll_id and hypothese to avoid summing multiple hypotheses/polls on same day
    // For type="poll", include poll_id and hypothese in the group ID if present
    // But we need a consistent group ID structure for $group.
    // Instead of conditionally adding fields to _id (which might split results too much or too little),
    // let's group by date/type/election_id + grouping field, AND calculate the average for polls on the same day?
    // OR: The user issue is summing percentages > 100%.
    // If we have multiple polls on the same day, we probably want to AVERAGE them, not sum them.
    // If we have multiple hypotheses in the same poll, we should probably pick one or treat them as separate data points.

    // Updated aggregation logic:
    // 1. Match documents
    // 2. Group by specific poll/hypothesis first to handle multiple hypotheses (though usually we filter by hypothesis if UI allowed it)
    //    Actually, if we just want to avoid >100%, we should average the results for the same candidate on the same day.

    if (groupByField !== "nuance") groupId[groupByField] = `$${groupByField}`;
    groupId.nuance = "$nuance";

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: groupId,
          // Use average for polls on the same day/group to avoid > 100% sums
          // But for election results (type="result"), sum might be appropriate if we are aggregating sub-regions (not the case here with level=national usually)
          // Let's use $avg for percentages to be safe for polls.
          avg_result_pourcentage_exprime: { $avg: "$result_pourcentage_exprime" },
          sum_result_amount: { $sum: "$result_amount" },
        },
      },
      {
        $project: {
          _id: 1,
          sum_result_pourcentage_exprime: "$avg_result_pourcentage_exprime", // Keep the name for frontend compatibility but map to avg
          sum_result_amount: 1,
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
