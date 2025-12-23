const { S3_ACCESSKEYID, S3_ENDPOINT, S3_SECRETACCESSKEY } = require("../config");

const AWS = require("aws-sdk");

// Validate password: minimum 8 characters
function validatePassword(password) {
  if (!password || password.length < 6) return false;
  return true;
}

function uploadToS3FromBuffer(path, buffer, ContentType) {
  return new Promise((resolve, reject) => {
    let s3bucket = new AWS.S3({
      endpoint: S3_ENDPOINT,
      accessKeyId: S3_ACCESSKEYID,
      secretAccessKey: S3_SECRETACCESSKEY,
    });

    var params = {
      ACL: "public-read",
      Bucket: "bank",
      Key: path,
      Body: buffer,
      ContentEncoding: "base64",
      ContentType,
      Metadata: { "Cache-Control": "max-age=31536000" },
    };
    s3bucket.upload(params, function (err, data) {
      if (err) return reject(`error in callback:${err}`);
      resolve(data.Location);
    });
  });
}

const BREVO_TEMPLATES = {};

module.exports = {
  uploadToS3FromBuffer,
  validatePassword,
  BREVO_TEMPLATES,
};
