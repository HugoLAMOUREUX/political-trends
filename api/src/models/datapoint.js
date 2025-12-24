const mongoose = require("mongoose");

const DataPointSchema = new mongoose.Schema(
  {
    // Type: result for official results, poll for survey data
    type: {
      type: String,
      enum: ["result", "poll"],
      required: true,
      index: true,
    },

    // Election information
    election_id: {
      type: String,
      required: true,
      index: true,
    },
    election_type: {
      type: String,
      enum: ["presidentielle", "municipale", "europeenne", "legislative", "regionale", "metropolitaine"],
      required: true,
      index: true,
    },

    // Date of the election or poll
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Candidate information
    candidate_name: {
      type: String,
      required: true,
      index: true,
    },

    // Denormalized party and political nuance for fast filtering
    party: {
      type: String,
      required: true,
      index: true,
    },
    nuance: {
      type: String,
      required: true,
      index: true,
      enum: ["Gauche", "Droite", "Centre", "Extreme droite", "Extreme gauche", "Autre"],
    },

    // Location information - flat structure
    level: {
      type: String,
      enum: ["national", "municipal"],
      required: true,
      index: true,
    },
    city: {
      type: String,
      default: "",
      index: true,
    },

    // Result value (percentage)
    value: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // Poll source (only if type is "poll")
    poll_source: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Compound indexes for common queries
DataPointSchema.index({ city: 1, date: -1 });
DataPointSchema.index({ level: 1, date: -1 });
DataPointSchema.index({ nuance: 1, election_type: 1 });
DataPointSchema.index({ party: 1, election_type: 1 });
DataPointSchema.index({ election_type: 1, date: -1 });
DataPointSchema.index({ type: 1, date: -1 });

const DataPoint = mongoose.model("datapoint", DataPointSchema);

module.exports = DataPoint;
