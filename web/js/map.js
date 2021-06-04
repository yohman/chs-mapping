/* *************************** 
 
	Global variables

**************************** */

// map defaults
let map;
let lat = 0;
let lon = 0;
let zl = 3;

// map args
let field = 'total_pop';
let num_classes = 5;
let scheme = 'quantiles';

// geojson variables
let geojson_scale = 'bg'; // options: bg (block groups)
let geojson_path_tracts = 'data/la_tracts.geojson';
let geojson_path_bgs = 'data/la_bg.geojson';
let geojson_data_tracts;
let geojson_data_bgs;
let geojson_layer;

// misc
let brew = new classyBrew();
let legend = L.control({position: 'bottomright'});
let info_panel = L.control();

// zoom default to LA
let la_bounds = [
	[34.840471137173814,-117.64558196067811],
	[33.65310164305273,-118.95295500755311]
]

let palette = getRandomPalette();

// map boundaries
let map_boundary; // hold the current boundary here

// geojson
let geojson_data = [
	{
		text: 'Census Block Groups',
		id: 'bg',
		path: 'data/la_bg.geojson',
		csv: 'data/acs_vars_results_blockgroups.csv',
	},
	{
		text: 'Census Tracts',
		id: 'bg',
		path: 'data/la_tracts.geojson',
		csv: 'data/acs_vars_results_tracts.csv',
	},
	{
		text: 'Neighborhoods',
		id: 'neighborhoods',
		path: 'data/latimes_place_lacounty.geojson',
		csv: 'data/acs_vars_results_tracts.csv',
	},
	
]

// list of boundaries
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
		path: 'data/latimes_place_lacounty.geojson'
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

// themes for choropleth
let map_variables = [
	{
		geography: 'bg',
		text: 'Total Population',
		id: 'Pop_total',
	},
	{
		geography: 'bg',
		text: 'Percent Limited English',
		id: 'Limited_Eng_per',
	},
	{
		geography: 'bg',
		text: 'Percent Uninsured',
		id: 'Uninsured_per',
	},
	{
		geography: 'bg',
		text: 'Below 100 percent of the poverty level',
		id: 'Poverty_per',
	},
	{
		geography: 'bg',
		text: 'Percent Hispanic or Latino',
		id: 'Hisp_per',
	},
	{
		geography: 'bg',
		text: 'Percent Non Hispanic Asian',
		id: 'NonHisp_asian_per',
	},
	{
		geography: 'bg',
		text: 'Percent Non Hispanic Black',
		id: 'NonHisp_black_per',
	},
	{
		geography: 'bg',
		text: 'Percent Non Hispanic White',
		id: 'NonHisp_white_per',
	},
	{
		geography: 'bg',
		text: 'Percent Non Hispanic Native Hawaiian and Other PI',
		id: 'NonHisp_pi_per',
	},
	{
		geography: 'bg',
		text: 'Percent Non Hispanic American Indian and Alaska Native',
		id: 'NonHisp_ai_per',
	},
]

// hi/lo marker indicators for choropleth maps
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


let geoid_list_tracts = [];
let geoid_list_bgs = [];
let geojson_highlighted_layer;
let highlighted = L.featureGroup();

/* **************************** 

	Initialize

***************************** */ 

$( document ).ready(function() {

	getData();

	// $.when(createMap())
	// .then(function(){
	// 	 getGeoJSON();
	// })
	// createMap().then(getGeoJSON());
});

