var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var uuid = require('./node_modules/uuid');

const Room = require('./server/Room');

app.set('port', 5000);
app.use('/client', express.static(__dirname + '/client'));
app.use('/css', express.static(__dirname + '/css'));
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(5000, function() {
    console.log('Starting server on port 5000');
});

var rooms = {};
var playerToRoom = new Map();
var lastroomID;
var field = { width: 1000, height: 500 };

function findFreeRoom() {
    for (var id in rooms) {
        if (!rooms[id].fullFlag()) {
            lastroomID = rooms[id].roomid;
        }
    }
}

io.on('connection', function(socket) {
    socket.on('new player', function() {

        findFreeRoom();
        if (lastroomID == null) {
            var roomid = uuid.v4();
            rooms[roomid] = new Room(roomid, field.width, field.height);
            lastroomID = roomid;
            rooms[lastroomID].addPlayer(socket);
            playerToRoom.set(socket.id, lastroomID);
        } else {
            //starts score game when second player added
            rooms[lastroomID].addPlayer(socket);
            playerToRoom.set(socket.id, lastroomID);
            rooms[lastroomID].startScoreGame();
            console.log("Game started in room " + lastroomID);
            lastroomID = null;
        }

    });

    socket.on('disconnect', function() {
        if (playerToRoom.has(socket.id)) {
            console.log(socket.id + " disconnected");
            rooms[playerToRoom.get(socket.id)].removePlayer(socket);
            if (rooms[playerToRoom.get(socket.id)].emptyFlag()) {
                delete rooms[playerToRoom.get(socket.id)];
                console.log("Deleted empty room " + playerToRoom.get(socket.id));
            }
            playerToRoom.delete(socket.id);

        }
    });

    socket.on('movement', function(data) {
        if (playerToRoom.has(socket.id)) {
            rooms[playerToRoom.get(socket.id)].playerMoved(socket.id, data.x, data.y);
        }

    });

    socket.on('pause', function() {
        if (playerToRoom.has(socket.id)) {
            rooms[playerToRoom.get(socket.id)].changePause();
        }
    });


});