const mongoose = require("mongoose");

const MODELNAME = "dummy_model";

const Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const OBJ = mongoose.model(MODELNAME, Schema);
module.exports = OBJ;
