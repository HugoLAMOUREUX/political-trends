const mongoose = require("mongoose");

const PollSchema = new mongoose.Schema(
  {
    poll_id: { type: String, required: true, unique: true, index: true },
    nom_institut: { type: String, required: true, index: true },
    debut_enquete: { type: Date, required: true, index: true },
    fin_enquete: { type: Date, required: true, index: true },
    rolling: { type: Boolean, default: false },
    media: { type: Boolean, default: false },
    commanditaire: { type: String, default: "" },
    lien: { type: String, default: "" },
    echantillon: { type: Number, required: true },
    population: { type: String, default: "" },
    election_type: {
      type: String,
      enum: ["presidentielle", "municipale", "europeenne", "legislative", "regionale", "metropolitaine"],
      required: true,
      index: true,
    },
    year: { type: Number, required: true, index: true },
  },
  { timestamps: true },
);

PollSchema.index({ nom_institut: 1, fin_enquete: -1 });
PollSchema.index({ election_type: 1, year: -1 });

const Poll = mongoose.model("poll", PollSchema);

module.exports = Poll;
