var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var ip;



app.use(express.static('public'));

var url = 'mongodb://localhost:27017/node_chat';


MongoClient.connect(url, function(err, db){
    var messagesCollection = db.collection('messages'),
        connectedSockets = [];

    io.on('connection', function(socket) {
        console.log('Client connected');



        if(connectedSockets.indexOf(socket) === -1){
            connectedSockets.push(socket);
        };

        /* messagesCollection.find().toArray().then(function(docs){
            socket.emit('chatHistory', docs);
        }) */


        socket.on('message', function(message){
            console.log('message: ' + message);

            messagesCollection.insertOne({user: message.user, text: message.body, time: message.time}, function(err, res){
                console.log('Inserted into messagecollection');
            });

            io.emit('message', message);
        });


        socket.on('username', function(username){
            socket.chatUsername = username;
            io.emit('username', {
                username: username,
                id: socket.id
            });

            messagesCollection.find().toArray().then(function(docs){
                socket.emit('chatHistory', docs);
            })

            var connectedUsersList2 = connectedSockets.map(function(item){
                return {
                    id: item.id,
                    username: item.chatUsername
                }
            });

            socket.broadcast.emit('newConnectedUser', connectedUsersList2);
            
        });

        socket.on ('online', function(data){
            socket.broadcast.emit('isOnline', data);
            console.log(data.user + " " + data.state);
        });

        socket.on('askForConnectedClients', function(nothing, cb){
            var connectedUsersList = connectedSockets.map(function(item){
                return {
                    id: item.id,
                    username: item.chatUsername
                }
            });

            cb(connectedUsersList);
        });


        socket.on('disconnect', function(){
            console.log('Client disconnected');
            var index = connectedSockets.indexOf(socket);
            connectedSockets.splice(index, 1);
            console.log('Currently ' + connectedSockets.length + ' connected');

            var connectedUsersList2 = connectedSockets.map(function(item){
                return {
                    id: item.id,
                    username: item.chatUsername
                }
            });

            socket.broadcast.emit('newDisconnectedUser', connectedUsersList2);
            io.emit('isOnline', "false");
        });

        socket.on('clearChat', function() {
            console.log("received");
            var aDate = new Date (),
                year = aDate.getFullYear(),
                month = aDate.getMonth(),
                day = aDate.getDate(), 
                hour = aDate.getHours(),
                min = aDate.getMinutes(),
                sec = aDate.getSeconds(),
                dateString = "log" + year  +  month + day + hour + min + sec;
            var copyTo = "function() { db['messages'].copyTo('" + dateString + "') };"

            db.eval(copyTo, [], function(err, result) {
            console.log(err);
            });
            
            var drop = "function() { db['messages'].drop() };"

            db.eval(drop, [], function(err, result) {
            console.log(err);
            });
            console.log("copied");
        });

        socket.on('deviceDetails', function(deviceId) {
            var deviceId = deviceId;
            app.use(function (req, res, next) {
                console.log(req.ip);
                console.log(deviceId.deviceV);
                var ip = req.ip || req.connection.remoteAddress;
                fs.appendFile('public/onlinelog.html', '<div>' + ip + '<br>' + deviceId.deviceV + ' ' + deviceId.osV + ' ' + device.browserV + '</div>', function(err){
                    if (err) throw err;
                });
            });
        });

    });
});


http.listen(3000, function() {
    console.log('Server is running...');
});