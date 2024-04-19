'use strict';

const { Client } = require('pg');
const { SQSClient, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient();

const createTableIfNotExists = async client => {
  const queryText = `
  CREATE TABLE IF NOT EXISTS pipou (
    id SMALLSERIAL,
    name varchar(45) NOT NULL,
    description varchar(255),
    PRIMARY KEY (name)
  )`;
  return await client.query(queryText);
};

const deleteProcessedMessage = async message => {
  return await sqs.send(
    new DeleteMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      ReceiptHandle: message.receiptHandle,
    })
  );
};

module.exports.handler = async event => {
  let status = 200;
  let result = '';
  const dbUser = process.env.DB_USERNAME;
  const dbPass = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbHost = process.env.POSTGRESQL_HOST;
  const dbPort = +process.env.POSTGRESQL_PORT;

  const client = new Client({
    user: dbUser,
    host: dbHost,
    database: dbName,
    password: dbPass,
    port: dbPort,
    ssl: { rejectUnauthorized: false },
  });

  client.on('error', err => {
    console.error('Error on pg client:', err.stack);
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected');

    console.log('Starting transaction...');
    await client.query('BEGIN');

    const table = await createTableIfNotExists(client);
    console.log('Table:', table);

    const record = event.Records[0];
    const [name, description] = record.body.split(',').map(str => str.trim());

    const queryText =
      'INSERT INTO pipou(name, description) VALUES ($1, $2) RETURNING *';
    const queryValue = [name, description];

    console.log(`Saving ${name} with description: ${description}...`);
    result = await client.query(queryText, queryValue);
    await client.query('COMMIT');
    await deleteProcessedMessage(record);
    console.log('Transaction completed:', result);
  } catch (error) {
    await client.query('ROLLBACK');
    console.log('Rollback complete.');
    console.error('Error trying to save line:', error);
    status = 500;
    // TODO resend message to DLQ bcs only auto sends when lambda crashes.
    result = error;
  } finally {
    await client.end();
  }

  return { status, result };
};
