"use strict";

const { Client } = require("pg");

const client = new Client({
  user: "seu_usuario",
  host: process.env.POSTGRESQL_HOST,
  database: "seu_banco_de_dados",
  password: "sua_senha",
  port: process.env.POSTGRESQL_PORT,
});

module.exports.handler = async (event) => {
  const record = event.Records[0];

  console.log("record:", record);

  return { status: "success" };
};
