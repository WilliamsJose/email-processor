'use strict';

const { S3 } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const simpleParser = require('mailparser').simpleParser;
const { v4: uuidv4 } = require('uuid');
const { once } = require('node:events');
const readline = require('node:readline/promises');
const { Readable } = require('node:stream');

const s3 = new S3({
  region: process.env.AWSREGION,
});

const sqs = new SQSClient();

const processLine = async (line, msgGroupId) => {
  console.log('Processing line:', line);

  const MessageDeduplicationId = uuidv4();

  const messagePromise = await sqs.send(
    new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: line,
      MessageAttributes: {
        Created_At: {
          DataType: 'String',
          StringValue: new Date().toISOString(),
        },
      },
      MessageGroupId: msgGroupId,
      MessageDeduplicationId,
    })
  );
  console.log('message sent.', messagePromise);
  return messagePromise;
};

module.exports.handler = async event => {
  const record = event.Records[0];
  let statusCode = 200;
  let message;
  const request = {
    Bucket: record.s3.bucket.name,
    Key: record.s3.object.key,
  };
  let totalProcessedLines = 0;

  const data = await s3.getObject(request);
  const email = await simpleParser(data.Body);

  console.log('attachments:', email.attachments);

  if (email.attachments.length === 0) {
    console.log('No attachments found.');
    return {
      statusCode,
      body: 'No attachments found.',
    };
  }

  const buffer = Buffer.from(email.attachments[0].content);

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const reader = readline.createInterface({
    input: stream,
    terminal: false,
  });

  const start = async () => {
    for await (const line of reader) {
      const trimmedLine = line.trim();
      if (trimmedLine !== '') {
        await processLine(trimmedLine, record.s3.object.key);
        totalProcessedLines++;
      }
    }
  };

  await start();

  message = 'File processed with total lines: ' + totalProcessedLines;
  console.log(message);

  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  };
};
