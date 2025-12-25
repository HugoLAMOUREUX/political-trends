const mongoose = require("mongoose");

const TourDataSchema = new mongoose.Schema(
  {
    tour_number: { type: Number, required: true, min: 1, max: 2 },
    date: { type: Date, required: true },
    inscrits_amount: { type: Number, required: true, min: 0 },
    abstentions_amount: { type: Number, required: true, min: 0 },
    abstentions_pourcentage_inscrits: { type: Number, required: true, min: 0, max: 100 },
    votants_amount: { type: Number, required: true, min: 0 },
    votants_pourcentage_inscrits: { type: Number, required: true, min: 0, max: 100 },
    blancs_amount: { type: Number, required: true, min: 0 },
    blancs_pourcentage_inscrits: { type: Number, required: true, min: 0, max: 100 },
    blancs_pourcentage_votants: { type: Number, required: true, min: 0, max: 100 },
    nuls_amount: { type: Number, required: true, min: 0 },
    nuls_pourcentage_inscrits: { type: Number, required: true, min: 0, max: 100 },
    nuls_pourcentage_votants: { type: Number, required: true, min: 0, max: 100 },
    exprimes_amount: { type: Number, required: true, min: 0 },
    exprimes_pourcentage_inscrits: { type: Number, required: true, min: 0, max: 100 },
    exprimes_pourcentage_votants: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

const ElectionSchema = new mongoose.Schema(
  {
    election_id: { type: String, required: true, unique: true, index: true },
    election_type: {
      type: String,
      enum: ["presidentielle", "municipale", "europeenne", "legislative", "regionale", "metropolitaine"],
      required: true,
      index: true,
    },
    year: { type: Number, required: true, index: true },
    level: {
      type: String,
      enum: ["national", "municipal", "regional", "departmental"],
      default: "national",
      index: true,
    },
    location: { type: String, default: "" },
    tour_1: { type: TourDataSchema, required: true },
    tour_2: { type: TourDataSchema, default: null },
    source: { type: String, default: "data.gouv.fr" },
  },
  { timestamps: true },
);

ElectionSchema.index({ election_type: 1, year: -1 });
ElectionSchema.index({ level: 1, election_type: 1 });
ElectionSchema.index({ location: 1, election_type: 1 });
ElectionSchema.index({ year: -1, election_type: 1 });

const Election = mongoose.model("election", ElectionSchema);

module.exports = Election;
