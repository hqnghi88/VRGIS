
var canvas = document.getElementById("gameCanvas");
/** @type {CanvasRenderingContext2D} */
var ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.fillStyle = "red";
var socket = io();

var gamestate = {
    settings: {
        playerW: 30,
        playerH: 30,
        worldW: 500,
        worldH: 500,
        speed: 12,
    },
    players: {}

}

socket.on('game-state', (game) => {
    // console.log(game);
    gamestate = game;
});


function renderGame() {
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (gamestate) {

        for (player in gamestate.players) {
            // ctx.fillStyle = gamestate.players[player].color;
            // ctx.fillRect(gamestate.players[player].x, gamestate.players[player].y, gamestate.settings.playerW, gamestate.settings.playerH)
            // ctx.font = '15px Arial';
            // ctx.fillText(gamestate.players[player].username, gamestate.players[player].x - 25, gamestate.players[player].y - 5);
        }
    }
    requestAnimationFrame(renderGame)
}
socket.on('player-remove', (id) => {
    delete gamestate.players[id]
})

var Game = {};

Game.addNewPlayer = function (id, x, y) {
    gamestate.players[id] = {
        x: -73.979681 + Math.random() / 10000,
        y: 40.6974881 + Math.random() / 10000,
        health: 100,
        username: `Player${Math.floor(Math.random() * 999999)}`,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16)
    }
 
    let options = {
        type: mapConfig.human.type, //model type
        obj: mapConfig.human.model + "." + mapConfig.human.type,

        // obj: 'models/Soldier.glb',
        // type: 'glb',//gltf
        units: 'meters', // in meters
        rotation: { x: 90, y: 180, z: 0 },
        scale: mapConfig.human.scale, //x3 times is real size for this model
        // rotation: mapConfig.human.rotation, //default rotation
        anchor: 'top',
        clone: false //objects won't be cloned
    }


    tb.loadObj(options, function (model) {
        //     human = model.setCoords(mapConfig.human.origin); 
        var _human1 = model.setCoords([gamestate.players[id].x, gamestate.players[id].y]);

        // var _human1 = model.setCoords(mapConfig.human.origin);
        _human1.setRotation(mapConfig.human.startRotation); //turn it to the initial street way
        // human1.addTooltip("Walk with WASD keys", true, human1.anchor, true, 2);
        _human1.castShadow = true;
        _human1.selected = false;
        // human1.addEventListener('ObjectChanged', onObjectChanged, false);

        tb.add(_human1);
        pple.set(id, _human1);
        console.log(pple);
        // init();
        // if (pple.size === 10) {
        //     start_renderer();
        // }
    });
};

Game.removePlayer = function (id) {
    pple.set(id,null);
    delete gamestate.players[id];
};
function movePlayer(dir) {
    // console.log(dir);
    // socket.emit('move-player', dir);
    // console.log("end " + dir);
}

Game.movePlayer = function (id, xx, yy) {
    // console.log(xx);
    gamestate.players[id].x = gamestate.players[id].x + xx/1000000; 
    gamestate.players[id].y = gamestate.players[id].y + yy/1000000;
    pple.get(id).setCoords([gamestate.players[id].x, gamestate.players[id].y]);

};
document.addEventListener('keydown', (e) => {
    if (e.key == 'w') {
        movePlayer('up');
        Client.socket.emit('click', { x: 0, y: -1 });
    }
    if (e.key == 'a') {
        movePlayer('left');
        Client.socket.emit('click', { x: 1, y: 0 });
    }
    if (e.key == 's') {
        movePlayer('down');
        Client.socket.emit('click', { x: 0, y: 1 });
    }
    if (e.key == 'd') {
        movePlayer('right');
        Client.socket.emit('click', { x: -1, y: 0 });
    }
})


// renderGame();