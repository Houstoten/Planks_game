(function() {
    var canvas = document.getElementById("main_canvas");
    var scoreDisplay = document.getElementById("score");
    var roomIdDisplay = document.getElementById("roomId");
    var playerOneDisplay = document.getElementById("playerOne");
    scoreDisplay.innerHTML = 0 + " - " + 0;
    var ctx = canvas.getContext("2d");
    var socket = io();

    // $('#change_game_mode').click(function() {
    //     $.fancybox([
    //         { href: '#choose_mode' }
    //     ]);
    // });

    socket.emit('new player');


    document.addEventListener("mousemove", mouseMoveHandler, false);
    document.addEventListener("keydown", pausePressHandler, false);
    var movement = {};

    function pausePressHandler(e) {
        if (e.keyCode == 32) {
            socket.emit('pause');
        }
    }

    function mouseMoveHandler(e) {

        movement.x = e.clientX;
        movement.y = e.clientY;
        socket.emit('movement', movement);
        //collisionDetection();
    }

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
        canvas.width = 1000;
        canvas.height = 500;
        redraw();
    }

    function redraw(x, y, width, height) {
        ctx.clearRect(x, y, width, height);
    }


    // function redrawAll() {
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    // }

    // setInterval(redrawAll, 1000);

    function drawPlatform(x, y, width, height, color) {
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }

    function drawBall(x, y, radius, color) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }

    socket.on('ball', function(ball) {
        redraw(ball.lastx - ball.radius, ball.lasty - ball.radius, ball.radius * 2, ball.radius * 2);
        drawBall(ball.x, ball.y, ball.radius, ball.color);
    });

    socket.on('state', function(players) {
        for (var id in players) {
            var player = players[id];
            console.log("Drawing player " + id);
            redraw(player.lastx, player.lasty, player.width, player.height);
            drawPlatform(player.x, player.y, player.width, player.height, player.color);
        }
    });

    socket.on('score', function(score) {
        scoreDisplay.innerHTML = score.left + " - " + score.right;
    });

    socket.on('playerInRoom', function(info) {
        roomIdDisplay.innerHTML = info.id;
        playerOneDisplay.innerHTML = info.color + " player";
        playerOneDisplay.style.color = info.color;
    });
})();