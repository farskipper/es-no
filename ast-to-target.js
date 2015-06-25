var xtend = require('xtend');
var through2 = require('through2');

module.exports = function(options){

  var macros = options.macros || {};
  var target_macros = options.target_macros || {};

  var callTargetMacro = function(name, ast){
    if(!target_macros[name]){
      throw new Error('no target macro defined for: ' + name);
    }
    return target_macros[name](ast, astToTarget);
  };

  var astToTarget = function(ast){
    if(ast.type !== 'list'){
      return callTargetMacro('$$es-no$$make-type-' + ast.type, ast);
    }
    var list_op = ast.value[0];
    if(!list_op || list_op.type !== 'symbol'){
      throw new Error('First arg in a AST list should always be a symbol, but was: ' + (list_op && list_op.type));
    }
    if(macros[ast.value[0].value]){
      //macro expansion
      return astToTarget(macros[ast.value[0].value](ast));
    }
    if(!target_macros[list_op.value]){
      list_op = xtend({}, ast, {
        type: 'symbol',
        value: '$$es-no$$fn-call'
      });
      ast.value.unshift(list_op);
    }
    return callTargetMacro(list_op.value, ast);
  };

  return through2.obj(function(ast, enc, done){
    try{
      this.push(callTargetMacro('$$es-no$$top-level-expression', ast));
      done();
    }catch(e){
      done(e);
    }
  });
};
