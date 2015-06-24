module.exports = function(stream, writes){
  var nextWrite = function(){
    var write = writes.shift();
    if(!write){
      process.nextTick(function(){
        stream.end();
      });
      return;
    }
    process.nextTick(function(){
      stream.write(write);
      nextWrite();
    });
  };
  nextWrite();
};
