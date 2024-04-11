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

  const messagePromise = sqs.send(
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
  const batchSize = 500;
  let promises = [];
  let totalProcessedLines = 0;

  const data = await s3.getObject(request);
  const email = await simpleParser(data.Body);

  console.log('attachments:', email.attachments);

  const buffer = Buffer.from(email.attachments[0].content);

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const reader = readline.createInterface({
    input: stream,
    terminal: false,
  });

  reader.on('line', async chunk => {
    const trimmedLine = chunk.trim();
    if (trimmedLine !== '') {
      promises.push(processLine(trimmedLine, record.s3.object.key));
      totalProcessedLines++;

      if (promises.length >= batchSize) {
        await Promise.all(promises);
        promises = [];
      }
    }
  });

  await once(reader, 'close');

  if (promises.length > 0) {
    await Promise.all(promises);
    promises = null;
  }

  message = 'File processed with total lines: ' + totalProcessedLines;
  console.log(message);

  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  };
};
