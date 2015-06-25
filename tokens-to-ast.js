var xtend = require('xtend');
var through2 = require('through2');

var tokenToLoc = function(token){
  var lines = token.src.split('\n');
  return {
    start: {
      line: token.line,
      column: token.col - 1
    },
    end: {
      line: token.line + lines.length - 1,
      column: (lines.length > 1 ? 1 : token.col) + lines[lines.length - 1].length - 2
    }
  };
};

module.exports = function(){

  var stack = [];

  var onToken = function(token){
    if(token.type === 'whitespace'){
      return;
    }else if(token.type === 'comment'){
      return;
    }else if(token.type === 'string'){
      token.value = token.src.substring(1, token.src.length - 1).replace(/\\"/g, '"');
    }else if(token.type === 'number'){
      //just de-sugar the number. Converting it to a float, or big-num language dialect
      token.value = token.src.replace(/[+,]/g, '').toLowerCase();
    }else if(token.type === 'open'){
      return stack.push(xtend({}, token, {
        type: 'list',
        value: []
      }));
    }else if(token.type === 'close'){
      token = stack.pop();
    }else if(token.type === 'symbol'){
      if(!token.hasOwnProperty('value')){
        token.value = token.src;
      }
    }else{
      throw new Error('unexpected token type: ' + token.type);
    }
    if(stack.length > 0){
      stack[stack.length - 1].value.push(token);
    }else{
      ast_stream.push(token);
    }
  };

  var ast_stream = through2.obj(function(token_orig, enc, done){
    var token = xtend({}, token_orig);

    token.loc = tokenToLoc(token);
    delete token.line;
    delete token.col;

    onToken(token);

    if(token.src === '{'){
      onToken(xtend({}, token, {
        type: 'symbol',
        value: '$$es-no$$map'
      }));
    }else if(token.src === '['){
      onToken(xtend({}, token, {
        type: 'symbol',
        value: '$$es-no$$array'
      }));
    }
    done();
  }, function(done){
    if(stack.length > 0){
      return done(new Error('Looks like you are missing ), ] or }'));
    }
    done();
  });

  return ast_stream;
};