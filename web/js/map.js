// Global variables
let map;
let lat = 0;
let lon = 0;
let zl = 3;
let path = '';

// map args
let field = 'total_pop';
let num_classes = 5;
let scheme = 'quantiles';

// put this in your global variables
let geojson_scale = 'tracts'; // options: bg (block groups)
let geojson_path = 'data/la_tracts.geojson';
let geojson_data;
let geojson_layer;


let brew = new classyBrew();
let legend = L.control({position: 'bottomright'});
let info_panel = L.control();

let la_bounds = [
	[34.840471137173814,-117.64558196067811],
	[33.65310164305273,-118.95295500755311]
]

let palette = getRandomPalette();

let map_boundary;
let map_boundaries = [
	{
		text: 'Service Planning Areas (2012)',
		id: 'SPA',
		path: 'data/spa.geojson'
	},
	{
		text: 'LA County Supervisors District (2011)',
		id: 'sd',
		path: 'data/sd.geojson'
	},
	{
		text: 'LA County Neighborhoods',
		id: 'neighborhoods',
		path: 'data/neighborhoods.geojson'
	},
	{
		text: 'LA County Regions',
		id: 'regions',
		path: 'data/regions.geojson'
	},
	{
		text: 'L.A. City Council District (2012)',
		id: 'council',
		path: 'data/council.geojson'
	},
	{
		text: 'L.A. Census Block Groups',
		id: 'bg',
		path: 'data/la_bg.geojson'
	},
]

let map_variables = [
	{
		// id: 1,
		text: 'Total Population',
		id: 'total_pop',
	},
	{
		// id: 2,
		text: 'Percent Limited English',
		id: 'Limited_Eng_per',
	},
	{
		// id: 3,
		text: 'Below 100 percent of the poverty level',
		id: 'Poverty_per',
	},
	{
		// id: 4,
		text: 'Percent Hispanic or Latino',
		id: 'Hisp_per',
	},
	{
		// id: 5,
		text: 'Percent Non Hispanic Asian',
		id: 'NonHisp_asian_per',
	},
	{
		// id: 6,
		text: 'Percent Non Hispanic Black',
		id: 'NonHisp_black_per',
	},
	{
		// id: 7,
		text: 'Percent Non Hispanic White',
		id: 'NonHisp_white_per',
	},
	{
		// id: 8,
		text: 'Percent Non Hispanic Native Hawaiian and Other PI',
		id: 'NonHisp_pi_per',
	},
	{
		// id: 9,
		text: 'Percent Non Hispanic American Indian and Alaska Native',
		id: 'NonHisp_ai_per',
	},

]



// initialize
$( document ).ready(function() {
	createMap(lat,lon,zl);
	getGeoJSON();
});

function getRandomPalette(){
	let pal = brew.getColorCodesByType().seq
	let random_num = Math.floor(Math.random() * pal.length+1)
	return(pal[random_num])
}
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

	map.createPane('labels').style.zIndex = 590;
	map.createPane('boundaries').style.zIndex = 640;
	
	// disable click events
	map.getPane('labels').style.pointerEvents = 'none';
	
	let positronLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
		// attribution: cartodbAttribution,
		pane: 'labels'
	}).addTo(map);
	
	map.fitBounds(la_bounds)
	
}

// function to get the geojson data
function getGeoJSON(){

	if(geojson_layer){
		geojson_layer.clearLayers()
	}

	$.getJSON(geojson_path,function(data){
		console.log(data)

		// put the data in a global variable
		geojson_data = data;

		// create a geoid list
		createGeoidList()

		createSidebar();

		// create the layer and add to map
		geojson_layer = L.geoJson(geojson_data, {
			
			stroke: true,
			color: 'white',
			weight: 0.8,
			fill: true,
			// fillColor: brew.getColorInRange(feature.properties[field]),
			fillOpacity: 0.5
			
		}).addTo(map)
		
		// join with csv data
		joinCSV()

		// call the map function
		// mapGeoJSON();
	})
}

