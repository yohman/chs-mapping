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
	const csvdata2 = parseCsv(chs.data.csv_path2)
	const googledata = parseCsv(chs.data.google_path)
	const geojsondata = getGeoJson(chs.data.bgs_path)

	/*
	
		put them in a promise to load all data before moving on to the next step
	
	*/ 
	Promise.all(
		[geojsondata,csvdata,csvdata2,googledata]
	).then(
		function(results){

			/*
			
				put the data in global variables
			
			*/ 
			chs.data.bgs = results[0]
			chs.data.csv = results[1]
			chs.data.csv2 = results[2]
			chs.data.google = results[3]

			/*
			
				create the map and add the first layer
			
			*/ 
			createMap();
			
			/*
			
				Join the geodata to the csv data
			
			*/ 
			addDefaultBaseLayer();

			// create a geojson for highlighting
			chs.mapLayers.highlighted_layer = L.topoJson(chs.data.bgs,{pane:'boundaries'})

			joinCSV()

			createGeoidList()

			addTooltip();

			/*
			
				create the sidebar dropdowns
			
			*/ 
			createSidebar();
			createInfoPanel();
			$('#toggler').show();
			$('#toggler2').show();
		}
	)
}

function addDefaultBaseLayer(){
	chs.mapLayers.baselayer = L.topoJson(chs.data.bgs,{				
			stroke: true,
			color: 'white',
			weight: 0.8,
			fill: true,
			fillOpacity: chs.mapOptions.fillOpacity,
			opacity: chs.mapOptions.fillOpacity,
			onEachFeature: onEachFeature,
		}
	).addTo(chs.map)

	// add tooltip
	
	// chs.mapLayers.baselayer.getLayers().forEach(function(layer){
	// 	layer.bindTooltip(layer.feature.properties['GEOID'],{
	// 		permanent:false,
	// 		opacity:0.8,
	// 		className: 'tooltip'
	// 	});
	// })


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
	})

	/*
	
		labels
	
	*/ 
	let positronLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
		// attribution: cartodbAttribution,
		pane: 'labels'
	})
	
	/*
	
		satellite color with poi
	
	*/ 
	let satellitecolor = L.tileLayer('https://api.mapbox.com/styles/v1/yohman/ckrh25hug05w018ndot6lycob/tiles/512/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw', 
	{
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox/yohman</a>',
		maxZoom: 18,
		tileSize: 512,
		zoomOffset: -1,
		accessToken: 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw'
	});

	
	/*
	
		layer control
	
	*/ 
	let satelliteGroup = L.layerGroup([satellite,positronLabels]).addTo(chs.map);
	let satelliteColorGroup = L.layerGroup([satellitecolor,positronLabels]);
	let baseMaps = {
		"Satellite (black and white)": satelliteGroup,
		"Satellite (color)": satelliteColorGroup
	}
	L.control.layers(baseMaps).addTo(chs.map);
	
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

	geocoder.on('markgeocode', function(event) {
		/*
		
			remove the pin if it exists
		
		*/ 
		if(chs.mapLayers.geocodepin){chs.mapLayers.geocodepin.remove()}

		/*
		
			geocode and add a pin (marker)
		
		*/ 
		var center = event.geocode.center;
		chs.mapLayers.geocodepin = L.marker(center).addTo(chs.map);
		chs.map.setView(center, 15);
   	});

	/*
	
		user location
	
	*/ 
	L.control.locate().addTo(chs.map);

	/*
	
		print button
	
	*/ 
	L.control.browserPrint({
		printModes: ["Portrait", "Landscape"]
	}).addTo(chs.map)
	// L.Control.BrowserPrint.Utils.registerRenderer(L.Tooltip, 'L.Tooltip');
   	// chs.map.on('zoomend', function() {
    // 	onZoomEnd();
	// });
}

function onZoomEnd(){

	if(chs.map.getZoom() > 14){
		chs.mapLayers.baselayer.getLayers().forEach(function(layer){
			layer.bindTooltip(layer.feature.properties['GEOID'],{
					   permanent:false,
					   opacity:0.8,
					   className: 'tooltip'
				   });
	   })

	}
}

