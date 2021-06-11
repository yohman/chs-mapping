/* **************************** 

	Initialize

***************************** */ 

$( document ).ready(function() {

	getData();

});

/* **************************** 

	Get the data

***************************** */ 
 function getData()
{

	/*
	
		function to parse csv files
	
	*/ 
	function parseCsv(url, stepArr){
		return new Promise(function(resolve, reject){
			Papa.parse(url, {
				download:true,
				header:true,
				complete: resolve       
			});        
		});
	}

	/*
	
		function to parse geojson files
	
	*/ 
	function getGeoJson(url){
		return new Promise(function(resolve,reject){
			$.getJSON(url,resolve)
		})
	}

	/*
	
		list of data to parse
	
	*/ 
	const csvdata = parseCsv(chs.data.csv_path)
	const googledata = parseCsv(chs.data.google_path)
	const geojsondata = getGeoJson(chs.data.bgs_path)

	/*
	
		put them in a promise to load all data before moving on to the next step
	
	*/ 
	Promise.all(
		[geojsondata,csvdata,googledata]
	).then(
		function(results){

			/*
			
				put the data in global variables
			
			*/ 
			chs.data.bgs = results[0]
			chs.data.csv = results[1]
			chs.data.google = results[2]

			/*
			
				create the map and add the first layer
			
			*/ 
			createMap();
			
			chs.mapOptions.baselayer = L.topoJson(chs.data.bgs,{				
					stroke: true,
					color: 'white',
					weight: 0.8,
					fill: true,
					fillOpacity: chs.mapOptions.fillOpacity,
					opacity: chs.mapOptions.fillOpacity,
					onEachFeature: onEachFeature,
				}
			).addTo(chs.map)

			// create a geojson for highlighting
			chs.mapLayers.highlighted_layer = L.topoJson(chs.data.bgs,{pane:'boundaries'})

			/*
			
				Join the geodata to the csv data
			
			*/ 
			joinCSV()
			createGeoidList()

			/*
			
				create the sidebar dropdowns
			
			*/ 
			createSidebar();
			createInfoPanel();
			$('#toggler').show();
		}
	)
}


/* **************************** 

	Create the initial map

***************************** */ 
function createMap(){
	chs.map = L.map('map')
	
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
	}).addTo(chs.map);

	/*
	
		labels
	
	*/ 
	let positronLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
		// attribution: cartodbAttribution,
		pane: 'labels'
	}).addTo(chs.map);
	
	/*
	
		Custom panes to assign z-index layers
	
	*/ 
	chs.map.createPane('labels').style.zIndex = 590;
	chs.map.createPane('boundaries').style.zIndex = 580;
	
	// disable click events
	chs.map.getPane('labels').style.pointerEvents = 'none';
	
	// default to Los Angeles
	chs.map.fitBounds(chs.mapOptions.bounds)	

	/*
	
		add the geocoder
	
	*/ 
	geocoder = L.Control.geocoder({
		position:'topleft',
		defaultMarkGeocode: false,
		geocoder: new L.Control.Geocoder.Nominatim({
			geocodingQueryParams: {
				// countrycodes: 'us',
				bounded: 1,
				viewbox: '-119.064863, 35.0780436,-117.04887, 33.19587'
			}
		})
	}).addTo(chs.map);
	// L.Control.geocoder({
	// 	geocoder: L.Control.Geocoder.nominatim({
	// 		geocodingQueryParams: {countrycodes: 'gb'}
	// 	})
	// });
	// var geocoder=L.Control.geocoder({
	// 	geocoder: new L.Control.Geocoder.Nominatim({
	// 		geocodingQueryParams: {
	// 			"country": "US",
	// 			"city": "Los Angeles"
	// 		}
	// 	})
	// }).addTo(chs.map)

	geocoder.on('markgeocode', function(event) {
		console.log(event)
		var center = event.geocode.center;
		// L.marker(center).addTo(chs.map);
		chs.map.setView(center, 15);
   });

	// // const chs.map = new L.chs.Map('chs.map');
	// const provider = new OpenStreetchs.MapProvider();

	// const searchControl = new GeoSearchControl({
	// 	provider: provider,
	// });
	// chs.map.addControl(searchControl);

}

