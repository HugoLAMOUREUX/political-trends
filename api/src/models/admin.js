const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MODELNAME = "admin";

const Schema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    avatar: { type: String, default: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y" },

    password: { type: String },

    invitation_token: { type: String },
    invitation_expires: { type: Date },

    forgot_password_reset_token: { type: String },
    forgot_password_reset_expires: { type: Date },

    last_login_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

Schema.pre("save", function (next) {
  if (this.isModified("password") || this.isNew) {
    if (!this.password) return next();
    bcrypt.hash(this.password, 10, (e, hash) => {
      this.password = hash;
      return next();
    });
  } else {
    return next();
  }
});

Schema.methods.comparePassword = function (p) {
  return bcrypt.compare(p, this.password || "");
};

Schema.set("toJSON", {
  transform: function (doc, ret, options) {
    delete ret.password;
    return ret;
  },
});

const OBJ = mongoose.model(MODELNAME, Schema);
module.exports = OBJ;
