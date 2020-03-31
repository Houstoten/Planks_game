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


function createRoomID() {
    var roomid = uuid.v4();
    roomid = roomid.slice(0, 8);
    try {
        //var iterator = playerToRoom.values();
        var roomids = [...playerToRoom.values()];
        roomids.forEach(function(value, i) {
            if (value == roomid) {
                createRoomID();
            }
            if (i == roomids.length - 1) {
                throw "All rooms are full";
            }
        });
    } catch (e) {
        socket.emit('error', e);
        roomid = null;
    } finally {
        return roomid;
    }
}

function findFreeRoom() {
    for (var id in rooms) {
        if (!rooms[id].fullFlag() && !rooms[id].privateFlag) {
            return rooms[id].roomid;
        }
    }
    return null;
}

function createNewRoomIfAllAreFull(socket) {
    try {
        var roomid = createRoomID();
        if (roomid == null) {
            return;
        }
        rooms[roomid] = new Room(roomid, field.width, field.height, false);
        lastroomID = roomid;
        rooms[lastroomID].addPlayer(socket);
        playerToRoom.set(socket.id, lastroomID);
    } catch (e) {
        socket.emit('error', e);
    }
}

function joinToExistingQuickMatchRoom(socket) {
    try {
        rooms[lastroomID].addPlayer(socket);
        playerToRoom.set(socket.id, lastroomID);
        // rooms[lastroomID].startScoreGame();
        //console.log("Game started in room " + lastroomID);
        lastroomID = null;
    } catch (e) {
        socket.emit('error', e);
    }
}

function disconnectFromRoom(socket) {
    if (playerToRoom.has(socket.id)) {
        console.log(socket.id + " disconnected");
        rooms[playerToRoom.get(socket.id)].removePlayer(socket);
        if (rooms[playerToRoom.get(socket.id)].emptyFlag()) {
            delete rooms[playerToRoom.get(socket.id)];
            console.log("Deleted empty room " + playerToRoom.get(socket.id));
        }
        playerToRoom.delete(socket.id);
    }
}

io.on('connection', function(socket) {

    socket.on('new player', function() {

        lastroomID = findFreeRoom();
        if (lastroomID == null) {
            createNewRoomIfAllAreFull(socket);
        } else {
            //starts score game when second player added
            joinToExistingQuickMatchRoom(socket);
        }
    });

    socket.on('create_private', function() {
        disconnectFromRoom(socket);
        var roomid = createRoomID();
        if (roomid == null) {
            return;
        }
        rooms[roomid] = new Room(roomid, field.width, field.height, true);
        rooms[roomid].addPlayer(socket);
        playerToRoom.set(socket.id, roomid);
    });

    socket.on('join_private', function(id) {
        disconnectFromRoom(socket);
        rooms[id].addPlayer(socket);
        playerToRoom.set(socket.id, id);
        //rooms[id].startScoreGame();
        //console.log("Game started in private room " + id);
    });

    socket.on('disconnect', function() {
        disconnectFromRoom(socket);
    });

    socket.on('movement', function(data) {
        if (playerToRoom.has(socket.id)) {
            rooms[playerToRoom.get(socket.id)].playerMoved(socket.id, data.x, data.y);
        }

    });

    socket.on('pause', function() {
        if (playerToRoom.has(socket.id)) {
            rooms[playerToRoom.get(socket.id)].requestPause(socket.id);
        }
    });

    socket.on('start_score', function() {
        if (playerToRoom.has(socket.id)) {
            //  console.log("In sockets score" + socket.id);
            rooms[playerToRoom.get(socket.id)].requestScoreGame(socket.id);
        }
    });


});