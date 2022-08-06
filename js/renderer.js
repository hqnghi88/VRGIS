
var pple = new Map();
var creepM = new Map();
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

        creepM.forEach((value) => {
            tb.remove(value);
        })
        creepM = new Map();
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

// function init() {
//     animate();

// }

// function animate() {
//     // human.playAnimation(opt);
//     // pple.forEach((value) => {
//     //     value.playAnimation({ animation: 3, duration: 100000000 });
//     // }) 
//     // console.log(gamestate.players[main_id].moving);
//     // var options = {
//     //     animation:  0,
//     //     duration: 500000000//ddistance/duration*200000
//     // }

//     pple.get(main_id).playAnimation({ animation: 0, duration: 100000000 });
//     requestAnimationFrame(animate);
//     // // pple.get(main_id).playAnimation({ animation:0, duration: 100    });
//     // // stats.update(); 
//     // let options = {
//     //     center: pple.get(main_id).coordinates,
//     //     bearing: map.getBearing(),
//     //     easing: easing
//     // };


//     // map.jumpTo(options);
//     tb.map.update = true;

// }


function creepPath(id, destination) {
    var creep = creepM.get(id);
    if (!creep) return;
    creep.setCoords(creep.coordinates);
    var route = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': [creep.coordinates, destination]
                }
            }
        ]
    };
    // let duration = 5000;
    // var options = {
    //     animation: 0,
    //     // path: data.routes[0].geometry.coordinates,
    //     path: route.features[0].geometry.coordinates,
    //     trackHeading: true,
    //     duration: duration
    // }
    const ddistance = turf.length(route);
    let duration = 1;
    // console.log( ddistance );
    // console.log( ddistance/duration*200000);
    // extract path geometry from callback geojson, and set duration of travel
    var options = {
        animation: 0,
        path: route.features[0].geometry.coordinates,
        trackHeading: true,
        duration: ddistance / duration * (ddistance > 0.05 ? 100000 : 200000)
    }

    creep.playAnimation(options);

    creep.followPath(
        options,
        function () {
            creep.setCoords(destination);
        }
    );
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
function createCompositeLayer(layerId) {
    let layer = {
        'id': layerId,
        'source': mapConfig.names.compositeSource,
        'source-layer': mapConfig.names.compositeSourceLayer,
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': minZoom,
        'paint': {
            'fill-extrusion-color':
                [
                    'case',
                    ['boolean', ['feature-state', 'select'], false],
                    "red",
                    ['boolean', ['feature-state', 'hover'], false],
                    "lightblue",
                    '#aaa'
                ],

            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                minZoom,
                0,
                minZoom + 0.05,
                ['get', 'height']
            ],
            'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                minZoom,
                0,
                minZoom + 0.05,
                ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.9
        }
    };
    return layer;
}