/* **************************** 

	Map themes (choropleths)

***************************** */ 
function mapGeoJSON(args){

	/*
	
		defaults
	
	*/ 
	args = args || {};
	chs.mapOptions.field = args.field || chs.mapOptions.field;
	chs.mapOptions.num_classes = args.num_classes || chs.mapOptions.num_classes;
	chs.mapOptions.choroplethColors = args.palette || getRandomPalette();
	chs.mapOptions.scheme = args.scheme || chs.mapOptions.scheme;
	
	/*
	
		brew it
	
	*/ 
	let values = [];

	// based on the provided field, enter each value into the array
	chs.mapOptions.baselayer.getLayers().forEach(function(item,index){
		// console.log(item.feature.properties[field])
		//only add if it's a number
		if(!isNaN(item.feature.properties[chs.mapOptions.field])){
			values.push(parseFloat(item.feature.properties[chs.mapOptions.field]))
		}
	})
	// chs.data.bgs.features.forEach(function(item,index){x
	// 	//only add if it's a number
	// 	if(!isNaN(item.properties[field])){
	// 		values.push(parseFloat(item.properties[field]))
	// 	}
	// })


	chs.mapOptions.brew.setSeries(values);
	chs.mapOptions.brew.setNumClasses(chs.mapOptions.num_classes);
	chs.mapOptions.brew.setColorCode(chs.mapOptions.choroplethColors);
	chs.mapOptions.brew.classify(chs.mapOptions.scheme);

	
	/*
	
		clear layers
	
	*/ 
	if (chs.mapOptions.baselayer){
		chs.mapOptions.baselayer.clearLayers()
	}

	/*
	
		map it
	
	*/ 
	chs.mapOptions.baselayer = L.topoJson(chs.data.bgs, {
		style: getStyle, //call a function to style each feature
		onEachFeature: onEachFeature,
	}).addTo(chs.map);

	// create the legend
	createLegend();

	// add markers for hi/lo values
	mapHiLo();
}
	
