require("dotenv").config();
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { initSentry, setupErrorHandler } = require("./services/sentry");
const { PORT, ENVIRONMENT, APP_URL, ADMIN_URL } = require("./config");

const app = express();
initSentry(app);

if (ENVIRONMENT === "development") {
  app.use(morgan("tiny"));
}

require("./services/mongo");

app.use(
  cors({
    credentials: true,
    origin: [APP_URL, ADMIN_URL, "https://political-trends.onrender.com/", "https://hugolamoureux.github.io"],
  }),
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const lastDeployedAt = new Date();
app.get("/", async (req, res) => {
  res.status(200).send({
    name: "api",
    environment: ENVIRONMENT,
    last_deployed_at: lastDeployedAt.toLocaleString(),
  });
});

app.use("/user", require("./controllers/user"));
app.use("/admin", require("./controllers/admin"));
app.use("/file", require("./controllers/file"));
app.use("/datapoint", require("./controllers/datapoint"));
app.use("/election", require("./controllers/election"));

setupErrorHandler(app);
require("./services/passport")(app);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
