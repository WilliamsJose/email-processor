'use strict';

const { Client } = require('pg');

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

module.exports.handler = async event => {
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

  console.log('Connecting to database...');
  const connection = await client.connect();
  console.log('Connected:', connection);

  const table = await createTableIfNotExists(client);
  console.log('Table:', table);

  const record = event.Records[0];
  const [name, description] = record.body.split(',').map(str => str.trim());

  const queryText =
    'INSERT INTO pipou(name, description) VALUES ($1, $2) RETURNING *';
  const queryValue = [name, description];

  console.log(`Saving ${name} with description: ${description}...`);
  result = await client.query(queryText, queryValue);
  console.log('Saved:', result);

  await client.end();

  return { status: 'success', result };
};
