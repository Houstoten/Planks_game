const Ball = require('./Ball');
const Player = require('./Player');
const Field = require('./Field');

class Room {
    constructor(roomid, width, height, privateFlag) {
        this.roomid = roomid;
        this.players = {};
        this.field = new Field(width, height);
        this.privateFlag = privateFlag;
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
        // if (this.fullFlag()) {
        //     this.startScoreGame();
        // }
        this.updateAllDataForPlayers();


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
        this.updateAllDataForPlayers();
    }

    addLeftPlayer(socket) {
        this.players[socket.id] = new Player(this.field.width / 3, this.field.height / 2, 10, 100, socket, 10, this.field.width / 2, this.paused);
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
        this.players[socket.id] = new Player(this.field.width * 2 / 3, this.field.height / 2, 10, 100, socket, 10, -this.field.width / 2, this.paused);
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
        this.ballIsMoving = true;
    }

    startScoreGame() {

        if (!this.nonScoreStarted) {
            this.startNonScoreGame();
            this.nonScoreStarted = true;
        }
        this.setZeroScore();
        this.playForScore = true;
        this.updateAllDataForPlayers();
        this.sendConfirmationToPlayers(this.allTruePredicate, "Score Game Started!");
    }

    requestScoreGame(socketID) {
        if (this.fullFlag()) {
            // console.log("In request score " + socketID);
            this.players[socketID].wantedScoreGame = true;
            if (this.allWantedScoreGame()) {
                this.startScoreGame();
                for (var id in this.players) {

                    this.players[id].wantedScoreGame = null;
                }
                // console.log("now all is null!!!!!!!!!!!!!!!!!");
            }
        } else {
            this.throwErrorForPlayers("Wait for all players to join");
        }
    }


    allWantedScoreGame() {
        //   console.log("all Wanted Score here");
        for (var id in this.players) {
            if (!this.players[id].wantedScoreGame) {
                this.sendConfirmationToPlayers(this.scoreGamePredicate, "Your opponent wants to start score game.")
                    //  console.log("all Wanted returns false");
                return false;
            }
        }
        //console.log("all Wanted returns true");
        return true;
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

    requestPause(socketID) {
        if (this.players[socketID].wantedPause) {
            console.log(socketID + " wants to unpause");
            this.players[socketID].wantedPause = false;
        } else {
            console.log(socketID + " wants to pause");
            this.players[socketID].wantedPause = true;
        }
        if (this.allWantedPause()) {
            this.changePause();
        }
    }

    allWantedPause() {
        for (var id in this.players) {
            if (this.players[id].wantedPause == this.paused) {
                if (this.paused == true) {
                    this.sendConfirmationToPlayers(this.pausePredicate.bind(this), "Your opponent wants to unpause.");
                } else {
                    this.sendConfirmationToPlayers(this.pausePredicate.bind(this), "Your opponent wants to pause.");
                } //  console.log("all Wanted returns false");
                return false;
            }
        }
        //console.log("all Wanted returns true");
        return true;
    }

    pausePredicate(player) {
        console.log(player.socket.id + " " + player.wantedPause + " " + this.paused);
        if (player instanceof Player && player.wantedPause == this.paused) {
            return true;
        } else {
            return false;
        }
    }

    scoreGamePredicate(player) {
        //  console.log("Predicate here");
        if (player instanceof Player && !player.wantedScoreGame) {
            //  console.log("Predicate true for " + player.socket.id);
            return true;
        } else {
            // console.log("Predicate false for " + player.socket.id);
            return false;
        }
    }

    allTruePredicate(player) {
        return true;
    }

    //end of game mode section

    findOutWinner() {
        this.nonScoreStarted = false;
        this.updateAllForPlayers();
        if (this.players[this.leftPlayer].score > this.players[this.rightPlayer].score) {

            var winner = this.players[this.leftPlayer].color;
        } else {
            if (this.players[this.leftPlayer].score < this.players[this.rightPlayer].score) {
                var winner = this.players[this.rightPlayer].color;
            }
        }
        this.sendConfirmationToPlayers(this.allTruePredicate, "Score Game Ended! " + winner + " player is winner!");
        console.log("Game ended in room " + this.roomid + " .Winner is " + winner + " player.");

    }

    //update section here

    sendConfirmationToPlayers(predicate, letter) {
        // console.log("Confirmation Sending Here");
        for (var id in this.players) {
            if (predicate(this.players[id])) {
                //   console.log("sending confirmation to " + this.players[id].socket.id);
                this.players[id].socket.emit('confirm', letter);
            }
        }
    }

    throwErrorForPlayers(error) {
        for (var id in this.players) {
            this.players[id].socket.emit('eror', error);
        }
    }

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
        var scoreleft = 0;
        var scoreright = 0;
        if (this.leftPlayerFlag) {
            scoreleft = this.players[this.leftPlayer].score;
        }
        if (this.rightPlayerFlag) {
            scoreright = this.players[this.rightPlayer].score;
        }
        for (var id in this.players) {
            this.players[id].socket.emit('score', {
                left: scoreleft,
                right: scoreright
            });
        }
    }

    updateAllForPlayers() {
        for (var id in this.players) {
            this.players[id].socket.emit('update');
        }
    }

    updateAllDataForPlayers() {
        this.updateAllForPlayers();
        this.updateScoreForPlayers();
        this.updatePlayersForPlayers();
        this.updateBallForPlayers();
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

            setTimeout(this.moveBall.bind(this), 100 / 6);
        } else {
            if (this.gameEnded) {
                this.startNonScoreGame();
                this.updateAllForPlayers();
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
                    if (this.gameEnded) {
                        this.findOutWinner();
                    }
                    this.updateScoreForPlayers();
                }
                this.ball.dx = -this.ball.dx;
                //console.log("New score in " + this.roomid + " - " + this.players[this.leftPlayer].score + " : " + this.players[this.rightPlayer].score);
            }
        } catch (e) {
            // this.throwErrorForPlayers("No data for player in room");
            // console.log("No data for player in room " + this.roomid);
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
        this.collisionDetection();
        //console.log("someone moved");
        this.updatePlayersForPlayers();
    }


    //end of move section


}

module.exports = Room