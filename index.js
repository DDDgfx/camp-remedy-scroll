//v2

//A scroll story with a map.
var map;
var mapLayersAdded = [];
var markersAdded = [];

//Layers
var legendScale;
var iconScale;
var layerData;
var searchLayers;

var scroller = scrollama();
var layerNow;
var progress;

var animationStep = 150;
var animations = {};

var lastMarker = 'blank';

var geocoder = d3.select("#controls").insert("div", ":first-child").attr("id", "geocode-input");

layerData = [{
        'name': "90 Minutes from D.C.",
        'function': commuteMode,
    },
    {
        "name": "Paradise on the Potomac",
        "function": zoomToProject
    },
    {
        "name": "Capacon Lodge, an AirBNB hotel",
        "function": cacaponLodge
    },
    {
        "name": "Sideling Estates Phase 1",
        "function": sidelingEstates
    },
    {
        "name": "A Timless Natural Ampitheatre",
        "function": festival
    }
];


///DOC READY
$(document).ready(function () {
    ////Map Init
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGRkZ2Z4IiwiYSI6IjJZRmFxUGcifQ.QQBTN4FSSN4uqpA1Hf4y3w';

    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/dddgfx/cl9frtktp000114lg4fzv7pim',
        center: [-77.405425, 39.043784],
        zoom: 7, // starting zoom
        bearing: 0, //bearing
        pitch: 0,
        tap: true,
        interactive: true,
        scrollZoom: false,
        dragPan: true
    });



    map.on('load', function () {
        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        console.log(map.getStyle().layers);
        // console.log(map.getSource('composite').vectorLayerIds);
        addLayers();
        //add a geo JSON source for 10 Exchange place. alone.
        // map.addSource('cacapon-project', {
        //     'type': 'geojson',
        //     'data': cacaponProject

        // });
        // //add a layer for 10 Exchange
        // map.addLayer({
        //     'id': 'cacapon-project',
        //     'type': 'symbol',
        //     'source': 'cacapon-project',
        //     'layout': {
        //         'icon-image': 'marker_black',
        //         'text-field' : ['get', 'Name'],
        //         'icon-anchor': 'bottom',
        //         'icon-size': 1,
        //         'icon-allow-overlap': true
        //     }
        // });

        createMultiPopUp(cacaponProject.features[0]);


        // createLegend(legendScale);
        // createGeocoder();




        scrollSetup();
        // d3.timeout(showFlow, 1000)
    });

    //When the map is clicked
    map.on('click', function (e) {
        console.log('click');
        console.log("zoom: " + map.getZoom() + "pitch: " + map.getPitch() + "bearing: " + map.getBearing());

        // // If the user clicked on one of your markers, get its information.
        var features = map.queryRenderedFeatures(e.point, {
            layers: legendScale.domain(), //.concat(['tenExchangePoint', '10-exchange-ammenities']) // replace with your layer name
        });

        //if you dont hit a marker...just back out.
        if (!features.length) {
            flyHome();
            return;
        }
        //if you do.
        var feature = features[0];

        createPopUp(feature);

        map.flyTo({
            center: feature.geometry.coordinates,
            zoom: 10,
            bearing: 30,
            // speed: 1.5,
            pitch: 20
        });
    });

    //when the mouse moves over the map - change cursor to pointer if its over a marker.
    map.on('mousemove', function (e) {
        // console.log(e);

        var features = map.queryRenderedFeatures(e.point, {
            layers: searchLayers, // 
        });

        if (!features.length) {
            //Remove POP UP
            if (map.getLayer('focusmarker')) map.removeLayer('focusmarker');
            if (map.getSource('focusmarker')) map.removeSource('focusmarker');

            var popUps = document.getElementsByClassName('uxpop');

            if (popUps[0]) {
                popUps[0].remove();
            }
            return;
        } else {
            var feature = features[0];
            // createPopUp(feature, e.lngLat);
            map.getCanvas().style.cursor = features.length ? 'pointer' : '';
        }
    });

});

function createLegend(scale) {
    console.log('legend');
    d3.select('#map-legend').remove();
    var title = d3.select("#copy-ux").insert("div", "#controls").attr("id", "map-title").html("Views");

    // var deck = d3.select("#copy-ux").insert("div", "#controls").attr("id", "map-deck").classed('small-copy', true).html("<div><ul><li>Serves 1 in 12 Americans (27 million Californians) with high-quality, affordable water supplies</li><li>Irrigates 750,000 acres of farmland</li><li>Sustains California’s X billion economy</li></ul></div>")
    // var instructions = d3.select("#copy-ux").insert("div", "#controls").attr("id", "map-instructions").classed('small-copy', true).html("<div>Hover over legend items to learn more about the water system</div>")

    // var legend = d3.select("#copy-ux").insert("div", "#controls").attr("id", "map-legend").html('Legend')

    // var legendItems = legend.selectAll('div').data(layerData.filter(d => d.legend == true)).join('div').classed('legend-item-holder', true)
    //     .on('mouseover', function (e, d) {
    //         legendItems.selectAll('.legend-item-label').style('font-weight', 300);
    //         d3.select(this).selectAll('.legend-item-label').style('font-weight', 600);
    //         layerActions(d);
    //     })
    //     .on('mouseleave', function (e, d) {
    //         legendItems.selectAll('.legend-item-label').style('font-weight', '300');
    //         layerReset(d);
    //     })

    // legendItems.append('img').attr('src', d => 'icons/' + scale(d.domain) + '.svg').classed('legend-item-icon', true).style('height', function (d) {
    //     if (d.iconsize) {

    //         var m;
    //         if (Array.isArray(d.iconsize)) {

    //             m = d.iconsize[4];

    //         } else {
    //             m = d.iconsize
    //         }

    //         return String(m * 100) + 'px';
    //     } else {
    //         return "25px";
    //     }
    // });

    var legend = d3.select("#copy-ux").insert("div", "#controls").attr("id", "map-legend");
    var legendItems = legend.selectAll('div').data(layerData).join('div').classed('legend-item-holder', true)
    .on('click', function (e, d) {
        legendItems.selectAll('.legend-item-label').style('font-weight', 300);
        d3.select(this).selectAll('.legend-item-label').style('font-weight', 600);
        console.log(d);
        var layerIndex = layerData.findIndex(l => d.name == l.name);
        smoothScroll("l-" + layerIndex);
        d.function();
    });


    legendItems.append('div').html(d => d.name).classed('legend-item-label', true);



}

