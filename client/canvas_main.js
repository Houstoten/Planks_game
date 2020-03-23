(function() {
    var canvas = document.getElementById("main_canvas");
    var ctx = canvas.getContext("2d");
    var socket = io();

    socket.emit('new player');

    document.addEventListener("mousemove", mouseMoveHandler, false);

    var movement = {};

    function mouseMoveHandler(e) {

        movement.x = e.clientX;
        movement.y = e.clientY;
        socket.emit('movement', movement);
        //collisionDetection();
    }

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redraw();
    }

    // var clients = {};
    // var commonBall = { x, y, radius };

    function redraw(x, y, width, height) {
        ctx.clearRect(x, y, width, height);
    }

    // function redrawAll() {
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    // }

    function drawPlatform(x, y, width, height) {

        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();
    }

    function drawBall(x, y, radius) {
        // commonBall.x = x;
        // commonBall.y = y;
        // commonBall.radius = radius;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();
    }

    socket.on('ball', function(ball) {
        redraw(ball.lastx - ball.radius, ball.lasty - ball.radius, ball.radius * 2, ball.radius * 2);
        drawBall(ball.x, ball.y, ball.radius);
    });

    socket.on('state', function(players) {
        for (var id in players) {
            var player = players[id];
            redraw(player.lastx, player.lasty, player.width, player.height);
            drawPlatform(player.x, player.y, player.width, player.height);
        }
    });

})();