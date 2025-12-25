const express = require("express");
const router = express.Router();
const Election = require("../models/election");
const ERROR_CODES = require("../utils/errorCodes");

// Get all elections
router.get("/", async (req, res) => {
  try {
    const elections = await Election.find().sort({ year: -1 });
    return res.status(200).send({ ok: true, data: elections });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

// Get election by ID
router.get("/:id", async (req, res) => {
  try {
    const election = await Election.findOne({ election_id: req.params.id });
    if (!election) return res.status(404).send({ ok: false, code: ERROR_CODES.NOT_FOUND });
    return res.status(200).send({ ok: true, data: election });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

module.exports = router;
