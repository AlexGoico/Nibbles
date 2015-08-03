/**
 Array of entities implementation as opposed to a
 collision sparse board.
 */
/** Globals */
var canvas, ctx;
var CELL_PIXEL_WIDTH, CELL_PIXEL_HEIGHT,
    CELLS_WIDE,       CELLS_HIGH;
var score;
var gameEntities, player, apple;

function init_globals() {
    canvas = $("canvas")[0];
    ctx    = canvas.getContext("2d");
    score  = $("input")[0];

    CELL_PIXEL_WIDTH = 20;
    CELL_PIXEL_HEIGHT = 20;
    // Ex. 640x480 resolution 20x20 cell size
    CELLS_WIDE = canvas.width / CELL_PIXEL_WIDTH;     // 640 / 20 = 32 cells wide
    CELLS_HIGH = canvas.height / CELL_PIXEL_HEIGHT;   // 480 / 20 = 24 cells high

    // Bug: input ghosting through callback.
    // 2 noticable instances: Snake able to turn from right to left before a
    // frame is processed and on game reset snake default direction can be defeated.
    $(document).keydown(process_inputs);
};

/** Objects */
function Snake() {
    this.color = "green";
    this.dead = false;
    this.body = [];

    // Head of the snake is the last element of the body
    for (var i = 0; i < 4; i++)
        this.body.push([2, 2]);

    this.dir = "down";
    this.nextDir = "";
};

Snake.prototype = {
    constructor: Snake,
    move: function() {
        // Remove tail
        this.body.shift();
        // Copy head
        head = this.body[this.body.length-1];
        headCopy = [head[0], head[1]];
        // Push copy as new head
        this.body.push(headCopy);
        // Update new head
        switch (this.dir) {
            case "up":    headCopy[1] -= 1; break;
            case "left":  headCopy[0] -= 1; break;
            case "down":  headCopy[1] += 1; break;
            case "right": headCopy[0] += 1; break;
        }

        // Consume last input if there is some input queued.
        if (this.nextDir != "")
        {
            this.dir = this.nextDir;
            this.nextDir = "";
        }
    },
    paint: function() {
        headIndex = this.body.length - 1;
        ctx.fillStyle = "blue";
        ctx.fillRect(this.body[headIndex][0] * CELL_PIXEL_WIDTH,
                     this.body[headIndex][1] * CELL_PIXEL_HEIGHT,
                     CELL_PIXEL_WIDTH, CELL_PIXEL_HEIGHT);

        ctx.strokeStyle = "green";
        for (var i = 0; i < this.body.length - 1; i++)
            ctx.strokeRect(this.body[i][0] * CELL_PIXEL_WIDTH,
                           this.body[i][1] * CELL_PIXEL_HEIGHT,
                           CELL_PIXEL_WIDTH, CELL_PIXEL_HEIGHT);
    },
    hasCollided: function() {
        // collided with walls (game edges, perhaps real walls later)
        var headX = this.body[this.body.length - 1][0];
        var headY = this.body[this.body.length - 1][1];
        if (headX < 0 || headX > CELLS_WIDE - 1 ||
            headY < 0 || headY > CELLS_HIGH - 1) {
            this.dead = true;
            return;
        }

        // collided with itself
        // n - 1 checks for O(n) ineffiency, ugly array 2d global
        // collision array map is a possible O(1) solution
        for (var i = this.body.length-2; i >= 0; i--)
            if (headX == this.body[i][0] && headY == this.body[i][1]) {
                this.dead = true;
                return;
            }

        // collided with apple
        if (headX == apple[0] && headY == apple[1]) {
            tail = this.body[0];
            tailCopy = [tail[0], tail[1]];
            this.body.unshift(tailCopy);
            score.value++;

            generate_apple();
        }
    },

    overlaps: function(coord) {
        for (var i = 0; i < this.body.length - 1; i++)
            if (this.body[i][0] == coord[0] &&
                this.body[i][1] == coord[1])
                return true;
        return false;
    }
};

/** Functions */
function coords_eq(coord1, coord2) {

}

function process_inputs(e) {
    if (player.dead != true) {
        switch (e.keyCode) {
            case 38: if (player.dir != "down")  player.nextDir = "up";    break;
            case 37: if (player.dir != "right") player.nextDir = "left";  break;
            case 40: if (player.dir != "up")    player.nextDir = "down";  break;
            case 39: if (player.dir != "left")  player.nextDir = "right"; break;
        }
    }
}

/*
 Collision based apple generatation.
 Non-deterministic. With a fair random generator of uniform distribution
 you will get a worse case of O(N) collisions, where N is the number of
 occupied cells. Definitely better implementations.
 */
function generate_apple() {
    apple = [Math.floor(Math.random() * CELLS_WIDE),
             Math.floor(Math.random() * CELLS_HIGH)];
    for (var i = 0; i < gameEntities.length; i++)
    {
        if (gameEntities[i].overlaps(apple))
        {
            apple = [Math.floor(Math.random() * CELLS_WIDE),
                     Math.floor(Math.random() * CELLS_HIGH)];
            i = 0;
        }
    }
    paint_apple();

}

function paint_apple() {
    ctx.fillStyle = "red";
    ctx.fillRect(apple[0] * CELL_PIXEL_WIDTH, apple[1] * CELL_PIXEL_HEIGHT,
                 CELL_PIXEL_WIDTH, CELL_PIXEL_HEIGHT);
}

function main() {
    init_globals();

    player = new Snake();
    // For potential future gameEntities. Collisions can be check through an interface.
    gameEntities = [];
    gameEntities.push(player);
    generate_apple();

    requestAnimationFrame(loop);
};

var t;
function loop(cur) {
    if (!t) t = cur;
    var dt = cur - t;

    // Logic
    if (dt >= 50)   // 50ms
    {
        t = cur;
        player.move();
        player.hasCollided();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paint_apple();
    player.paint();

    if (!player.dead)
        requestAnimationFrame(loop);
    else
    {
        player = new Snake();
        setTimeout(function() {
            loop();
            document.forms[0].reset();
        }, 2000);

    }
}

/**
 * Must be invoked at the bottom of source, in order for JS interpreter
 * to scan all functions and more specifically, all Objects and their
 * prototypes.
 * JS will only scan functions that are directly invoked, thus choking
 * Object prototypes from ever being scanned if main is invoked at the
 * top of the source.
 */
main();

/*
 Grid is zero indexed
 0 . . . . . . . 31
 |                  |
 |                  |
 |    Valid Area    |
 |                  |
 |                  |
 |                  |
 . . . . . . . . .
 */