function joinCSV(){
	Papa.parse(getDataPath(), {
    download: true,
    header: true,
    complete: function(results) {

		geojson_layer.eachLayer(function(layer) {
          featureJoinByProperty(layer.feature.properties, results.data, "GEOID");
        });

      }
  });
}

function getDataPath(){
	return 	(geojson_scale === 'tracts') ? 'data/acs_vars_tracts.csv' : 
			(geojson_scale === 'bg') ? 'data/acs_vars_bg.csv': ''
}

// function mapGeoJSON(field,num_classes,color,scheme){
function mapGeoJSON(args){

	// populate args
	args = args || {};
	field = args.field || field;
	num_classes = args.num_classes || num_classes;
	palette = args.palette || getRandomPalette();
	scheme = args.scheme || scheme;

	// clear layers in case it has been mapped already
	if (geojson_layer){
		geojson_layer.clearLayers()
	}
	
	// create an empty array
	let values = [];

	// based on the provided field, enter each value into the array
	geojson_data.features.forEach(function(item,index){
		//only add if it's a number
		if(!isNaN(item.properties[field])){
			values.push(parseFloat(item.properties[field]))
		}
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

	// geojson_layer.setStyle(getStyle).addTo(map)
	// create the legend
	createLegend();

	// create the infopanel
	createInfoPanel();

	// add markers for hi/lo values
	mapHiLo();
}
	

function createSidebar(){

	$('.sidebar').html('')
	// layers
	$('.sidebar').append(`<p class="sidebar-title">Layers:</p><div id="dropdown-layers"></div>`)

	$('#dropdown-layers').selectivity({
		allowClear: true,
		items: [{
			// id: '+00:00',
			text: 'ACS 2019 5-year Estimates',
			children: map_variables,
		}],
		placeholder: 'Select a theme to map',
		showSearchInputInDropdown: false
	}).on("change",function(data){
		console.log(data.value)
		mapGeoJSON({field:data.value})
	});

	$('.sidebar').append(`
	<p class="sidebar-title">
		Boundaries:
	</p>
	`)
	$('.sidebar').append(`<div id="dropdown-boundaries"></div>`)

	$('#dropdown-boundaries').selectivity({
		allowClear: true,
		items: [{
			// id: '+00:00',
			text: 'Boundaries',
			children: map_boundaries,
		}],
		placeholder: 'Select a boundary to map',
		showSearchInputInDropdown: false
	}).on("change",function(data){
		addBoundaryLayer(data.value)
	});

	// zoom to fips
	$('.sidebar').append(`<p class="sidebar-title">Search by FIPS (eventually block code):</p><div id="dropdown-geoids"></div>`)
	$('#dropdown-geoids').selectivity({
		allowClear: true,
		items: geoid_list,
		placeholder: 'Select a FIPS code to map',
		showSearchInputInDropdown: true
	}).on("change",function(data){
		zoomToFIPS(data.value)
	});


}

function addBoundaryLayer(id_text){

	if(map_boundary)
	{
		map_boundary.clearLayers()
	}

	// find it in the list of layers
	layer2add = map_boundaries.find(({id}) => id === id_text)

	if(layer2add != undefined){
		$.getJSON(layer2add.path,function(data){
			boundary_options = {
				fill: false,
				weight: 1.5,
				pane:'boundaries'
			}
			map_boundary = L.geoJson(data,boundary_options).addTo(map)
			// put the data in a global variable
			// geojson_data = data;
	
		})
	}
	else{
		console.log('layer ' + id_text + ' not found')
	}


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
		let title = map_variables.find( ({ id }) => id === field)
		div.innerHTML = `<h4>${title.text}</h4>`
		// div.innerHTML += `<h4>${field}</h4>`

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
		div.innerHTML += `<span class='legend-scheme' onclick="mapGeoJSON({scheme:'quantiles'})">quantiles</span>`;
		div.innerHTML += `<span class='legend-scheme' onclick="mapGeoJSON({scheme:'equal_interval'})">equal interval</span>`;
		div.innerHTML += `<span class='legend-scheme' onclick="mapGeoJSON({scheme:'jenks'})">jenks</span>`;

		// colors
		div.innerHTML += '<hr>';

		brew.getColorCodesByType().seq.forEach(function(item){
			div.innerHTML += `<span class='legend-color' onclick="mapGeoJSON({palette:'${item}'})">${item}</span>`;
			
		})

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
		color: '#fff',
		fillOpacity: 0.6
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

		// look up full var name
		// if feature is highlighted
		if(properties){
			let var_name = map_variables.filter(item => item.id === field )
			this._div.innerHTML = `<h4>${properties.GEOID}</h4><div style="font-size:4em;padding-top:20px;">${parseInt(properties[field])}%</div><br>${var_name[0].text}`;
		}
		// if feature is not highlighted
		else
		{
			this._div.innerHTML = 'Hover over an area of interest';
		}
	};

	info_panel.addTo(map);
}

// 

let geoid_list = [];

function zoomToFIPS(fips){
	let layer = geojson_layer.getLayers().filter(item => item.feature.properties.GEOID === fips)[0];
	map.fitBounds(layer.getBounds())
		// style to use on mouse over
		layer.setStyle({
			weight: 8,
			color: '#fff',
			// fillOpacity: 0.3
		});
		layer.bringToFront();
	
}
function createGeoidList(){
	geojson_data.features.forEach(function(item){
		geoid_list.push(item.properties.GEOID)
	});
}

let hilo_markers = L.featureGroup();

let hiIcon = L.icon({
    iconUrl: 'images/hi.png',

    iconSize:     [40, 45], // size of the icon
    iconAnchor:   [20, 45], // point of the icon which will correspond to marker's location
	popupAnchor:  [0,-35]
});

let loIcon = L.icon({
    iconUrl: 'images/lo.png',

    iconSize:     [40, 45], // size of the icon
    iconAnchor:   [20, 45], // point of the icon which will correspond to marker's location
});

function mapHiLo(){
	hilo_markers.clearLayers();
	let max_value = Math.max(...brew.getSeries())
	let min_value = Math.min(...brew.getSeries())
	
	console.log(max_value)
	console.log(min_value)

	let max_geos = geojson_layer.getLayers().filter(item => parseFloat(item.feature.properties[field]) === max_value)
	max_geos.forEach(function(item){
		let marker = L.marker(item.getCenter(),{icon:hiIcon}).bindPopup(`${Math.round(max_value)} %`).on('mouseover',function(){
			this.openPopup()
		})
		hilo_markers.addLayer(marker)
	})

	// let min_geos = geojson_layer.getLayers().filter(item => parseFloat(item.feature.properties[field]) === min_value)
	// min_geos.forEach(function(item){
	// 	let marker = L.marker(item.getCenter(),{icon:loIcon}).bindPopup(`${min_value} %`).on('mouseover',function(){
	// 		this.openPopup()
	// 	})
	// 	hilo_markers.addLayer(marker).bindPopup(``)
	// })
	hilo_markers.addTo(map)
}
/////////////////////////////////////////////////////////////////////////////////////////////
//join function//
/////////////////////////////////////////////////////////////////////////////////////////////

//input arguments:
//fProps: geoJson feature properties object
//dTable: array of objects containing properties to be joined
//joinKey: property to use to perform the join
function featureJoinByProperty(fProps, dTable, joinKey) {
	var keyVal = fProps[joinKey];
	var match = {};
	for (var i = 0; i < dTable.length; i++) {
	  if (dTable[i][joinKey] === keyVal) {
		match = dTable[i];
		for (key in match) {
		  if (!(key in fProps)) {
			fProps[key] = match[key];
		  }
		}
	  }
	}
  }