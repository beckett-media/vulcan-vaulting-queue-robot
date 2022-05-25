const requestlib = require('request');
const crypto = require('crypto');
const axios = require('axios');

exports.handler = async function (event) {
  const url = 'https://dev.beckett.com:3001/webhooks/sentinel';
  const { webhookSharedSecret } = event.secrets;
  const { request } = event;
  const toHash = JSON.stringify(request);
  const h = crypto
    .createHmac('sha256', webhookSharedSecret)
    .update(toHash)
    .digest('hex');
  const body = {
    hash: h,
    request: request,
  };
  const response = await axios.post(url, body, {});
  // Example: {status: ok}
  console.log(response);
  return {};
};
