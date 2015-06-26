var test = require('tape');
var xtend = require('xtend');
var srcToTokens = require('./src-to-tokens');
var tokensToAST = require('./tokens-to-ast');
var astToTarget = require('./ast-to-target');
var simStreamWrites = require('./simulate-stream-writes');

var setup = function(src, callback){
  var target_parts = [];

  var s = srcToTokens();
  var a = tokensToAST();
  var e = astToTarget();
  var defMacro = function(name, fn){
    e.macros[name] = {type: 'ast-macro', fn: fn};
  };
  var defTargetMacro = function(name, fn){
    e.macros[name] = {type: 'target-macro', fn: fn};
  };

  defTargetMacro('$$es-no$$top-level-expression', function(ast, astToTarget){
    return astToTarget(ast);
  });
  defTargetMacro('$$es-no$$fn-call', function(ast, astToTarget){
    var args = [];
    var i;
    for(i=2; i<ast.value.length; i++){
      args.push(astToTarget(ast.value[i]));
    }
    return {fn_name: ast.value[1].value, args: args};
  });
  defTargetMacro('$$es-no$$make-type-string', function(ast, astToTarget){
    return {string: ast.value};
  });
  defTargetMacro('$$es-no$$make-type-number', function(ast, astToTarget){
    return {number: parseFloat(ast.value)};
  });
  defTargetMacro('list', function(ast, astToTarget){
    var vals = [];
    var i;
    for(i=1; i<ast.value.length; i++){
      vals.push(astToTarget(ast.value[i]));
    }
    return {list: vals};
  });
  defMacro('surround', function(ast){
    return xtend({}, ast, {
      type: 'list',
      value: [
        xtend({}, ast, {type: 'symbol', value: 'list'}),
        xtend({}, ast, {type: 'number', value: '1'}),
        ast.value[1],
        xtend({}, ast, {type: 'number', value: '3'})
      ]
    });
  });
  defMacro('surround-these', function(ast){
    return xtend({}, ast, {
      type: 'list',
      value: [
        xtend({}, ast, {type: 'symbol', value: 'list'}),
        xtend({}, ast, {
          type: 'list',
          value: [
            xtend({}, ast, {type: 'symbol', value: 'surround'}),
            ast.value[1]
          ]
        }),
        xtend({}, ast, {
          type: 'list',
          value: [
            xtend({}, ast, {type: 'symbol', value: 'surround'}),
            ast.value[2]
          ]
        })
      ]
    });
  });

  s.pipe(a).pipe(e);

  e.on('data', function(ast){
    target_parts.push(ast);
  });
  e.on('end', function(){
    callback(undefined, target_parts);
  });

  simStreamWrites(s, [src]);
};

test('make a sting', function(t){
  setup('"hello world"', function(err, parts){
    t.deepEquals(parts, [
      {string: 'hello world'}
    ]);
    t.end(err);
  });
});

test('a list of numbers', function(t){
  setup('(list 1 2)', function(err, parts){
    t.deepEquals(parts, [
      {list: [
        {number: 1},
        {number: 2}
      ]}
    ]);
    t.end(err);
  });
});

test('expand a macro', function(t){
  setup('(surround 2)', function(err, parts){
    t.deepEquals(parts, [
      {list: [
        {number: 1},
        {number: 2},
        {number: 3}
      ]}
    ]);
    t.end(err);
  });
});

test('double expand a macro', function(t){
  setup('(surround-these "one" "two")', function(err, parts){
    t.deepEquals(parts, [
      {list: [
        {list: [
          {number: 1},
          {string: 'one'},
          {number: 3}
        ]},
        {list: [
          {number: 1},
          {string: 'two'},
          {number: 3}
        ]}
      ]}
    ]);
    t.end(err);
  });
});

test('function call', function(t){
  setup('(+ 1 2)', function(err, parts){
    t.deepEquals(parts, [
      {
        fn_name: '+',
        args: [
          {number: 1},
          {number: 2}
        ]
      }
    ]);
    t.end(err);
  });
});
