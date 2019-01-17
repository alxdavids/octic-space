const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const request = require('request');

const options = {};

const PORT = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const SERVER_IP = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
const API_KEY = process.env.OCTIC_API_KEY;

app.use('/', express.static(__dirname + '/../../', options));
server.listen(PORT);
console.log('Listening on port ' + PORT + ' at ' + SERVER_IP);

io.on('connection', function(socket) {
  socket.on('request', function(data) {
    const longUrl = data.url;
    try {
      tinify(socket, longUrl);
    } catch (err) {
      socket.emit('error', {
        error: err,
      });
    }
  });
});

/**
 * Tinifies the URL using the rebrand.ly API
 * @param {socket.io} socket
 * @param {URL} long
 */
function tinify(socket, long) {
  request({
    uri: 'https://api.rebrandly.com/v1/links',
    method: 'POST',
    body: JSON.stringify({
      destination: long,
      domain: {
        fullName: 'log.octic.space',
      },
    }),
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
    },
  }, function(err, response, body) {
    const link = JSON.parse(body);
    console.log('Long URL was ' + link.destination + ', short URL is '
        + link.shortUrl);
    socket.emit('response', {
      tinyUrl: link.shortUrl,
    });
  });
}