/* **************************** 

	Boundary layers

***************************** */ 
function addBoundaryLayer(id_text){

	/*
	
		clear
	
	*/ 
	if(chs.mapLayers.boundary)
	{
		chs.mapLayers.boundary.clearLayers()
	}

	// find it in the list of layers
	layer2add = chs.data.boundaries.find(({id}) => id === id_text)

	if(layer2add != undefined){
		$.getJSON(layer2add.path,function(data){
			boundary_options = {
				fill: false,
				weight: 1.5,
				pane:'boundaries',
				onEachFeature: function(feature,layer){
					layer.bindTooltip(feature.properties.name,{
						permanent:true,
						opacity:0.8,
						className: 'tooltip'
					});
				}
			}
			chs.mapLayers.boundary = L.geoJson(data,boundary_options).addTo(chs.map)
			// chs.mapLayers.boundary = L.geoJson(data,boundary_options).bindTooltip(function (layer) {
			// 	return 'hello'
			// 	// return layer.feature.properties.name; //merely sets the tooltip text
			//  }, {permanent: true, opacity: 0.5}  //then add your options
			// ).addTo(chs.map);
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
		fillColor: chs.mapOptions.brew.getColorInRange(feature.properties[chs.mapOptions.field]),
		fillOpacity: chs.mapOptions.fillOpacity,
		opacity: chs.mapOptions.fillOpacity,
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


function joinCSV(){
	chs.mapOptions.baselayer.eachLayer(function(layer) {
		featureJoinByProperty(layer.feature.properties, chs.data.csv.data, "GEOID");
	});
	chs.mapOptions.baselayer.eachLayer(function(layer) {
		featureJoinByProperty(layer.feature.properties, chs.data.google.data, "GEOID");
	});

}

// function getDataPath(){
// 	return 	(geojson_scale === 'tracts') ? 'data/acs_vars_results_tracts.csv' : 
// 			(geojson_scale === 'bg') ? 'data/acs_vars_results_blockgroups.csv': ''
// }


function createGeoidList(){
	chs.mapOptions.baselayer.eachLayer(function(item){
		if(item.feature.properties.Block_Code != '')
		{
			block_code_object = {
				id: item.feature.properties.GEOID,
				text: `${item.feature.properties.Block_Code} (${item.feature.properties.Current_Agency})`,
				block_code: item.feature.properties.Block_Code
			}
			chs.panels.list_block_codes.push(block_code_object)
			chs.panels.list_agencies.push(item.feature.properties.Current_Agency)
		}
	})

	// get rid of empty values
	chs.panels.list_agencies = chs.panels.list_agencies.filter(item => item);
	chs.panels.list_block_codes = chs.panels.list_block_codes.filter(item => item);

	// get rid of duplicates
	chs.panels.list_agencies = [...new Set(chs.panels.list_agencies)];

	// sort it
	chs.panels.list_agencies.sort();
	chs.panels.list_block_codes.sort(function(a,b){
		return a.block_code - b.block_code;
	})

	// geojson_data_tracts.features.forEach(function(item){
	// 	geoid_list_tracts.push(item.properties.GEOID)
// chs.data.bgs.objects.bg.geometries.forEach(function(item){
	// 	object = {
	// 		id: item.properties.GEOID,
	// 		// text: item.properties.GEOID,
	// 		text: `${item.properties.Block_Code} (${item.properties.CSA_Name})`
	// 	}
	// 	chs.panels.list_block_codes.push(object)
	// });
	
	// if geojson
	// chs.data.bgs.features.forEach(function(item){
	// 	object = {
	// 		id: item.properties.GEOID,
	// 		text: `${item.properties.Block_Code} (${item.properties.CSA_Name})`
	// 	}
	// 	chs.panels.list_block_codes.push(object)
	// });

}

function mapHiLo(){
	chs.mapLayers.hilo_markers.clearLayers();
	let max_value = Math.max(...chs.mapOptions.brew.getSeries())
	let min_value = Math.min(...chs.mapOptions.brew.getSeries())

	let max_geos = chs.mapOptions.baselayer.getLayers().filter(item => parseFloat(item.feature.properties[chs.mapOptions.field]) === max_value)
	// max_geos.forEach(function(item){
	// 	let marker = L.marker(item.getCenter(),{icon:chs.mapLayers.hiIcon}).bindPopup(`${Math.round(max_value)} %`).on('mouseover',function(){
	// 		this.openPopup()
	// 	})
	// 	chs.mapLayers.hilo_markers.addLayer(marker)
	// })


	max_geos.forEach(function(feature,layer){
		feature.bindTooltip(`<i style="font-size:2em;color:red" class="fa fa-chevron-circle-up" aria-hidden="true"></i>`,{
			permanent:true,
			opacity:0.8,
			className: 'tooltip'
		});
	});



	// let min_geos = chs.mapOptions.baselayer.getLayers().filter(item => parseFloat(item.feature.properties[chs.mapOptions.field]) === min_value)
	// min_geos.forEach(function(item){
	// 	let marker = L.marker(item.getCenter(),{icon:chs.mapLayers.loIcon}).bindPopup(`${min_value} %`).on('mouseover',function(){
	// 		this.openPopup()
	// 	})
	// 	chs.mapLayers.hilo_markers.addLayer(marker).bindPopup(``)
	// })


	// min_geos.forEach(function(feature,layer){
	// 	feature.bindTooltip(`<i style="font-size:2em;color:red" class="fa fa-chevron-circle-up" aria-hidden="true"></i>`,{
	// 		permanent:true,
	// 		opacity:0.8,
	// 		className: 'tooltip'
	// 	});
	// });

	chs.mapLayers.hilo_markers.addTo(chs.map)
}


function getRandomPalette(){
	// let pal = chs.mapOptions.brew.getColorCodesByType().seq
	let pal = ["OrRd", "PuBu", "BuPu", "Oranges", "BuGn", "YlOrBr", "YlGn", "Reds", "RdPu", "Greens", "YlGnBu", "Purples", "GnBu", "YlOrRd", "PuRd", "Blues", "PuBuGn","Spectral", "RdYlGn", "RdBu", "PiYG", "PRGn", "RdYlBu", "BrBG", "RdGy", "PuOr"]	
	let random_num = Math.floor(Math.random() * pal.length+1)
	console.log(pal[random_num])
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

