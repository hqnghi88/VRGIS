
var pple = new Map(); 
function startGame() {
    let ee = document.getElementById("select_host");
    let host = ee.options[ee.selectedIndex].value;
    console.log(host);
    // Client.createRoom(host);
    ee = document.getElementById("select_mode_exp");
    let pmodel = ee.options[ee.selectedIndex].value.split("@");
    // loading_indi();

    ee = document.getElementById("select_room_id").value.split("@");
    let s = ee[0];
    let e = ee[1];
    if (s == "" || e === "") {
        Client.startGame([host, pmodel[0], pmodel[1], 1]);
    } else {
        let ee = document.getElementById("select_host");
        let host = ee.options[ee.selectedIndex].value;
        Client.joinGame([s, e, host]);
        gama = new GAMA(host, "", "");
        gama.connect();
        gama.socket_id = s;
        gama.exp_id = e;
        // start_sim(s, e);
    }
}
function exitGame() {
    let ee = document.getElementById("select_room_id").value.split("@");
    let s = ee[0];
    let e = ee[1];
    if (s === "" || e === "") {
    } else {
        Client.leaveGame([s, e]);
    }
}
function stopGame() {
    let ee = document.getElementById("select_room_id").value.split("@");
    let s = ee[0];
    let e = ee[1];
    if (s === "" || e === "") {
    } else {
        Client.stopGame([s, e]);
 
    }
}
function easing(t) {
    return t * (2 - t);
}
function travelPath(id, destination, run) {
    var soldier = pple.get(id);
    if (!soldier) return;
    soldier.setCoords(soldier.coordinates);
    gamestate.players[id].moving = true;
    // request directions. See https://docs.mapbox.com/api/navigation/#directions for details

    // var url = "https://api.mapbox.com/directions/v5/mapbox/driving/" + [origin, destination].join(';') + "?geometries=geojson&access_token=" + config.accessToken


    // fetchFunction(url, function (data) { 
    var route = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    // 'coordinates': [gamestate.players[id].ori, destination]
                    'coordinates': [soldier.coordinates, destination]
                }
            }
        ]
    };

    const ddistance = turf.length(route);
    let duration = 1 + gamestate.players[id].health / 1000;
    // console.log( ddistance );
    // console.log( ddistance/duration*200000);
    // extract path geometry from callback geojson, and set duration of travel
    var options = {
        animation: (ddistance > 0.2 || run) ? 1 : 3,
        // path: data.routes[0].geometry.coordinates,
        path: route.features[0].geometry.coordinates,
        // trackHeading:false,
        duration: ddistance / duration * ((ddistance > 0.2 || run) ? 100000 : 200000)
    }

    // // set up geometry for a line to be added to map, lofting it up a bit for *style*
    // var lineGeometry = options.path
    // 	.map(function (coordinate) {
    // 		return coordinate.concat([0]);
    // 	})

    // // // create and add line object
    // line = tb.line({
    // 	geometry: lineGeometry,
    // 	width: 5,
    // 	color: 'steelblue'
    // })
    soldier.playAnimation(options);

    soldier.followPath(
        options,
        function () {
            // console.log(id);
            gamestate.players[id].ori = destination;

            soldier.setCoords(destination);
            soldier.playAnimation({ animation: 0, duration: 100000000000 });
            // console.log(soldier.animations);   


            // for (iii in gamestate.players) {
            //     pple.get(parseInt(iii)).setCoords(gamestate.players[iii].dest);
            // }
            gamestate.players[id].moving = false;
        }
    );


    // })
}
   
function centerSoldier() {

    var soldier = pple.get(main_id);
    if (!soldier) return;
    let opt = {
        // center: [gamestate.players[main_id].x,gamestate.players[main_id].y],
        center: soldier.coordinates,
        bearing: map.getBearing(), zoom: 21,
        easing: easing
    };
    map.jumpTo(opt);
    tb.map.update = true;
}

var updater;
// var modelPath = 'C:/git/Drafts/hanman/models/simple.gaml';
// var experimentName = 'main';
// var gama = new GAMA("ws://localhost:6868/", modelPath, experimentName);
var geojson = {
    'type': 'FeatureCollection',
    'features': [
    ]
};
function on_connected() {
    start_sim();
}
function on_disconnected() {
    console.log("dis");
    clearInterval(updater);
} 
function start_renderer() {
    updater = setInterval(() => {
        // if (gama.state === "play") {
        // gama.step( 
        // console.log(gama);

        gama.getPopulation("prey", ["name", "color"], "EPSG:4326", function (message) {
            // console.log(message);
            if (typeof message == "object") {

            } else {
                try {
                    geojson = JSON.parse(message);

                    map.getSource("floorplan").setData(geojson);
                } catch (e) {
                    console.log('JSON.parse: ' + message);
                    // throw new Error('Error occured: ', e);
                }
            }
        });
        // gama.getPopulation("people", ["name"], "EPSG:4326", function (message) {
        //     if (typeof message == "object") {

        //     } else {
        //         geojson = null;
        //         geojson = JSON.parse(message);
        //         // geojson.features.forEach((e) => console.log(e.geometry.coordinates));



        //         geojson.features.forEach((e) => {
        //             // console.log(e.properties.name);
        //             if (creep.get(e.properties.name)) {
        //                 var dest = [e.geometry.coordinates[0], e.geometry.coordinates[1]];
        //                 // var pt = [destxx,destyy];
        //                 creepPath(e.properties.name, dest);
        //                 // creep.get(e.properties.name).setCoords([e.geometry.coordinates[0], e.geometry.coordinates[1]]);
        //             }
        //         });
        //         // console.log(pple);
        //     }
        // });
        // );

        // }
    }, 1);
}
