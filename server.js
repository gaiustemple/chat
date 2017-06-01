var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;

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

            /* socket.emit('message', message);
            socket.broadcast.emit('message', message); */
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
            console.log(data);
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
            db.collection("old3",function(err,target) {

                var batch = target.initializeOrderedBulkOp();
                counter = 0;

                var cursor = db.collection("messages").find();
                var current = null;       

                async.whilst(
                    function() {
                        cursor.nextObject(function(err,doc) {
                            if (err) throw err;

                            // .nextObject() returns null when the cursor is depleted
                            if ( doc != null ) {
                                current = doc;
                                return true;
                            } else {
                                return false;
                            }
                        })
                    },
                    function(callback) {
                        batch.insert(current);
                        counter++;

                        if ( counter % 1000 == 0 ) {
                            batch.execute(function(err,result) {    
                                if (err) throw err;
                                var batch = target.initializeOrderedBulkOp();
                                callback();
                            });
                        }
                    },
                    function(err) {
                        if (err) throw err;
                        if ( counter % 1000 != 0 ) 
                            batch.execute(function(err,result) {
                                if (err) throw err;

                                // job done
                            });
                    }
                );    


            });
            console.log("copied");
        })

    });
});


http.listen(3000, function() {
    console.log('Server is running...');
});