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
var gamahost = new Map();
var updaterhost = new Map();
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
            health:0,
            creep: '',
            msg: ''
            // x: randomInt(100,400),
            // y: randomInt(100,400)
        };
        players.set(socket.player.id, socket.player);
        socket.emit('allplayers', getAllPlayers());
        socket.emit('mainplayer', socket.player);
        socket.broadcast.emit('newplayer', socket.player);

        // socket.on('closeRoom', function (data) {
        //     clearInterval(updateSource);
        //     if (gama && gama.wSocket) {
        //         gama.wSocket.close();
        //     }
        //     gama = null;
        //     io.emit('exitRoom', socket.player.id);
        // });
        socket.on('startGame', function (data) { 

            // console.log(data);
            var gama = new gamalib.GAMA(data[0], data[1], data[2]);//"ws://localhost:6868/" 
            gama.connect(
                function (e) { 
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
                                roomloc.delete(roomid);
                                roomloc.set(roomid, socket.player.roomloc);
                                socket.player.ori = [eee[0]+ Math.random() / 10000, eee[1]+ Math.random() / 10000];
                                socket.player.dest = socket.player.ori;
                                io.emit('updatePosition', socket.player);
                                socket.join(roomid);
                                io.sockets.in(roomid).emit('started', socket.player);

                                gamahost.set(roomid, gama);
                                var updateSource = setInterval(() => {
                                    if(gamahost.get(socket.player.room[0] + "" + socket.player.room[1])){
                                        gamahost.get(socket.player.room[0] + "" + socket.player.room[1]).step();
                                    }
                                }, data[3]);
                                updaterhost.set(roomid, updateSource);
                            });

                        });
                }, function () { });



        });

        socket.on('killAgent', function (data) {
            let roomid = socket.player.room[0] + "" + socket.player.room[1];
            let sss=data.toString().replace(/,/g,'","');
            // console.log('ask prey where(each.name in ["' +  sss+ '"]){do die;}');
            gamahost.get(roomid).evalExpr('ask prey where(each.name in ["' + sss + '"]){do die;}', function (ee) {
                // gama.getPopulation("prey", ["name", "color"], "EPSG:4326", function (message) {
                //     if (typeof message == "object") {
                    socket.player.health=socket.player.health+((data.toString().split(',')).length+1);
                //     } else {
                //         socket.player.creep = JSON.parse(message);
                io.sockets.in(roomid).emit('allCreep', socket.player);
                //     }
                // })
            });
        });
        socket.on('joinGame', function (data) {
            socket.join(data[0] + "" + data[1]);
            socket.player.room = [data[0], data[1]];
            socket.player.outroom = socket.player.ori;
            socket.player.ori = roomloc.get(socket.player.room[0] + "" + socket.player.room[1]);
            socket.player.dest = socket.player.ori;
            // clearInterval(updateSource);
            // if (gama && gama.wSocket) {
            //     gama.wSocket.close();
            // }
            // gama = null;
            // gama = new gamalib.GAMA("ws://localhost:6868/", "", "");//"ws://localhost:6868/"
            // gama.connect();
            io.emit('updatePosition', socket.player);
            socket.emit("intoRoom", socket.player.ori);
        });
        socket.on('leaveGame', function (data) {
            socket.leave(data[0] + "" + data[1]);
            socket.player.health = 0; 
            socket.player.ori = socket.player.outroom;
            socket.player.dest = socket.player.outroom;
            // clearInterval(updateSource);
            // if (gama && gama.wSocket) {
            //     gama.wSocket.close();
            // }
            io.emit('updatePosition', socket.player);
            socket.emit("outRoom", socket.player);
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
            // let room_id=socket.player.room[0] + "" + socket.player.room[1];
            // clearInterval(updaterhost.get(room_id));
            // if (gamahost.get(room_id) && gamahost.get(room_id).wSocket) {
            //     gamahost.get(room_id).wSocket.close();
            // }
            // gamahost.delete(room_id);
            // updaterhost.delete(room_id);
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