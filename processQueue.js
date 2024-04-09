"use strict";

module.exports.handler = async (event) => {
  const record = event.Records[0];

  console.log("date:", record);

  return { status: "success" };
};
