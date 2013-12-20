/*!
 * Connect - Multipart
 * Copyright(c) 2013 TJ Holowaychuk <tj@vision-media.ca>,
 *                   S Langer       <screeny05@gmail.com>
 *                   
 * MIT Licensed.
 */

/**
 * Module dependencies.
 */

var formidable = require('formidable');

/**
 * Setup form with the given `options`.
 *
 * Options:
 *
 *   - `encoding`        Encoding used for incoming forms. Defaults to utf8
 *   - `uploadDir`       Directory to save uploads. Defaults to "/tmp"
 *   - `keepExtensions`  Include original extensions. Defaults to `false`
 *
 * Examples:
 *
 *      var form = require('connect-form');
 *      var server = connect.createServer(
 *             form({ keepExtensions: true }),
 *             function(req, res, next){
 *              // Form was submitted
 *                 if (req.form) {
 *                  // Do something when parsing is finished
 *                  // and respond, or respond immediately
 *                  // and work with the files.
 *                     req.form.complete(function(err, fields, files){
 *                         res.writeHead(200, {});
 *                         if (err) res.write(JSON.stringify(err.message));
 *                         res.write(JSON.stringify(fields));
 *                         res.write(JSON.stringify(files));
 *                         res.end();
 *                     });
 *                 // Regular request, pass to next middleware
 *                 } else {
 *                     next();
 *                 }
 *             }
 *         );
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function(options){
  options = options || {};
  return function(req, res, next){
    if (formRequest(req)){
      var form = req.form = new formidable.IncomingForm();
      merge(form, options);
      form.complete = function(fn){
        var ended = false;
        var completed = false;

        var err, fields, files;

        form.on('end', function(){
          if(completed)  fn(err, fields, files);
          else  ended = true;
        });
        form.parse(req, function(_err, _fields, _files){
          completed = true;
          if(_err)  return fn(_err);
          if(!ended){
            err = _err;
            fields = _fields;
            files = _files;
            return
          } else {
            fn(_err, _fields, _files);
          }
        });
      };
    }
    next();
  };
};

/**
 * Check if `req` is a valid form request.
 *
 * @param {IncomingMessage} req
 * @return {Boolean}
 * @api private
 */

function formRequest(req) {
  var contentType = req.headers['content-type'];
  if (!contentType) return;

  return req.body === undefined || Object.keys(req.body).length === 0
    && (req.method === 'POST'
    || req.method === 'PUT')
    && (contentType.indexOf('multipart/form-data') >= 0
    ||  contentType.indexOf('urlencoded') >= 0);
}

/**
 * Merge object `b` with object `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

function merge(a, b) {
  var keys = Object.keys(b);
  for (var i = 0, len = keys.length; i < len; ++i) {
    a[keys[i]] = b[keys[i]];
  }
  return a;
}