function layerActions(d) {
    console.log(d);
    searchLayers = [d.domain];

    if (d.function) {
        // layerReset();
        d.function();
        return;
    }

    var symbollayers = layerData.filter(d => d.type == 'symbol');
    var linelayers = layerData.filter(d => d.type == 'line');

    symbollayers.forEach(function (l) {
        map.setPaintProperty(l.domain, 'icon-opacity', .01)
        map.setPaintProperty(l.domain, 'text-opacity', .1)
    });

    linelayers.forEach(function (l) {
        map.setPaintProperty(l.domain, 'line-opacity', .1)
    })

    if (d.type == 'symbol') {

        map.setPaintProperty(d.domain, 'icon-opacity', 1)
        map.setPaintProperty(d.domain, 'text-opacity', 1)
        // map.setLayoutProperty(d.domain, 'icon-size', .2);
        //['interpolate', Array(1), Array(1), 0, 0.5, 12, 1]

    }

    if (d.type == 'line') {
        map.setPaintProperty(d.domain, 'line-opacity', 1)
        // enableLineAnimation(d.domain);

    }
}

function layerReset() {
    searchLayers = legendScale.domain();
    var symbollayers = layerData.filter(d => d.type == 'symbol');
    var linelayers = layerData.filter(d => d.type == 'line');

    symbollayers.forEach(function (l) {
        map.setPaintProperty(l.domain, 'icon-opacity', l.iconopacity);
        map.setPaintProperty(l.domain, 'text-opacity', 1);
    })

    linelayers.forEach(function (l) {
        map.setPaintProperty(l.domain, 'line-opacity', 1);
        // map.setPaintProperty(l.domain, 'line-dasharray', []);
    });

    // if (animations.d.domain) {clearInterval(animations.d.domain);}
}

function addLayers() {

    legendScale = d3.scaleOrdinal()
        .domain(layerData.filter(d => d.legend == true).map(d => d.domain))
        .range(layerData.filter(d => d.legend == true).map(d => d.range))
        .unknown("marker_yellow");

    iconScale = d3.scaleOrdinal()
        .domain(layerData.filter(d => d.legend == true).map(d => d.domain))
        .range(layerData.filter(d => d.legend == true).map(d => d.icon))
        .unknown("marker_yellow");

    searchLayers = legendScale.domain();

    //Layer Adding function
    layerData.forEach(function (d) {

        if (d.render) {

            if (map.getLayer(d.domain)) map.removeLayer(d.domain);

            if (d.type == 'symbol') {
                map.addLayer({
                    'id': d.domain,
                    'type': d.type,
                    'source': d.source, // reference the data source
                    // 'source-layer': d.sourcelayer,
                    'layout': {
                        'icon-image': d.range,
                        'icon-anchor': d.iconanchor,
                        // 'icon-size': ['interpolate', ['linear'], ['zoom'], 12, .2, 16, .5],
                        'icon-size': d.iconsize,
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true
                        // 'text-field': ['get', 'AssetDescr'],
                        // // 'text-font': ["Montserrat"],
                        // 'text-anchor': "bottom-left",
                        // 'text-justify': "left",
                        // 'text-allow-overlap': false,
                        // 'text-ignore-placement': false
                    },
                    'paint': {
                        'icon-opacity': d.iconopacity,
                        // 'text-color': "#256079",
                        // 'text-halo-color': "white",
                        // 'text-halo-width': 2
                    },
                    // 'filter': ['==', d.field, 'pumping plant']
                    'filter': ["match", ["get", d.field], d.values, true, false]
                });

                if (d.labels) {
                    map.setPaintProperty(d.domain, 'text-color', '#000000');
                    map.setPaintProperty(d.domain, 'text-halo-color', 'white');
                    map.setPaintProperty(d.domain, 'text-halo-width', 2);
                    map.setLayoutProperty(d.domain, 'text-field', ['get', 'Name'])
                    map.setLayoutProperty(d.domain, 'text-anchor', 'top');
                    // map.setLayoutProperty(d.domain, 'text-font', ["Montserrat"]);
                }

            } else if (d.type == 'line') {


                map.addLayer({
                    'id': d.domain,
                    'type': 'line',
                    'source': d.source, // reference the data source
                    'source-layer': d.sourcelayer,
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': d.linecolor,
                        'line-width': d.linewidth,
                        'line-dasharray': d.linedash,
                        'line-opacity': d.lineopacity

                    }
                    // 'filter': ['==', 'District', district]
                });

                if (d.animate) {
                    enableLineAnimation(d.domain)
                }
            }
        }
    })
}

//layer functions
function zoomToProject() {


    console.log(mapLayersAdded);

    mapLayersAdded.forEach(d => map.removeLayer(d));



    if (window.matchMedia("(max-width: 600px)").matches) {
        console.log("small screen");

        map.flyTo({
            center: [-78.327432, 39.631297],
            zoom: 12, 
            bearing: -150, 
            pitch: 48,
            duration: 10000,
            curve: .1
        });

    } else {

        map.flyTo({
            center: [-78.327432, 39.631297],
            zoom: 14.5, // starting zoom
            bearing: -133, //bearing
            pitch: 65,
            duration: 10000,
            curve: .1
            // essential: true
        });
    }
}

