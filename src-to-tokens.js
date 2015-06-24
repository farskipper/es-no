var tokenizer2 = require('tokenizer2');
var escapeRegExp = require('escape-regexp');

var grouping_chars = '([{}])'.split('');

var separators = escapeRegExp(grouping_chars.join('')) +'\\s,;"';

var number_regex = (function(){
  var s = '';
  s += '[+-]?';//may start with a + or -
  s += '(' + [
    '([0-9][0-9,]*\\.?[0-9]*)',//starting with a number
    '(\\.[0-9]+)'//starting with a period
  ].join('|') + ')';
  s += '([eE][-+]?[0-9,]*)?';//optional exponent
  return new RegExp('^' + s + '$');
}());

module.exports = function(){
  var t = tokenizer2();

  t.addRule(/^[\s,]+$/, 'whitespace');
  t.addRule(/(^""$)|(^"([^"]|\\")*[^\\]"$)/, 'string');
  t.addRule(number_regex, 'number');
  t.addRule(/^;[^\n]*$/, 'comment');

  grouping_chars.forEach(function(c, i){
    t.addRule(new RegExp('^' + escapeRegExp(c) + '$'), i < grouping_chars.length / 2 ? 'open' : 'close');
  });

  t.addRule(new RegExp('^[^0-9' + separators + '][^' + separators + ']*$'), 'symbol');

  return t;
};
