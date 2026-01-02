const mongoose = require("mongoose");

const DataPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["result", "poll"], required: true, index: true },
    election_id: { type: String, required: true, index: true },
    election_type: {
      type: String,
      enum: ["presidentielle", "municipale", "europeenne", "legislative", "regionale", "metropolitaine"],
      required: true,
      index: true,
    },
    election_tour: { type: Number, enum: [1, 2], required: true, index: true },
    date: { type: Date, required: true, index: true },
    candidate_name: { type: String, required: true, index: true },
    party: { type: [String], required: true, index: true },
    nuance: {
      type: String,
      required: true,
      index: true,
      enum: ["Gauche", "Droite", "Centre", "Extreme droite", "Extreme gauche", "Autre"],
    },
    level: { type: String, enum: ["national", "municipal"], required: true, index: true },
    city: { type: String, default: "", index: true },
    result_pourcentage_exprime: { type: Number, required: true, min: 0, max: 100 },
    result_pourcentage_inscrits: { type: Number, default: 0, min: 0, max: 100 },
    result_amount: { type: Number, default: 0, min: 0 },
    poll_source: { type: String, default: null },
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
