# es-no
An experimental compiler that parses **E**ssential **S**yntax and performs macro expansion until it outputs the target language. Also there is **NO** standard library.

## Essential Syntax

Just a simple lisp/scheme/clojure like syntax.

## How it works
There are three streams that you can pipe your source in then get target code on the other side.

### src-to-tokens
This stream takes in your source stream and spits token objects out the other end

### tokens-to-ast
This stream takes in tokens and converts it into an ast tree.

### ast-to-target
This stream takes in ast segments and attempts to call a macro function on the first argument of every list. The macro either returns target output or more ast code to be expanded. This continues until there is no more code to expand then it outputs the target.

The target can be raw strings, or it could be another languages AST such as the ESTree.

## What?!?! No Standard Library?

Yep, bring your own libraries. Not only can you bring your own functions and objects you can bring your own macros. Thus giving you the full power to express anything in your dialect of this language. Also you can redefine/remove any macro (just like you would a function) thus there are no "reserved" words.

## Disclaimer

Because this language is called "es-no" one may be inclined to think it has something to do with an ECMAScript language version. (i.e. es5 or es6) This may lead one to think that this language is making a statement about ECMAScript. Although that would be interesting, this language makes no statements toward, nor has any affiliation with, ECMAScript or TC39. "es-no" simply means **E**ssential **S**yntax and **NO** standard library.

## License
MIT