function commuteMode() {
    map.fitBounds([
        [-80.36662605773022, 36.45164258254058],
        [-75.06159551921587, 40.09318373444462]
    ], {
        bearing: 0,
        pitch: 0
    });
   
    console.log(map.getStyle().layers);

    var popupOffsets = {
        'top': [0, 0],
        'top-left': [0, 0],
        'top-right': [0, 0],
        'bottom': [0, -25],
        'bottom-left': [0, 0],
        'bottom-right': [0, 0],
        'left': [20, 0],
        'right': [-7, -10]
    };

    const popup = new mapboxgl.Popup({ closeButton: false, anchor: 'bottom', offset: popupOffsets })
        
    // const marker = new mapboxgl.Marker({
    //         color: '#8a0f77',
    //         scale: 0.5,
    //         draggable: false,
    //         pitchAlignment: 'auto',
    //         rotationAlignment: 'auto'
    //     })
    //     .setLngLat([-78.32933568367781, 39.621401909295116])
    //     .setPopup(popup)
    //     .addTo(map)
    //     .togglePopup();

    // d3.selectAll('.mapboxgl-popup').remove();

    if (!map.getSource('urban-centers')) {
        map.addSource('urban-centers', {
            'type': 'geojson',
            'data': urbanCentersData

        });
    }

    map.addLayer({
        'id': 'urban-centers',
        'type': 'symbol',
        'source': 'urban-centers',
        'layout': {
            'icon-image': '1b_dot_sm',
            'icon-anchor': 'center',
            'icon-size': 1,
            'icon-allow-overlap': true
        }
    });


    

    //draw the route to the location
    var cacaponProject_x = cacaponProject.features[0].geometry.coordinates[0];
    var cacaponProject_y = cacaponProject.features[0].geometry.coordinates[1];
    var cacaponProjectCoords = cacaponProject_y + ',' + cacaponProject_x;

    urbanCentersData.features.forEach(function (feature) {
        var feature_x = feature.geometry.coordinates[0];
        var feature_y = feature.geometry.coordinates[1];
        var googleCoords = feature_y + ',' + feature_x;

        const directionsService = new google.maps.DirectionsService();


        directionsService.route(
            {
                    origin: googleCoords,
                    destination: cacaponProjectCoords,
                    travelMode: "DRIVING"
            },
            (response, status) => {
                //console.log(response);
                var route = {
                    'type': 'LineString',
                    'coordinates': []
                };
                var path = response.routes[0].overview_path;
                path.forEach(d => {
                    // console.log(d);
                    route['coordinates'].push([d.lng(), d.lat()]);
                })
                
                addNeighborhoodRouteG(route, feature.properties.Name);
                
                createDirectionsPopUp(feature, response);
                // commuteLegend(response, feature.properties.Name); 

               }
        )

    })


}

function riverCruiseProgress() {
    var apis = {};
    const pinRoute = riverCruiseLine.features[0].geometry.coordinates;
    
    var popupOffsets = {
        'top': [0, 0],
        'top-left': [0, 0],
        'top-right': [0, 0],
        'bottom': [0, -25],
        'bottom-left': [0, 0],
        'bottom-right': [0, 0],
        'left': [20, 0],
        'right': [-7, -10]
    };

    const popup = new mapboxgl.Popup({ closeButton: false, anchor: 'bottom', offset: popupOffsets })
        
    const marker = new mapboxgl.Marker({
            color: '#8a0f77',
            scale: 0.5,
            draggable: false,
            pitchAlignment: 'auto',
            rotationAlignment: 'auto'
        })
        .setLngLat([-78.32933568367781, 39.621401909295116])
        .setPopup(popup)
        .addTo(map)
        .togglePopup();

    if (map.getLayer('line')) {
        map.removeLayer('line');
    }

    if (map.getSource('walking-line')) {
        map.removeSource('walking-line');
    }

    map.addSource('walking-line', {
        type: 'geojson',
        // Line metrics is required to use the 'line-progress' property
        lineMetrics: true,
        data: riverCruiseLine
        });
        map.addLayer({
            type: 'line',
            source: 'walking-line',
            id: 'line',
            paint: {
            'line-color': '#05ADE5',
            'line-width': 10,
            'line-opacity': 0
            },
            layout: {
            'line-cap': 'round',
            'line-join': 'round'
        }
    });

    // The total animation duration, in milliseconds
    const animationDuration = 20000;
    // Use the https://turfjs.org/ library to calculate line distances and
    // sample the line at a given percentage with the turf.along function.
    const path = turf.lineString(pinRoute);
    // Get the total line distance
    const pathDistance = turf.lineDistance(path);
    //console.log(pathDistance);

    const startZoom = map.getZoom();
    var zoomScale = d3.scaleLinear([startZoom, 13.3], [0,1]);
    //console.log(zoomScale.invert(.5));
    const startBearing = map.getBearing();
    var bearingScale = d3.scaleLinear([startBearing, 80], [0,1]);
    const startPitch = map.getPitch();
    var pitchScale = d3.scaleLinear([startPitch, 52], [0,1]);
    const centerStart = map.getCenter();
    var centerXScale = d3.scaleLinear([centerStart.lng, 30.088995292191214], [0,1]);
    var centerYScale = d3.scaleLinear([centerStart.lat, -1.9056191853016458], [0,1]);

    // let start;

    apis.frame = function(progress) {
        console.log("aniframe!");
        //start is undefined, as it is when the animation is started - set it to the current moment.
        // if (!start) start = time;
        //create a variable for the nanimation phase which simply the point in time we are in in the animation devided by the animation total lnegth
        //essentially a percentage finished.
        const animationPhase = progress;

        //Stop the animation when we reach 1
        // if (animationPhase > 1) {
        //     return;
        // }   

        // Get the new latitude and longitude by sampling along the path
        const alongPath = turf.along(path, pathDistance * animationPhase)
            .geometry.coordinates;

        const lngLat = {
            lng: alongPath[0],
            lat: alongPath[1]
        };

        // Sample the terrain elevation. We round to an integer value to
        // prevent showing a lot of digits during the animation
        const elevation = Math.floor(
            // Do not use terrain exaggeration to get actual meter values
            map.queryTerrainElevation(lngLat, { exaggerated: false })
        );

        const distance = pathDistance * animationPhase;
        
        // // Update the popup altitude value and marker location
        popup.setHTML('<div class="popup-divider">' +
                        '<h4>Camp Remedy</h4>' +
                        '</div>');

                        
        // //move the marker
        // marker.setLngLat(lngLat);
        
        // Reduce the visible length of the line by using a line-gradient to cutoff the line
        // animationPhase is a value between 0 and 1 that reprents the progress of the animation
        map.setPaintProperty('line', 'line-gradient', [
            'step',
            ['line-progress'],
            '#05ADE5',
            animationPhase,
            'rgba(0, 255, 0, 0)'
            ]);
        
        // Rotate the camera at a slightly lower speed to give some parallax effect in the background25.59999999999968
        // const rotation = 150 - animationPhase * 40.0
        const rotation = startBearing + animationPhase * 30.0
        //const rotation = (startBearing - 60) * animationPhase;
        const zoom = (13.252945685535897 - startZoom) * animationPhase;

        //Center: LngLat(30.083257101936937, -1.9053182529979864)Zoom: 13.252945685535897 Pitch: 61.373225926465786 Bearing: 57.63311399999748
        
        // map.setBearing(rotation % 360);
        //map.setBearing(map.getBearing() + .2);


        //console.log(animationPhase);
        map.setZoom(15.5);
        map.setPitch(75);
        map.setBearing(-90);
        //console.log(centerStart);
        //console.log(lngLat);
        var tempFeature = turf.multiPoint([[centerStart.lng, centerStart.lat], [lngLat.lng, lngLat.lat]]);
        //var centroid = turf.centroid(tempFeature);
        //console.log(centroid.geometry.coordinates[0]);
        map.setCenter(lngLat);
        // map.setCenter({lng: centerXScale.invert(animationPhase), lat: centerYScale.invert(animationPhase)});
        
        // window.requestAnimationFrame(frame);
    }

    // window.requestAnimationFrame(frame);
    return apis;
}

