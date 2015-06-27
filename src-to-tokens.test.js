var test = require('tape');
var srcToTokens = require('./src-to-tokens');
var simStreamWrites = require('./simulate-stream-writes');

var setup = function(writes, callback){
  var tokens = [];

  var s = srcToTokens();
  s.on('data', function(token){
    tokens.push([token.type, token.src, token.line, token.col]);
  });
  s.on('end', function(){
    callback(undefined, tokens);
  });

  simStreamWrites(s, writes);
};

var demo_src = '';
demo_src += 'hello world;a comment\n';
demo_src += '(map {"a" 1,\n';
demo_src += '      "b" 2}(fn[[k,v]] (+ 1 v)))\n';
demo_src += '-1,000.25e-10\n';
demo_src += '+1,000.25e+10';

var expected_tokens = [
  ['symbol', 'hello', 1, 1],
  ['whitespace', ' ', 1, 6],
  ['symbol', 'world', 1, 7],
  ['comment', ';a comment', 1, 12],
  ['whitespace', '\n', 1, 22],
  ['open', '(', 2, 1],
  ['symbol', 'map', 2, 2],
  ['whitespace', ' ', 2, 5],
  ['open', '{', 2, 6],
  ['string', '"a"', 2, 7],
  ['whitespace', ' ', 2, 10],
  ['number', '1,', 2, 11],
  ['whitespace', '\n      ', 2, 13],
  ['string', '"b"', 3, 7],
  ['whitespace', ' ', 3, 10],
  ['number', '2', 3, 11],
  ['close', '}', 3, 12],
  ['open', '(', 3, 13],
  ['symbol', 'fn', 3, 14],
  ['open', '[', 3, 16],
  ['open', '[', 3, 17],
  ['symbol', 'k', 3, 18],
  ['whitespace', ',', 3, 19],
  ['symbol', 'v', 3, 20],
  ['close', ']', 3, 21],
  ['close', ']', 3, 22],
  ['whitespace', ' ', 3, 23],
  ['open', '(', 3, 24],
  ['symbol', '+', 3, 25],
  ['whitespace', ' ', 3, 26],
  ['number', '1', 3, 27],
  ['whitespace', ' ', 3, 28],
  ['symbol', 'v', 3, 29],
  ['close', ')', 3, 30],
  ['close', ')', 3, 31],
  ['close', ')', 3, 32],
  ['whitespace', '\n', 3, 33],
  ['number', '-1,000.25e-10', 4, 1],
  ['whitespace', '\n', 4, 14],
  ['number', '+1,000.25e+10', 5, 1]
];

test('all one chunck', function(t){
  setup([
    demo_src
  ], function(err, tokens){
    t.deepEquals(tokens, expected_tokens);
    t.end(err);
  });
});

test('on lines', function(t){
  var lines = demo_src.split("\n").map(function(line){
    return line + "\n";
  });
  lines[lines.length - 1] = lines[lines.length - 1].trim();
  setup(lines, function(err, tokens){
    t.deepEquals(tokens, expected_tokens);
    t.end(err);
  });
});

test('on individual chars', function(t){
  setup(demo_src.split(''), function(err, tokens){
    t.deepEquals(tokens, expected_tokens);
    t.end(err);
  });
});

test('dispatch', function(t){
  setup([
    '#one#two(#3',
  ], function(err, tokens){
    t.deepEquals(tokens, [
      ['dispatch', '#', 1, 1],
      ['symbol', 'one', 1, 2],
      ['dispatch', '#', 1, 5],
      ['symbol', 'two', 1, 6],
      ['open', '(', 1, 9],
      ['dispatch', '#', 1, 10],
      ['number', '3', 1, 11]
    ]);
    t.end(err);
  });
});
