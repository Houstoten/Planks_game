(function() {
    var canvas = document.getElementById("main_canvas");
    var ctx = canvas.getContext("2d");

    var socket = io();
    socket.emit('new player');
    socket.on('message', function(data) {
        console.log(data);
    });
    // var socket = io();
    // socket.emit('new player');
    // setInterval(function() {
    //     socket.emit('movement', movement);
    // }, 10);

    // socket.on('state', function(players) {
    //     console.log(players);
    //     context.clearRect(0, 0, 800, 600);
    //     context.fillStyle = 'green';
    //     for (var id in players) {
    //         var player = players[id];
    //         context.beginPath();
    //         context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    //         context.fill();
    //     }
    // });

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas, false);

    document.addEventListener("mousemove", mouseMoveHandler, false);

    function mouseMoveHandler(e) {

        movement.x = e.clientX - platformwidth / 2;
        movement.y = e.clientY - platformheight / 2;
        // movement.x = platformX;
        // movement.y = platformY;
        socket.emit('movement', movement);
        collisionDetection();
    }

    function drawPlatform() {
        ctx.beginPath();
        ctx.rect(platformX, platformY, platformwidth, platformheight);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redraw();
    }

    function collisionDetection() {
        if (x + dx - ballradius <= platformX + platformwidth && x + dx + ballradius >= platformX &&
            y + dy <= platformY + platformheight && y + dy + ballradius >= platformY) {
            dx = -dx;
        }
        if (y + dy - ballradius <= platformY + platformheight && y + dy + ballradius >= platformY &&
            x + dx <= platformX + platformwidth && x + dx + ballradius >= platformX) {
            dy = -dy;
        }

    }

    // setInterval(redraw, 10);


    var x = canvas.width / 2;
    var y = canvas.height / 2;
    var speed = 3;
    var dx = speed;
    var dy = speed;
    var ballradius = 10;

    var platformwidth = 10;
    var platformheight = 100;
    var platformX = 0;
    var platformY = canvas.height / 2;
    var movement = {};

    function drawBall() {
        ctx.beginPath();
        ctx.arc(x, y, ballradius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();
    }

    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlatform();
        collisionDetection();
        drawBall();

        changex();
        changey();
        x += dx;
        y += dy;

    }

    socket.on('state', function(players) {

        for (var id in players) {
            var player = players[id];
            platformX = player.x;
            platformY = player.y;
            redraw();
        }
    });

    function changex() {
        if (x + dx > canvas.width - ballradius || x + dx < ballradius) {
            dx = -dx;
        }
    }

    function changey() {
        if (y + dy > canvas.height - ballradius || y + dy < ballradius) {
            dy = -dy;
        }
    }
})();