var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var firstPlayer = true;
app.set('port', 5000);
app.use('/client', express.static(__dirname + '/client'));
app.use('/css', express.static(__dirname + '/css'));
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(5000, function() {
    console.log('Starting server on port 5000');
});


var field = { width: 1000, height: 500 };
var players = {};
var ball = {};

io.on('connection', function(socket) {
    socket.on('new player', function() {
        console.log("new player here: " + socket.id);
        players[socket.id] = {
            x: 300,
            y: 300
        };
        if (firstPlayer) {
            firstPlayer = false;
            ball.x = 300;
            ball.y = 300;
            ball.lastx = ball.x;
            ball.lasty = ball.y;
            ball.speed = 3;
            ball.dx = ball.speed;
            ball.dy = ball.speed;
            ball.radius = 10;
            setInterval(moveBall, 10);
        }
    });
    socket.on('movement', function(data) {
        var player = players[socket.id] || {};
        //console.log("player " + socket.id + " is moving");
        player.lastx = player.x;
        player.lasty = player.y;
        player.x = data.x;
        player.y = data.y;
        player.width = 10;
        player.height = 100;
    });
});

function moveBall() {
    collisionDetection();
    changeX();
    changeY();
    ball.lastx = ball.x;
    ball.lasty = ball.y;
    ball.x += ball.dx;
    ball.y += ball.dy;
    io.sockets.emit('ball', ball);
}

function collisionDetection() {
    for (var id in players) {
        var player = players[id];
        if (ball.x + ball.dx - ball.radius <= player.x + player.width && ball.x + ball.dx + ball.radius >= player.x &&
            ball.y + ball.dy <= player.y + player.height && ball.y + ball.dy + ball.radius >= player.y) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy - ball.radius <= player.y + player.height && ball.y + ball.dy + ball.radius >= player.y &&
            ball.x + ball.dx <= player.x + player.width && ball.x + ball.dx + ball.radius >= player.x) {
            ball.dy = -ball.dy;
        }
    }

}

function changeX() {
    if (ball.x + ball.dx > field.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
    }
}

function changeY() {
    if (ball.y + ball.dy > field.height - ball.radius || ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    }
}

setInterval(function() {
    io.sockets.emit('state', players);
}, 1000 / 60);

/////////////////////////////////////////////////////////////////////////////////////////////////\\\\\\\\\\\\\\\

// var express = require('express');
// var http = require('http');
// var path = require('path');
// var socketIO = require('socket.io');

// var app = express();
// var server = http.Server(app);
// var io = socketIO(server);

// app.set('port', 5000);
// app.use('/client', express.static(__dirname + '/client'));

// app.get('/', function(request, response) {
//     response.sendFile(path.join(__dirname, 'index.html'));
// });

// server.listen(5000, function() {
//     console.log('Starting server on port 5000');
// });

// var players = {};
// io.on('connection', function(socket) {
//     socket.on('new player', function() {
//         players[socket.id] = {
//             x: 300,
//             y: 300
//         };
//     });
//     socket.on('movement', function(data) {
//         var player = players[socket.id] || {};
//         if (data.left) {
//             player.x -= 5;
//         }
//         if (data.up) {
//             player.y -= 5;
//         }
//         if (data.right) {
//             player.x += 5;
//         }
//         if (data.down) {
//             player.y += 5;
//         }
//     });
// });

// setInterval(function() {
//     io.sockets.emit('state', players);
// }, 10);