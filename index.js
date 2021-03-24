/*
* Server main file
*/
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

var httpServer = http.createServer(function (req, res) {

    unifiedServer(req, res);
});



httpServer.listen(config.httpPort, function () {
    console.log("The server is listening on portc " + config.httpPort + "now")
    console.log("config:" + config.httpPort + ',' + config.envName)
});
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem'),
};
var httpsServer = http.createServer(httpsServerOptions, function (req, res) {

    unifiedServer(req, res);
});


httpsServer.listen(config.httpsPort, function () {
    console.log("The server is listening on port " + config.httpsPort + "now")
    console.log("config:" + config.httpsPort + ',' + config.envName)
});

var handlers = {};
handlers.ping = function (data, callback) {
    callback(200, {'alive': 'server is alive'});
};
handlers.foo = function (data, callback) {
    callback(200, data);
};
handlers.notFound = function (data, callback) {
    callback(404);
};

var router = {
    'foo': handlers.foo
};


var unifiedServer = function (req, res) {
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+s/g, '');

    var queryStringObject = parsedUrl.query;
    var method = req.method.toLowerCase();
    var headers = req.headers;
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });

    req.on('end', function () {
        buffer += decoder.end();
        console.log('trimmedPath:'+ trimmedPath);
        var choosenHandler = typeof (router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;
        
        console.log('choosenHandler:'+ choosenHandler);
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        }

        choosenHandler(data, function (statusCode, payload) {
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            payload = typeof (payload) == 'object' ? payload : {};
            var payloadString = JSON.stringify(payload);
            res.setHeader('Content-type', 'application/json')
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log("Returning ",  statusCode, payloadString);
        });


        
      
    });



};