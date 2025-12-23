const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const crypto = require("crypto");

const Admin = require("../models/admin");

const config = require("../config");
const ERROR_CODES = require("../utils/errorCodes");
const brevo = require("../services/brevo");
const { capture } = require("../services/sentry");
const { validatePassword } = require("../utils");
const { BREVO_TEMPLATES } = require("../utils/constants");

// 1 year
const COOKIE_MAX_AGE = 31557600000;
const JWT_MAX_AGE = "1y";

const cookieOptions = () => {
  if (config.ENVIRONMENT === "development") {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: false, domain: "localhost", sameSite: "Lax" };
  } else {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, origin: config.ADMIN_URL, sameSite: "none" };
  }
};

router.post("/signin", async (req, res) => {
  let { password, email } = req.body;
  email = (email || "").trim().toLowerCase();

  if (!email || !password) return res.status(400).send({ ok: false, code: ERROR_CODES.EMAIL_AND_PASSWORD_REQUIRED });

  try {
    const user = await Admin.findOne({ email });
    if (!user) return res.status(401).send({ ok: false, code: ERROR_CODES.USER_NOT_EXISTS });

    const match = config.ENVIRONMENT === "development" || (await user.comparePassword(password));
    if (!match) return res.status(401).send({ ok: false, code: ERROR_CODES.EMAIL_OR_PASSWORD_INVALID });

    user.set({ last_login_at: Date.now() });
    await user.save();

    const token = jwt.sign({ _id: user.id }, config.SECRET, { expiresIn: JWT_MAX_AGE });
    res.cookie("jwt_admin", token, cookieOptions());

    return res.status(200).send({ ok: true, token, user });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

// SIGNUP ROUTE - Comment this once at least one admin account is created
router.post("/signup", async (req, res) => {
  try {
    const { password, email, name } = req.body;

    if (!email || !password) return res.status(400).send({ ok: false, code: ERROR_CODES.EMAIL_AND_PASSWORD_REQUIRED });

    if (password && !validatePassword(password))
      return res.status(400).send({ ok: false, user: null, code: ERROR_CODES.PASSWORD_NOT_VALIDATE });

    const user = await Admin.create({ name, password, email });
    const token = jwt.sign({ _id: user._id }, config.SECRET, { expiresIn: JWT_MAX_AGE });
    res.cookie("jwt_admin", token, cookieOptions());

    return res.status(200).send({ user, token, ok: true });
  } catch (error) {
    console.log("e", error);
    if (error.code === 11000) return res.status(409).send({ ok: false, code: ERROR_CODES.USER_ALREADY_REGISTERED });
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR, error });
  }
});

router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("jwt_admin", cookieOptions());
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, error });
  }
});

