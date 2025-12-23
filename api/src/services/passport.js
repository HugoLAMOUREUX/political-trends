const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const { SECRET } = require("../config");
const { capture } = require("./sentry");

// load up
const User = require("../models/user");
const Admin = require("../models/admin");

function getUserToken(req) {
  let token = ExtractJwt.fromAuthHeaderWithScheme("JWT")(req);
  if (!token) token = req.cookies.jwt_user;
  return token;
}

function getAdminToken(req) {
  let token = ExtractJwt.fromAuthHeaderWithScheme("JWT")(req);
  if (!token) token = req.cookies.jwt_admin;
  return token;
}

module.exports = function (app) {
  const userOpts = {};
  userOpts.jwtFromRequest = getUserToken;
  userOpts.secretOrKey = SECRET;

  const adminOpts = {};
  adminOpts.jwtFromRequest = getAdminToken;
  adminOpts.secretOrKey = SECRET;

  passport.use(
    "user",
    new JwtStrategy(userOpts, async function (jwtPayload, done) {
      try {
        const user = await User.findOne({ _id: jwtPayload._id });
        if (user) {
          return done(null, user);
        }
      } catch (error) {
        capture(error);
      }
      return done(null, false);
    }),
  );

  passport.use(
    "admin",
    new JwtStrategy(adminOpts, async function (jwtPayload, done) {
      try {
        const admin = await Admin.findOne({ _id: jwtPayload._id });
        if (admin) {
          return done(null, admin);
        }
      } catch (error) {
        capture(error);
      }
      return done(null, false);
    }),
  );

  app.use(passport.initialize());
};
