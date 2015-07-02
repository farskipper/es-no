var tokenizer2 = require('tokenizer2');
var escapeRegExp = require('escape-regexp');

var special_chars = [
  ["(", "open"],
  ["[", "open"],
  ["{", "open"],

  [")", "close"],
  ["]", "close"],
  ["}", "close"],

  ["#", "dispatch"],
  ["'", "dispatch-quote"],
  ["`", "dispatch-super-quote"],
  ["@", "dispatch-deref"],
  ["~", "dispatch-unquote"],
  ["^", "dispatch-meta"]
];

var separators = '\\s' + escapeRegExp(',;"' + special_chars.map(function(d){
  return d[0];
}).join(''));

var number_regex = (function(){
  var s = '';
  s += '[+-]?';//may start with a + or -
  s += '(' + [
    '([0-9][0-9,]*\\.?[0-9]*)',//starting with a number
    '(\\.[0-9]+)'//starting with a period
  ].join('|') + ')';
  s += '([eE][-+]?[0-9]*)?';//optional exponent (using * b/c the tokenizer needs to match as it goes along)
  return new RegExp('^' + s + '$');
}());

module.exports = function(){
  var t = tokenizer2();

  t.addRule(/^[\s,]+$/, 'whitespace');
  t.addRule(/^;[^\n]*$/, 'comment');
  t.addRule(/(^""$)|(^"([^"]|\\")*[^\\]"$)/, 'string');
  t.addRule(number_regex, 'number');

  special_chars.forEach(function(p){
    t.addRule(new RegExp('^' + escapeRegExp(p[0]) + '$'), p[1]);
  });

  t.addRule(new RegExp('^[^0-9' + separators + '][^' + separators + ']*$'), 'symbol');

  return t;
};
