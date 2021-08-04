
/* **************************** 

	Sidebar

***************************** */ 
function createSidebar(){

	$('.sidebar').html('')

	/*
	
		search by agency
	
	*/ 
	$('.sidebar').append(`<div class="dropdown" id="dropdown-agency"></div>`)
	$('#dropdown-agency').selectivity({
		allowClear: true,
		items: chs.panels.list_agencies,
		placeholder: 'Search by Agency',
		showSearchInputInDropdown: true
	}).on("change",function(data){
		zoomToAgency(data.value)
	});

	/*
	
		search by block code
	
	*/ 
	$('.sidebar').append(`<div class="dropdown" id="dropdown-blocks"></div>`)
	$('#dropdown-blocks').selectivity({
		allowClear: true,
		items: chs.panels.list_block_codes,
		placeholder: 'Search by block code',
		showSearchInputInDropdown: true
	}).on("change",function(data){
		zoomToFIPS(data.value)
	});

	/*
	
		categorical themes
	
		$('.sidebar').append(`<div class="dropdown" id="dropdown-catlayers"></div>`)
		
		$('#dropdown-catlayers').selectivity({
			allowClear: true,
			items: [
				{
					// id: '+00:00',
					text: 'Categorical themes',
					children: chs.data.categorical_variables,
				},
			],
			placeholder: 'Categorical Themes',
			showSearchInputInDropdown: false
		}).on("change",function(data){
			addCategoricalLayer(data.value)
		});
		*/ 
	/*
	
		themes
	
	*/ 
	$('.sidebar').append(`<div class="dropdown" id="dropdown-layers"></div>`)

	$('#dropdown-layers').selectivity({
		allowClear: true,
		items: [
			{
				// id: '+00:00',
				text: 'Categorical themes',
				children: chs.data.categorical_variables,
			},
			{
				// id: '+00:00',
				text: 'ACS 2019 5-year Estimates',
				children: chs.data.variables,
			}
		],
		placeholder: 'Themes',
		showSearchInputInDropdown: false
	}).on("change",function(data){
		// choropleth or categorical?
		
		if(chs.data.categorical_variables.filter(item => item.id === data.value).length > 0)
		{
			addCategoricalLayer(data.value)
		}
		else
		{
			addChoroplethLayer({field:data.value})
		}
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
			children: chs.data.boundaries,
		}],
		placeholder: 'Boundaries',
		showSearchInputInDropdown: false
	}).on("change",function(data){
		addBoundaryLayer(data.value)
	});

}

/* **************************** 

	Selection panel

***************************** */ 

function createInfoPanel(){

	chs.panels.info.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		this.update();
		return this._div;
	};

	// method that we will use to update the control based on feature properties passed
	chs.panels.info.update = function (properties) {
		// let count = chs.mapLayers.highlighted.getLayers().length;
		let count = chs.mapLayers.selected_geoids.length;

		if(count > 0){
			if(count === 1){
				this._div.innerHTML = `${count} feature selected`
			}
			else{
				this._div.innerHTML = `${count} features selected`
			}
			this._div.innerHTML += ` <button style="" onclick="clearHighlightedFeatures()">clear</button>`
		}
		else{
			hover = true;
			this._div.innerHTML = 'Click on a block group to select it';
		}

		// // if feature is highlighted
		// if(properties){
		// 	this._div.innerHTML = `<b>${properties.GEOID}</b>`;
		// }
		// // if feature is not highlighted
		// else
		// {
		// 	this._div.innerHTML = 'Hover over a block group';
		// }
	};	

	chs.panels.info.addTo(chs.map);
}

function clearHighlightedFeatures(){
	hover=true;
	chs.mapLayers.selected_geoids = [];
	chs.mapLayers.highlighted.clearLayers();
	chs.panels.info.update()
}