/* **************************** 

	Map themes (choropleths)

***************************** */ 
function addChoroplethLayer(args){

	/*
	
		If reset requested
	
	*/ 
	if(args.field === null)
	{
		if (chs.mapLayers.baselayer){
			// clear the layer
			chs.mapLayers.baselayer.clearLayers()
		}
		$('.legend').empty()
		addDefaultBaseLayer()
	}
	else
	{
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
		chs.mapLayers.baselayer.getLayers().forEach(function(item,index){
			//only add if it's a number
			if(!isNaN(item.feature.properties[chs.mapOptions.field])){
				values.push(parseFloat(item.feature.properties[chs.mapOptions.field]))
			}
		})

		// get rid of NaN's
		values = values.filter(e => (e === 0 || e));
		
		chs.mapOptions.brew.setSeries(values);
		chs.mapOptions.brew.setNumClasses(chs.mapOptions.num_classes);
		chs.mapOptions.brew.setColorCode(chs.mapOptions.choroplethColors);
		chs.mapOptions.brew.classify(chs.mapOptions.scheme);
		
		/*
		
		clear layers
		
		*/ 
		if (chs.mapLayers.baselayer){
			// clear the tooltips first
			if(chs.mapOptions.max_geos){
				chs.mapOptions.max_geos.forEach(function(layer){
					layer.unbindTooltip();
				})
			}
			
			chs.mapLayers.baselayer.clearLayers()
		}

		/*
		
			map it
		
		*/ 
		chs.mapLayers.baselayer = L.topoJson(chs.data.bgs, {
			style: getStyle, //call a function to style each feature
			onEachFeature: onEachFeature,
		}).addTo(chs.map);

		// add tooltip
		addTooltip();

		// create the legend
		createLegend();

		// add markers for hi/lo values
		mapHiLo();
	}

}

/* **************************** 

	Add Tooltip on hover

***************************** */ 
function addTooltip(){
	chs.mapLayers.baselayer.getLayers().forEach(function(layer){

		/*
		
			set the content html
		
		*/ 
		// let html = `<div style="font-size:1.4em">`
		let html = (layer.feature.properties['Block_Code']!='') ? `<div style="font-size:1.6em;border-bottom:1px solid #aaa;font-weight: bold;padding:4px;margin-bottom:8px;">Block code: ${layer.feature.properties['Block_Code']}</div>` : '';
		html += (layer.feature.properties['CSA_Name']!='') ? `${layer.feature.properties['CSA_Name']}<br>` : '';
		html += (layer.feature.properties['Current_Agency']!='') ? `${layer.feature.properties['Current_Agency']}<br>` : '';
		html += (layer.feature.properties['Current_Outreach']!='') ? `Outreach count: ${layer.feature.properties['Current_Outreach']}<br>` : '';
		// html += (layer.feature.properties['CHW_commun']!='') ? `CHW: ${layer.feature.properties['CHW_commun']}<br>` : '';
		// html += '</div>'

		if(html != ''){
			html = `<div style="font-size:1.4em">${html}</div>`
			layer.bindTooltip(html,{
				permanent:false,
				opacity:0.8,
				className: 'tooltip'
			});
		}

	})
}
/* **************************** 

	Create categorical map

***************************** */ 
// let cat_colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']
let cat_colors = d3.scale.category20().range()

function addCategoricalLayer(field){

	// empty themes
	// $('#dropdown-layers').selectivity('clear')
	
	if(field === null){
		if (chs.mapLayers.baselayer){
			chs.mapLayers.baselayer.clearLayers()
		}
		$('.legend').empty()
		addDefaultBaseLayer()

	}
	else
	{
		chs.mapOptions.category_field = field;

		/*
		
			clear array
		
		*/ 
		chs.mapOptions.category_array = [];
	
		/*
		
			get categories
		
		*/ 
		chs.data.data.forEach(function(item){
			chs.mapOptions.category_array.push(item[chs.mapOptions.category_field])
		})
	
		/*
		
			clean up
		
		*/ 
		// get rid of duplicates
		chs.mapOptions.category_array = [...new Set(chs.mapOptions.category_array)]
	
		// get rid of empty values
		if(chs.mapOptions.category_array[0]!=undefined){
			chs.mapOptions.category_array = chs.mapOptions.category_array.filter((entry) => { return entry.trim() != '' })
		}
	
		// sort it
		chs.mapOptions.category_array.sort();
	
		/*
		
			clear layers
		
		*/ 
		if (chs.mapLayers.baselayer){
			chs.mapLayers.baselayer.clearLayers()
		}
	
		chs.mapLayers.baselayer = L.topoJson(chs.data.bgs, {
			style:  getCategoryStyle,
			onEachFeature: onEachFeature,
		}).addTo(chs.map);
	
		// add tooltip
		addTooltip();

		createCategoricalLegend();
	
	}

}

