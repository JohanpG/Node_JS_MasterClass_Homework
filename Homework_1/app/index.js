/*
* Primary file for my api
*Author: Johan Porras
*/

//Dependencies
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config= require('./config');
var fs = require('fs');
// Instanciate the HTTP srver
var httpServer =http.createServer(function(req,res){
unifiedServer(req,res);
});
//Start the server, and have it listed on port 3000
httpServer.listen(config.httpPort,function(){
  console.log("The http server is listening on port: "+config.httpPort+" in " + config.envName+" now. ");
});

//All server logic for both the http and https server
var unifiedServer= function(req,res){
  //get the url and parse it
  var parsedUrl= url.parse(req.url,true); //True to parse the query string, set the parse url query (string module).
  //Get the path from the url
  var path= parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g,'');
  //get eh query string as an object
  var queryStringObject= parsedUrl.query;
  //Get http method
  var method= req.method.toUpperCase();
  //Get headers as an object
  var headers= req.headers;
  //Get payloads
  var decoder= new StringDecoder('utf-8');
  var buffer='';
  //Event when payload is received in the req
  req.on('data', function(data){
    buffer+=decoder.write(data);
  });
  //Event when the payload ends always is triggeres event if not pyaload.
  req.on('end',function(){
    buffer+=decoder.end();
    //Choose the handler this request should go to if one is not foung ise the not found handlers
    var chosenHandler = typeof(router[trimmedPath])!=='undefined'? router[trimmedPath]:router.notFound;
    //Construct data object to sent to the handler
    var data={
      'trimmedPath': trimmedPath,
      'queryStringObject':queryStringObject,
      'method' : method,
      'headers':headers,
      'payload':buffer
    };
    //Route the request to the handler specified in the router
    chosenHandler(data,function(statusCode,payload){
      //Use the status code defined by the handler or pass 200 as defaults
      statusCode=typeof(statusCode)=='number'? statusCode:200;
      //use the payload called back by the handler or a defaults object
      payload=typeof(payload)=='object'? payload:{};
      //Convert payload to string
       var payloadString = JSON.stringify(payload);
       res.setHeader('Content-Type','application/json');
       //Return the response code
       res.writeHead(statusCode);
       //send the response back as string
       res.end(payloadString);
       //Log the payload reply
       console.log("Returned Payload: ",statusCode, payloadString);
    });
    //log the request
    console.log("Request received on path: " + trimmedPath + " With this method: " + method+ " With this query string parameters: ", queryStringObject);
    console.log("Request received with this payloads", buffer);
  });

};
//define the handlers
var handlers= {};
//ping handler
handlers.hello = function(data,callback){
  //Callback http status decode, and a payloadObject
  var rawdata = fs.readFileSync('./json_messages/planet.json');
  var responsePayload = JSON.parse(rawdata);
  callback(200,responsePayload);
};

handlers.notFound = function(data,callback){
  //Callback http status decode, and a payloadObject
  callback(404,{'name': 'handler not found'});
};
//Define Request routes
var router={
  'hello':handlers.hello,
  'notFound':handlers.notFound
};
