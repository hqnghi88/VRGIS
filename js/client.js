/**
 * Created by Jerome on 03-03-17.
 */

var Client = {};
var main_id;
Client.socket = io.connect('/');

Client.sendTest = function () {
    console.log("test sent");
    Client.socket.emit('test');
};
Client.startGame= function(){
    Client.socket.emit('startGame');
};
Client.joinGame= function(data){
    Client.socket.emit('joinGame',data);
};
Client.leaveGame= function(data){
    Client.socket.emit('leaveGame',data);
};
Client.createRoom= function(){
    Client.socket.emit('createRoom');
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
    Game.addNewPlayer(data.id, data.ori, data.dest);
});
Client.socket.on('mainplayer',function(data){
    main_id=data.id; 
    // console.log(main_id);
    // Game.addNewPlayer(data.id,data.x,data.y);
});

Client.socket.on('allplayers', function (data) {
    for (var i = 0; i < data.length; i++) {
        Game.addNewPlayer(data[i].id, data[i].ori, data[i].dest);
    }

    Client.socket.on('room', function (data) { 
        Game.showRoom(data);
    });
    Client.socket.on('intoRoom', function (data) { 
        Game.intoRoom(data);
    });
    Client.socket.on('outRoom', function (data) { 
        Game.outRoom(data);
    });
    Client.socket.on('exitRoom', function (data) { 
        Game.exitRoom(data);
    });
    Client.socket.on('started', function (data) { 
        Game.startGame(data);
    });
    Client.socket.on('allCreep', function (data) {  
        Game.allCreep(data);
    });
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


