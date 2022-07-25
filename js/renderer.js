
if (!config) console.error("Config not set! Make a copy of 'config_template.js', add in your access token, and save the file as 'config.js'.");

mapboxgl.accessToken = config.accessToken;









var pple = new Map();
var creep = new Map();
let minZoom = 12;
var mapConfig = {
    map: { center: [105.771453381, 10.022111449], zoom: 20, pitch: 45, bearing: 0 },//[105.771453381, 10.022111449]
    human: {
        origin: [105.771453381, 10.022111449],
        type: 'glb',
        model: 'models/Soldier',
        scale: 2,
        units: 'meters',
        rotation: { x: 90, y: 0, z: 0 },
        anchor: 'center',//default rotation
        date: new Date(2020, 12, 12, 1, 12, 12, 12, 12)
    },
    names: {
        compositeSource: "composite",
        compositeSourceLayer: "building",
        compositeLayer: "3d-buildings"
    }
}

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v11',
    // style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
    // style: "mapbox://styles/mapbox/streets-v11?optimize=true",
    // style: "https://wasac.github.io/mapbox-stylefiles/unvt/style.json",

    zoom: mapConfig.map.zoom,
    center: mapConfig.map.center,
    pitch: mapConfig.map.pitch,
    bearing: mapConfig.map.bearing,
    antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
});

window.tb = new Threebox(
    map,
    map.getCanvas().getContext('webgl'),
    {
        defaultLights: true,
        // realSunlight: true,
        enableSelectingObjects: true,
        // enableDraggingObjects: true,
        // enableRotatingObjects: true,
        // enableTooltips: true
    }
);
// tb.setSunlight(mapConfig.human.date, map.getCenter());

// parameters to ensure the model is georeferenced correctly on the map
// let human;  
function createCustomLayer(layerName) {
    let model;
    //create the layer
    let customLayer3D = {
        id: layerName,
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
            Client.askNewPlayer();

            // if (experimentName != null && experimentName !== "") {
            //     gama = new GAMA("ws://localhost:6868/", modelPath, experimentName);
            //     // gama = new GAMA("ws://51.255.46.42:6001/", modelPath, experimentName);
            //     // gama.executor_speed=100;
            //     gama.connect(on_connected, on_disconnected);

            // }
        },
        render: function (gl, matrix) {
            tb.update();
        }
    };
    return customLayer3D;

};

function createRoom() {
    Client.createRoom();
}
function startGame() {
    let s = document.getElementById('room_id').value;
    let e = document.getElementById('exp_id').value;
    if (s === "" || e === "") {
        Client.startGame();
    } else {
        start_sim(s, e);
    }
}
function easing(t) {
    return t * (2 - t);
}

let velocity = 0.0, speed = 0.0, ds = 0.01;

map.on('style.load', function () {

    map.addLayer(createCustomLayer('3d-model'));

    let l = mapConfig.names.compositeLayer;
    if (api.buildings) {
        if (!map.getLayer(l)) { map.addLayer(createCompositeLayer(l)); }
    }
    map.getCanvas().focus();

})
    .on('click', function (e) {
        // console.log(gamestate.players[main_id].moving);
        // if (gamestate.players[main_id].moving === false) {


        Game.getCoordinates(e.lngLat.lng, e.lngLat.lat);
        // }
    })
    ;

const filterInput = document.getElementById('filter-input');
filterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const value = e.target.value.trim().toLowerCase();
        if (value !== "") {
            Client.sendMessage(value);
            // console.log("send chat " + value);
        }
        filterInput.value = "";
    }
});

function createLabelIcon(text) {
    let popup = document.createElement('div');


    popup.innerHTML = '<div title="' + text + '" style="font-size: 12;color: yellow;background-color:gray">' + text + '</div>';
    return popup;
}
function travelPath(id, destination) {
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
    let duration = 5000;
    // extract path geometry from callback geojson, and set duration of travel
    var options = {
        animation: 1,
        // path: data.routes[0].geometry.coordinates,
        path: route.features[0].geometry.coordinates,
        // trackHeading:false,
        duration: duration
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
            // soldier.playAnimation({ animation:-12, duration: 1 });

            // for (iii in gamestate.players) {
            //     pple.get(parseInt(iii)).setCoords(gamestate.players[iii].dest);
            // }
            gamestate.players[id].moving = false;
        }
    );


    // })
}


function onObjectChanged(e) {
    let model = e.detail.object; //here's the object already modified
    if (api.buildings) {
        let c = model.coordinates;
        let point = map.project(c);

        var bbox = [[point.x - 5, point.y - 5], [point.x + 5, point.y + 5]];
        var features = map.queryRenderedFeatures(bbox, { layers: ['3d-model'] });
        // let features = map.queryRenderedFeatures(point, { layers: ["3d-model"] });
        if (features.length > 0) {
            light(features[0]); // crash!
        }
    }
}

function light(feature) {
    console.log(feature);
    fHover = feature;
    map.setFeatureState({
        source: fHover.source,
        sourceLayer: fHover.sourceLayer,
        id: fHover.id
    }, { select: true });
}

