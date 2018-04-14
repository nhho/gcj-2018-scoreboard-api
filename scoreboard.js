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
const nSpace = (cnt) => {
  let ret = '';
  for (let i = 0; i < cnt; i++) {
    ret += ' ';
  }
  return ret;
};
const timeToString = (time) => {
  time -= time % 1000000;
  time /= 1000000;
  let sec = time % 60;
  time -= sec;
  time /= 60;
  sec = sec.toString();
  if (sec.length == 1) {
    sec = '0' + sec;
  }
  let min = time % 60;
  time -= min;
  time /= 60;
  min = min.toString();
  if (min.length == 1) {
    min = '0' + min;
  }
  time += ':' + min + ':' + sec;
  return time;
};

const contestId = process.argv[2];
let country = '';
if (process.argv.length >= 4) {
  country = process.argv[3];
}

// const dashboardUrl = baseUrl + 'dashboard/' + contestId + '/poll?p=e30';
const scoreboardUrl = baseUrl + 'scoreboard/' + contestId + '/poll?p=' +
                      getP(1, 1);
req.get(scoreboardUrl, (err, res) => {
  if (err) {
    console.log(err.message);
    return;
  }
  const data = JSON.parse(base64.decode(res));
  console.log('===' + data.challenge.title + '===');
  if ('additional_info' in data.challenge &&
      data.challenge.additional_info.length > 0) {
    console.log(data.challenge.additional_info);
  }
  let tot = data.full_scoreboard_size;
  console.log('number of participants:', tot);
  console.log();
  const size = [0, 0, 0, 0];
  const taskMap = {};
  const testCnt = [];
  for (let i = 0; i < data.challenge.tasks.length; i++) {
    const task = data.challenge.tasks[i];
    taskMap[task.id] = i;
    testCnt.push(task.tests.length);
    console.log('{' + (i + 1) + '}', task.title);
    for (let j = 0; j < task.tests.length; j++) {
      const test = task.tests[j];
      test.name = ' [' + (j + 1) + ']';
      size[0] = Math.max(size[0], test.name.length);
      test.value += 'pt';
      size[1] = Math.max(size[1], test.value.length);
      test.type__str = test.type__str.toLowerCase();
      size[2] = Math.max(size[2], test.type__str.length);
      if ('num_solved' in test) {
        test.cnt = test.num_solved + '/' + task.num_attempted;
      } else {
        test.cnt = '?/' + task.num_attempted;
      }
      size[3] = Math.max(size[3], test.cnt.length);
    }
    for (let j = 0; j < task.tests.length; j++) {
      const test = task.tests[j];
      let line = test.name;
      line += nSpace(size[0] - test.name.length);
      line += ' ';
      line += nSpace(size[1] - test.value.length);
      line += test.value;
      line += ' ';
      line += nSpace(size[2] - test.type__str.length);
      line += test.type__str;
      line += ' ';
      line += nSpace(size[3] - test.cnt.length);
      line += test.cnt;
      console.log(line);
    }
  }
  console.log();
  let at = 0;
  const promises = [];
  const result = [];
  while (at < tot) {
    const cnt = Math.min(200, tot - at);
    const scoreboardUrl = baseUrl + 'scoreboard/' + contestId + '/poll?p=' +
                          getP(at + 1, cnt);
    at += cnt;
    result.push([]);
    promises.push(new Promise((resolve) => {
      req.get(scoreboardUrl, (err, res) => {
        if (err) {
          console.log(err.message);
          resolve([]);
          return;
        }
        const data = JSON.parse(base64.decode(res));
        if (country.length == 0) {
          resolve(data.user_scores);
        } else {
          const ret = [];
          for (let i = 0; i < data.user_scores.length; i++) {
            const user = data.user_scores[i];
            if (user.country == country) {
              ret.push(user);
            }
          }
          resolve(ret);
        }
      });
    }));
  }
  Promise.all(promises).then((value) => {
    const data = [].concat(...value);
    const size = [0, 0, 0, 0, 0];
    for (let i = 0; i < Object.keys(taskMap).length; i++) {
      size.push(1);
      for (let j = 0; j < 3; j++) {
        size.push(0);
      }
    }
    for (let i = 0; i < data.length; i++) {
      const user = data[i];
      user.rank = user.rank.toString();
      size[0] = Math.max(size[0], user.rank.length);
      user.displayname = user.displayname.replace(/[^\x20-\x7E]+/g, '?');
      size[1] = Math.max(size[1], user.displayname.length);
      size[2] = Math.max(size[2], user.country.length);
      user.score_1 = user.score_1 + 'pt';
      size[3] = Math.max(size[3], user.score_1.length);
      user.score_2 = timeToString(-user.score_2);
      size[4] = Math.max(size[4], user.score_2.length);
      user.task = [];
      for (let j = 0; j < Object.keys(taskMap).length; j++) {
        user.task.push({});
      }
      for (let j = 0; j < user.task_info.length; j++) {
        const task = user.task_info[j];
        const ind = taskMap[task.task_id];
        user.task[ind] = task;
      }
      let at = 5;
      for (let j = 0; j < Object.keys(taskMap).length; j++) {
          const task = user.task[j];
          at++;
          if ('task_id' in task) {
            if (!('penalty_micros' in task) || task.penalty_micros < 0) {
              task.penalty_micros = '-';
            } else {
              task.penalty_micros = timeToString(task.penalty_micros);
            }
            task.total_attempts += '/' + task.penalty_attempts;
            task.tests = '';
            for (let k = 0; k < task.tests_definitely_solved; k++) {
              task.tests += 'A';
            }
            for (let k = 0; k < task.tests_possibly_solved; k++) {
              task.tests += '?';
            }
            while (task.tests.length != testCnt[j]) {
              task.tests += '_';
            }
          } else {
            task.penalty_micros = '-';
            task.total_attempts = '-';
            task.tests = '-';
          }
          size[at] = Math.max(size[at], task.penalty_micros.length);
          at++;
          size[at] = Math.max(size[at], task.total_attempts.length);
          at++;
          size[at] = Math.max(size[at], task.tests.length);
          at++;
      }
    }
    for (let i = 0; i < data.length; i++) {
      const user = data[i];
      let line = user.rank;
      line += nSpace(size[0] - user.rank.length);
      line += ' ';
      line += nSpace(size[1] - user.displayname.length);
      line += user.displayname;
      line += ' ';
      line += nSpace(size[2] - user.country.length);
      line += user.country;
      line += ' ';
      line += nSpace(size[3] - user.score_1.length);
      line += user.score_1;
      line += ' ';
      line += nSpace(size[4] - user.score_2.length);
      line += user.score_2;
      let at = 5;
      for (let j = 0; j < Object.keys(taskMap).length; j++) {
        const task = user.task[j];
        line += ' | ';
        at++;
        line += nSpace(size[at] - task.penalty_micros.length);
        line += task.penalty_micros;
        at++;
        line += ' ';
        line += nSpace(size[at] - task.total_attempts.length);
        line += task.total_attempts;
        at++;
        line += ' ';
        line += nSpace(size[at] - task.tests.length);
        line += task.tests;
        at++;
      }
      console.log(line);
    }
  });
});