function festival(){
    map.flyTo({
        center: [-78.334069, 39.622421],
        zoom: 15.58, // starting zoom
        bearing: -45.60, //bearing
        pitch: 62,
        duration: 2000,
        curve: .1
        // essential: true
    });

}

function sidelingEstates(){
    map.flyTo({
        center: [-78.334069, 39.622421],
        zoom: 15.58, // starting zoom
        bearing: -45.60, //bearing
        pitch: 62,
        duration: 2000,
        curve: .1
        // essential: true
    });

}

function cacaponLodge(){
    map.flyTo({
        center: [-78.334069, 39.622421],
        zoom: 15.58, // starting zoom
        bearing: -45.60, //bearing
        pitch: 62,
        duration: 2000,
        curve: .1
        // essential: true
    });

}

function riverCruise() {

        const pinRoute = riverCruiseLine.features[0].geometry.coordinates;
        var popupOffsets = {
            'top': [0, 0],
            'top-left': [0, 0],
            'top-right': [0, 0],
            'bottom': [0, -25],
            'bottom-left': [0, 0],
            'bottom-right': [0, 0],
            'left': [20, 0],
            'right': [-7, -10]
        };
            
        const popup = new mapboxgl.Popup({ closeButton: false, anchor: 'bottom', offset: popupOffsets })
                
        const marker = new mapboxgl.Marker({
            color: '#8a0f77',
            scale: 0.5,
            draggable: false,
            pitchAlignment: 'auto',
            rotationAlignment: 'auto'
        })
        .setLngLat([-78.32933568367781, 39.621401909295116])
        .setPopup(popup)
        .addTo(map)
        .togglePopup();

        if (map.getLayer('line')) {
            map.removeLayer('line');
        }

        if (map.getSource('walking-line')) {
            map.removeSource('walking-line');
        }

        map.addSource('walking-line', {
                type: 'geojson',
                // Line metrics is required to use the 'line-progress' property
                lineMetrics: true,
                data: riverCruiseLine
                });
                map.addLayer({
                    type: 'line',
                    source: 'walking-line',
                    id: 'line',
                    paint: {
                    'line-color': '#05ADE5',
                    'line-width': 10,
                    'line-opacity': 0
                    },
                    layout: {
                    'line-cap': 'round',
                    'line-join': 'round'
                }
            });

            // The total animation duration, in milliseconds
            const animationDuration = 20000;
            // Use the https://turfjs.org/ library to calculate line distances and
            // sample the line at a given percentage with the turf.along function.
            const path = turf.lineString(pinRoute);
            // Get the total line distance
            const pathDistance = turf.lineDistance(path);
            //console.log(pathDistance);

            const startZoom = map.getZoom();
            var zoomScale = d3.scaleLinear([startZoom, 13.3], [0,1]);
            //console.log(zoomScale.invert(.5));
            const startBearing = map.getBearing();
            var bearingScale = d3.scaleLinear([startBearing, 80], [0,1]);
            const startPitch = map.getPitch();
            var pitchScale = d3.scaleLinear([startPitch, 52], [0,1]);
            const centerStart = map.getCenter();
            var centerXScale = d3.scaleLinear([centerStart.lng, 30.088995292191214], [0,1]);
            var centerYScale = d3.scaleLinear([centerStart.lat, -1.9056191853016458], [0,1]);
            
            let start;
            
            function frame(time) {
                //start is undefined, as it is when the animation is started - set it to the current moment.
                if (!start) start = time;
                //create a variable for the nanimation phase which simply the point in time we are in in the animation devided by the animation total lnegth
                //essentially a percentage finished.
                const animationPhase = (time - start) / animationDuration;

                //Stop the animation when we reach 1
                if (animationPhase > 1) {
                    return;
                }   
            
                // Get the new latitude and longitude by sampling along the path
                const alongPath = turf.along(path, pathDistance * animationPhase)
                    .geometry.coordinates;

                const lngLat = {
                    lng: alongPath[0],
                    lat: alongPath[1]
                };
            
                // Sample the terrain elevation. We round to an integer value to
                // prevent showing a lot of digits during the animation
                const elevation = Math.floor(
                    // Do not use terrain exaggeration to get actual meter values
                    map.queryTerrainElevation(lngLat, { exaggerated: false })
                );

                const distance = pathDistance * animationPhase;
                
                // // Update the popup altitude value and marker location
                popup.setHTML('<div class="popup-divider">' +
                                '<h4>Camp Remedy</h4>' +
                                '</div>');

                                
                // //move the marker
                // marker.setLngLat(lngLat);
                
                // Reduce the visible length of the line by using a line-gradient to cutoff the line
                // animationPhase is a value between 0 and 1 that reprents the progress of the animation
                map.setPaintProperty('line', 'line-gradient', [
                    'step',
                    ['line-progress'],
                    '#05ADE5',
                    animationPhase,
                    'rgba(0, 255, 0, 0)'
                    ]);
                
                // Rotate the camera at a slightly lower speed to give some parallax effect in the background25.59999999999968
                // const rotation = 150 - animationPhase * 40.0
                const rotation = startBearing + animationPhase * 30.0
                //const rotation = (startBearing - 60) * animationPhase;
                const zoom = (13.252945685535897 - startZoom) * animationPhase;

                //Center: LngLat(30.083257101936937, -1.9053182529979864)Zoom: 13.252945685535897 Pitch: 61.373225926465786 Bearing: 57.63311399999748
                
                // map.setBearing(rotation % 360);
                //map.setBearing(map.getBearing() + .2);


                //console.log(animationPhase);
                map.setZoom(15.5);
                map.setPitch(75);
                map.setBearing(-90);
                //console.log(centerStart);
                //console.log(lngLat);
                var tempFeature = turf.multiPoint([[centerStart.lng, centerStart.lat], [lngLat.lng, lngLat.lat]]);
                //var centroid = turf.centroid(tempFeature);
                //console.log(centroid.geometry.coordinates[0]);
                map.setCenter(lngLat);
                // map.setCenter({lng: centerXScale.invert(animationPhase), lat: centerYScale.invert(animationPhase)});
                
                window.requestAnimationFrame(frame);
            }
            
            window.requestAnimationFrame(frame);

}

