class Player {
    constructor(x, y, width, height, socket) {
        this.x = x;
        this.y = y;
        this.lastx = x;
        this.lasty = y;
        this.width = width;
        this.height = height;
        this.socket = socket;
        console.log(socket.id + " player constructed");
    }
    setcolor(color) {
        this.color = color;
    }
    moveTo(x, y) {
        // console.log("Player " + this.socket.id + " moved ");
        this.lastx = this.x;
        this.lasty = this.y;
        this.x = x;
        this.y = y;
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
}
module.exports = Player