router.get("/signin_token", passport.authenticate("admin", { session: false }), async (req, res) => {
  try {
    const { user } = req;

    await user.set({ last_login_at: Date.now() });
    await user.save();
    return res.status(200).send({ user, token: req.cookies.jwt_admin, ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

router.post("/forgot_password", async (req, res) => {
  try {
    const obj = await Admin.findOne({ email: req.body.email.toLowerCase() });

    if (!obj) return res.status(401).send({ ok: false, code: ERROR_CODES.EMAIL_OR_PASSWORD_INVALID });

    const token = await crypto.randomBytes(20).toString("hex");
    obj.set({ forgot_password_reset_token: token, forgot_password_reset_expires: Date.now() + 7200000 }); //2h
    await obj.save();

    await brevo.sendTemplate(BREVO_TEMPLATES.FORGOT_PASSWORD, {
      emailTo: [{ email: obj.email }],
      params: { cta: `${config.ADMIN_URL}/auth/reset?token=${token}` },
    });

    res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

router.post("/forgot_password_reset", async (req, res) => {
  try {
    const obj = await Admin.findOne({
      forgot_password_reset_token: req.body.token,
      forgot_password_reset_expires: { $gt: Date.now() },
    });

    if (!obj) return res.status(400).send({ ok: false, code: ERROR_CODES.PASSWORD_TOKEN_EXPIRED_OR_INVALID });

    if (!validatePassword(req.body.password))
      return res.status(400).send({ ok: false, code: ERROR_CODES.PASSWORD_NOT_VALIDATED });

    obj.password = req.body.password;
    obj.forgot_password_reset_token = "";
    obj.forgot_password_reset_expires = "";
    await obj.save();
    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

router.post("/accept_invitation", async (req, res) => {
  try {
    const obj = await Admin.findOne({
      invitation_token: req.body.token,
      invitation_expires: { $gt: Date.now() },
    });

    if (!obj) return res.status(400).send({ ok: false, code: ERROR_CODES.PASSWORD_TOKEN_EXPIRED_OR_INVALID });

    if (!validatePassword(req.body.password))
      return res.status(400).send({ ok: false, code: ERROR_CODES.PASSWORD_NOT_VALIDATED });

    obj.password = req.body.password;
    obj.invitation_token = "";
    obj.invitation_expires = "";
    await obj.save();

    const token = jwt.sign({ _id: obj.id }, config.SECRET, { expiresIn: JWT_MAX_AGE });
    res.cookie("jwt_admin", token, cookieOptions());

    return res.status(200).send({ ok: true, token, user: obj });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

router.post("/reset_password", passport.authenticate("admin", { session: false }), async (req, res) => {
  try {
    const match = await req.user.comparePassword(req.body.password);
    if (!match) {
      return res.status(401).send({ ok: false, code: ERROR_CODES.PASSWORD_INVALID });
    }
    if (req.body.newPassword !== req.body.verifyPassword) {
      return res.status(422).send({ ok: false, code: ERROR_CODES.PASSWORDS_DO_NOT_MATCH });
    }
    if (!validatePassword(req.body.newPassword)) {
      return res.status(400).send({ ok: false, code: ERROR_CODES.PASSWORD_NOT_VALIDATED });
    }
    const obj = await Admin.findById(req.user._id);

    obj.set({ password: req.body.newPassword });
    await obj.save();
    return res.status(200).send({ ok: true, user: obj });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

router.post("/search", passport.authenticate("admin", { session: false }), async (req, res) => {
  try {
    let query = {};

    const limit = req.body.limit || 10;
    const offset = req.body.offset || 0;

    if (req.body.search) {
      const searchRegex = new RegExp(req.body.search, "i");
      query = {
        $or: [{ name: { $regex: searchRegex } }, { email: { $regex: searchRegex } }],
      };
    }

    const total = await Admin.countDocuments(query);
    const data = await Admin.find(query).sort({ created_at: -1 }).skip(offset).limit(limit);

    return res.status(200).send({ ok: true, data, total });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

router.post("/", passport.authenticate("admin", { session: false }), async (req, res) => {
  try {
    const obj = req.body;
    const exist = await Admin.findOne({ email: obj.email });
    if (exist) return res.status(400).send({ ok: false, code: "EMAIL_ALREADY_EXISTS" });

    const token = await crypto.randomBytes(20).toString("hex");
    const user = await Admin.create({
      created_at: new Date(),
      email: obj.email,
      name: obj.name,
      invitation_token: token,
      invitation_expires: Date.now() + 2419200000, // 4 weeks
    });

    await brevo.sendTemplate(BREVO_TEMPLATES.FORGOT_PASSWORD, {
      emailTo: [{ email: obj.email }],
      params: { cta: `${config.ADMIN_URL}/auth/invitation?token=${token}` },
    });

    console.log(`Admin invitation sent to ${obj.email}`);
    console.log(`Invitation link: ${config.ADMIN_URL}/auth/invitation?token=${token}`);

    return res.status(200).send({ data: user, ok: true });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

router.put("/", passport.authenticate("admin", { session: false }), async (req, res) => {
  try {
    const obj = req.body;
    const data = await Admin.findByIdAndUpdate(req.user._id, obj, { new: true });
    res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR, error });
  }
});

router.put("/:id", passport.authenticate("admin", { session: false }), async (req, res) => {
  try {
    const obj = req.body;
    const data = await Admin.findByIdAndUpdate(req.params.id, obj, { new: true });
    res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR, error });
  }
});

router.get("/:id", passport.authenticate("admin", { session: false }), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) return res.status(404).send({ ok: false, code: ERROR_CODES.NOT_FOUND });

    return res.status(200).send({ ok: true, data: admin });
  } catch (error) {
    capture(error);
    return res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR });
  }
});

router.delete("/:id", passport.authenticate("admin", { session: false }), async (req, res) => {
  try {
    await Admin.findOneAndRemove({ _id: req.params.id });
    res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERROR_CODES.SERVER_ERROR, error });
  }
});

module.exports = router;