function showFlow() {
    console.log('show flow');
    // enableLineAnimation('cgb-canals');
    var newCenter = turf.centroid(mainline.features[0]);
    console.log(newCenter.geometry.coordinates);

    var newZoom = map.getZoom() + .5;
    // map.flyTo({
    //     center: newCenter.geometry.coordinates,
    //     duration: 4000,
    //     zoom: newZoom,
    //     pitch: 10,
    //     bearing: 5
    // });

    var pinRoute = mainline.features[0].geometry.coordinates[0];

    pinRoute = pinRoute.reverse();

    var popupOffsets = {
        'top': [0, 0],
        'top-left': [0, 0],
        'top-right': [0, 0],
        'bottom': [0, -25],
        'bottom-left': [0, 0],
        'bottom-right': [0, 0],
        'left': [0, 0],
        'right': [-7, -10]
    };

    const popup = new mapboxgl.Popup({
        closeButton: false,
        anchor: 'left',
        offset: popupOffsets,
        className: 'animatedpop'
    })


    popup.setHTML('<div>' +
        '<h3>California Aqueduct</h3>' +
        '</div>');

    const marker = new mapboxgl.Marker({
            color: '#05ADE5',
            scale: 0.5,
            draggable: false,
            pitchAlignment: 'auto',
            rotationAlignment: 'auto',
            scale: .1,
            className: 'animatedpop'
        })
        .setLngLat(pinRoute[0])
        .setPopup(popup)
        .addTo(map)
        .togglePopup();



    // if (map.getLayer('waterlines')) {
    //     map.removeLayer('waterlines');
    // }

    // if (map.getSource('waterlines')) {
    //     map.removeSource('waterlines');
    // }

    // map.addSource('waterlines', {
    //         type: 'geojson',
    //         // Line metrics is required to use the 'line-progress' property
    //         lineMetrics: true,
    //         data: mainline
    //         });

    // map.addLayer({
    //             type: 'line',
    //             source: 'waterlines',
    //             id: 'waterlines',
    //             paint: {
    //             'line-color': '#0979A9',
    //             'line-width': 2,
    //             'line-opacity': 1
    //             },
    //             layout: {
    //             'line-cap': 'round',
    //             'line-join': 'round'
    //         }
    //     });


    // The total animation duration, in milliseconds
    const animationDuration = 5000;
    // Use the https://turfjs.org/ library to calculate line distances and
    // sample the line at a given percentage with the turf.along function.
    const path = turf.lineString(pinRoute);
    // Get the total line distance
    const pathDistance = turf.lineDistance(path);
    //console.log(pathDistance);

    const startZoom = map.getZoom();
    console.log(startZoom);
    var zoomScale = d3.scaleLinear([startZoom, 13.3], [0, 1]);
    //console.log(zoomScale.invert(.5));
    const startBearing = map.getBearing();
    var bearingScale = d3.scaleLinear([startBearing, 80], [0, 1]);
    const startPitch = map.getPitch();
    var pitchScale = d3.scaleLinear([startPitch, 52], [0, 1]);
    const centerStart = map.getCenter();
    // console.log(centerStart);
    var centerXScale = d3.scaleLinear([centerStart.lng, 30.088995292191214], [0, 1]);
    var centerYScale = d3.scaleLinear([centerStart.lat, -1.9056191853016458], [0, 1]);

    let start;

    function frame(time) {
        //start is undefined, as it is when the animation is started - set it to the current moment.
        if (!start) start = time;
        //create a variable for the nanimation phase which simply the point in time we are in in the animation devided by the animation total lnegth
        //essentially a percentage finished.
        const animationPhase = (time - start) / animationDuration;


        var easePhase = d3.easeQuadInOut(animationPhase);

        //Stop the animation when we reach 1
        if (animationPhase > 1) {
            // map.removeLayer('waterlines');
            //marker.remove();
            return;
        }
        // Get the new latitude and longitude by sampling along the path
        const alongPath = turf.along(path, pathDistance * easePhase)
            .geometry.coordinates;

        const lngLat = {
            lng: alongPath[0],
            lat: alongPath[1]
        };

        const distance = pathDistance * animationPhase;


        //move the marker
        if (animationPhase < .436) {

            marker.setLngLat(lngLat);
        }


        // Reduce the visible length of the line by using a line-gradient to cutoff the line
        // animationPhase is a value between 0 and 1 that reprents the progress of the animation
        // map.setPaintProperty('waterlines', 'line-gradient', [
        //     'step',
        //     ['line-progress'],
        //     '#0979A9',
        //     easePhase,
        //     'rgba(0, 255, 0, 0)'
        //     ]);

        // Rotate the camera at a slightly lower speed to give some parallax effect in the background25.59999999999968
        // const rotation = 150 - animationPhase * 40.0
        const rotation = startBearing + animationPhase * 30.0
        //const rotation = (startBearing - 60) * animationPhase;
        const zoom = (13.252945685535897 - startZoom) * animationPhase;

        //Center: LngLat(30.083257101936937, -1.9053182529979864)Zoom: 13.252945685535897 Pitch: 61.373225926465786 Bearing: 57.63311399999748

        // map.setBearing(rotation % 360);
        //map.setBearing(map.getBearing() + .2);


        //console.log(animationPhase);
        // map.setZoom(zoomScale.invert(animationPhase));
        // map.setPitch(pitchScale.invert(animationPhase));
        // map.setBearing(bearingScale.invert(animationPhase));
        //console.log(centerStart);
        //console.log(lngLat);
        var tempFeature = turf.multiPoint([
            [centerStart.lng, centerStart.lat],
            [lngLat.lng, lngLat.lat]
        ]);
        //var centroid = turf.centroid(tempFeature);
        //console.log(centroid.geometry.coordinates[0]);

        // map.setCenter({lng: centerXScale.invert(animationPhase), lat: centerYScale.invert(animationPhase)});

        window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);

}