/* **************************** 

	Get the data

***************************** */ 
 function getData()
{
	$.when(
		/*
			Data json files:
			New datasets need to added as json files. Note that the json file is
			preceded with defining the json as a javascript object.
		*/
		$.getJSON(geojson_path_tracts,function(data){
			console.log('tracts:')
			console.log(data)
	
			// put the data in a global variable
			geojson_data_tracts = data;
		}),
	
		$.getJSON(geojson_path_bgs,function(data){
			console.log('bgs:')
			console.log(data)
	
			// put the data in a global variable
			geojson_data_bgs = data;
		})
	

	).done(function(){
		// now that all the data has loaded...
		console.log('all data got')
		createGeoidList()
		createSidebar();
		createMap();
		joinCSV()



		geojson_layer = L.geoJson(geojson_data_bgs, {				
			stroke: true,
			color: 'white',
			weight: 0.8,
			fill: true,
			fillOpacity: fillOpacity,
			opacity: fillOpacity,
			onEachFeature: onEachFeature,
			
		}).addTo(map)
		


		// create a geojson for highlighting
		geojson_highlighted_layer = L.geoJson(geojson_data_bgs,{pane:'boundaries'})

	});
}


/* **************************** 

	Create the initial map

***************************** */ 
function createMap(){
	map = L.map('map')
	
	/*
	
		default (for now) is mapbox black and white satellite		
	
	*/ 
	let satellite = L.tileLayer('https://api.mapbox.com/styles/v1/yohman/ckon2lqfc00bu17nrdwdtsmke/tiles/512/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw', 
	{
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox/yohman</a>',
		maxZoom: 18,
		tileSize: 512,
		zoomOffset: -1,
		accessToken: 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw'
	}).addTo(map);

	/*
	
		labels
	
	*/ 
	let positronLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
		// attribution: cartodbAttribution,
		pane: 'labels'
	}).addTo(map);
	
	/*
	
		panes
	
	*/ 
	map.createPane('labels').style.zIndex = 590;
	map.createPane('boundaries').style.zIndex = 580;
	
	// disable click events
	map.getPane('labels').style.pointerEvents = 'none';
	
	// default to Los Angeles
	map.fitBounds(la_bounds)	
}

/* **************************** 

	Map themes (choropleths)

***************************** */ 
function mapGeoJSON(args){

	/*
	
		defaults
	
	*/ 
	args = args || {};
	field = args.field || field;
	num_classes = args.num_classes || num_classes;
	palette = args.palette || getRandomPalette();
	scheme = args.scheme || scheme;

	/*
	
		clear layers
	
	*/ 
	if (geojson_layer){
		geojson_layer.clearLayers()
	}
	
	/*
	
		brew it
	
	*/ 
	let values = [];

	// based on the provided field, enter each value into the array
	geojson_data_bgs.features.forEach(function(item,index){
		//only add if it's a number
		if(!isNaN(item.properties[field])){
			values.push(parseFloat(item.properties[field]))
		}
	})

	console.log(values)

	brew.setSeries(values);
	brew.setNumClasses(num_classes);
	brew.setColorCode(palette);
	brew.classify(scheme);

	/*
	
		map it
	
	*/ 
	geojson_layer = L.geoJson(geojson_data_bgs, {
		style: getStyle, //call a function to style each feature
		onEachFeature: onEachFeature,
	}).addTo(map);

	// create the legend
	createLegend();

	$("#transparency").ionRangeSlider({
		skin: 'flat',
		min: 0,
		max: 100,
		from: 50,
		onChange: function(data){
			console.log(data.from)
			fillOpacity = data.from/100
			geojson_layer.setStyle({opacity:fillOpacity,fillOpacity:fillOpacity})
		}
	});

	// add markers for hi/lo values
	mapHiLo();
}
	
