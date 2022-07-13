
if (!config) console.error("Config not set! Make a copy of 'config_template.js', add in your access token, and save the file as 'config.js'.");

mapboxgl.accessToken = config.accessToken;









let minZoom = 12;
let mapConfig = {
    map: { center: [-73.979681, 40.6974881], zoom: 22, pitch: 75, bearing: 38 },//[105.771453381, 10.022111449]
    human: {
        origin: [-73.979681, 40.6974881],
        type: 'glb',
        model: 'models/Soldier',
        // model: 'models/vehicles/car',
        rotation: { x: 90, y: -90, z: 0 },
        scale: 2,
        startRotation: { x: 0, y: 0, z: -38 },
        date: new Date(2020, 12, 12, 1, 12, 12, 12, 12)
    },
    names: {
        compositeSource: "composite",
        compositeSourceLayer: "building",
        compositeLayer: "3d-buildings"
    }
}

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v11',
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
        realSunlight: true,
        enableSelectingObjects: true,
        enableDraggingObjects: true,
        enableRotatingObjects: true,
        enableTooltips: true
    }
);

tb.setSunlight(mapConfig.human.date, map.getCenter());

// parameters to ensure the model is georeferenced correctly on the map
let human; let human1;

var soldier;
function createCustomLayer(layerName) {
    let model;
    //create the layer
    let customLayer3D = {
        id: layerName,
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {

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
                human = model.setCoords(mapConfig.human.origin);
                human.setRotation(mapConfig.human.startRotation); //turn it to the initial street way
                human.addTooltip("Walk with WASD keys", true, human.anchor, true, 2);
                human.castShadow = true;
                human.selected = true;
                human.addEventListener('ObjectChanged', onObjectChanged, false);
                tb.lights.dirLight.target = model;

                tb.add(human);
                init();

            });


        },
        render: function (gl, matrix) {
            tb.update();
        }
    };
    return customLayer3D;

};

function easing(t) {
    return t * (2 - t);
}

let velocity = 0.0, speed = 0.0, ds = 0.01;
let keys;

map.on('style.load', function () {

    map.addLayer(createCustomLayer('3d-model'));

    let l = mapConfig.names.compositeLayer;
    if (api.buildings) {
        if (!map.getLayer(l)) { map.addLayer(createCompositeLayer(l)); }
    }
    map.getCanvas().focus();

});

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

import { GUI } from 'https://threejs.org/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';
let stats, gui;
let fHover;

let api = {
    buildings: true,
    acceleration: 2,
    inertia: 3
};

function init() {
    // stats
    stats = new Stats();
    map.getContainer().appendChild(stats.dom);

    keys = {
        a: false,
        s: false,
        d: false,
        w: false
    };

    document.body.addEventListener('keydown', function (e) {

        const key = e.code.replace('Key', '').toLowerCase();
        if (keys[key] !== undefined)
            keys[key] = true;
    });
    document.body.addEventListener('keyup', function (e) {

        const key = e.code.replace('Key', '').toLowerCase();
        if (keys[key] !== undefined)
            keys[key] = false;
    });

    animate();

    // gui
    gui = new GUI();
    // this will define if there's a fixed zoom level for the model
    gui.add(api, 'buildings').name('buildings').onChange(changeGui);
    gui.add(api, 'acceleration', 1, 10).step(0.5);
    gui.add(api, 'inertia', 1, 5).step(0.5);
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
const w = canvas.width = 500;
const h = canvas.height = 300;
const ctx = canvas.getContext('2d');
let invertX = false;

const scene = {
    objects: [],
    update(t) {
        // here we only update the objects
        this.objects.forEach(obj => {
            if (invertX) {
                obj.dx *= -1;
            }
            obj.x += obj.dx;
            obj.y += obj.dy;
            if (obj.x > w) obj.x = (obj.x - w) - obj.w;
            if (obj.x + obj.w < 0) obj.x = w - (obj.x + obj.w);
            if (obj.y > h) obj.y = (obj.y - h) - obj.h;
            if (obj.y + obj.h < 0) obj.y = h - (obj.y + obj.h);
        });
        invertX = false;
    },
    draw() {
        // here we only draw
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.objects.forEach(obj => {
            ctx.fillStyle = obj.fill;
            ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        });
    }
}

function mainLoop() {
    scene.update();
    scene.draw();
    requestAnimationFrame(mainLoop);
}

for (let i = 0; i < 50; i++) {
    scene.objects.push({
        x: Math.random() * w,
        y: Math.random() * h,
        w: Math.random() * w / 5,
        h: Math.random() * h / 5,
        dx: (Math.random() * 3 - 1.5),
        dy: (Math.random() * 3 - 1.5),
        fill: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16)
    });
}
// every second do something external
setInterval(() => {
    invertX = true;
}, 1000);
// make one follow the cursor
onmousemove = e => {
    const evtX = e.clientX - canvas.offsetLeft;
    const evtY = e.clientY - canvas.offsetTop;
    const obj = scene.objects[0];
    const dirX = Math.sign(evtX - obj.x);
    const dirY = Math.sign(evtY - obj.y);
    obj.dx = Math.abs(obj.dx) * dirX;
    obj.dy = Math.abs(obj.dy) * dirY;
}