function getCategoryStyle(feature){
	let index = chs.mapOptions.category_array.indexOf(feature.properties[chs.mapOptions.category_field])
	// let cat = parseInt(feature.properties.Priority_Decile)
	return {
		stroke: true,
		color: 'white',
		weight: 0.8,
		fill: true,
		fillColor: cat_colors[index],
		fillOpacity: chs.mapOptions.fillOpacity,
		opacity: chs.mapOptions.fillOpacity,
	}



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
	$('.boundary-toggle-container').empty();
	chs.mapOptions.boundary_label_toggle = true;

	// find it in the list of layers
	layer2add = chs.data.boundaries.find(({id}) => id === id_text)

	/*
	
		add boundary layer
	
	*/ 
	if(layer2add != undefined){
		$.getJSON(layer2add.path,function(data){
			boundary_options = {
				fill: false,
				weight: 1.5,
				pane:'boundaries',
				onEachFeature: function(feature,layer){
					if(layer2add.label){
						layer.bindTooltip(feature.properties[layer2add.name_field],{
							permanent:true,
							opacity:0.8,
							className: 'tooltip'
						});
					}
				}
			}
			// geo or topo json?
			if(layer2add.type === 'geojson'){
				chs.mapLayers.boundary = L.geoJson(data,boundary_options).addTo(chs.map)
			}
			else{
				chs.mapLayers.boundary = L.topoJson(data,boundary_options).addTo(chs.map)
			}
		})

		$('.sidebar').append(`<div class="boundary-toggle-container" style="margin-left:10px;font-size:0.8em">Labels <i id="boundary-toggle" onclick="toggleBoundaryLabels()" class="fa fa-toggle-on" aria-hidden="true" style="font-size:1.3em"></i></div>`)
				
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


function joinCSV(){

	/*
	
		do the joins
	
	*/ 
	chs.mapLayers.baselayer.eachLayer(function(layer) {
		featureJoinByProperty(layer.feature.properties, chs.data.csv.data, "GEOID");
	});
	
	chs.mapLayers.baselayer.eachLayer(function(layer) {
		featureJoinByProperty(layer.feature.properties, chs.data.csv2.data, "GEOID");
	});

	// google sheet for "live" data
	chs.mapLayers.baselayer.eachLayer(function(layer) {
		featureJoinByProperty(layer.feature.properties, chs.data.google.data, "GEOID");
	});

	/*
	
		add it to global data var
	
	*/ 
	chs.data.data = []
	chs.mapLayers.baselayer.eachLayer(function(layer) {
		chs.data.data.push(layer.feature.properties)
	});
}

function createGeoidList(){
	chs.mapLayers.baselayer.eachLayer(function(item){
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
	
	// deleteMaxGeos()
	chs.mapOptions.max_geos_toggle = true;
	let max_value = Math.max(...chs.mapOptions.brew.getSeries())
	let min_value = Math.min(...chs.mapOptions.brew.getSeries())

	chs.mapOptions.max_geos = chs.mapLayers.baselayer.getLayers().filter(item => parseFloat(item.feature.properties[chs.mapOptions.field]) === max_value)

	chs.mapOptions.max_geos.forEach(function(feature,layer){
		feature.bindTooltip(`<i style="font-size:2em;color:red" class="fa fa-chevron-circle-up" aria-hidden="true"></i>`,{
			permanent:true,
			opacity:0.8,
			className: 'tooltip'
		});
	});

	// let min_geos = chs.mapLayers.baselayer.getLayers().filter(item => parseFloat(item.feature.properties[chs.mapOptions.field]) === min_value)
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

function toggleMaxGeos(){

	if(chs.mapOptions.max_geos_toggle)
	{
		chs.mapOptions.max_geos.forEach(function(layer){
			layer.unbindTooltip();
		})
		$('#hi-toggle').removeClass('fa-toggle-on').addClass('fa-toggle-off')
		chs.mapOptions.max_geos_toggle = false;
	}
	else
	{
		mapHiLo()
		$('#hi-toggle').removeClass('fa-toggle-off').addClass('fa-toggle-on')
		chs.mapOptions.max_geos_toggle = true;
	}
}
function toggleBoundaryLabels(){

	if(chs.mapOptions.boundary_label_toggle)
	{
		chs.mapLayers.boundary.getLayers().forEach(function(layer){
			layer.unbindTooltip();   
		})
		$('#boundary-toggle').removeClass('fa-toggle-on').addClass('fa-toggle-off')
		chs.mapOptions.boundary_label_toggle = false;
	}
	else
	{
		$('#boundary-toggle').removeClass('fa-toggle-off').addClass('fa-toggle-on')
		chs.mapLayers.boundary.getLayers().forEach(function(layer){
			layer.bindTooltip(layer.feature.properties[layer2add.name_field],{
				permanent:true,
				opacity:0.8,
				className: 'tooltip'
			})
		})
		chs.mapOptions.boundary_label_toggle = true;
	}
}

function getRandomPalette(){
	// let pal = chs.mapOptions.brew.getColorCodesByType().seq
	let pal = ["OrRd", "PuBu", "BuPu", "Oranges", "BuGn", "YlOrBr", "YlGn", "Reds", "RdPu", "Greens", "YlGnBu", "Purples", "GnBu", "YlOrRd", "PuRd", "Blues", "PuBuGn","Spectral", "RdYlGn", "RdBu", "PiYG", "PRGn", "RdYlBu", "BrBG", "RdGy", "PuOr"]	
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

