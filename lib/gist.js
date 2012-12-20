var request = require('request'),
       exec = require('child_process').exec,
      fork  = require('child_process').fork,
         fs = require('fs'),
       path = require('path'),
       temp = require('temp');

// Request gist contents
exports.get = Get;
// Run the gist
exports.run = Run;

var reqOpt = {
   method : 'get'
};

if(process.env.https_proxy) {
  reqOpt.proxy = process.env.https_proxy;
}

function Get(id,cb) {
  reqOpt.url = 'https://api.github.com/gists/'+id
  request(reqOpt,function(err,res,body){
    if(err) {
      return cb(err);
    }

    _parseGist(body,cb);
  });
}

function Run(id,cb) {
  Get(id,function(err,files) {
    if(err) {
      return cb.call(null,err);
    }

    _run(id,files,cb);
  });
}

function _run(id,files,cb) {

  var filePath,
      main,
      root   = id,
      length = 0,
      count  = 0;

  for(file in files) length++;

  if(length == 0) {
    return cb.call(null,new Error('Empty Gist'));
  }

  if(length == 1) {
     for(file in files) {
       // TODO Check file mimetype
       // TODO Run in new process?
       var vm = require('vm');
       return vm.runInThisContext(files[file].content,file);
     }
  }

  // More than one file means
  // we should create a directory structure
  // and probably install dependencies
  // according to package.json
  temp.mkdir(root,function(err,dir) {

    for(file in files) {
      filePath = path.join(dir,file);

      (function(file,filePath){

        fs.writeFile(filePath, files[file].content, function(err) {

          if(err) {
            throw new Error(err);
          }

          if( file == 'package.json' ) {

            packageObj = JSON.parse(files[file].content);
            main = packageObj.main;
            console.log('Installing node modules...');
            exec('npm install',{cwd:dir},function(err,stdout,stderr){
              if(err) {
                throw new Error(err);
              }
              count++;

              if(count == length) {
                // Run process
                if(!main) main = 'index.js';
                console.log('Running ',main);
                var child = fork(path.join(dir,main),[],{cwd:dir});
              }

            });

          } else {
            count++;
          }

          if(count == length) {
            // Run process
            if(!main) main = 'index.js';
            console.log('Running ',main);
            var child = fork(path.join(dir,main),[],{cwd:dir});
          }
        });

      })(file,filePath);

    }
  });
}

function _parseGist(obj,cb){
  if(typeof obj == 'string') {
    obj = JSON.parse(obj);
  }

  var files = obj.files;
  var err = null;
  cb.call(null,err,files);
// TODO Does github always return content?
//  var output, url;
//  for(file in files) {
//    url = files[file].raw_url;    
//  }

}