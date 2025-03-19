'use strict';

const fs = require('node:fs');
const http = require('node:http');

const htmlForm = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>File Compression</title>
  </head>

  <body>
    <h1>File Compression</h1>
    <form action="/add-expense" method="POST">
      <label for="date">Select a date: </label>
      <input id="date" name="date" type="date" required><br><br>

      <label for="title">Select a title: </label>
      <input id="title" name="title" type="text" required><br><br>

      <label for="amount">Select an amount: </label>
      <input id="amount" name="amount" type="number" required><br><br>

      <input type="submit" value="Submit">
    </form>
  </body>
</html>
`;

function createServer() {
  return http.createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, 'OK', { 'content-type': 'text/html' });

      return res.end(htmlForm);
    }

    if (['/add-expense', '/submit-expense'].includes(req.url)) {
      if (req.method !== 'POST') {
        res.writeHead(400, 'Bad Request', { 'content-type': 'text/html' });

        return res.end(`${req.method} not allowed for this path`);
      }

      const chunks = [];

      req.on('data', (chunk) => chunks.push(chunk));

      req.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf-8');

        const data =
          JSON.parse(text) ||
          text
            .split('&')
            .map((v) => v.split('='))
            .reduce((acc, [key, value]) => {
              acc[key] = decodeURIComponent(value);

              return acc;
            }, {});

        const keys = Object.keys(data);

        if (
          keys.length !== 3 ||
          !keys.includes('date') ||
          !keys.includes('title') ||
          !keys.includes('amount')
        ) {
          res.writeHead(400, 'Bad Request', { 'content-type': 'text/plain' });

          return res.end(
            'The request must include exactly 3 keys: date, title, and amount.',
          );
        }

        const responseData = JSON.stringify(data, null, 2);

        if (req.url === '/submit-expense') {
          res.writeHead(200, 'OK', { 'content-type': 'application/json' });

          return res.end(responseData);
        }

        fs.writeFile('./db/expense.json', responseData, (err) => {
          if (err) {
            res.writeHead(500, 'Server Error', {
              'content-type': 'text/plain',
            });

            return res.end('Something went wrong. Please try again later.');
          }

          res.writeHead(200, 'OK', { 'content-type': 'application/json' });
          res.end(responseData);
        });
      });

      return;
    }

    res.writeHead(404, 'Not Found', { 'content-type': 'text/plain' });
    res.end('Not Found');
  });
}

module.exports = {
  createServer,
};
