
if (!config) console.error("Config not set! Make a copy of 'config_template.js', add in your access token, and save the file as 'config.js'.");

mapboxgl.accessToken = config.accessToken;







 
let minZoom = 12;
var mapConfig = {
    map: { center: [105.771453381, 10.022111449], zoom: 21, pitch: 60, bearing: 0 },//[105.771453381, 10.022111449]
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

    maxZoom: 25,
    // projection: 'globe',
    zoom: mapConfig.map.zoom,
    center: mapConfig.map.center,
    pitch: mapConfig.map.pitch,
    bearing: mapConfig.map.bearing,
    attributionControl: false,
    cooperativeGestures: true,
    antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
});
map.addControl(new mapboxgl.FullscreenControl());

window.tb = new Threebox(
    map,
    map.getCanvas().getContext('webgl'),
    {
        defaultLights: true,
        // realSunlight: true,
        // enableSelectingObjects: true,
        // enableDraggingObjects: true,
        // enableRotatingObjects: true,
        // enableTooltips: true
    }
);
// tb.setSunlight(mapConfig.human.date, map.getCenter());

// parameters to ensure the model is georeferenced correctly on the map
// let human;  
function createCustomLayer(layerName) {
    // let model;
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


// let velocity = 0.0, speed = 0.0, ds = 0.01;

map.on('style.load', function () {

    map.addLayer(createCustomLayer('3d-model'));
    let customgameLayer3D = {
        id: '3d-game',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
        },
        render: function (gl, matrix) {
            tb.update();
        }
    };
    map.addLayer(customgameLayer3D);
    map.on('click', '3d-buildings', (e) => {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(e.features[0].properties.name)
            .addTo(map);
    });

    // map.addSource('floorplan', {
    //     'type': 'geojson',
    //     /*
    //     * Each feature in this GeoJSON file contains values for
    //     * `properties.height`, `properties.base_height`,
    //     * and `properties.color`.
    //     * In `addLayer` you will use expressions to set the new
    //     * layer's paint properties based on these values.
    //     */
    //     'data': geojson
    // });
    // map.addLayer({

    //     // 'id': 'room-extrusion',
    //     // 'type': 'circle',
    //     // 'source': 'floorplan',
    //     // 'layout': {},
    //     // 'paint': {
    //     //     'circle-color':['get', 'color'],
    //     // }


    //     'id': 'room-extrusion',
    //     'type': 'fill-extrusion',
    //     'source': 'floorplan',
    //     'paint': {
    //         // Get the `fill-extrusion-color` from the source `color` property.
    //         'fill-extrusion-color': ['get', 'color'],

    //         // Get `fill-extrusion-height` from the source `height` property.
    //         'fill-extrusion-height': 1,// ['get', 'height'],

    //         // Get `fill-extrusion-base` from the source `base_height` property.
    //         'fill-extrusion-base': 0,//['get', 'base_height'],

    //         // Make extrusions slightly opaque to see through indoor walls.
    //         // 'fill-extrusion-opacity': 0.5
    //     }
    // });
    // map.on('sourcedata', function(e) {

    //     // if (e.sourceId !== 'total') return
    //     if (e.sourceId !== 'floorplan') return
    //     if (e.isSourceLoaded !== true) return

    //     var data = {
    //       "type": "FeatureCollection",
    //       "features": []
    //     }

    //     // e.source.data.features.forEach(function(f) {
    //     map.querySourceFeatures('floorplan').forEach(function(f) {
    //       var object = turf.centerOfMass(f)
    //       var center = object.geometry.coordinates
    //       var radius = 1;
    //       var options = {
    //         steps: 4,
    //         units: 'meters',
    //         properties: object.properties
    //       };
    //       data.features.push(turf.circle(center, radius, options))
    //     })
    //     map.getSource('floorplan').setData(data);
    //   })
    let l = mapConfig.names.compositeLayer;
    if (api.buildings) {
        if (!map.getLayer(l)) { map.addLayer(createCompositeLayer(l)); }
    }
    // map.getCanvas().focus();
    loaded_indi();
})
    .on('click', function (e) {
        // console.log(gamestate.players[main_id].moving);
        // if (gamestate.players[main_id].moving === false) {
        // let xx=e.lngLat.lng;
        // let yy=e.lngLat.lat;
        // let aa=[];
        // let dd=0.00001;
        // aa.push([xx-dd,yy-dd]);
        // aa.push([xx+dd,yy-dd]);
        // aa.push([xx+dd,yy+dd]);
        // aa.push([xx-dd,yy+dd]);
        // aa.push([xx-dd,yy-dd]);
        // // console.log(geojson.features[0].geometry.coordinates);
        // geojson.features[0].geometry.coordinates=[aa];
        // // console.log(geojson.features[0].geometry.coordinates);
        // map.getSource("floorplan").setData(geojson);
        Game.getCoordinates(e.lngLat.lng, e.lngLat.lat);
        // }
    })
    // .on('dblclick', e => {
    //     // console.log(e);
    //     Game.getCoordinates(e.lngLat.lng, e.lngLat.lat);
    //   })
    ;