//UTILITIY
function enableLineAnimation(layerId) {
    console.log("animating " + layerId);
    // if (animations.layerId) {clearInterval(animations.layerId);}


    var step = 0;

    let dashArraySeq = [
        [0, 4, 3],
        [1, 4, 2],
        [2, 4, 1],
        [3, 4, 0],
        [0, 1, 3, 3],
        [0, 2, 3, 2],
        [0, 3, 3, 1]
    ];


    let dashArraySeq2 = [
        [0, 3, 4],
        [1, 3, 3],
        [2, 4, 1],
        [3, 4, 0],
        [0, 1, 3, 3],
        [0, 2, 3, 2],
        [0, 3, 3, 1]
    ];

    animations.layerId = d3.interval(() => {
        step = (step + 1) % dashArraySeq.length;
        map.setPaintProperty(layerId, 'line-dasharray', dashArraySeq[step]);
    }, animationStep);
}

function animateLine(layerName, route, duration) {
    console.log(route);
    var pinRoute = route.coordinates;
    // The total animation duration, in milliseconds
    const animationDuration = duration;
    // Use the https://turfjs.org/ library to calculate line distances and
    // sample the line at a given percentage with the turf.along function.
    const path = turf.lineString(pinRoute);
    // Get the total line distance
    const pathDistance = turf.lineDistance(path);
    const startZoom = map.getZoom();
    var zoomScale = d3.scaleLinear([startZoom, 13.3], [0, 1]);
    const startBearing = map.getBearing();
    var bearingScale = d3.scaleLinear([startBearing, 80], [0, 1]);
    const startPitch = map.getPitch();
    var pitchScale = d3.scaleLinear([startPitch, 52], [0, 1]);
    const centerStart = map.getCenter();
    var centerXScale = d3.scaleLinear([centerStart.lng, 30.088995292191214], [0, 1]);
    var centerYScale = d3.scaleLinear([centerStart.lat, -1.9056191853016458], [0, 1]);

    let start;

    function frame(time) {
        console.log('animating')
        //start is undefined, as it is when the animation is started - set it to the current moment.
        if (!start) start = time;
        //create a variable for the nanimation phase which simply the point in time we are in in the animation devided by the animation total lnegth
        //essentially a percentage finished.
        const animationPhase = (time - start) / animationDuration;
        var easePhase = d3.easeQuadInOut(animationPhase);

        //Stop the animation when we reach 1
        if (animationPhase > 1) {
            // map.removeLayer(layerName);
            // marker.remove();
            return;
        }
        // Get the new latitude and longitude by sampling along the path
        const alongPath = turf.along(path, pathDistance * easePhase)
            .geometry.coordinates;

        const lngLat = {
            lng: alongPath[0],
            lat: alongPath[1]
        };

        const distance = pathDistance * animationPhase;

        // Reduce the visible length of the line by using a line-gradient to cutoff the line
        // animationPhase is a value between 0 and 1 that reprents the progress of the animation
        
        map.setPaintProperty(layerName, 'line-gradient', [
            'step',
            ['line-progress'],
            '#1BB53B',
            animationPhase,
            'rgba(0, 255, 0, 0)'
            ]);

        // Rotate the camera at a slightly lower speed to give some parallax effect in the background25.59999999999968
        // const rotation = 150 - animationPhase * 40.0
        const rotation = startBearing + animationPhase * 30.0
        //const rotation = (startBearing - 60) * animationPhase;
        const zoom = (13.252945685535897 - startZoom) * animationPhase;

        //Center: LngLat(30.083257101936937, -1.9053182529979864)Zoom: 13.252945685535897 Pitch: 61.373225926465786 Bearing: 57.63311399999748

        // map.setBearing(rotation % 360);
        //map.setBearing(map.getBearing() + .2);


        //console.log(animationPhase);
        // map.setZoom(zoomScale.invert(animationPhase));
        // map.setPitch(pitchScale.invert(animationPhase));
        // map.setBearing(bearingScale.invert(animationPhase));
        //console.log(centerStart);
        //console.log(lngLat);
        var tempFeature = turf.multiPoint([
            [centerStart.lng, centerStart.lat],
            [lngLat.lng, lngLat.lat]
        ]);
        //var centroid = turf.centroid(tempFeature);
        //console.log(centroid.geometry.coordinates[0]);

        // map.setCenter({lng: centerXScale.invert(animationPhase), lat: centerYScale.invert(animationPhase)});

        window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);

}

function addNeighborhoodRouteG(route, layerName) {

    layerName = layerName + "G";
    //console.log(route);

    if (map.getLayer(layerName)) map.removeLayer(layerName);
    if (map.getSource(layerName)) map.removeSource(layerName);

    map.addSource(layerName, {
        'type': 'geojson',
        lineMetrics: true,
        'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': route
        }
    });

    map.addLayer({
        'id': layerName,
        'type': 'line',
        'source': layerName,
        'layout': {
            'line-join': 'miter',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#1BB53B',
            'line-width': 3,
            'line-opacity': .7
            // 'line-width': 1.5,
            // 'line-dasharray': [2, 3],
        }
    });

    if (!mapLayersAdded.includes(layerName)) {
        mapLayersAdded.push(layerName);
    };


    map.moveLayer(layerName, 'lots-line');
    animateLine(layerName, route, 2000);
}


