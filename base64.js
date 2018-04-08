'use strict';

const u = String.fromCharCode;
const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const l = function(e) {
  const t = {};
  const i = e.length;
  for (let n = 0; n < i; n++) {
    t[e.charAt(n)] = n;
  }
  return t;
}(c);
const b = new RegExp(['[À-ß][-¿]", "[à-ï][-¿]{2}", "[ð-÷][-¿]{3}'].join('|'),
                     'g');
const w = function(e) {
  switch (e.length) {
    case 4:
      const t = (7 & e.charCodeAt(0)) << 18 | (63 & e.charCodeAt(1)) << 12 |
              (63 & e.charCodeAt(2)) << 6 | 63 & e.charCodeAt(3);
      const n = t - 65536;
      return u(55296 + (n >>> 10)) + u(56320 + (1023 & n));
    case 3:
      return u((15 & e.charCodeAt(0)) << 12 | (63 & e.charCodeAt(1)) << 6 |
             63 & e.charCodeAt(2));
    default:
      return u((31 & e.charCodeAt(0)) << 6 | 63 & e.charCodeAt(1));
  }
};
const k = function(e) {
  return e.replace(b, w);
};
const x = function(e) {
  const t = e.length;
  const n = t % 4;
  const i = (t > 0 ? l[e.charAt(0)] << 18 : 0) |
            (t > 1 ? l[e.charAt(1)] << 12 : 0) |
            (t > 2 ? l[e.charAt(2)] << 6 : 0) | (t > 3 ? l[e.charAt(3)] : 0);
  const r = [u(i >>> 16), u(i >>> 8 & 255), u(255 & i)];
  r.length -= [0, 0, 2, 1][n];
  return r.join('');
};
const _ = function(e) {
  return e.replace(/[\s\S]{1,4}/g, x);
};
const a = function(e) {
  return k(_(e));
};
module.exports.decode = function(e) {
  return a(String(e).replace(/[-_]/g, function(e) {
    return '-' == e ? '+' : '/';
  }).replace(/[^A-Za-z0-9\+\/]/g, ''));
};

const h = function(e) {
  if (e.length < 2) {
    const t = e.charCodeAt(0);
    return t < 128 ? e : t < 2048 ? u(192 | t >>> 6) + u(128 | 63 & t) :
                                      u(224 | t >>> 12 & 15) +
                                      u(128 | t >>> 6 & 63) + u(128 | 63 & t);
    }
  const t = 65536 + 1024 * (e.charCodeAt(0) - 55296) +
            (e.charCodeAt(1) - 56320);
  return u(240 | t >>> 18 & 7) + u(128 | t >>> 12 & 63) +
         u(128 | t >>> 6 & 63) + u(128 | 63 & t);
};
const p = function(e) {
  const t = [0, 2, 1][e.length % 3];
  const n = e.charCodeAt(0) << 16 | (e.length > 1 ? e.charCodeAt(1) : 0) << 8 |
           (e.length > 2 ? e.charCodeAt(2) : 0);
  return [
    c.charAt(n >>> 18),
    c.charAt(n >>> 12 & 63),
    t >= 2 ? '=' : c.charAt(n >>> 6 & 63),
    t >= 1 ? '=' : c.charAt(63 & n),
  ].join('');
};
const g = function(e) {
  return e.replace(/[\s\S]{1,3}/g, p);
};
const d = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
const f = function(e) {
  return e.replace(d, h);
};
const m = function(e) {
  return g(f(e));
};
const v = function(e, t) {
  return t ? m(String(e)).replace(/[+\/]/g, function(e) {
    return '+' == e ? '-' : '_';
  }).replace(/=/g, '') : m(String(e));
};
module.exports.encodeURI = function(e) {
  return v(e, !0);
};