let fillOpacity = 0.5
/* **************************** 

	Sidebar

***************************** */ 
function createSidebar(){

	$('.sidebar').html('')

	/*
	
		search by block code
	
	*/ 
	$('.sidebar').append(`<div class="dropdown" id="dropdown-blocks"></div>`)
	$('#dropdown-blocks').selectivity({
		allowClear: true,
		items: geoid_list_bgs,
		placeholder: 'Search by block code',
		showSearchInputInDropdown: true
	}).on("change",function(data){
		zoomToFIPS(data.value)
	});

	/*
	
		themes
	
	*/ 
	$('.sidebar').append(`<div class="dropdown" id="dropdown-layers"></div>`)

	$('#dropdown-layers').selectivity({
		allowClear: true,
		items: [{
			// id: '+00:00',
			text: 'ACS 2019 5-year Estimates',
			children: map_variables,
		}],
		placeholder: 'Themes',
		showSearchInputInDropdown: false
	}).on("change",function(data){
		console.log(data.value)
		mapGeoJSON({field:data.value})
	});

	/*
	
		Boundaries
	
	*/ 
	$('.sidebar').append(`<div class="dropdown" id="dropdown-boundaries"></div>`)

	$('#dropdown-boundaries').selectivity({
		allowClear: true,
		items: [{
			// id: '+00:00',
			text: 'Boundaries',
			children: map_boundaries,
		}],
		placeholder: 'Boundaries',
		showSearchInputInDropdown: false
	}).on("change",function(data){
		addBoundaryLayer(data.value)
	});

}

/* **************************** 

	Boundary layers

***************************** */ 
function addBoundaryLayer(id_text){

	/*
	
		clear
	
	*/ 
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
		fillOpacity: fillOpacity,
		opacity: fillOpacity,
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

/* **************************** 

	Legend

***************************** */ 
function createLegend(){
	// legend.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'info legend'),
		breaks = brew.getBreaks(),
		labels = [],
		from, to;
		let title = map_variables.find( ({ id }) => id === field)
		div.innerHTML = `<h4>${title.text}</h4>`

		for (var i = 0; i < breaks.length; i++) {
			from = breaks[i];
			to = breaks[i + 1];
			if(to) {
				labels.push(
					'<i style="background:' + brew.getColorInRange(to) + '"></i> ' +
					from.toFixed(0) + '% &ndash; ' + to.toFixed(0) + '%');
				}
		}
			
		div.innerHTML += labels.join('<br>');
		div.innerHTML += '<hr>Opacity:';
		div.innerHTML += '<div id="transparency"></div>';
		// div.innerHTML += '<hr>';
		div.innerHTML += `<span class='legend-scheme' onclick="mapGeoJSON({scheme:'quantiles'})">quantiles</span>`;
		div.innerHTML += `<span class='legend-scheme' onclick="mapGeoJSON({scheme:'equal_interval'})">equal interval</span>`;


		// div.innerHTML += `<span class='legend-scheme' onclick="mapGeoJSON({scheme:'jenks'})">jenks</span>`;

		// colors
		// div.innerHTML += '<hr>';

		// brew.getColorCodesByType().seq.forEach(function(item){
		// 	div.innerHTML += `<span class='legend-color' onclick="mapGeoJSON({palette:'${item}'})">${item}</span>`;
		// })

		$('.legend').html(div)

	// 	return div;
	// };
		
	// legend.addTo(map);
}

/* **************************** 

	Feature actions

***************************** */ 
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
		color: 'red',
		// fillOpacity: 0.6
	});

	if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
		layer.bringToFront();
	}

	createChart(layer.feature.properties)
}

// on mouse out, reset the style, otherwise, it will remain highlighted
function resetHighlight(e) {
	geojson_layer.resetStyle(e.target);
}

// on mouse click on a feature, zoom in to it
function zoomToFeature(e) {
	map.fitBounds(e.target.getBounds());
}

