
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


// function renderGame() {
//     ctx.fillStyle = "white"
//     ctx.fillRect(0, 0, canvas.width, canvas.height)

//     // if (gamestate) {

//         // for (player in gamestate.players) {
//             // ctx.fillStyle = gamestate.players[player].color;
//             // ctx.fillRect(gamestate.players[player].x, gamestate.players[player].y, gamestate.settings.playerW, gamestate.settings.playerH)
//             // ctx.font = '15px Arial';
//             // ctx.fillText(gamestate.players[player].username, gamestate.players[player].x - 25, gamestate.players[player].y - 5);
//         // }
//     // }
//     requestAnimationFrame(renderGame)
// }
socket.on('player-remove', (id) => {
    delete gamestate.players[id]
})

var Game = {};

Game.addNewPlayer = function (id, x, y, o, d) {
    gamestate.players[id] = {
        x: x,
        y: y,
        ori: o,
        dest: d,
        moving: false,
        // x: -73.979681 + Math.random() / 10000,
        // y: 40.6974881 + Math.random() / 10000,
        health: 100,
        username: `Player${id}`,
        color: "#" + Math.floor(id * 16777215).toString(16)
    }

    let options = {
        type: mapConfig.human.type, //model type
        obj: mapConfig.human.model + "." + mapConfig.human.type,

        scale: 2,
        units: 'meters',
        rotation: { x: 90, y: 0, z: 0 },
        anchor: 'top',
        clone: false //objects won't be cloned
    }


    tb.loadObj(options, function (model) {
        //     human = model.setCoords(mapConfig.human.origin); 
        var _human1 = model.setCoords([gamestate.players[id].x, gamestate.players[id].y]);

        // var _human1 = model.setCoords(mapConfig.human.origin);
        // _human1.setRotation(mapConfig.human.startRotation); //turn it to the initial street way
        // _human1.addTooltip("Player"+id, true, _human1.anchor, true, 2); 
        _human1.addLabel(createLabelIcon("Player" + id + "<br/><br/><br/><br/>"), true);
        _human1.castShadow = true;
        _human1.selected = false;
        // human1.addEventListener('ObjectChanged', onObjectChanged, false);

        tb.add(_human1);
        // _human1.playAnimation({ animation: 3, duration: 100000000 });
        pple.set(id, _human1);
        init();
        // if (pple.size === 10) {
        //     start_renderer();
        // }
    });
};

Game.removePlayer = function (id) {
    tb.remove(pple.get(id));
    pple.delete(id);
    delete gamestate.players[id];
};

Game.movePlayer = function (id, dest) {
    // console.log(xx);
    // gamestate.players[id].x = gamestate.players[id].x + xx / 1000000;
    // gamestate.players[id].y = gamestate.players[id].y + yy / 1000000;
    // pple.get(id).setCoords([gamestate.players[id].x, gamestate.players[id].y]);
    gamestate.players[id].dest = dest;
    // var pt = [destxx,destyy];
    travelPath(id, dest);
    // pple.forEach((human) => { 
    //     travelPath(human.dest);
    // });
};
Game.showMessage = function (id, m) {
    gamestate.players[id].msg = m;
    var soldier = pple.get(id);
    if (!soldier) return;
    soldier.addLabel(createLabelIcon("Player" + id + "<br/>" + m), true);
    setTimeout(function () { 
        soldier.addLabel(createLabelIcon("Player" + id + "<br/><br/><br/><br/>"), true);

        soldier.playAnimation({ animation: 3, duration: 1 });
        // tb.update();
    }, 5000);
    soldier.playAnimation({ animation: 3, duration: 1 });
    // soldier.addLabel("Player"+id+" "+m, true, soldier.anchor, true, 2);
    // tb.update();

};
Game.getCoordinates = function (x, y) {
    Client.sendClick(x, y);
};