let duration = 100;
var opt = {
    animation: 3,
    duration: duration
}
// mainLoop();
function animate() {
    // human.playAnimation(opt);
    
    pple.forEach((value) => {
        value.playAnimation(opt);
    })
    requestAnimationFrame(animate);
    stats.update();
    speed = 0.0;

    if (!(keys.w || keys.s)) {
        if (velocity > 0) { speed = -api.inertia * ds }
        else if (velocity < 0) { speed = api.inertia * ds }
        if (velocity > -0.0008 && velocity < 0.0008) { speed = velocity = 0.0; return; }
    }

    if (keys.w)
        speed = api.acceleration * ds;
    else if (keys.s)
        speed = -api.acceleration * ds;

    velocity += (speed - velocity) * api.acceleration * ds;
    if (speed == 0.0) {
        velocity = 0;
        return;
    }

    human.set({ worldTranslate: new THREE.Vector3(0, -velocity, 0) });

    let options = {
        center: human.coordinates,
        bearing: map.getBearing(),
        easing: easing
    };

    function toDeg(rad) {
        return rad / Math.PI * 180;
    }

    function toRad(deg) {
        return deg * Math.PI / 180;
    }

    let deg = 1;
    let rad = toRad(deg);
    let zAxis = new THREE.Vector3(0, 0, 1);

    if (keys.a || keys.d) {
        rad *= (keys.d ? -1 : 1);
        human.set({ quaternion: [zAxis, human.rotation.z + rad] });
        options.bearing = -toDeg(human.rotation.z);
    }

    human.playAnimation(opt);

    map.jumpTo(options);
    tb.map.update = true;

}

function onObjectChanged(e) {
    let model = e.detail.object; //here's the object already modified
    if (api.buildings) {
        let c = model.coordinates;
        let point = map.project(c);
        let features = map.queryRenderedFeatures(point, { layers: [mapConfig.names.compositeLayer] });
        if (features.length > 0) {
            light(features[0]); // crash!
        }
    }
}

function light(feature) {
    fHover = feature;
    map.setFeatureState({
        source: fHover.source,
        sourceLayer: fHover.sourceLayer,
        id: fHover.id
    }, { select: true });
}




var updateSource;
var modelPath = 'C:/git/Drafts/hanman/models/simple.gaml';
var experimentName = 'main';
var gama;
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
if (experimentName != null && experimentName !== "") {
    gama = new GAMA("ws://localhost:6868/", modelPath, experimentName);
    // gama = new GAMA("ws://51.255.46.42:6001/", modelPath, experimentName);
    // gama.executor_speed=100;
    gama.connect(on_connected, on_disconnected);

}
function on_connected() {
    start_sim();
}
function on_disconnected() {
    clearInterval(updateSource);
}
function start_sim() {
    gama.launch(() => {
        initpeople();
    }
    );
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

var pple = new Map();
function initpeople() {

    gama.getPopulation("people", ["name"], "EPSG:4326", function (message) {
        if (typeof event.data == "object") {

        } else {
            geojson = null;
            geojson = JSON.parse(message);
            // geojson.features.forEach((e) => console.log(e.geometry.coordinates));


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
            geojson.features.forEach((e) => {
                // console.log(e); 
                tb.loadObj(options, function (model) {
                    var _human1 = model.setCoords([e.geometry.coordinates[0], e.geometry.coordinates[1]]);
                    _human1.setRotation(mapConfig.human.startRotation); //turn it to the initial street way
                    // human1.addTooltip("Walk with WASD keys", true, human1.anchor, true, 2);
                    _human1.castShadow = true;
                    _human1.selected = false;
                    // human1.addEventListener('ObjectChanged', onObjectChanged, false);

                    tb.add(_human1);
                    pple.set(e.properties.name, _human1);
                    // console.log(pple);
                    // init();
                    if (pple.size === 10) {
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
                        if (pple.get(e.properties.name)) {
                            pple.get(e.properties.name).setCoords([e.geometry.coordinates[0], e.geometry.coordinates[1]]);
                        }
                    });
                    // console.log(pple);
                }
            });
        // );

        // }
    }, 1000);
}