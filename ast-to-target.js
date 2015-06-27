var xtend = require('xtend');
var through2 = require('through2');

module.exports = function(){

  var target_macros = {};

  var callMacro = function(name, ast){
    if(!target_macros[name]){
      throw new Error('No target macro defined for: ' + name);
    }
    return target_macros[name](ast, astToTarget);
  };

  var astToTarget = function(ast){
    if(ast.type !== 'list'){
      return callMacro('$$es-no$$make-type-' + ast.type, ast);
    }
    var list_op = ast.value[0];
    if(!list_op || list_op.type !== 'symbol'){
      throw new Error('First arg in an AST list should always be a symbol, but was: ' + (list_op && list_op.type));
    }
    var macro = target_macros[list_op.value];
    if(!macro){
      list_op = xtend({}, ast, {
        type: 'symbol',
        value: '$$es-no$$fn-call'
      });
      ast.value.unshift(list_op);
    }
    return callMacro(list_op.value, ast);
  };

  var s = through2.obj(function(ast, enc, done){
    try{
      this.push(callMacro('$$es-no$$top-level-expression', ast));
      done();
    }catch(e){
      done(e);
    }
  });
  s.target_macros = target_macros;
  return s;
};