/* **************************** 

	Legend

***************************** */ 
function createCategoricalLegend(){
	// legend.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'legend-inner');
		
		let title = chs.data.categorical_variables.filter(item => item.id === chs.mapOptions.category_field)[0].text
		let html = `<h4>${title}</h4>`

		html += `<table>`

		/*
		
			colors and values
		
		*/ 
		chs.mapOptions.category_array.forEach(function(item,index){
			
			html += `<tr><td><i style="margin-left:20px;background:${cat_colors[index]}"></i></td>
			<td><span style="font-size:0.8em;">${item}</span></td></tr>`
			// toggle version for later implementation
			// html += `<tr><td><i style="margin-left:20px;background:${cat_colors[index]}"></i></td><td><i id="hi-toggle" onclick="toggleMaxGeos()" class="fa fa-toggle-on" aria-hidden="true" style="font-size:1.3em"></i></td>
			// <td><span style="font-size:0.8em;">${item}</span></td></tr>`
		})

		// div.innerHTML = html;


		// $('.legend').html(div)

		/*
		
			opacity
		
		*/ 
		html += `<table style="margin-left:20px;" leaflet-browser-print-pages-hide><tr><td style="vertical-align: top;font-size:0.8em;">Opacity</td><td style="vertical-align: middle;"><input type="range" min="1" max="100" value="${chs.mapOptions.fillOpacity*100}" class="slider" id="myRange"></td></tr></table>`;

		div.innerHTML = html;


		$('.legend').html(div)
		
		var slider = document.getElementById("myRange");
		slider.oninput = function(){
			chs.mapOptions.fillOpacity = this.value/100
			chs.mapLayers.baselayer.setStyle({opacity:chs.mapOptions.fillOpacity,fillOpacity:chs.mapOptions.fillOpacity})
		}



}

function createLegend(){
	// legend.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'legend-inner'),
		breaks = chs.mapOptions.brew.getBreaks(),
		from, to;
		let variable = chs.data.variables.find( ({ id }) => id === chs.mapOptions.field)
		let html = `<h4>${variable.text}</h4>`

		html += `<table>`

		/*
		
			colors and values
		
		*/ 
		for (var i = 0; i < breaks.length; i++) {
			from = breaks[i];
			to = breaks[i + 1];
			if(to) {
				if(variable.percent){
					html += `<tr><td><i style="margin-left:20px;background:${chs.mapOptions.brew.getColorInRange(to)}"></i></td>
					<td><span style="font-size:0.8em;">${from.toFixed(0)}% &ndash; ${to.toFixed(0)}%</span></td></tr>`
				}
				else{
					html += `<tr><td><i style="margin-left:20px;background:${chs.mapOptions.brew.getColorInRange(to)}"></i></td>
					<td><span style="font-size:0.8em;">${from.toFixed(0)} &ndash; ${to.toFixed(0)}</span></td></tr>`
				}
			}	
		}
		
		/*
		
			highest values
		
		*/ 
		html += `<tr><td style="vertical-align: middle;"><i style="margin-left:22px;font-size:1.2em;color:red" class="fa fa-chevron-circle-up" aria-hidden="true"></i></td><td style="vertical-align: middle;font-size:0.8em;">highest values</td><td><i id="hi-toggle" onclick="toggleMaxGeos()" class="fa fa-toggle-on" aria-hidden="true" style="font-size:1.3em"></i></td></tr></table>`;

		/*
		
		break options
		
		*/ 
		html += `<span style="margin-left:20px;" class='legend-scheme' onclick="addChoroplethLayer({scheme:'quantiles'})" leaflet-browser-print-pages-hide>quantiles</span>`;
		html += `<span class='legend-scheme' onclick="addChoroplethLayer({scheme:'equal_interval'})" leaflet-browser-print-pages-hide>equal interval</span>`;
		
		/*
		
			opacity
		
		*/ 
		html += `<table style="margin-left:20px;" leaflet-browser-print-pages-hide><tr><td style="vertical-align: top;font-size:0.8em;">Opacity</td><td style="vertical-align: middle;"><input type="range" min="1" max="100" value="${chs.mapOptions.fillOpacity*100}" class="slider" id="myRange"></td></tr></table>`;

		div.innerHTML = html;


		$('.legend').html(div)

		var slider = document.getElementById("myRange");
		slider.oninput = function(){
			chs.mapOptions.fillOpacity = this.value/100
			chs.mapLayers.baselayer.setStyle({opacity:chs.mapOptions.fillOpacity,fillOpacity:chs.mapOptions.fillOpacity})
		}


}


