var express = require('express');
var app = express();
var http = require("http");
var serv = http.createServer(app);

app.get('/',function(req,res){
	res.sendFile('index.html');
});

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

serv.listen(port,ip);
console.log("Server Started");

