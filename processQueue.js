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
  const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.POSTGRESQL_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.POSTGRESQL_PORT,
  });

  const connection = await client.connect();
  console.log('Connection:', connection);

  const table = await createTableIfNotExists(client);
  console.log('Table:', table);

  const record = event.Records[0];
  const [name, description] = record.body.split(',').map(str => str.trim());

  const queryText =
    'INSERT INTO pipou(name, description) VALUES ($1, $2) RETURNING *';
  const queryValue = [name, description];

  console.log(`Saving ${name} with description: ${description}...`);
  const result = await client.query(queryText, queryValue);
  console.log('saving result:', result);

  await client.end();

  return { status: 'success', result };
};