/* **************************** 

	Dashboard

***************************** */ 
function createChart(properties){

	// for now, total pop is different
	if(geojson_scale === 'bg'){
		total_pop = properties.Pop_total
		additional_html = `
		<span style="font-size:2em;color:#666">Block code: ${properties.block_code}</span><br>
		<span style="font-size:0.6;color:#666">${properties.Agency_1}</span>
		`
	}
	else{
		total_pop = properties.total_pop
	}
	// empty dashboard
	$('.dashboard').html(`
	<div style="text-align:center">
		<h4>${properties.CSA_Name}</h4>
		${additional_html}
		<h4>Community Profile</h4>
		<div style="font-size:4em;">${total_pop}</div>
		<p>persons</p>
	</div>
	<table width="100%"><tr><td width="33%" id="dash1"></td><td width="33%" id="dash2"></td><td width="33%" id="dash3"></td></tr></table>
	`);

	/*
	
		Poverty
	
	*/ 
	var options = {
		series: [Math.round(properties.Poverty_per)],
		chart: {
			height: 150,
			type: 'radialBar',
			animations: {
				enabled: false,
			}
	  	},
		plotOptions: {
			radialBar: {
				hollow: {
					size: '60%',
				},
				dataLabels: {
					show: true,
					name: {
						show: true,
						color: '#888',
						fontSize: '12px'
					},
				},
			},
		},

		labels: ['In Poverty'],
	  };
	//   var chart = new ApexCharts(document.querySelector("#dash1"), options);
	//   chart.render();

	/*
	
		Uninsured
	
	*/ 
	var options = {
		series: [Math.round(properties.Uninsured_per)],
		chart: {
			height: 150,
			width: 100,
			type: 'radialBar',
			animations: {
				enabled: false,
			}
	  	},
		plotOptions: {
			radialBar: {
				hollow: {
					size: '60%',
				},
				dataLabels: {
					show: true,
					name: {
						show: true,
						color: '#888',
						fontSize: '12px'
					},
				},
			},
		},

		labels: ['Uninsured'],
	  };
	//   var chart = new ApexCharts(document.querySelector("#dash2"), options);
	//   chart.render();


	/*
	
		English
	
	*/ 
	var options = {
		series: [Math.round(properties.Limited_Eng_per)],
		chart: {
			height: 150,
			type: 'radialBar',
			animations: {
				enabled: false,
			}
	  	},
		plotOptions: {
			radialBar: {
				hollow: {
					size: '60%',
				},
				dataLabels: {
					show: true,
					name: {
						show: true,
						color: '#888',
						fontSize: '12px'
					},
				},
			},
		},

		labels: ['Limited English'],
	};

	// var chart = new ApexCharts(document.querySelector("#dash3"), options);
	// chart.render();


	/*
	
		poverty
	
	*/ 
	var series = [Math.round(properties.Poverty_per),100-Math.round(properties.Poverty_per)]
	var labels = ['Below poverty level', 'Above poverty level']
	var wafflevalues = {};
	wafflevalues.title = 'Poverty';
	wafflevalues.data = series
	wafflevalues.labels = labels
	$('#dash1').html('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');

	/*
	
		uninsured
	
	*/ 
	var series = [Math.round(properties.Uninsured_per),100-Math.round(properties.Uninsured_per)]
	var labels = ['Uninsured', 'Insured']
	var wafflevalues = {};
	wafflevalues.title = 'Uninsured';
	wafflevalues.data = series
	wafflevalues.labels = labels
	$('#dash2').html('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');

	/*
	
		English
	
	*/ 
	var series = [Math.round(properties.Limited_Eng_per),100-Math.round(properties.Limited_Eng_per)]
	var labels = ['Limited English', 'Not Limited']
	var wafflevalues = {};
	wafflevalues.title = 'English';
	wafflevalues.data = series
	wafflevalues.labels = labels
	$('#dash3').html('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');


	/*
	
		Race
	
	*/ 
	var series = [
		Math.round(properties.Hisp_per),
		Math.round(properties.NonHisp_white_per),
		Math.round(properties.NonHisp_black_per),
		Math.round(properties.NonHisp_asian_per),
		100-Math.round(properties.Hisp_per)-Math.round(properties.NonHisp_white_per)-Math.round(properties.NonHisp_black_per)-Math.round(properties.NonHisp_asian_per)
	]
	var labels = [
		'Hispanic',
		'White',
		'Black',
		'Asian',
		'Other'
	]


	// race waffle
	var wafflevalues = {};
	wafflevalues.title = 'Race';
	wafflevalues.data = series
	wafflevalues.labels = labels
	$('.dashboard').append('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');


	// var options = {
	// 		series: [{
	// 		data: series
	// 	}],
	// 	chart: {
	// 		type: 'bar',
	// 		height: 160,
	// 		animations: {
	// 			enabled: false,
	// 		}
	// 	},
	// 	plotOptions: {
	// 		bar: {
	// 		borderRadius: 4,
	// 		horizontal: true,
	// 		}
	// 	},
	// 	dataLabels: {
	// 		enabled: true,
	// 		textAnchor: 'start',
	// 		style: {
	// 			fontSize: '10px',
	// 			colors: ['#222']
	// 		},
	// 	},
	// 	xaxis: {
	// 		categories: labels,
	// 	}
	// };

	// var chart = new ApexCharts(document.querySelector(".dashboard"), options);
	// chart.render();


	// rankings
	
	$('#undermap').empty()

	// sparkline_data = [];
	// geojson_data_tracts.features.forEach(function(item){
	// 	sparkline_data.push(parseFloat(item.properties[field]))

	// })
	//  sparkline_data = sparkline_data.filter(function (value) {
	// 	return !Number.isNaN(value);
	// });
	// sparkline_data.sort((a,b) => a-b)

	// index = sparkline_data.findIndex(item => item === parseFloat(properties[field]));
	// // index = sparkline_data.findIndex(item => item === 8.85188431200701);

	// console.log('index is ' + index)
	// console.log(properties[field])
	// var options5 = {
	// 		series: [{
	// 		data: sparkline_data
	// 	}],
	// 	chart: {
	// 		type: 'bar',
	// 		width: '100%',
	// 		height: 100,
	// 		sparkline: {
	// 			enabled: true
	// 		},
	// 		animations: {
	// 			enabled: false,
	// 		}
	// 	},
	// 	// plotOptions: {
	// 	// 	bar: {
	// 	// 	columnWidth: '80%'
	// 	// 	}
	// 	// },
	// 	// //   labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
	// 	// xaxis: {
	// 	// 	crosshairs: {
	// 	// 		width: 1
	// 	// 	},
	// 	// },
	// 	tooltip: {
	// 		fixed: {
	// 			enabled: false
	// 		},
	// 		x: {
	// 			show: false
	// 		},
	// 		y: {
	// 		title: {
	// 			formatter: function (seriesName) {
	// 			return ''
	// 			}
	// 		}
	// 		},
	// 		marker: {
	// 			show: false
	// 		}
	// 	},
	// 	annotations: {
	// 		xaxis: [
	// 		  {
	// 			x: index,
	// 			borderColor: '#775DD0',
	// 			label: {
	// 			  style: {
	// 				color: '#bbb',
	// 			  },
	// 			  text: 'here'
	// 			}
	// 		  }
	// 		]
	// 	  }
	//   };

	//   var chart5 = new ApexCharts(document.querySelector("#undermap"), options5);
	//   chart5.render();


	// var trace = {
	// 	x: x,
	// 	type: 'histogram',
	// 	xbins: {
	// 		start: brew.breaks[0],
	// 		size:(brew.breaks[brew.breaks.length-1]-brew.breaks[0])/num_classes,
	// 		end: brew.breaks[brew.breaks.length-1]
	// 	},
	// 	marker:{
	// 		color: ["rgb(241,238,246)", "rgb(215,181,216)", "rgb(223,101,176)", "rgb(221,28,119)", "rgb(152,0,67)"]
	// 	}
	//   };
	// //   trace.marker.color = trace.x.map(function (v) {
	// // 	//   console.log(v)
	// // 	return v === 10 ? 'red' : 'blue'
	// //   });
	// var data = [trace];
	// var layout = {
	// 	autosize: true,
	// 	// width: ,
	// 	height: 150,
	// 	margin: {
	// 	  l: 50,
	// 	  r: 50,
	// 	  b: 40,
	// 	  t: 20,
	// 	  pad: 4
	// 	},
	// 	xaxis: {title: field}, 
	// 	bargap: 0.05, 
	//   };
	//   	Plotly.newPlot('undermap', data,layout);
	


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
	return 	(geojson_scale === 'tracts') ? 'data/acs_vars_results_tracts.csv' : 
			(geojson_scale === 'bg') ? 'data/acs_vars_results_blockgroups.csv': ''
}


