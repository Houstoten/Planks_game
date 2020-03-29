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
        this.gameEnded = true;
        this.paused = false;
        this.playForScore = false;
        this.nonScoreStarted = false;
    }


    //convert to send needed json
    updateObject() {
        var clients = {};
        for (var id in this.players) {
            clients[id] = this.players[id].objectToSend();
        }
        return clients;
    }

    //flag section here

    fullFlag() {
        if (this.rightPlayerFlag && this.leftPlayerFlag) {
            return true;
        } else {
            return false;
        }
    }

    emptyFlag() {
        if (!this.rightPlayerFlag && !this.leftPlayerFlag) {
            return true;
        } else {
            return false;
        }
    }

    //end of flag section

    //create section here

    addPlayer(socket) {
        if (!this.leftPlayerFlag) {
            this.addLeftPlayer(socket);

        } else {
            if (!this.rightPlayerFlag) {
                this.addRightPlayer(socket);
            }
        }
        if (!this.nonScoreStarted) {
            this.startNonScoreGame();
            this.nonScoreStarted = true;
        }
        if (this.fullFlag()) {
            this.startScoreGame();
        }

    }

    removePlayer(socket) {
        delete this.players[socket.id];
        if (socket.id == this.leftPlayer) {
            this.leftPlayerFlag = false;
        } else {
            this.rightPlayerFlag = false;
        }
        if (!this.nonScoreStarted) {
            this.startNonScoreGame();
            this.nonScoreStarted = true;
        }
        this.updateAllForPlayers();
    }

    addLeftPlayer(socket) {
        this.players[socket.id] = new Player(this.field.width / 3, this.field.height / 2, 10, 100, socket, 10, this.field.width / 2);
        this.players[socket.id].setcolor("blue");
        this.leftPlayer = socket.id;
        this.leftPlayerFlag = true;
        console.log("Created Left Player " + this.leftPlayer + " in " + this.roomid);
        socket.emit('playerInRoom', {
            color: this.players[this.leftPlayer].color,
            id: this.roomid
        });
    }

    addRightPlayer(socket) {
        this.players[socket.id] = new Player(this.field.width * 2 / 3, this.field.height / 2, 10, 100, socket, 10, -this.field.width / 2);
        this.players[socket.id].setcolor("red");
        this.rightPlayer = socket.id;
        this.rightPlayerFlag = true;
        console.log("Created Right Player " + this.rightPlayer + " in " + this.roomid);
        socket.emit('playerInRoom', {
            color: this.players[this.rightPlayer].color,
            id: this.roomid
        });
    }

    createBall() {
        this.ball = new Ball(this.field.width / 2, this.field.height / 2, 10, 3, 2, 1);
        this.ball.setcolor("white");
    }

    //end of create section

    //game mode section here

    startNonScoreGame() {
        this.playForScore = false;
        this.gameEnded = false;
        this.createBall();
        this.moveBall();
    }

    startScoreGame() {
        this.setZeroScore();
        this.playForScore = true;
    }

    setZeroScore() {
        for (var id in this.players) {
            this.players[id].score = 0;
        }
    }

    changePause() {
        if (this.paused) {
            this.paused = false;
            if (!this.gameEnded) {
                this.moveBall();
            }
        } else {
            this.paused = true;
        }
        console.log("room " + this.roomid + " paused " + this.paused);
    }

    //end of game mode section

    //update section here

    updateBallForPlayers() {
        for (var id in this.players) {
            this.players[id].socket.emit('ball', this.ball);
        }
        //console.log(this.ball);
    }

    updatePlayersForPlayers() {
        for (var id in this.players) {
            //console.log("Sending state to " + this.players[id].socket.id);
            this.players[id].socket.emit('state', this.updateObject());
        }
        //console.log(this.players);
    }

    updateScoreForPlayers() {
        for (var id in this.players) {
            this.players[id].socket.emit('score', {
                left: this.players[this.leftPlayer].score || 0,
                right: this.players[this.rightPlayer].score || 0
            });
        }
    }

    updateAllForPlayers() {
        for (var id in this.players) {
            this.players[id].socket.emit('update');
        }
    }

    //end of update section

    //move section here


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
        if (!this.gameEnded && !this.paused) {
            setTimeout(this.moveBall.bind(this), 10);
        } else {
            if (this.gameEnded && this.playForScore) {
                this.nonScoreStarted = false;

                if (Math.max(this.players[this.leftPlayer].score, this.players[this.rightPlayer].score) == this.players[this.leftPlayer].score) {
                    this.updateAllForPlayers();
                    var winner = this.players[this.leftPlayer].color;
                } else {
                    var winner = this.players[this.rightPlayer].color;
                }
                console.log("Game ended in room " + this.roomid + " .Winner is " + winner + " player.");
            }
        }
    }

    changeX() {
        try {
            if (this.ball.x + this.ball.dx > this.field.width - this.ball.radius || this.ball.x + this.ball.dx < this.ball.radius) {

                if (this.playForScore) {
                    if (this.ball.x + this.ball.dx > this.field.width - this.ball.radius) {
                        this.gameEnded = this.players[this.leftPlayer].increaseScoreAndCheckWinner();
                    } else {
                        if (this.ball.x + this.ball.dx < this.ball.radius) {
                            this.gameEnded = this.players[this.rightPlayer].increaseScoreAndCheckWinner();
                        }
                    }
                    this.updateScoreForPlayers();
                }
                this.ball.dx = -this.ball.dx;
                //console.log("New score in " + this.roomid + " - " + this.players[this.leftPlayer].score + " : " + this.players[this.rightPlayer].score);
            }
        } catch (e) {
            console.log("No data for player in room " + this.roomid);
            this.playForScore = false;
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
            if (this.ball.x + this.ball.dx - this.ball.radius < player.x + player.width && this.ball.x + this.ball.dx + this.ball.radius > player.x &&
                this.ball.y + this.ball.dy < player.y + player.height && this.ball.y + this.ball.dy + this.ball.radius > player.y) {
                this.ball.color = player.color;
                this.ball.dx = -this.ball.dx;
            }
            if (this.ball.y + this.ball.dy - this.ball.radius < player.y + player.height && this.ball.y + this.ball.dy + this.ball.radius > player.y &&
                this.ball.x + this.ball.dx < player.x + player.width && this.ball.x + this.ball.dx + this.ball.radius > player.x) {
                this.ball.color = player.color;
                this.ball.dy = -this.ball.dy;
            }
        }
    }

    playerMoved(socketID, x, y) {

        this.players[socketID].moveTo(x, y);
        //this.collisionDetection();
        //console.log("someone moved");
        this.updatePlayersForPlayers();
    }


    //end of move section


}

module.exports = Room