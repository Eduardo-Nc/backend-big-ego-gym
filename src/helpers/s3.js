const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');

const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const storage = new S3({
  region,
  accessKeyId,
  secretAccessKey
});


const uploadToBucket = (file) => {

  const stream = fs.createReadStream(file.tempFilePath);
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: Date.now() + "-" + file.name,
    Body: stream
  };
  return storage.upload(params).promise();
};

module.exports = {
  uploadToBucket
};






