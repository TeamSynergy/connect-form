
/**
 * Module dependencies.
 */

var connect = require('connect'),
    multipart = require('./../index');

// Test server

var server = connect.createServer(
    multipart(),
    function(req, res, next){
        if (req.form) {
            req.form.onComplete = function(err, fields, files){
                res.writeHead(200, {});
                if (err) res.write(JSON.stringify(err.message));
                res.write(JSON.stringify(fields));
                res.write(JSON.stringify(files));
                res.end();
            };
        } else {
            next();
        }
    }
);

// Tests

exports['test single multipart field'] = function(assert){
    var headers = {
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryMfJEpQcCbybb6A8U'
    };

    var body = [
        '------WebKitFormBoundaryMfJEpQcCbybb6A8U',
        'Content-Disposition: form-data; name="name"',
        '',
        'foo',
        '------WebKitFormBoundaryMfJEpQcCbybb6A8U--\r\n'
    ].join('\r\n');

    assert.response(server,
        { url: '/' },
        { body: 'Cannot find /' });
    
    assert.response(server,
        { url: '/', method: 'POST', headers: headers, data: body },
        { body: '{"name":"foo"}{}' });
};

exports['test several multipart fields'] = function(assert){
    var headers = {
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryMfJEpQcCbybb6A8U'
    };

    var body = [
        '------WebKitFormBoundaryMfJEpQcCbybb6A8U',
        'Content-Disposition: form-data; name="name"',
        '',
        'foo',
        '------WebKitFormBoundaryMfJEpQcCbybb6A8U',
        'Content-Disposition: form-data: name="comments"',
        '',
        'foo bar baz',
        '------WebKitFormBoundaryMfJEpQcCbybb6A8U--\r\n'
    ].join('\r\n');

    assert.response(server,
        { url: '/', method: 'POST', headers: headers, data: body },
        { body: '{"name":"foo","comments":"foo bar baz"}{}' });
};

exports['test malformed multipart'] = function(assert){
    var headers = {
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryMfJEpQcCbybb6A8U'
    };

    var body = [
        '--WebKitFormBoundaryMfJEpQcCbybb6A8U',
        'Content-Disposition: form-data; name="name"',
        '',
        'foo',
        '------WebKitFormBoundaryMfJEpQcCbybb6A8U--\r\n'
    ].join('\r\n');

    assert.response(server,
        { url: '/', method: 'POST', headers: headers, data: body },
        { body: '"parser error, 2 of 134 bytes parsed"{}{}' });
};

exports['test multipart files'] = function(assert){
    var headers = {
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryMfJEpQcCbybb6A8U'
    };

    var body = [
        '------WebKitFormBoundaryMfJEpQcCbybb6A8U',
        'Content-Disposition: form-data; name="name"',
        '',
        'foo',
        '------WebKitFormBoundaryMfJEpQcCbybb6A8U',
        'Content-Disposition: form-data: name="text"; filename="foo.txt"',
        '',
        'foo\nbar\nbaz\n',
        '------WebKitFormBoundaryMfJEpQcCbybb6A8U--\r\n'
    ].join('\r\n');

    assert.response(server,
        { url: '/', method: 'POST', headers: headers, data: body },
        function(res){
            assert.ok(res.body.indexOf('{"name":"foo"}') >= 0, 'Test field');
            assert.ok(res.body.indexOf('{"path":"/tmp') >= 0, 'Test file path');
        });
};