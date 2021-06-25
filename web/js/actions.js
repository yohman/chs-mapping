/* **************************** 

	Feature actions

***************************** */ 
// Function that defines what will happen on user interactions with each feature
function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight,
		// click: zoomToFeature
		click: selectFeature
	});
}

/* **************************** 

	On mouse over

***************************** */ 
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

/* **************************** 

	On mouse out

***************************** */ 
function resetHighlight(e) {
	$('#charts').empty();
	chs.mapLayers.baselayer.resetStyle(e.target);
}


/* **************************** 

	On mouse click

***************************** */ 
function zoomToFeature(e) {
	console.log(e)
	chs.map.fitBounds(e.target.getBounds());
}


/* **************************** 

	Other actions

***************************** */ 
function selectFeature(e){
	var layer = e.target;

	let properties = e.target.feature.properties;
	console.log(properties)
	
	
	highlight=chs.mapLayers.highlighted_layer.getLayers().filter(item => item.feature.properties.GEOID === properties.GEOID)[0];
	
	console.log(highlight)
	chs.mapLayers.highlighted.addLayer(highlight)
	
	chs.map.fitBounds(chs.mapLayers.highlighted.getBounds())
	// style to use on mouse over
	chs.mapLayers.highlighted.setStyle({
		weight: 4,
		color: '#6A3D9A',
		pane: 'boundaries',
		fill: false
	});
	chs.mapLayers.highlighted.bringToFront();
	chs.mapLayers.highlighted.addTo(chs.map)
	chs.panels.info.update(layer.feature.properties)

}

function zoomToFIPS(fips){

	if(chs.mapLayers.highlighted){
		chs.mapLayers.highlighted.clearLayers()
	}

	highlight=chs.mapLayers.highlighted_layer.getLayers().filter(item => item.feature.properties.GEOID === fips)[0];

	chs.mapLayers.highlighted.addLayer(highlight)
	chs.map.fitBounds(chs.mapLayers.highlighted.getBounds())

	// style to use on mouse over
	chs.mapLayers.highlighted.setStyle({
		weight: 4,
		color: '#6A3D9A',
		pane: 'boundaries',
		fill: false
	});
	chs.mapLayers.highlighted.bringToFront();
	chs.mapLayers.highlighted.addTo(chs.map)

	/*
	
		create chart
	
	*/ 
	// find the data for this fips
	properties = chs.mapLayers.baselayer.getLayers().filter(item => item.feature.properties.GEOID === fips)[0].feature.properties

	createChart(properties)
	
}

function zoomToAgency(agency){

	if(chs.mapLayers.highlighted){
		chs.mapLayers.highlighted.clearLayers()
	}

	// get list of fips for this agency
	highlight_agency_bgs=chs.mapLayers.highlighted_layer.getLayers().filter(item => item.feature.properties.Current_Agency === agency)

	highlight_agency_bgs.forEach(function(item){
		chs.mapLayers.highlighted.addLayer(item)
	})
	// chs.mapLayers.highlighted.addLayer(highlight)
	chs.map.fitBounds(chs.mapLayers.highlighted.getBounds())

	// style to use on mouse over
	chs.mapLayers.highlighted.setStyle({
		weight: 2,
		color: '#6A3D9A',
		pane: 'boundaries',
		fill: false
	});
	chs.mapLayers.highlighted.bringToFront();
	chs.mapLayers.highlighted.addTo(chs.map)

	/*
	
		create chart
	
	*/ 
	// find the data for this fips
	// properties = chs.mapLayers.baselayer.getLayers().filter(item => item.feature.properties.GEOID === fips)[0].feature.properties

	// createChart(properties)
	
}
