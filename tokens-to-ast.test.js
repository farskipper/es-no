var test = require('tape');
var srcToTokens = require('./src-to-tokens');
var tokensToAST = require('./tokens-to-ast');
var simStreamWrites = require('./simulate-stream-writes');

var setup = function(src, callback){
  var ast_parts = [];

  var s = srcToTokens();
  var a = tokensToAST();
  s.pipe(a);

  a.on('data', function(ast){
    ast_parts.push(ast);
  });
  a.on('end', function(){
    callback(undefined, ast_parts);
  });

  simStreamWrites(s, [src]);
};

test('ast nodes should use ESTree style Position', function(t){
  setup('one two\n  three', function(err, parts){
    t.deepEquals(parts, [
      {
        "type": "symbol",
        "src": "one",
        "value": "one",
        "loc": {
          "start": {"line": 1, "column": 0},
          "end": {"line": 1, "column": 2}
        }
      },
      {
        "type": "symbol",
        "src": "two",
        "value": "two",
        "loc": {
          "start": {"line": 1, "column": 4},
          "end": {"line": 1, "column": 6}
        }
      },
      {
        "type": "symbol",
        "src": "three",
        "value": "three",
        "loc": {
          "start": {"line": 2, "column": 2},
          "end": {"line": 2, "column": 6}
        }
      }
    ]);
    t.end(err);
  });
});

test('ast list', function(t){
  setup('(one)', function(err, parts){
    t.deepEquals(parts, [{
      "type": "list",
      "src": "(",
      "value": [
        {
          "type": "symbol",
          "src": "one",
          "value": "one",
          "loc": {
            "start": {"line": 1, "column": 1},
            "end": {"line": 1, "column": 3}
          }
        }
      ],
      "loc": {
        "start": {"line": 1, "column": 0},
        "end": {"line": 1, "column": 0}
      }
    }]);
    t.end(err);
  });
});

test('string', function(t){
  setup('"some multi-\nlined \\"string\\""', function(err, parts){
    t.deepEquals(parts, [{
      "type": "string",
      "src": '"some multi-\nlined \\"string\\""',
      "value": 'some multi-\nlined "string"',
      "loc": {
        "start": {"line": 1, "column": 0},
        "end": {"line": 2, "column": 16}
      }
    }]);
    t.end(err);
  });
});

test('number', function(t){
  setup('-10,123.001E+10', function(err, parts){
    t.deepEquals(parts, [{
      "type": "number",
      "src": '-10,123.001E+10',
      "value": '-10123.001e10',
      "loc": {
        "start": {"line": 1, "column": 0},
        "end": {"line": 1, "column": 14}
      }
    }]);
    t.end(err);
  });
});

test('array', function(t){
  setup('[one two]', function(err, parts){
    t.deepEquals(parts, [{
      "type": "list",
      "src": "[",
      "value": [
        {
          "type": "symbol",
          "src": "[",
          "value": "$$es-no$$array",
          "loc": {
            "start": {"line": 1, "column": 0},
            "end": {"line": 1, "column": 0}
          }
        },
        {
          "type": "symbol",
          "src": "one",
          "value": "one",
          "loc": {
            "start": {"line": 1, "column": 1},
            "end": {"line": 1, "column": 3}
          }
        },
        {
          "type": "symbol",
          "src": "two",
          "value": "two",
          "loc": {
            "start": {"line": 1, "column": 5},
            "end": {"line": 1, "column": 7}
          }
        }
      ],
      "loc": {
        "start": {"line": 1, "column": 0},
        "end": {"line": 1, "column": 0}
      }
    }]);
    t.end(err);
  });
});

var rmLoc = function(ast){
  delete ast.loc;
  if(ast.type === 'list'){
    ast.value = ast.value.map(rmLoc);
  }
  return ast;
};

test('map', function(t){
  setup('{"one" 1}', function(err, parts){
    t.deepEquals(parts.map(rmLoc), [{
      "type": "list",
      "src": "{",
      "value": [
        {
          "type": "symbol",
          "src": "{",
          "value": "$$es-no$$map"
        },
        {
          "type": "string",
          "src": '"one"',
          "value": "one"
        },
        {
          "type": "number",
          "src": "1",
          "value": "1"
        }
      ]
    }]);
    t.end(err);
  });
});

test('dispatch symbol', function(t){
  setup('#one two three', function(err, parts){
    t.deepEquals(parts.map(rmLoc), [
      {
        type: "list",
        src: "#",
        list_max_size: 3,
        value: [
          {
            type: "symbol",
            src: "#",
            value: "$$es-no$$dispatch"
          },
          {
            type: "symbol",
            src: "one",
            value: "one"
          },
          {
            type: "symbol",
            src: "two",
            value: "two"
          }
        ]
      },
      {
        type: "symbol",
        src: "three",
        value: "three"
      }
    ]);
    t.end(err);
  });
});

var essenceOfAST = function(ast){
  if(ast.type === "list"){
    return ast.value.map(essenceOfAST);
  }
  return ast.value.replace('$$es-no$$', '$');
};

test('dispatch types', function(t){
  setup([
    '#one two three four',
    '# one two three four',
    '#one #two #three four',
    '#1',
    '#{"one" 1} two',
    '#"one" two',
    '#(one two three) four',
    '#(#(one))'
  ].join("\n"), function(err, parts){
    t.deepEquals(parts.map(essenceOfAST), [
      ["$dispatch", "one", "two"], "three", "four",
      ["$dispatch", "one", "two"], "three", "four",
      ["$dispatch", "one", ["$dispatch", "two", ["$dispatch", "three", "four"]]],
      ["$dispatch", "1"],
      ["$dispatch", ["$map", "one", "1"]], "two",
      ["$dispatch", "one"], "two",
      ["$dispatch", ["one", "two", "three"]], "four",
      ["$dispatch", [["$dispatch", ["one"]]]]
    ]);
    t.end(err);
  });
});
