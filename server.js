var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
// app.use('/css',express.static(__dirname + '/css'));
app.use('/dist', express.static(path.join(__dirname, 'dist')))
app.use('/examples', express.static(path.join(__dirname, 'examples')))
app.use('/models', express.static(path.join(path.join(__dirname, 'examples'), 'models')))
app.use('/js', express.static(__dirname + '/js'));
// app.use('/assets',express.static(__dirname + '/assets'));

app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname + '/examples/20-game.html'));
});

app.get('/home', function (request, response) {
    if (request.session.loggedin) {
        response.sendFile(__dirname + '/examples/20-game.html');
    } else {
        //response.send('Please login to view this page!');
        response.redirect('/');
        response.end();
    }
});

server.lastPlayderID = 0;

server.listen(process.env.PORT || 80, function () {
    console.log('Listening on ' + server.address().port);
});

io.on('connection', function (socket) {

    socket.on('newplayer', function () {
        console.log("newplayer " + server.lastPlayderID );
        var xx=-73.979681 + Math.random() / 10000;
        var yy=40.6974881 + Math.random() / 10000;
        socket.player = {
            id: server.lastPlayderID++,
            x:xx ,
            y:yy,
            ori:[xx,yy],
            dest:[xx,yy]
            // x: randomInt(100,400),
            // y: randomInt(100,400)
        }; 
        socket.emit('allplayers', getAllPlayers());
        socket.broadcast.emit('newplayer', socket.player);

        socket.on('click', function (data) {
            // console.log('click to '+data.x+', '+data.y);
            socket.player.x = data.x;
            socket.player.y = data.y;
            socket.player.dest = [data.x, data.y];
            io.emit('move', socket.player);
        });

        socket.on('disconnect', function () {
            io.emit('remove', socket.player.id);
        });
    });

    socket.on('test', function () {
        console.log('test received');
    });
});

function getAllPlayers() {
    var players = [];
    Object.keys(io.sockets.connected).forEach(function (socketID) {
        var player = io.sockets.connected[socketID].player;
        if (player) players.push(player);
    });
    return players;
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