let api = {
    buildings: true,
    acceleration: 2,
    inertia: 3
};


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
function start_sim(s, e) {
    // gama.exp_id = e;
    // gama.socket_id = s;
    // gama.connect(initpeople, on_disconnected);
    // gama.evalExpr("world", function (ee) {
    //     console.log(ee)
    //     if (ee.startsWith("Wrong socket_id or exp_id")) {
    //         gama.launch(() => {
    //             console.log(gama.exp_id+" "+gama.socket_id);  
    //             initpeople(); 
    //         }
    //         );
    //     }else{
    // initpeople();
    //     }
    // });
    // gama.launch(initpeople);
    // gama.evalExpr("\"\"+CRS_transform(world.shape.points[1],\"EPSG:4326\")+\",\"+CRS_transform(world.shape.points[3],\"EPSG:4326\")", function (ee) {
    // 	ee = JSON.parse(ee).result.replace(/[{}]/g, "").replace(/['"]+/g, '');
    // 	var eee = ee.split(",");
    // 	// console.log(eee);
    // 	// console.log(eee[0]);
    // 	// console.log(eee[1]);
    // 	// console.log(eee[3]);
    // 	// console.log(eee[4]);
    // 	bbox = [
    // 		[eee[0], eee[1]], // southwestern corner of the bounds
    // 		[eee[3], eee[4]], // northeastern corner of the bounds
    // 	];
    // });
    // gama.evalExpr("CRS_transform(world.location,\"EPSG:4326\")", fitzoom);
    // map.on('style.load', () => {
    // 	const waiting = () => {
    // 		if (!map.isStyleLoaded()) {
    // 			setTimeout(waiting, 200);
    // 		} else {
    // 			gama.evalExpr("species(world).microspecies", createSources);
    // 		}
    // 	};
    // 	waiting();
    // });

    // gama.evalExpr("species(world).microspecies", createSources);
    // gama.evalExpr("experiment.parameters.pairs", createParameters);

    // gama.play();
}
var creep_options = {
    // type: mapConfig.human.type, //model type
    // obj: mapConfig.human.model + "." + mapConfig.human.type,
    type: 'glb',
    obj: "models/untitled.glb",
    scale: 2,
    units: 'meters',
    rotation: { x: 90, y: 0, z: 0 },
    anchor: 'top',
    clone: false //objects won't be cloned
}
function showCreep(geojson) {

    // loaded_indi();
    // console.log(geojson);
    // map.getSource("floorplan").setData(geojson);
    // geojson.features.forEach((e) => {
    // console.log(e.properties.name);
    // if (creepM.get(e.properties.name)) {
    //     var dest = [e.geometry.coordinates[0], e.geometry.coordinates[1]];
    //     // var pt = [destxx,destyy];
    //     creepPath(e.properties.name, dest);
    //     // creep.get(e.properties.name).setCoords([e.geometry.coordinates[0], e.geometry.coordinates[1]]);
    // } else {
    //     tb.loadObj(creep_options, function (model) {
    //         var _human1 = model.setCoords([e.geometry.coordinates[0], e.geometry.coordinates[1]]);

    //         _human1.addLabel(createLabelIcon("Gama_" + e.properties.name), true);//, soldier.anchor, 1.5);
    //         // console.log(mapConfig.human);
    //         // _human1.setRotation(mapConfig.human.startRotation); //turn it to the initial street way
    //         // human1.addTooltip("Walk with WASD keys", true, human1.anchor, true, 2);
    //         _human1.castShadow = true;
    //         _human1.selected = false;
    //         // human1.addEventListener('ObjectChanged', onObjectChanged, false);

    //         tb.add(_human1, "3d-game");
    //         creepM.set(e.properties.name, _human1);
    //         // console.log(pple);
    //         // init();
    //         if (creepM.size == geojson.features.length) {
    //             loaded_indi();
    //             //     start_renderer();
    //         }
    //     });
    // }
    // });
}

// function initpeople() {

//     gama.getPopulation("people", ["name"], "EPSG:4326", function (message) {
//         if (typeof message == "object") {

//         } else {
//             geojson = null;
//             geojson = JSON.parse(message);
//             // geojson.features.forEach((e) => console.log(e.geometry.coordinates));


//             geojson.features.forEach((e) => {
//                 tb.loadObj(creep_options, function (model) {
//                     var _human1 = model.setCoords([e.geometry.coordinates[0], e.geometry.coordinates[1]]);

//                     _human1.addLabel(createLabelIcon("Gama_" + e.properties.name), true);//, soldier.anchor, 1.5);
//                     // console.log(mapConfig.human);
//                     // _human1.setRotation(mapConfig.human.startRotation); //turn it to the initial street way
//                     // human1.addTooltip("Walk with WASD keys", true, human1.anchor, true, 2);
//                     _human1.castShadow = true;
//                     _human1.selected = false;
//                     // human1.addEventListener('ObjectChanged', onObjectChanged, false);

//                     tb.add(_human1);
//                     creep.set(e.properties.name, _human1);
//                     // console.log(pple);
//                     // init();
//                     if (creep.size === 10) {
//                         start_renderer();
//                     }
//                 });
//             });
//         }
//     });
// }
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
                    console.log('Error occured: ' + e);
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