function creepPath(id, destination) {
    var soldier = creep.get(id);
    if (!soldier) return;
    soldier.setCoords(soldier.coordinates);
    var route = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': [soldier.coordinates, destination]
                }
            }
        ]
    };
    let duration = 5000;
    var options = {
        animation: 0,
        // path: data.routes[0].geometry.coordinates,
        path: route.features[0].geometry.coordinates,
        trackHeading: true,
        duration: duration
    }
    soldier.playAnimation(options);

    soldier.followPath(
        options,
        function () {
            soldier.setCoords(destination);
        }
    );
}
function centerSoldier() {

    var soldier = pple.get(main_id);
    if (!soldier) return;
    let opt = {
        // center: [gamestate.players[main_id].x,gamestate.players[main_id].y],
        center: soldier.coordinates,
        bearing: map.getBearing(), zoom: 20,
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

// import { GUI } from 'https://threejs.org/examples/jsm/libs/lil-gui.module.min.js';
// import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';
// let stats, gui;
let fHover;

let api = {
    buildings: true,
    acceleration: 2,
    inertia: 3
};

function init() {
    // stats
    // stats = new Stats();
    // map.getContainer().appendChild(stats.dom);

    animate();

    // gui
    // gui = new GUI();
    // // this will define if there's a fixed zoom level for the model
    // gui.add(api, 'buildings').name('buildings').onChange(changeGui);
    // gui.add(api, 'acceleration', 1, 10).step(0.5);
    // gui.add(api, 'inertia', 1, 5).step(0.5);
}

function changeGui() {
    let l = mapConfig.names.compositeLayer;
    if (api.buildings) {
        if (!map.getLayer(l)) { map.addLayer(createCompositeLayer(l)); }
    }
    else {
        if (map.getLayer(l)) { map.removeLayer(l) }

    }

    tb.map.repaint = true;
}

let duration = 50;
var opt = {
    animation: 3,
    duration: duration
}
// mainLoop();
function animate() {
    // human.playAnimation(opt);
    // pple.forEach((value) => {
    //     value.playAnimation({ animation: 3, duration: 100000000 });
    // }) 
    requestAnimationFrame(animate);
    // stats.update(); 

    // map.jumpTo(options); 
    tb.map.update = true;

}



var updateSource;
var modelPath = 'C:/git/Drafts/hanman/models/simple.gaml';
var experimentName = 'main';
var gama = new GAMA("ws://localhost:6868/", modelPath, experimentName);
var geojson = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [0, 0]
            }
        }
    ]
};
function on_connected() {
    start_sim();
}
function on_disconnected() {
    clearInterval(updateSource);
}
function start_sim(s, e) {
    gama.exp_id = e;
    gama.socket_id = s;
    gama.connect(initpeople, on_disconnected);
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

function initpeople() {

    gama.getPopulation("people", ["name"], "EPSG:4326", function (message) {
        if (typeof message == "object") {

        } else {
            geojson = null;
            geojson = JSON.parse(message);
            // geojson.features.forEach((e) => console.log(e.geometry.coordinates));


            let creep_options = {
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
            geojson.features.forEach((e) => {
                tb.loadObj(creep_options, function (model) {
                    var _human1 = model.setCoords([e.geometry.coordinates[0], e.geometry.coordinates[1]]);

                    _human1.addLabel(createLabelIcon("Gama_" + e.properties.name), true);//, soldier.anchor, 1.5);
                    // console.log(mapConfig.human);
                    // _human1.setRotation(mapConfig.human.startRotation); //turn it to the initial street way
                    // human1.addTooltip("Walk with WASD keys", true, human1.anchor, true, 2);
                    _human1.castShadow = true;
                    _human1.selected = false;
                    // human1.addEventListener('ObjectChanged', onObjectChanged, false);

                    tb.add(_human1);
                    creep.set(e.properties.name, _human1);
                    // console.log(pple);
                    // init();
                    if (creep.size === 10) {
                        start_renderer();
                    }
                });
            });
        }
    });
}
function start_renderer() {
    updateSource = setInterval(() => {
        // if (gama.state === "play") {
        // gama.step(

        gama.getPopulation("people", ["name"], "EPSG:4326", function (message) {
            if (typeof message == "object") {

            } else {
                geojson = null;
                geojson = JSON.parse(message);
                // geojson.features.forEach((e) => console.log(e.geometry.coordinates));



                geojson.features.forEach((e) => {
                    // console.log(pple.get(e.properties.name));
                    if (creep.get(e.properties.name)) {
                        var dest = [e.geometry.coordinates[0], e.geometry.coordinates[1]];
                        // var pt = [destxx,destyy];
                        creepPath(e.properties.name, dest);
                        // creep.get(e.properties.name).setCoords([e.geometry.coordinates[0], e.geometry.coordinates[1]]);
                    }
                });
                // console.log(pple);
            }
        });
        // );

        // }
    }, 5000);
}