/* **************************** 

	Dashboard

***************************** */ 
function createChart(GEOIDs){

	/*
	
		set the chart variables
	
	*/ 
	let people_in_poverty = 0;
	let total_pop_poverty = 0;

	let people_uninsured = 0;
	let total_pop_uninsured = 0;

	let people_english = 0;
	let total_pop_english = 0;

	let people_hisp = 0;
	let people_NonHisp_black = 0;
	let people_NonHisp_white = 0;
	let people_NonHisp_asian = 0;
	let total_pop_race = 0;

	let people_male = 0;
	let people_female = 0;
	let total_pop_gender = 0;

	let people_age_5under = 0;
	let people_age_5to14 = 0;
	let people_age_15to17 = 0;
	let people_age_18to20 = 0;
	let people_age_21to64 = 0;
	let people_age_65above = 0;
	let total_pop_age = 0;

	let blockcodes = [];

	let Pop_total = 0;

	/*
	
		for each geoid, summarize the data
	
	*/ 
	GEOIDs.forEach(function(geoid){

		properties = chs.data.data.filter(item => item.GEOID === geoid)[0]

		Pop_total += parseInt(properties.Pop_total)

		blockcodes.push(properties.Block_Code)

		/*
		
			poverty
		
		*/ 
		people_in_poverty += parseInt(properties.B17021_002E)
		total_pop_poverty += parseInt(properties.B17021_001E)
		
		/*
		
			insured
		
		*/ 
		people_uninsured += parseInt(properties.B27010_017E)+parseInt(properties.B27010_033E)+parseInt(properties.B27010_050E)+parseInt(properties.B27010_066E)
		total_pop_uninsured += parseInt(properties.B27010_001E)

		/*
		
			english
		
		*/ 
		people_english += parseInt(properties.B16004_007E) + parseInt(properties.B16004_008E) +
			parseInt(properties.B16004_012E) + parseInt(properties.B16004_013E) +
			parseInt(properties.B16004_017E) + parseInt(properties.B16004_018E) +
			parseInt(properties.B16004_022E) + parseInt(properties.B16004_023E) +
			parseInt(properties.B16004_029E) + parseInt(properties.B16004_030E) +
			parseInt(properties.B16004_034E) + parseInt(properties.B16004_035E) +
			parseInt(properties.B16004_039E) + parseInt(properties.B16004_040E) +
			parseInt(properties.B16004_044E) + parseInt(properties.B16004_045E) +
			parseInt(properties.B16004_051E) + parseInt(properties.B16004_052E) +
			parseInt(properties.B16004_056E) + parseInt(properties.B16004_057E) +
			parseInt(properties.B16004_061E) + parseInt(properties.B16004_062E) +
			parseInt(properties.B16004_066E) + parseInt(properties.B16004_067E)
		total_pop_english += parseInt(properties.B16004_001E)

		/*
		
			race
		
		*/ 
		people_hisp += parseInt(properties.B03002_012E);
		people_NonHisp_black += parseInt(properties.B03002_004E);
		people_NonHisp_white += parseInt(properties.B03002_003E);
		people_NonHisp_asian += parseInt(properties.B03002_006E);
		total_pop_race += parseInt(properties.B03002_001E);

		/*
		
			gender
		
		*/ 
		people_male += parseInt(properties.B01001_002E);
		people_female += parseInt(properties.B01001_026E);
		total_pop_gender += parseInt(properties.B03002_001E);

		/*
		
			age
		
		*/ 
		people_age_5under += parseInt(properties.B01001_003E) + parseInt(properties.B01001_027E)
		people_age_5to14 += parseInt(properties.B01001_004E) + parseInt(properties.B01001_005E) + parseInt(properties.B01001_028E) + parseInt(properties.B01001_029E)
		people_age_15to17 += parseInt(properties.B01001_006E) + parseInt(properties.B01001_030E)
		people_age_18to20 += parseInt(properties.B01001_007E) + parseInt(properties.B01001_008E) + parseInt(properties.B01001_031E) + parseInt(properties.B01001_032E)
		people_age_21to64 += parseInt(properties.B01001_009E) + parseInt(properties.B01001_010E) + parseInt(properties.B01001_011E) + parseInt(properties.B01001_012E) + parseInt(properties.B01001_013E) + parseInt(properties.B01001_014E) + parseInt(properties.B01001_015E) + parseInt(properties.B01001_016E) + parseInt(properties.B01001_017E) + parseInt(properties.B01001_018E) + parseInt(properties.B01001_019E) + parseInt(properties.B01001_033E) + parseInt(properties.B01001_034E) + parseInt(properties.B01001_035E) + parseInt(properties.B01001_036E) + parseInt(properties.B01001_037E) + parseInt(properties.B01001_038E) + parseInt(properties.B01001_039E) + parseInt(properties.B01001_040E) + parseInt(properties.B01001_041E) + parseInt(properties.B01001_042E) + parseInt(properties.B01001_043E)
		people_age_65above += parseInt(properties.B01001_020E) + parseInt(properties.B01001_021E) + parseInt(properties.B01001_022E) + parseInt(properties.B01001_023E) + parseInt(properties.B01001_024E) + parseInt(properties.B01001_025E) + parseInt(properties.B01001_044E) + parseInt(properties.B01001_045E) + parseInt(properties.B01001_046E) + parseInt(properties.B01001_047E) + parseInt(properties.B01001_048E) + parseInt(properties.B01001_049E)
		total_pop_age += parseInt(properties.B03002_001E)
	})

	/*
	
		calculate the percent of total
	
	*/ 
	let percent_poverty = people_in_poverty/total_pop_poverty * 100;
	let Uninsured_per = people_uninsured/total_pop_uninsured * 100;
	let Limited_Eng_per = people_english/total_pop_english * 100;

	let Hisp_per = people_hisp/total_pop_race * 100;
	let NonHisp_black_per = people_NonHisp_black/total_pop_race * 100;
	let NonHisp_white_per = people_NonHisp_white/total_pop_race * 100;
	let NonHisp_asian_per = people_NonHisp_asian/total_pop_race * 100;

	let Male_per = people_male/total_pop_gender * 100;
	let Female_per = people_female/total_pop_gender * 100;

	let age_5under_per = people_age_5under/total_pop_age * 100; 
	let age_5to14_per = people_age_5to14/total_pop_age * 100; 
	let age_15to17_per = people_age_15to17/total_pop_age * 100; 
	let age_18to20_per = people_age_18to20/total_pop_age * 100; 
	let age_21to64_per = people_age_21to64/total_pop_age * 100; 
	let age_65above_per = people_age_65above/total_pop_age * 100; 
	/*
	
		show difference if block code exists
	
	*/ 
	if(GEOIDs.length == 1){
	
		if(properties.Block_Code != ''){
			additional_html = `
			<span style="font-size:1.6em;padding: 4px;margin:4px;">Block code: ${properties.Block_Code}</span>
			`
		}
		else{
			additional_html = '<span style="font-size:1.2em;padding: 4px;margin:4px;"><i>No block code</i></span>'
		}

	}
	else
	{
		additional_html = 'You have selected ' + GEOIDs.length + ' block groups'
	}

	/*
	
		create the html
	
	*/ 
	$('#charts').html(`
	<div style="text-align:center">
		<h4>
			<span style="font-size:1.3em">Community Profile<br>
		</h4>
		${additional_html}
		<div style="font-size:0.8em;color:#666">Total population: ${Pop_total}</div>
	</div>
	<table width="100%">
		<tr><td width="33%" id="dash1"></td><td width="33%" id="dash2"></td><td width="33%" id="dash3"></td></tr>
		<tr><td width="33%" id="dash4"></td><td width="33%" id="dash5"></td><td width="33%" id="dash6"></td></tr>
	</table>
	<div style="font-size:0.8em;padding:10px;font-weight:bold;">Source: American Community Survey, 2015-2019</div>
	`);

	/*
	
		Poverty
	
	*/ 
	
	// let percent_poverty = parseInt(properties.B17021_002E) / parseInt(properties.B17021_001E) * 100

	var series = [Math.round(percent_poverty),100-Math.round(percent_poverty)]
	var labels = ['Below poverty level', 'Above poverty level']
	var wafflevalues = {};
	wafflevalues.title = 'Poverty';
	wafflevalues.data = series
	wafflevalues.labels = labels
	$('#dash1').html('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');

	/*
	
		uninsured
	
	*/ 
	var series = [Math.round(Uninsured_per),100-Math.round(Uninsured_per)]
	var labels = ['Uninsured', 'Insured']
	var wafflevalues = {};
	wafflevalues.title = 'Uninsured';
	wafflevalues.data = series
	wafflevalues.labels = labels
	$('#dash2').html('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');

	/*
	
		English
	
	*/ 
	var series = [Math.round(Limited_Eng_per),100-Math.round(Limited_Eng_per)]
	var labels = ['Limited English', 'Not Limited']
	var wafflevalues = {};
	wafflevalues.title = 'English';
	wafflevalues.data = series
	wafflevalues.labels = labels
	$('#dash3').html('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');

	/*
	
		Gender
	
	*/ 
	var series = [Math.round(Male_per),Math.round(Female_per)]
	var labels = ['Male', 'Female']
	var wafflevalues = {};
	wafflevalues.title = 'Gender';
	wafflevalues.data = series
	wafflevalues.labels = labels
	$('#dash5').html('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');


	/*
	
		Race
	
	*/ 
	var series = [
		Math.round(Hisp_per),
		Math.round(NonHisp_white_per),
		Math.round(NonHisp_black_per),
		Math.round(NonHisp_asian_per),
		100-Math.round(Hisp_per)-Math.round(NonHisp_white_per)-Math.round(NonHisp_black_per)-Math.round(NonHisp_asian_per)
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
	$('#dash4').append('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');
	/*
	
		age
	
	*/ 
	var series = [
		Math.round(age_5under_per),
		Math.round(age_5to14_per),
		Math.round(age_15to17_per),
		Math.round(age_18to20_per),
		Math.round(age_21to64_per),
		Math.round(age_65above_per),
	]
	var labels = [
		'under 5',
		'5 to 14',
		'15 to 17',
		'18 to 20',
		'21 to 64',
		'above 65'
	]

	// race waffle
	var wafflevalues = {};
	wafflevalues.title = 'Age';
	wafflevalues.data = series
	wafflevalues.labels = labels
	$('#dash6').append('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');

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
			waffle += '<div class="waffle-border" style="float:left;"><div class="waffle-box" style="background-color:'+chs.palette[i]+'"></div></div>';
		}
	})
	// waffle += '</div>';


	/*
	
		legend
	
	*/ 
	// stats and values
	waffle += '<table class="table table-sm table-condensed smallfont" style="text-align:left;">';

	for (var i = 0; i < values.data.length; i++) {
		waffle += '<tr><td><div class="waffle-box-empty smallfont" style="background-color:'+chs.palette[i]+'"> &nbsp&nbsp&nbsp&nbsp</div></td><td>'+values.labels[i]+' ('+normalizedValues[i]+'%)</td><td><div class="waffle-border" style="float:left;"></div></td></tr>';
		// waffle += '<tr><td width="60%"><div class="waffle-box-empty smallfont" style="background-color:'+mdbla.chs.palette[i]+'"> &nbsp&nbsp&nbsp&nbsp'+values.labels[i]+'</div></td><td class="smallfont" width="40%" align="right">'+values.data[i]+' ('+normalizedValues[i]+'%)</td><td><div class="waffle-border" style="float:left;"></div></td></tr>';
	}

	waffle += '</table></div>'

	return waffle;
}


function toggleDashboard(){
	if(chs.panels.hideDashboard){
		
		$('#charts').hide()
		$('body').css('grid-template-columns','300px 1fr 1px')
		chs.map.invalidateSize()
		chs.panels.hideDashboard = false;
	}
	else
	{
		$('#charts').show()
		$('body').css('grid-template-columns','300px 1fr 400px')
		chs.map.invalidateSize()
		chs.panels.hideDashboard = true;
	}
}

function toggleTOC(){

	// check dashboard toggle
	if(chs.panels.hideDashboard){
		dashboard_width = '400px';
	}
	else{
		dashboard_width = '1px';
	}

	if(chs.panels.hideTOC){
		
		$('#sidebar').hide()
		$('#legend').hide()
		$('body').css('grid-template-columns',`1px 1fr ${dashboard_width}`)
		chs.map.invalidateSize()
		chs.panels.hideTOC = false;
	}
	else
	{
		$('#sidebar').show()
		$('#legend').show()
		$('body').css('grid-template-columns',`300px 1fr ${dashboard_width}`)
		chs.map.invalidateSize()
		chs.panels.hideTOC = true;
	}
}