function addMarker(d) {
    var layer = 'test';

    if (d.layer) {
        layer = d.layer.id
        // console.log(map.getStyle(d.layer.id));

    } else if (d.properties.Source == 'usbr') {
        layer = 'dams'
    } else if (d.properties.Source == 'cvp') {
        layer = 'cvp-dams'
    } else if (d.properties.Source == 'swc') {
        layer = 'swp-points'
    } else {
        layer = 'none'
    }

    // console.log(d);

    if (d.properties.Name == lastMarker) {
        // console.log("marker already here");
        return;

    }

    if (map.getLayer('focusmarker')) map.removeLayer('focusmarker');
    if (map.getSource('focusmarker')) map.removeSource('focusmarker');

    map.addSource('focusmarker', {
        'type': 'geojson',
        'data': d
    });

    map.addLayer({
        'id': 'focusmarker',
        'type': 'symbol',
        'source': 'focusmarker',
        'layout': {
            'icon-image': iconScale(layer),
            'icon-offset': [0, 0],
            // 'text-field' : ['get', 'Name'],
            'icon-anchor': 'bottom',
            'icon-size': .5,
            'icon-allow-overlap': true
        }
    });


    lastMarker = d.properties.Name;
}


function addMarkerIcon(d, icon) {
    console.log(d);
    var markerName = d.properties.Name.replace(/\s+/g, '');
    //add a marker - and does not remove any
    if (map.getLayer(markerName)) map.removeLayer(markerName);
    if (map.getSource(markerName)) map.removeSource(markerName);

    map.addSource(markerName, {
        'type': 'geojson',
        'data': d
    });

    map.addLayer({
        'id': markerName,
        'type': 'symbol',
        'source': markerName,
        'layout': {
            'icon-image': icon,
            'icon-offset': [0, 0],
            // 'text-field' : ['get', 'Name'],
            'icon-anchor': 'bottom',
            'icon-size': .5,
            'icon-allow-overlap': true
        }
    });


    markersAdded.push(markerName);


}


function createMultiPopUp(feature) {
    console.log('multipop');
    var fName = feature.properties.Name;

    var fDetails
    
    var smartCoords = function (f) {
        return feature.geometry.type == 'Point' ? feature.geometry.coordinates :
            feature.geometry.type == 'LineString' ? coords :
            feature.geometry.type == 'MultiLineString' ? coords :
            feature.geometry.type == 'Polygon' ? coords :
            feature.geometry.coordinates;
    }

    var popUps = document.getElementsByClassName('multipop');


    var popupOffsets = {
        'top': [0, 0],
        'top-left': [0, 0],
        'top-right': [0, 0],
        'bottom': feature.geometry.type == 'Point' ? [0, -50] : [0, -0],
        'bottom-left': [0, 0],
        'bottom-right': [0, 0],
        'left': [0, 0],
        'right': [0, 0]
    };

    var popup = new mapboxgl.Popup({
            offset: popupOffsets,
            focusAfterOpen: true,
            maxWidth: 300,
            className: 'multipop'
        })
        .setLngLat(smartCoords(feature))
        .setHTML(
            // '<div class="legend-item-holder">' +
            // '<img src="icons/' + legendScale(feature.layer.id) + '.svg" alt="'+ feature.layer.id + '" class="legend-item-icon">' +
            '<h3>' + fName + '</hs>' 
            // '<h4>' + fDetails + '</h4>'
            // '</div>'
        )
        .addTo(map);

    if (feature.geometry.type == 'Point') {
        addMarkerIcon(feature, 'marker_black');
    }

}


function createPopUp(feature, coords) {

    var smartCoords = function (f) {
        return feature.geometry.type == 'Point' ? feature.geometry.coordinates :
            feature.geometry.type == 'LineString' ? coords :
            feature.geometry.type == 'MultiLineString' ? coords :
            feature.geometry.coordinates;
    }

    var popUps = document.getElementsByClassName('uxpop');

    if (popUps[0]) {
        // console.log('removing pop')
        popUps[0].remove();
    }

    var popupOffsets = {
        'top': [0, 0],
        'top-left': [0, 0],
        'top-right': [0, 0],
        'bottom': feature.geometry.type == 'Point' ? [0, -50] : [0, -0],
        'bottom-left': [0, 0],
        'bottom-right': [0, 0],
        'left': [0, 0],
        'right': [0, 0]
    };

    var popup = new mapboxgl.Popup({
            offset: popupOffsets,
            focusAfterOpen: true,
            maxWidth: 300,
            className: 'uxpop'
        })
        .setLngLat(smartCoords(feature))
        .setHTML(
            // '<div class="legend-item-holder">' +
            // '<img src="icons/' + legendScale(feature.layer.id) + '.svg" alt="'+ feature.layer.id + '" class="legend-item-icon">' +
            '<h3>' + fName + '</hs>' +
            '<h4>' + fDetails + '</h4>'
            // '</div>'
        )
        .addTo(map);
        
    if (feature.geometry.type == 'Point') {
        addMarker(feature);
    }

}

function createDirectionsPopUp(feature, directionsData) {

    // console.log(directionsData);
    var duration = directionsData.routes[0].legs[0].duration.text;


    var popup = new mapboxgl.Popup({
            offset: [0, 0],
            className: 'clear-popup',
            anchor: 'top'
        })
        .setLngLat(feature.geometry.coordinates)
        .setHTML(
            '<h3>' + feature.properties.Name + '</h3>' +
            '<h4>' + duration + '</h4>'
        )
        .addTo(map);

}



