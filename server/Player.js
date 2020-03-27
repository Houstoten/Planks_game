class Player {
    constructor(x, y, width, height, socket, maxScore, maxX) {
        this.x = x;
        this.y = y;
        this.lastx = x;
        this.lasty = y;
        this.width = width;
        this.height = height;
        this.socket = socket;
        this.score = 0;
        this.maxScore = maxScore;
        this.maxX = maxX;
        console.log(socket.id + " player constructed");
    }
    setcolor(color) {
        this.color = color;
    }
    moveTo(x, y) {
        // console.log("Player " + this.socket.id + " moved ");
        this.lasty = this.y;
        this.y = y;
        this.lastx = this.x;

        if (this.maxX >= 0) {
            if (x >= this.maxX) {
                return;
            }
        } else {
            if (x <= -this.maxX) {
                return;
            }
        }

        this.x = x;

    }
    objectToSend() {
        var cc = {
            x: this.x,
            y: this.y,
            lastx: this.lastx,
            lasty: this.lasty,
            width: this.width,
            height: this.height,
            color: this.color
        }
        return cc;
    }

    increaseScoreAndCheckWinner() {
        this.score++;
        if (this.score >= this.maxScore) {
            return true;
        } else {
            return false;
        }
    }
}
module.exports = Player