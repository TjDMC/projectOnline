var express = require('express');
var app = express();
var http = require("http");
var serv = http.createServer(app);

app.get('/',function(req,res){
	//res.sendFile(__dirname+'/client/index.html');
	res.sendFile(__dirname+'/client/index.html');
});
app.use('/client',express.static(__dirname+'/client'));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

serv.listen(port,ip);
//serv.listen('2000');
console.log("Server Started");

var ioreq = require('socket.io');
var io = ioreq(serv,{});
var socketList = [];

var player = function(id){
	
	var self = {
		speed:5,
		angle:0,
		posX:0,
		posY:0,
		id:id,
		keys:[],
		input:{
			x:0,
			y:0,
			mouseX:0,
			mouseY:0
		}
	}
	
	self.updateInput = function(){
		if((self.keys[37]||self.keys[65]) && !(self.keys[39]||self.keys[68])){
			self.input.x = -1;
		}else if(!(self.keys[37]||self.keys[65]) && (self.keys[39]||self.keys[68])){
			self.input.x = 1;
		}else{
			self.input.x=0;
		}
			
		if( (self.keys[38]||self.keys[87]) && !(self.keys[40]||self.keys[83]) ){
			self.input.y = -1;
		}else if( !(self.keys[38]||self.keys[87]) && (self.keys[40]||self.keys[83]) ){
			self.input.y = 1;
		}else{
			self.input.y=0;
		}
	}
	
	self.updatePos = function(){
		self.posX += self.input.x*self.speed;
		self.posY += self.input.y*self.speed;
	}
	
	self.updateRotation = function () {
		self.angle = Math.atan2(self.input.mouseY - self.posY,self.input.mouseX - self.posX);
	}
	playerList[id] = self;
	return self;
	
}

playerList = {};

var entity = function(){
}

entityList = [];

var bullet = function(id){
	var self = {
		posX:0,
		posY:0,
		lifetime:5,
		speed:5,
		direction:0
	}
	
	setTimeout(function(){	
		delete self;
	},self.lifetime);
	
	self.updatePos = function(){
		self.posX += Math.cos(self.direction)*speed;
		self.posY += Math.sin(self.direction)*speed;
	}
	
	return self;
}

var data = function(id){
	
	var pack = [];
	for(var i in playerList){
		playerList[i].updatePos();
		pack.push({
			posX:playerList[i].posX,
			posY:playerList[i].posY,
			angle:playerList[i].angle,
			ownX:playerList[id].posX,
			ownY:playerList[id].posY
		});
	}
	return pack;

}

io.on('connection', function(socket){
	do{
		unique = true;
		socket.id = Math.floor(Math.random()*100000);
		for (var i in socketList){
			if(i == socket.id)
				unique = false;
		}
	}while(!unique);
	
	socketList[socket.id] = socket;
	var p = player(socket.id);
	
	console.log(socket.id);
	socket.on('disconnect', function() {
        console.log('Client '+socket.id+' disconnected.');
		delete socketList[socket.id];
		delete playerList[socket.id];
    });
	
	socket.on('input',function(inp){
		p.keys = inp.keys;
		p.input.mouseX = inp.mouseX;
		p.input.mouseY = inp.mouseY;
		p.updateInput();
		p.updateRotation();
		console.log(p.input.x+" "+p.input.y+" "+p.input.mouseX+" "+p.input.mouseY);
	})

});
setInterval(function(){
	for(var i in socketList){
		socket = socketList[i];
		socket.emit('update',data(i));
	}
},20);
