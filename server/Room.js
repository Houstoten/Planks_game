const Ball = require('./Ball');
const Player = require('./Player');
const Field = require('./Field');

class Room {
    constructor(roomid, width, height) {
        this.roomid = roomid;
        this.players = {};
        this.field = new Field(width, height);
        this.leftPlayerFlag = false;
        this.rightPlayerFlag = false;
    }

    updateObject() {
        var clients = {};
        for (var id in this.players) {
            clients[id] = this.players[id].objectToSend();
        }
        return clients;
    }

    fullFlag() {
        if (this.rightPlayerFlag && this.leftPlayerFlag) {
            return true;
        } else {
            return false;
        }
    }

    addPlayer(socket) {
        if (!this.leftPlayerFlag) {
            this.addLeftPlayer(socket);
        } else {
            if (!this.rightPlayerFlag) {
                this.addRightPlayer(socket);
            }
        }
    }

    addLeftPlayer(socket) {
        this.leftPlayer = new Player(this.field.width / 3, this.field.height / 2, 10, 100, socket);
        this.leftPlayer.setcolor("blue");
        this.players[socket.id] = this.leftPlayer;
        this.leftPlayerFlag = true;
        console.log("Created Left Player " + socket.id + " in " + this.roomid);
    }

    addRightPlayer(socket) {
        this.rightPlayer = new Player(this.field.width * 2 / 3, this.field.height / 2, 10, 100, socket);
        this.rightPlayer.setcolor("red");
        this.players[socket.id] = this.rightPlayer;
        this.rightPlayerFlag = true;
        console.log("Created Right Player " + socket.id + " in " + this.roomid);
    }

    createBall() {
        this.ball = new Ball(this.field.width / 2, this.field.height / 2, 10, 3, 2, 1);
    }

    startGame() {
        this.createBall();
        this.moveBall();
    }

    updateBallForPlayers() {
        for (var id in this.players) {
            this.players[id].socket.emit('ball', this.ball);
        }
    }

    updatePlayersForPlayers() {
        for (var id in this.players) {
            //console.log("Sending state to " + this.players[id].socket.id);
            this.players[id].socket.emit('state', this.updateObject());
        }
        //console.log(this.players);
    }

    moveBall() {
        this.collisionDetection();
        //console.log("hi");
        this.changeX();
        this.changeY();
        this.ball.lastx = this.ball.x;
        this.ball.lasty = this.ball.y;
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        this.updateBallForPlayers();
        setTimeout(this.moveBall.bind(this), 10);
    }

    changeX() {
        if (this.ball.x + this.ball.dx > this.field.width - this.ball.radius || this.ball.x + this.ball.dx < this.ball.radius) {
            this.ball.dx = -this.ball.dx;
        }
    }

    changeY() {
        if (this.ball.y + this.ball.dy > this.field.height - this.ball.radius || this.ball.y + this.ball.dy < this.ball.radius) {
            this.ball.dy = -this.ball.dy;
        }
    }

    collisionDetection() {
        for (var id in this.players) {
            var player = this.players[id];
            if (this.ball.x + this.ball.dx - this.ball.radius <= player.x + player.width && this.ball.x + this.ball.dx + this.ball.radius >= player.x &&
                this.ball.y + this.ball.dy <= player.y + player.height && this.ball.y + this.ball.dy + this.ball.radius >= player.y) {
                this.ball.color = player.color;
                this.ball.dx = -this.ball.dx;
            }
            if (this.ball.y + this.ball.dy - this.ball.radius <= player.y + player.height && this.ball.y + this.ball.dy + this.ball.radius >= player.y &&
                this.ball.x + this.ball.dx <= player.x + player.width && this.ball.x + this.ball.dx + this.ball.radius >= player.x) {
                this.ball.color = player.color;
                this.ball.dy = -this.ball.dy;
            }
        }
    }

    playerMoved(socketID, x, y) {

        this.players[socketID].moveTo(x, y);

        //console.log("someone moved");
        this.updatePlayersForPlayers();
    }

}

module.exports = Room