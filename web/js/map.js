// Global variables
let map;
let lat = 0;
let lon = 0;
let zl = 3;
let path = '';

// map args
let field = 'C16001002';
let num_classes = 5;
let scheme = 'quantiles';
let palette = 'YlOrRd';

// put this in your global variables
let geojsonPath = 'data/censustracts.geojson';
let geojson_data;
let geojson_layer;

let brew = new classyBrew();
let legend = L.control({position: 'bottomright'});
let info_panel = L.control();

let la_bounds = [
	[34.96566249797373,-117.08526849746706],
	[33.48736604069934,-119.5654320716858]
]

// initialize
$( document ).ready(function() {
	createMap(lat,lon,zl);
	getGeoJSON();
});

// create the map
function createMap(lat,lon,zl){
	map = L.map('map').setView([lat,lon], zl);

	
	let satellite = L.tileLayer('https://api.mapbox.com/styles/v1/yohman/ckon2lqfc00bu17nrdwdtsmke/tiles/512/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw', 
	{
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox/yohman</a>',
		maxZoom: 18,
		tileSize: 512,
		zoomOffset: -1,
		accessToken: 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw'
	}).addTo(map);

	map.createPane('labels').style.zIndex = 650;
	map.createPane('boundaries').style.zIndex = 640;
	// disable click events
	map.getPane('labels').style.pointerEvents = 'none';
	
	let positronLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
		// attribution: cartodbAttribution,
		pane: 'labels'
	}).addTo(map);



	map.fitBounds(la_bounds)

}

let boundary_layer;
let boundary_layers = [
	{
		name: 'Service Planning Areas (2012)',
		short: 'SPA',
		path: 'data/spa.geojson'
	},
	{
		name: 'LA County Neighborhoods',
		short: 'neighborhoods',
		path: 'data/neighborhoods.geojson'
	},
]

function addBoundaryLayer(short_name){

	if(boundary_layer)
	{
		boundary_layer.clearLayers()
	}

	// find it in the list of layers
	layer2add = boundary_layers.find(({short}) => short === short_name)
	console.log(layer2add)

	if(layer2add != undefined){
		$.getJSON(layer2add.path,function(data){
			console.log(data)
			boundary_options = {
				fill: false,
				weight: 1.5,
				pane:'boundaries'
			}
			boundary_layer = L.geoJson(data,boundary_options).addTo(map)
			// put the data in a global variable
			// geojson_data = data;
	
		})
	}
	else{
		console.log('layer ' + short_name + ' not found')
	}


}

// function to get the geojson data
function getGeoJSON(){

	$.getJSON(geojsonPath,function(data){
		console.log(data)

		// put the data in a global variable
		geojson_data = data;

		// call the map function
		mapGeoJSON();
	})
}
// function mapGeoJSON(field,num_classes,color,scheme){
function mapGeoJSON(args){

	// populate args
	args = args || {};
	field = args.field || field;
	num_classes = args.num_classes || num_classes;
	palette = args.palette || palette;
	scheme = args.scheme || scheme;

	// clear layers in case it has been mapped already
	if (geojson_layer){
		geojson_layer.clearLayers()
	}
	
	// create an empty array
	let values = [];

	// based on the provided field, enter each value into the array
	geojson_data.features.forEach(function(item,index){
		values.push(item.properties[field])
	})

	// set up the "brew" options
	brew.setSeries(values);
	brew.setNumClasses(num_classes);
	brew.setColorCode(palette);
	brew.classify(scheme);

	// create the layer and add to map
	geojson_layer = L.geoJson(geojson_data, {
		style: getStyle, //call a function to style each feature
		onEachFeature: onEachFeature,
	}).addTo(map);

	// create the legend
	createLegend();

	// create the infopanel
	createInfoPanel();
}

function getStyle(feature){
	return {
		stroke: true,
		color: 'white',
		weight: 0.8,
		fill: true,
		fillColor: brew.getColorInRange(feature.properties[field]),
		fillOpacity: 0.8
	}
}

// return the color for each feature
function getColor(d) {

	return d > 1000000000 ? '#800026' :
		   d > 500000000  ? '#BD0026' :
		   d > 200000000  ? '#E31A1C' :
		   d > 100000000  ? '#FC4E2A' :
		   d > 50000000   ? '#FD8D3C' :
		   d > 20000000   ? '#FEB24C' :
		   d > 10000000   ? '#FED976' :
					  '#FFEDA0';
}

function createLegend(){
	legend.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'info legend'),
		breaks = brew.getBreaks(),
		labels = [],
		from, to;

		div.innerHTML = `<h4>${field}</h4>`

		for (var i = 0; i < breaks.length; i++) {
			from = breaks[i];
			to = breaks[i + 1];
			if(to) {
				labels.push(
					'<i style="background:' + brew.getColorInRange(to) + '"></i> ' +
					from.toFixed(0) + ' &ndash; ' + to.toFixed(0));
				}
		}
			
		div.innerHTML += labels.join('<br>');
		div.innerHTML += '<hr>';
		div.innerHTML += `<span class='scheme' onclick="mapGeoJSON({scheme:'quantiles'})">quantiles</span>`;
		div.innerHTML += `<span class='scheme' onclick="mapGeoJSON({scheme:'equal_interval'})">equal interval</span>`;
		div.innerHTML += `<span class='scheme' onclick="mapGeoJSON({scheme:'jenks'})">jenks</span>`;
		return div;
	};
		
		legend.addTo(map);
}

// Function that defines what will happen on user interactions with each feature
function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight,
		click: zoomToFeature
	});
}

// on mouse over, highlight the feature
function highlightFeature(e) {
	var layer = e.target;

	// style to use on mouse over
	layer.setStyle({
		weight: 2,
		color: '#666',
		fillOpacity: 0.3
	});

	if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
		layer.bringToFront();
	}

	info_panel.update(layer.feature.properties)
}

// on mouse out, reset the style, otherwise, it will remain highlighted
function resetHighlight(e) {
	geojson_layer.resetStyle(e.target);
	info_panel.update() // resets infopanel
}

// on mouse click on a feature, zoom in to it
function zoomToFeature(e) {
	map.fitBounds(e.target.getBounds());
}

function createInfoPanel(){

	info_panel.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		this.update();
		return this._div;
	};

	// method that we will use to update the control based on feature properties passed
	info_panel.update = function (properties) {
		// if feature is highlighted
		if(properties){
			this._div.innerHTML = `<b>${properties.name}</b><br>${field}: ${properties[field]}`;
		}
		// if feature is not highlighted
		else
		{
			this._div.innerHTML = 'Hover over an area of interest';
		}
	};

	info_panel.addTo(map);
}