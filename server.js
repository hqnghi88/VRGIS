var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var gamalib = require('./GAMA.js');
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

const app_version = process.env.HEROKU_SLUG_COMMIT || 1;//HEROKU_RELEASE_VERSION
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
app.get('/', function (request, response) {
    const options = {
        headers: {
            'Access-Control-Expose-Headers': 'User',
            'AppVersion': JSON.stringify(app_version),
        }
    };
    response.sendFile(path.join(__dirname + 'index.html'), options);
});
app.get("/app_info.js", function (req, res) {
    res.send('window.app_info={"version":"' + app_version + '"}');
});
app.get('/home', function (request, response) {
    if (request.session.loggedin) {
        response.sendFile(__dirname + 'index.html');
    } else {
        //response.send('Please login to view this page!');
        response.redirect('/');
        response.end();
    }
});

server.lastPlayderID = 0;

server.listen(process.env.PORT || 80, function () {
    console.log('Version ' + app_version);
    console.log('Listening on ' + server.address().port);
});


var players = new Map();
var roomloc = new Map();
io.on('connection', function (socket) {
    socket.on('newplayer', function () {
        console.log("newplayer " + server.lastPlayderID);//[105.771453381, 10.022111449]
        var xx = 105.771453381 + Math.random() / 10000;
        var yy = 10.022111449 + Math.random() / 10000;
        socket.player = {
            id: server.lastPlayderID++,
            ori: [xx, yy],
            dest: [xx, yy],
            outroom: [xx, yy],
            inroom: [xx, yy],
            room: [0, 0],
            roomloc: [],
            creep: '',
            msg: ''
            // x: randomInt(100,400),
            // y: randomInt(100,400)
        };
        players.set(socket.player.id, socket.player);
        socket.emit('allplayers', getAllPlayers());
        socket.emit('mainplayer', socket.player);
        socket.broadcast.emit('newplayer', socket.player);

        var gama;//= new gamalib.GAMA("ws://localhost:6868/", "", "");
        var updateSource;
        socket.on('createRoom', function (data) {
            // gama.modelPath = 'C:/git/Drafts/hanman/models/simple.gaml';
            // gama.experimentName = 'main';
            // gama = new GAMA("ws://51.255.46.42:6001/", modelPath, experimentName);
            // gama.executor_speed=100;

            clearInterval(updateSource);
            if (gama && gama.wSocket) {
                gama.wSocket.close();
            }
            gama = null;
            gama = new gamalib.GAMA("ws://localhost:6868/", "", "");
            gama.connect(
                function (e) {
                    gama.socket_id = e.data;
                    var roomid = socket.player.room[0] + "" + socket.player.room[1];
                    roomloc.delete(roomid);
                    socket.player.room = [gama.socket_id, gama.exp_id];
                    io.emit('room', socket.player);
                }, function () { });

        });
        socket.on('closeRoom', function (data) {
            clearInterval(updateSource);
            if (gama && gama.wSocket) {
                gama.wSocket.close();
            }
            gama = null;
            io.emit('exitRoom', socket.player.id);
        });
        socket.on('startGame', function (data) {
            // gama.modelPath = 'C:/git/Drafts/hanman/models/simple.gaml';
            // gama.experimentName = 'main';


            console.log("gama of " + gama);
            gama.modelPath = 'C:/git/gama/msi.gama.models/models/Tutorials/Road Traffic/models/Model 05.gaml';
            gama.experimentName = 'road_traffic';
            // gama.modelPath = '/Users/hqn88/git/gama/msi.gama.models/models/Tutorials/Road Traffic/models/Model 05.gaml';
            // gama.experimentName = 'road_traffic';
            // gama = new GAMA("ws://51.255.46.42:6001/", modelPath, experimentName);
            // gama.executor_speed=100;
            gama.launch(
                function (e) {
                    // console.log(e);
                    gama.evalExpr("CRS_transform(world.location,\"EPSG:4326\")", function (ee) {
                        // console.log(ee);
                        ee = JSON.parse(ee).result.replace(/[{}]/g, "");
                        var eee = ee.split(",");
                        socket.player.room = [gama.socket_id, gama.exp_id];
                        var roomid = socket.player.room[0] + "" + socket.player.room[1];
                        socket.player.roomloc = [eee[0], eee[1]];
                        roomloc.set(roomid, socket.player.roomloc);
                        socket.player.ori = [eee[0], eee[1]];
                        socket.player.dest = [eee[0], eee[1]];
                        socket.join(roomid);
                        io.sockets.in(roomid).emit('started', socket.player);
                    });

                }, function () { });

            console.log("updateSource of " + socket.player.id);
            updateSource = setInterval(() => {
                // if (gama.state === "play") {
                // gama.step(

                gama.getPopulation("people", ["name"], "EPSG:4326", function (message) {
                    if (typeof message == "object") {

                    } else {
                        socket.player.creep = JSON.parse(message);
                        io.sockets.in(socket.player.room[0] + "" + socket.player.room[1]).emit('allCreep', socket.player);
                    }
                });
                // );

                // }
            }, 10000);

        });

        socket.on('joinGame', function (data) {
            socket.join(data[0] + "" + data[1]);
            socket.player.room = [data[0], data[1]];
            socket.player.outroom = socket.player.ori;
            socket.emit("intoRoom", roomloc.get(socket.player.room[0] + "" + socket.player.room[1]));
        });
        socket.on('leaveGame', function (data) {
            socket.leave(data[0] + "" + data[1]);
            socket.player.ori = socket.player.outroom;
            socket.emit("outRoom", socket.player.ori);
        });
        socket.on('click', function (data) {
            // console.log('click to '+data.x+', '+data.y);
            
            socket.player.dest = [data.x, data.y];
            socket.player.ori = socket.player.dest;
            io.emit('move', socket.player);
        });

        socket.on('message', function (data) {
            // console.log('click to '+data.x+', '+data.y);
            socket.player.msg = data.msg;
            io.emit('chat', socket.player);
        });

        socket.on('disconnect', function () {
            clearInterval(updateSource);
            if (gama && gama.wSocket) {
                gama.wSocket.close();
            }
            gama = null;
            io.emit('remove', socket.player.id);
            players.delete(socket.player.id);
        });
    });

    socket.on('test', function () {
        console.log('test received');
    });
});

function getAllPlayers() {

    //     // io.sockets.forEach(function (socketID) {
    //     //     var player = io.sockets.connected[socketID].player;
    //     //     if (player) players.push(player);
    //     // });
    //     io.sockets.sockets.forEach(function (s) {
    //         console.log("xxxx "+s.player);
    //         var player = s.player;
    //         if (player) players.push(player);
    //     }); 
    return [...players.values()];// Array.from(players.values()) ;
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}