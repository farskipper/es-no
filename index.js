var through2 = require('through2');
var srcToTokens = require('./src-to-tokens');
var tokensToAST = require('./tokens-to-ast');
var astToTarget = require('./ast-to-target');

module.exports = function(src){

  var tokenize = srcToTokens();
  var astizize = tokensToAST();
  var targetize = astToTarget();

  var forwardError = function(err){
    targetize.emit('error', err);
  };
  tokenize.on('error', forwardError);
  astizize.on('error', forwardError);

  src
    .pipe(tokenize)
    .pipe(astizize)
    .pipe(targetize);

  return targetize;
};
