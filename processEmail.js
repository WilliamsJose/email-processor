"use strict";

const { S3 } = require("@aws-sdk/client-s3");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const simpleParser = require("mailparser").simpleParser;

const s3 = new S3({
  region: process.env.AWSREGION,
});

const sqs = new SQSClient();

module.exports.handler = async (event) => {
  let statusCode = 200;
  let message;

  console.log("Region:", process.env.AWSREGION);
  console.log("Received event:", JSON.stringify(event, null, 2));

  const record = event.Records[0];

  const request = {
    Bucket: record.s3.bucket.name,
    Key: record.s3.object.key,
  };

  const data = await s3.getObject(request);
  const email = await simpleParser(data.Body);

  console.log("date:", email.date);
  console.log("subject:", email.subject);
  console.log("body:", email.text);
  console.log("from:", email.from.text);
  console.log("attachments:", email.attachments);

  try {
    const attachmentLines = email.attachments[0].content.toString().split("\n");
    for (const line of attachmentLines) {
      console.log("reading line");
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: process.env.QUEUE_URL,
          MessageBody: line,
          MessageAttributes: {
            Created_At: {
              DataType: "String",
              StringValue: new Date().toISOString(),
            },
          },
          MessageGroupId: record.s3.object.key,
        })
      );
      console.log("Message sent.");
    }
  } catch (error) {
    console.log(error);
    message = error;
    statusCode = 500;
  }

  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  };
};
