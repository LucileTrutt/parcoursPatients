document.getElementById('pm3').addEventListener('submit', function(e) {e.preventDefault();});

document.getElementById('bouton3').addEventListener('click', graph3);
document.getElementById('mask3').addEventListener('click', masquer4);
document.getElementById('mask3bis').addEventListener('click', afficher4);

function graph3() {
	
	tbLabel3() 
	
	console.log('coucou')
	
	var annee = document.getElementById('annee').value
	var radios = document.getElementsByName('niveau');
	for(var i = 0; i < radios.length; i++){
		if(radios[i].checked){
		var niv = radios[i].value;
		}
	}
	
	d3.select("#graph3").selectAll("*").remove();
	
	var tsvData = null;

	var margin = {top: 61, right: 60, bottom: 60, left: 60},
		width = window.innerWidth*0.70,
		height = window.innerHeight*0.65;

	//~ var parseDate = d3.timeParse('%Y');

	//~ var formatSi = d3.format(".3s");

	//~ var formatNumber = d3.format(".1f"),
		//~ formatBillion = function(x) { return formatNumber(x / 1e9); };

	var x = d3.scaleLinear()
		.range([0, width]);

	var y = d3.scaleLinear()
		.range([height, 0]);

	var color = d3.scaleOrdinal(d3.schemeCategory20);

	var xAxis = d3.axisBottom()
		.scale(x);

	var yAxis = d3.axisLeft()
		.scale(y)
		//~ .tickFormat(formatBillion);

	var area = d3.area()
		.x(function(d) { 
		  return x(d.data.jour); })
		.y0(function(d) { return y(d[0]); })
		.y1(function(d) { return y(d[1]); });

	var stack = d3.stack()

	var svg = d3.select('#graph3').append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
	  .append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	//~ // à revoir pour la légende
	//~ function get_colors(n) {
		//~ var colors = ["#a6cee3","#1f78b4","#b2df8a","#33a02c",
		//~ "#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6",
		//~ "#6a3d9a"];
		//~ return colors[ n % colors.length];}
		
	d3.csv('db/area_'+ niv + annee +'.csv', function(error, data) {
		console.log(data[0])
	  color.domain(d3.keys(data[0]).filter(function(key) { return key !== 'jour'; }));
	  var keys = data.columns.filter(function(key) { return key !== 'jour'; })
	  //~ data.forEach(function(d) {
		//~ d.date = parseDate(d.date); 
	  //~ });
	  tsvData = (function(){ return data; })();


	  var maxDateVal = d3.max(data, function(d){
		var vals = d3.keys(d).map(function(key){ return key !== 'jour' ? d[key] : 0 });
		return d3.sum(vals);
	  });
	  
	  // Set domains for axes
	  //~ x.domain(d3.extent(data, function(d) { return d.jour; }));
	  x.domain([0, 90])
	  y.domain([0, maxDateVal])

	  stack.keys(keys);

	  stack.order(d3.stackOrderNone);
	  stack.offset(d3.stackOffsetNone);

	  console.log(stack(data));

	  var browser = svg.selectAll('.browser')
		  .data(stack(data))
		.enter().append('g')
		  .attr('class', function(d){ return 'browser ' + d.key; })
		  .attr('fill-opacity', 0.8)
		  .attr('title', function(d) { return 'browser' + d.key; });

	  browser.append('path')
		  .attr('class', 'area')
		  .attr('d', area)
		  .style('fill', function(d) { return color(d.key); });
		  //~ .attr('title', function(d) { return d.key; });
		//~ browser.append("title")
		  //~ .text(function(d) { return d.name; });

		  
	  //~ browser.append('text')
		  //~ .datum(function(d) { return d; })
		  //~ .attr('transform', function(d) { return 'translate(' + x(data[5].jour) + ',' + y(d[5][1]) + ')'; })
		  //~ .attr('x', -6) 
		  //~ .attr('dy', '.35em')
		  //~ .style("text-anchor", "start")
		  //~ .text(function(d) { return d.key; })
		  //~ .attr('fill-opacity', 1);

	  svg.append('g')
		  .attr('class', 'x axis')
		  .attr('transform', 'translate(0,' + height + ')')
		  .call(xAxis);

	  svg.append('g')
		  .attr('class', 'y axis')
		  .call(yAxis);

	  svg.append ("text")
		.attr("x", 0 - (margin.left /2))
		.attr("y", 0 - (margin.top /3))
		.text("n séjours")
		
	svg.append ("text")
		.attr("x", width / 2)
		.attr("y", height + (margin.bottom/2 + 10))
		.text("jours")

	var legend = svg.selectAll(".legend")
			.data(stack(data).reverse()).enter()
			.append("g")
			.attr("class","legend")
		 .attr("transform", "translate(" + (width - 80) + "," + 0+ ")");

	   legend.append("rect")
		 .attr("x", 0) 
		 .attr("y", function(d, i) { return 20 * i; })
		 .attr("width", 10)
		 .attr("height", 10)
		 .style("fill", function(d) { return color(d.key); })
		 .attr('fill-opacity', 0.8); 
	   
		legend.append("text")
		 .attr("x", 20) 
		 .attr("dy", "0.75em")
		 .attr("y", function(d, i) { return 20 * i; })
		 .text(function(d) {
			 if (d.key == '0000'){
				return 'Bloc CTCV'
			} else {
				return d.key}});
		  
		legend.append("text")
		 .attr("x",0) 
		 .attr("y",-10)
		 .text("Catégories");
	});	
}


function masquer4() {
	document.getElementById('tb3').style.display = 'none';
	document.getElementById('tb3bis').style.display = 'block';
}

function afficher4() {
	document.getElementById('tb3').style.display = 'block';
	document.getElementById('tb3bis').style.display = 'none';
}

function tbLabel3() {
	var annee = document.getElementById('annee').value;
	//~ var annee = '2017';
	var radios = document.getElementsByName('niveau');
	for(var i = 0; i < radios.length; i++){
		if(radios[i].checked){
			var niv = radios[i].value;
		}
	}
	
	nombre(annee)
	
	var request = new XMLHttpRequest();
	request.open('GET','db/lsLib.json');
	request.responseType = 'json';
	request.send();
	request.onload = function() {
		var label = request.response;
		var lab = []
		label = label[annee][niv];
		for(code in label) {
			lab.push([code, label[code].lib])
		}
		lab.sort()
		var tab = document.getElementById('lib3');
		
		while (tab.firstChild) {
			tab.deleteRow(0);
		}
		for (code in lab) {
			if ((lab[code][0] != "taille") && (lab[code][0] != "0000")) {
				var ligne = tab.insertRow()
				ligne.insertCell().innerHTML = lab[code][0]
				ligne.insertCell().innerHTML = lab[code][1]
			}
		}
	}
}
