/* **************************** 

	Feature actions

***************************** */ 
let hover = true;

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
	
	if(hover){
		createChart([layer.feature.properties.GEOID])
	}
}

/* **************************** 

	On mouse out

***************************** */ 
function resetHighlight(e) {
	if(hover){
		$('#charts').empty();
		chs.mapLayers.baselayer.resetStyle(e.target);
	}
	else{
		chs.mapLayers.baselayer.resetStyle(e.target);
	}

	// }
}

/* **************************** 

	On mouse click

***************************** */ 
function zoomToFeature(e) {
	chs.map.fitBounds(e.target.getBounds());
}


/* **************************** 

	Other actions

***************************** */ 
function selectFeature(e){
	/*
	
		when feature is selected, turn hover action off
	
	*/ 
	hover = false;

	var layer = e.target;

	// this is the selected feature
	let properties = e.target.feature.properties;	

	let this_geoid = properties.GEOID;

	/*
	
		add selected geoid's into an array
	
	*/ 
	// var chs.mapLayers.selected_geoids = []
	// chs.mapLayers.highlighted.getLayers().forEach(function(item){
	// })
	
	/*
	
		put selected feature into highlight variable
	
	*/ 
	highlight=chs.mapLayers.highlighted_layer.getLayers().filter(item => item.feature.properties.GEOID === this_geoid)[0];
	
	/*
	
		if feature has already been selected, de-select it
	
	*/ 
	if(chs.mapLayers.selected_geoids.indexOf(this_geoid)>-1){
		chs.mapLayers.highlighted.removeLayer(highlight)
		chs.mapLayers.selected_geoids.splice(chs.mapLayers.selected_geoids.indexOf(this_geoid),1)
	}
	/*
	
		if feature is new, add it to the selected geoids
	
	*/ 
	else{
		chs.mapLayers.selected_geoids.push(this_geoid)
			
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
	}
	
	chs.panels.info.update(layer.feature.properties)


	/*
	
		create charts
	
	*/ 
	createChart(chs.mapLayers.selected_geoids)
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

	createChart([properties.GEOID])
	
}

function zoomToAgency(agency){

	console.log(agency)

	if(chs.mapLayers.highlighted){
		chs.mapLayers.highlighted.clearLayers()
	}
	clearHighlightedFeatures()

	if(agency)
	{
		hover = false;
	
		// get list of fips for this agency
		highlight_agency_bgs=chs.mapLayers.highlighted_layer.getLayers().filter(item => item.feature.properties.Current_Agency === agency)
	
		/*
		
			loop through each feature in agency
		
		*/ 
		highlight_agency_bgs.forEach(function(item){
			// add it to the selected geoids
			chs.mapLayers.selected_geoids.push(item.feature.properties.GEOID)
	
			// highlight it
			chs.mapLayers.highlighted.addLayer(item)
	
			// add it to the info panel
			chs.panels.info.update(item.feature.properties)
	
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
		createChart(chs.mapLayers.selected_geoids)

	}
	else {
		$('#charts').empty();
	}
	
}
