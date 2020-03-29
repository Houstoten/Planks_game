class Ball {
    constructor(x, y, radius, speed, dx, dy) {
        // console.log("Ball created");
        this.x = x;
        this.y = y;
        this.lastx = x;
        this.lasty = y;
        this.radius = radius;
        this.speed = speed;
        this.dx = dx * speed;
        this.dy = dy * speed;
    }
    setcolor(color) {
        this.color = color;
    }
}

module.exports = Ball