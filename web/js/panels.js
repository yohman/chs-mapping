
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
			console.log(data.value)
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
		console.log(data.value)
		// choropleth or categorical?
		
		if(chs.data.categorical_variables.filter(item => item.id === data.value).length > 0)
		{
			console.log('it is categorical...')
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

		let count = chs.mapLayers.highlighted.getLayers().length;

		if(count > 0){
			if(count === 1){
				this._div.innerHTML = `${count} feature selected`
			}
			else{
				this._div.innerHTML = `${count} features selected`
			}
			this._div.innerHTML += ` <button style="" onclick="chs.mapLayers.highlighted.clearLayers();chs.panels.info.update()">clear</button>`
		}
		else{
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
			console.log(this.value)
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
			console.log(this.value)
			chs.mapOptions.fillOpacity = this.value/100
			chs.mapLayers.baselayer.setStyle({opacity:chs.mapOptions.fillOpacity,fillOpacity:chs.mapOptions.fillOpacity})
		}


}


/* **************************** 

	Dashboard

***************************** */ 
function createChart(properties){

	// for now, total pop is different
	// if(geojson_scale === 'bg'){
		total_pop = properties.Pop_total
		if(properties.Block_Code != '')
		{
			additional_html = `
			<span style="font-size:1.6em;padding: 4px;margin:4px;">Block code: ${properties.Block_Code}</span>
			`

			// <span style="font-size:0.7em;color:#666">Priority: ${properties.Priority_Decile}</span><br>
			// <span style="font-size:0.7em;color:#666">${properties.Current_Agency}</span>
		}
		else
		{
			additional_html = ''
		}
	// }
	// else{
	// 	total_pop = properties.total_pop
	// }
	// empty dashboard
	$('#charts').html(`
	<div style="text-align:center">
		<h4>
			<span style="font-size:1.3em">Community Profile<br>
		</h4>
		${additional_html}
		<div style="font-size:0.8em;color:#666">Total population: ${total_pop}</div>
	</div>
	<table width="100%">
	<tr><td width="50%" id="dash1"></td><td width="50%" id="dash2"></td></tr>
	<tr><td width="50%" id="dash3"></td><td width="50%" id="dash4"></td></tr>
	</table>
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
	$('#dash4').append('<div class="col-sm" style="text-align:center">'+createWaffleChart(wafflevalues)+'</div>');


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
	// 	sparkline_data.push(parseFloat(item.properties[chs.mapOptions.field]))

	// })
	//  sparkline_data = sparkline_data.filter(function (value) {
	// 	return !Number.isNaN(value);
	// });
	// sparkline_data.sort((a,b) => a-b)

	// index = sparkline_data.findIndex(item => item === parseFloat(properties[chs.mapOptions.field]));
	// // index = sparkline_data.findIndex(item => item === 8.85188431200701);

	// console.log('index is ' + index)
	// console.log(properties[chs.mapOptions.field])
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
	// 	xaxis: {title: chs.mapOptions.field}, 
	// 	bargap: 0.05, 
	//   };
	//   	Plotly.newPlot('undermap', data,layout);
	


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
		$('body').css('grid-template-columns','300px 1fr 300px')
		chs.map.invalidateSize()
		chs.panels.hideDashboard = true;
	}
}