function scrollSetup() {
    console.log('Scroll Setup');
    // using d3 for convenience, and storing a selected elements

    var $container = d3.select('#scroll');
    var $graphic = $container.select('.map-holder');

    var $chart = $graphic.select('.chart');
    var $text = $container.select('.scroll-copy');

    var $step = $text.selectAll('.content-layer')
        .data(layerData).join('div')
        .classed('content-layer', true)
        .attr('id', (d, i) => "l-" + i );
    // .datum(d => d);

    $step.append('div').classed('layer-title', true).html(d => d.name);
    $step.append('div').classed('layer-copy', true).html(d => d.copy);

    // resize function to set dimensions on load and on page resize
    function handleResize() {
        // 1. update height of step elements for breathing room between steps
        var stepHeight = Math.floor(window.innerHeight * 0.75);
        $step.style('height', stepHeight + 'px');

        var figureHeight = window.innerHeight;
        var figureMarginTop = (window.innerHeight - figureHeight);

        $graphic.style("height", figureHeight + "px").style("top", figureMarginTop + "px");

        map.resize();


        map.fitBounds([
            [-80.36662605773022, 36.45164258254058],
            [-75.06159551921587, 40.09318373444462]
        ], {
            bearing: 0,
            pitch: 0
        });


        // 4. tell scrollama to update new element dimensions
        scroller.resize();

    };

    // scrollama event handlers
    function handleStepEnter(response) {
        // response = { element, direction, index }
        console.log("step enter");
        var layerNow = d3.select(response.element).datum();


        // $graphic.classed('is-fixed', true);

        // fade in current step
        $step.classed('is-active', function (d, i) {
            return i === response.index;
        })

        layerActions(layerNow);

        // update graphic based on step here
        var stepData = $step.datum();

        console.log(stepData);

    }

    function stepProgress(response) {
        
        // if (response.index == 2) {
        //     riverCruiseProgress().frame(response.progress);
        // }

        // console.log(response);
        //riverCruiseProgress();
    }

    // kick-off code to run once on load
    function init() {
        console.log("prep scroll");
        // 1. call a resize on load to update width/height/position of elements
        handleResize();

        // 2. setup the scrollama instance
        // 3. bind scrollama event handlers (this can be chained like below)
        scroller.setup({
                graphic: '.map-holder', // the graphic
                text: '#scroll .scroll-copy .content-layer', // the step container
                step: '.content-layer', // the step elements
                offset: 0.75, // set the trigger to be 1/2 way down screen
                debug: false, // display the trigger offset for testing
                progress: true,
            })
            .onStepEnter(handleStepEnter)
            .onStepProgress(stepProgress);
        // .onContainerEnter(handleContainerEnter)
        // .onContainerExit(handleContainerExit);
        // setup resize event
        window.addEventListener('resize', handleResize);
    };

    // start it up
    init();

}

function smoothScroll(el) {
    console.log("scroll it down!")
    console.log(el);
    var mult = Number(el.split("-")[1]) + 1;

    var scrollable = d3.select("#" + el);

    var scrollheight = scrollable.property("scrollHeight");
    var introHeight = d3.select("#scroll").property("scrollTop");

    

    var scrollVal = (scrollheight * mult) + (50 * mult);
    // d3.select("#scrollable").transition().duration(3000) 
    //     .tween("uniquetweenname", scrollTween(scrollheight)); 
    console.log(scrollVal);

    d3.transition()
    // .delay(1500)
    .duration(500)
    .tween("scroll", scrollTween(scrollVal));

    function scrollTween(offset) {
    return function() {
        var i = d3.interpolateNumber(window.pageYOffset || document.documentElement.scrollTop, offset);
        return function(t) { scrollTo(0, i(t)); };
    };
    }

}


////mapData
var cacaponProject = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [-78.34111449049774, 39.62377024800164]
        },
        "properties": {
            "Name": "The Great Cacapon Project",
            "Category": "Primary",
            "Address": "1 Pecks Road, Great Cacapon, WV 25422",
            "Google Business URL": ""
        }
    }]
}

const riverCruiseLine = {
    "type": "FeatureCollection",
    "name": "riverCruise",
    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    "features": [
    { "type": "Feature", "properties": { "id": 1 }, "geometry": { "type": "LineString", "coordinates":  [ [ -78.286450981335832, 39.621715754228212 ], [ -78.292829248645859, 39.624125321878665 ], [ -78.298640558861649, 39.626534889529118 ], [ -78.306365349270465, 39.629440544637021 ], [ -78.311822311302379, 39.631212285556472 ], [ -78.315011444957392, 39.631637503377135 ], [ -78.318554926796295, 39.632984026475924 ], [ -78.321177103357073, 39.633905331754036 ], [ -78.324791454832763, 39.634401419211486 ], [ -78.328193197398107, 39.635677072673488 ], [ -78.332091027420901, 39.636810986861938 ], [ -78.334996682528796, 39.637732292140051 ], [ -78.33939060000904, 39.63858272778139 ], [ -78.344422344220277, 39.639291424149171 ], [ -78.34846191351663, 39.640141859790504 ], [ -78.351651047171643, 39.640992295431843 ], [ -78.355903225378327, 39.640921425795064 ], [ -78.358950619759781, 39.639645772333061 ], [ -78.35958844649079, 39.637944901050382 ], [ -78.359517576854017, 39.635960551220599 ] ] 
   } }
    ]
}

var urbanCentersData = {
    "type": "FeatureCollection",
    "name": "neighborhoods",
    "crs": {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    },
    "features": [{
            "type": "Feature",
            "properties": {
                "Name": "Washington DC",
                "description": null,
                "timestamp": null,
                "begin": null,
                "end": null,
                "altitudeMode": null,
                "tessellate": -1,
                "extrude": 0,
                "visibility": -1,
                "drawOrder": null,
                "icon": null
            },
            "geometry": {
                "type": "Point",
                "coordinates": [-77.037118641235, 38.90371417174988, 0.0]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "Name": "Baltimore",
                "description": null,
                "timestamp": null,
                "begin": null,
                "end": null,
                "altitudeMode": null,
                "tessellate": -1,
                "extrude": 0,
                "visibility": -1,
                "drawOrder": null,
                "icon": null
            },
            "geometry": {
                "type": "Point",
                "coordinates": [-76.6092127992475, 39.294566274937, 0.0]
            }
        }
    ]
}
    