map.doubleClickZoom.disable();

function createLabelIcon(text) {
    let popup = document.createElement('div');


    popup.innerHTML = '<div title="' + text + '" style="font-size: 12;color: yellow;background-color:gray">' + text + '</div>';
    return popup;
}

function onObjectChanged(e) {
    if (pple.get(main_id) !== e) return;
    let model = e;//e.detail.object; //here's the object already modified
    // if (api.buildings) {
    //     let c = model.coordinates;
    //     let point = map.project(c);
    //     // let features = map.queryRenderedFeatures(point, { layers: ["room-extrusion"] });

    //     let dd = 100;
    //     var bbox = [[point.x - dd, point.y - dd], [point.x + dd, point.y + dd]];
    //     var features = map.queryRenderedFeatures(bbox, { layers: ["room-extrusion"] });
    //     if (features.length > 0) {
    //         // console.log(features);
    //         var pna = [];
    //         features.forEach(e => {
    //             if (!e.state.select) {
    //                 pna.push(e.properties.name);
    //                 light(e);
    //             }
    //         });
    //         if (pna.length > 0) {
    //             Client.killAgent(pna);
    //         }
    //     }
    // }
}

function light(feature) {
    map.setFeatureState({
        source: feature.source,
        sourceLayer: feature.sourceLayer,
        id: feature.id
    }, { select: true });
    // console.log(e);
    // geojson.features.forEach(function (item, index) {
    //     if (("" + item["id"]) === ("" + feature.id)) {
    //         geojson.features.splice(index, 1);
    //         map.getSource("floorplan").setData(geojson);
    //     }
    // });
    // geojson.features.pop(e);
    // console.log(geojson.features);
    // geojson.features = geojson.features.filter(val => val.id !== e.id)

    // delete geojson.features[e.id]; 
    // console.log(feature.properties.name);
    // new mapboxgl.Popup()
    // .setLngLat(e.lngLat)
    // .setHTML(e.features[0].properties.name)
    // .addTo(map);
}
// function createRoom() {
// }
 
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

function addLayer(type, key) {

	if (type === 'LineString') {
		map.addLayer({
			'id': `source${key}`,
			'type': 'line',
			'source': `source${key}`, // reference the data source
			'layout': {},
			'paint': {
				'line-color': {
					type: 'identity',
					property: 'color',
				},
			}
		});
	} else if (type === 'Point') {

		map.addLayer({
			'id': `source${key}`,
			'type': 'circle',
			'source': `source${key}`, // reference the data source
			'layout': {},
			'paint': {
				'circle-color': {
					type: 'identity',
					property: 'color',
				},
			}
		});
	} else {

		map.addLayer({
			'id': `source${key}`,
			'type': 'fill',
			'source': `source${key}`, // reference the data source
			'layout': {},
			'paint': {

				'fill-color': {
					type: 'identity',
					property: 'color',
				},
				'fill-outline-color': 'rgba(0,0,0,0)',

				// 'fill-color': '#0080ff', // blue color fill
				'fill-opacity': 0.5
			}
		});
	}
	map.on('click', `source${key}`, (e) => {
		new mapboxgl.Popup()
			.setLngLat(e.lngLat)
			.setHTML(e.features[0].properties.name)
			.addTo(map);
	});map.on('idle',function(){
		map.resize()
		})

} 