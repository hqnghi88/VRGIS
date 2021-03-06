/**
 * Created by Jerome on 03-03-17.
 */

var Client = {};
var main_id;
Client.socket = io.connect();

Client.sendTest = function () {
    console.log("test sent");
    Client.socket.emit('test');
};

Client.askNewPlayer = function () {
    Client.socket.emit('newplayer');
};

Client.sendClick = function (x, y) {
    Client.socket.emit('click', { x: x, y: y });
};

Client.sendMessage = function (m) {
    Client.socket.emit('message', { msg: m });
};
 
Client.socket.on('newplayer', function (data) { 
    Game.addNewPlayer(data.id, data.x, data.y, data.ori, data.dest);
});
Client.socket.on('mainplayer',function(data){
    main_id=data.id; 
    // console.log(main_id);
    // Game.addNewPlayer(data.id,data.x,data.y);
});

Client.socket.on('allplayers', function (data) {
    for (var i = 0; i < data.length; i++) {

        Game.addNewPlayer(data[i].id, data[i].x, data[i].y, data[i].ori, data[i].dest);
    }

    Client.socket.on('move', function (data) {
        Game.movePlayer(data.id, data.dest);
    });
    Client.socket.on('chat', function (data) {
        Game.showMessage(data.id, data.msg);
    });

    Client.socket.on('remove', function (id) {
        Game.removePlayer(id);
    });
});


