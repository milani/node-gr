#!/usr/bin/env node

var url = require('url'),
   gist = require('./lib/gist');
    
var id = url.parse(process.argv[2]).path.replace(/\//,'');

gist.run(id,function(err){

  if(err) {
    console.log(err);
    process.exit();
  }

});
