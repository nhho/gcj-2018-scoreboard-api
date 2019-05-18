'use strict';

const base64 = require('./base64');
const req = require('./req');

const baseUrl = 'https://codejam.googleapis.com/';
const getP = (from, cnt) => {
  const r = {
    min_rank: from,
    num_consecutive_users: cnt,
  };
  const n = base64.encodeURI(JSON.stringify(r));
  return n;
};

const contestIds = [
  '0000000000000130',
  '00000000000000cb',
  '0000000000007883',
  '0000000000007764',
  '0000000000007765',
  '0000000000007706',
  '0000000000007707',
  '0000000000051705',
  '0000000000051635',
  '0000000000051706',
  '00000000000516b9',
  '0000000000051679',
];

const outerPromises = [];
for (const contestId of contestIds) {
  const scoreboardUrl = baseUrl + 'scoreboard/' + contestId + '/poll?p=' +
                        getP(1, 1);
  outerPromises.push(new Promise((outerResolve) => {
    req.get(scoreboardUrl, (err, res) => {
      if (err) {
        console.log(err.message);
        return;
      }
      const data = JSON.parse(base64.decode(res));
      const tot = data.full_scoreboard_size;
      let at = 0;
      const promises = [];
      while (at < tot) {
        const cnt = Math.min(200, tot - at);
        const scoreboardUrl = baseUrl + 'scoreboard/' + contestId + '/poll?p=' +
                              getP(at + 1, cnt);
        at += cnt;
        promises.push(new Promise((resolve) => {
          req.get(scoreboardUrl, (err, res) => {
            if (err) {
              console.log(err.message);
              resolve([]);
              return;
            }
            const data = JSON.parse(base64.decode(res));
            resolve(data.user_scores);
          });
        }));
      }
      Promise.all(promises).then((value) => {
        const data = [].concat(...value);
        outerResolve(data);
      });
    });
  }));
}

let countries = new Set();
Promise.all(outerPromises).then((value) => {
  const data = [].concat(...value);
  for (const user of data) {
    if (user.country !== '') {
      countries.add(user.country);
    }
  }
  countries = [...countries];
  countries.sort();
  for (const country of countries) {
    console.log('*', country);
  }
});
