'use strict';

const https = require('https');

module.exports.get = function(url, cb) {
  https.get(url, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      cb(Error('HTTP ' + res.statusCode));
      return;
    }
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      cb(null, data);
    });
  }).on('error', (err) => {
    cb(err);
  });
};