function zoomToFIPS(fips){

	if(highlighted){
		highlighted.clearLayers()
	}

	highlight=geojson_highlighted_layer.getLayers().filter(item => item.feature.properties.GEOID === fips)[0];

	highlighted.addLayer(highlight)
	map.fitBounds(highlighted.getBounds())

	// style to use on mouse over
	highlighted.setStyle({
		weight: 4,
		color: 'red',
		pane: 'boundaries',
		fill: false
	});
	highlighted.bringToFront();
	highlighted.addTo(map)

	// create chart

	// find the data for this fips
	properties = geojson_data_bgs.features.filter(item => item.properties.GEOID === fips)[0].properties
	console.log(fips)
	console.log(properties)
	createChart(properties)
	
}
function createGeoidList(){
	geojson_data_tracts.features.forEach(function(item){
		geoid_list_tracts.push(item.properties.GEOID)
	});
	geojson_data_bgs.features.forEach(function(item){
		object = {
			id: item.properties.GEOID,
			text: `${item.properties.block_code} (${item.properties.CSA_Name})`
		}
		geoid_list_bgs.push(object)
		// geoid_list_bgs.push(item.properties.block_code)
	});
}

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


function getRandomPalette(){
	let pal = brew.getColorCodesByType().seq
	let random_num = Math.floor(Math.random() * pal.length+1)
	return(pal[random_num])
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



function createWaffleChart(values)
{
	// var values = [40,20,10,5];
	var sum = 0;
	$.each(values.data,function(i,val){
		sum += val;
	})

	var normalizedValues = [];
	$.each(values.data,function(i,val){
		normalizedValues.push(Math.round(val/sum*100))
	})
	var count = 0;

	// waffle table
	var waffle = '';
	// var waffle = '<div class="container" style="text-align:center">';

	// waffle it
	waffle += '<div class="row waffle-container" style="margin: 5px;text-align:center">';

	colorPallete = ['#6A3D9A','#FF7F00','#33A02C','#1F78B4','#E31A1C'];
	
	/*
	
		title
	
	*/ 
	waffle += '<h4>'+values.title+'</h4>';

	/*
	
		waffle
	
	*/ 
	$.each(normalizedValues,function(i,val){
		for (var j = 0; j < val; j++)
		{
			waffle += '<div class="waffle-border" style="float:left;"><div class="waffle-box" style="background-color:'+colorPallete[i]+'"></div></div>';
		}
	})
	// waffle += '</div>';


	/*
	
		legend
	
	*/ 
	// stats and values
	waffle += '<table class="table table-sm table-condensed smallfont" style="text-align:left;">';

	for (var i = 0; i < values.data.length; i++) {
		waffle += '<tr><td><div class="waffle-box-empty smallfont" style="background-color:'+colorPallete[i]+'"> &nbsp&nbsp&nbsp&nbsp</div></td><td>'+values.labels[i]+' ('+normalizedValues[i]+'%)</td><td><div class="waffle-border" style="float:left;"></div></td></tr>';
		// waffle += '<tr><td width="60%"><div class="waffle-box-empty smallfont" style="background-color:'+mdbla.colorPallete[i]+'"> &nbsp&nbsp&nbsp&nbsp'+values.labels[i]+'</div></td><td class="smallfont" width="40%" align="right">'+values.data[i]+' ('+normalizedValues[i]+'%)</td><td><div class="waffle-border" style="float:left;"></div></td></tr>';
	}

	waffle += '</table></div>'

	return waffle;
}
