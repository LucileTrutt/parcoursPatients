document.getElementById('pm1').addEventListener('submit', function(e) {e.preventDefault();});

document.getElementById('bouton1').addEventListener('click', change);
document.getElementById('mask1').addEventListener('click', masquer1);
document.getElementById('mask1bis').addEventListener('click', afficher1);

// action générale
function change() {
	var annee = document.getElementById('annee').value;
	var minVenues = parseInt(document.getElementById('preci').value);
	var limiteMvtPre = - parseInt(document.getElementById('max_pre').value) -1;
	var limiteMvtPost = parseInt(document.getElementById('max_post').value) +1;
	
	if (limiteMvtPre == -1) {
		limiteMvtPre = 0;
	}
	if (limiteMvtPost == 1) {
		limiteMvtPost = 0;
	}

	var radios = document.getElementsByName('niveau');
	for(var i = 0; i < radios.length; i++){
		if(radios[i].checked){
		var niv = radios[i].value;
		}
	}
	
	if (this.form.preci.value && this.form.max_pre.value && this.form.max_post.value){
		console.log('* Module 1 *')
		dessin(annee, minVenues, limiteMvtPre, limiteMvtPost, niv);
		nombre(annee);
		tbLabel1(annee, niv);
	}
}

function nombre(annee){
  switch (annee){
    case '2017' :
      document.getElementById('nb1').textContent="1740";
      document.getElementById('nb2').textContent="1740";
      document.getElementById('nb3').textContent="1740";
      break;
    case '2016' :
      document.getElementById('nb1').textContent="1591";
      document.getElementById('nb2').textContent="1591";
      document.getElementById('nb3').textContent="1591";
      break;
    default:
      document.getElementById('nb1').textContent="0";
      document.getElementById('nb2').textContent="0";
      document.getElementById('nb3').textContent="0";
  } 
}


function dessin(annee, minVenues, limiteMvtPre, limiteMvtPost, niv){
	// version avec cumul de toutes les interventions à la même position
	if (document.getElementById('cumul').checked == true) {
		//récupération des noeuds
		var request = new XMLHttpRequest();
		request.open('GET','db/nodesbis.json');
		request.responseType = 'json';
		request.send();
		request.onload = function() {
			var nodes = request.response;
			var resultat1 = triNodes(nodes[niv][annee], minVenues,
			 limiteMvtPre, limiteMvtPost);
			var arrNodes = resultat1['arr'];
			var dictNodes = resultat1['dict'];
			
			// FORMAT :
			// nodes = {distance :{code :{libellé, effectif1 (value pour calculs), effectif2(étiquette), 
			//  proportion de l'effectif total, position, code (groupe), indice de largeur}}}
			// arrNodes = [id noeud : {libellé, effectif1 (value pour calculs), effectif2(étiquette), 
			//  proportion de l'effectif total, position, code (groupe), indice de largeur}]
			// dictNodes = {position : id noeud}

			// récupération des liens
			var request2 = new XMLHttpRequest();
			request2.open('GET','db/linksbis.json');
			request2.responseType = 'json';
			request2.send();
			request2.onload = function() {
				var links = request2.response;
				var arrLinks = triLinks(links[niv][annee], dictNodes,
				 arrNodes, minVenues, limiteMvtPre, limiteMvtPost);
				
				// FORMAT :
				// links = {niveau : {année : [position1 (source), position2 (cible), effectif]}}
				// arrLinks = [id lien : {source (id noeud), cible (id noeud), valeur}]
			}
		}
	// version centrée sur le premier bloc sans retour en arrière
	} else {
		//récupération des noeuds
		var request = new XMLHttpRequest();
		request.open('GET','db/nodes.json');
		request.responseType = 'json';
		request.send();
		request.onload = function() {
			var nodes = request.response;
			var resultat1 = triNodes(nodes[niv][annee], minVenues,
			 limiteMvtPre, limiteMvtPost);
			var arrNodes = resultat1['arr'];
			var dictNodes = resultat1['dict'];
			
			// récupération des liens
			var request2 = new XMLHttpRequest();
			request2.open('GET','db/links.json');
			request2.responseType = 'json';
			request2.send();
			request2.onload = function() {
				var links = request2.response;
				var arrLinks = triLinks(links[niv][annee], dictNodes,
				 arrNodes, minVenues, limiteMvtPre, limiteMvtPost);
			}
		}
	}
}


function triNodes(lsNodes, minVenues, limiteMvtPre, limiteMvtPost){
	// création de la liste des noeuds
	
	for (position in lsNodes){
		if((position < limiteMvtPre) || (position > limiteMvtPost)){
			// tri des positions entre les paramètres min et max par rapport au bloc
			delete lsNodes[position];
		} else if ((position == limiteMvtPre) && (limiteMvtPre != 0)) { 
			// création du node "début du séjour"
			for (code in lsNodes[position]) {
				if (typeof lsNodes[position]['debut'] != "undefined") {
					lsNodes[position]['debut'].units += ", " + code;
					lsNodes[position]['debut'].lsId.push(lsNodes[position][code].id);
					lsNodes[position]['debut'].value += lsNodes[position][code].value;
					lsNodes[position]['debut'].effectif += lsNodes[position][code].effectif;
					delete lsNodes[position][code];
				} else {
					lsNodes[position]['debut'] = new Object({libelle: 'début du séjour',
					 value : lsNodes[position][code].value, effectif : lsNodes[position][code].effectif,
					 id : 'debut' + position, units : code, lsId : [lsNodes[position][code].id], 
					 group : 'début du séjour', coef : 1.2});
					delete lsNodes[position][code];
				}
			}
		} else if ((position == limiteMvtPost) && (limiteMvtPost != 0)) { 
			// création du node "suite du séjour"
			for (code in lsNodes[position]) {
				if (typeof lsNodes[position]['suite'] != "undefined") {
					lsNodes[position]['suite'].units += ", " + code;
					lsNodes[position]['suite'].lsId.push(lsNodes[position][code].id);
					lsNodes[position]['suite'].value += lsNodes[position][code].value;
					lsNodes[position]['suite'].effectif += lsNodes[position][code].effectif;
					delete lsNodes[position][code];
				} else {
					lsNodes[position]['suite'] = new Object({libelle: 'suite du séjour', value : lsNodes[position][code].value, effectif : lsNodes[position][code].effectif,
					 id : 'suite' + position, units : code, lsId : [lsNodes[position][code].id], group : 'suite du séjour', coef : 1.2});
					delete lsNodes[position][code];
				}
			}
		} else {
			// création du node "autre"
			for (code in lsNodes[position]) {
				if ((lsNodes[position][code].prop < minVenues) && (lsNodes[position][code]["libelle"] != "Bloc CTCV")) { 
					if (typeof lsNodes[position]['autre'] != "undefined") {
						lsNodes[position]['autre'].units += ", " + code;
						lsNodes[position]['autre'].lsId.push(lsNodes[position][code].id);
						lsNodes[position]['autre'].value += lsNodes[position][code].value;
						lsNodes[position]['autre'].prop += lsNodes[position][code].prop;
						lsNodes[position]['autre'].effectif += lsNodes[position][code].effectif;
						delete lsNodes[position][code];
					} else {
						lsNodes[position]['autre'] = new Object({libelle: 'autre', value : lsNodes[position][code].value, effectif : lsNodes[position][code].effectif,
						prop : lsNodes[position][code].prop, id : 'autre' + position, units : code, lsId : [lsNodes[position][code].id], group : 'autre', coef : 1.2});
						delete lsNodes[position][code];
					}
				}
			}
		}
		//~ if (position == "+0") {
			//~ console.log('test bloc 1', lsNodes[position]);
		//~ }
	}
	
	// création de la liste des nodes avec leur indice d'identification
	var arrNodes = [];
	var dictNodes = new Object;
	var i = 0;
	for (position in lsNodes){
		for (code in lsNodes[position]) {
			lsNodes[position][code]['indice'] = i;
			arrNodes.push(lsNodes[position][code]);
			if (lsNodes[position][code]['libelle'] == 'autre' || lsNodes[position][code]['libelle'] == 'début du séjour' ||
			lsNodes[position][code]['libelle'] == 'suite du séjour') {
				lsNodes[position][code].lsId.forEach(function(element){
					dictNodes[element] = lsNodes[position][code]['indice'];
				});
			} else if (position == "+0") {
				dictNodes[lsNodes[position][code]['id']] = lsNodes[position][code]['indice'];
				//~ console.log('test bloc 2', dictNodes[lsNodes[position][code]['id']])
			} else {
				dictNodes[lsNodes[position][code]['id']] = lsNodes[position][code]['indice'];
			}
			i += 1;
		}
	}
	
	// retour des nodes créés sous forme de liste et de dictionnaire
	return {arr : arrNodes, dict : dictNodes};
}

	
function triLinks(arr, dictNodes, arrNodes, minVenues, limiteMvtPre, limiteMvtPost) {
	// création de la listes des liens
	
	// renommage des sources et targets
	arr.forEach(function(element) {
		if (dictNodes.hasOwnProperty(element['target'])) {
			element['target'] = dictNodes[element['target']];
		} 
		if (dictNodes.hasOwnProperty(element['source'])) {
			element['source'] = dictNodes[element['source']];
		}
	})
	// suppression des links non renommés
	//~ console.log("arr");
	//~ console.log(arr);
	var i = 0
	while (i < arr.length) {
		if ((typeof arr[i]['target'] == "string") || (typeof arr[i]['source'] == "string")) {
			arr.splice(i, 1);
		} else {
			i += 1;
		}
	}
	// cumul des doublons (en passant par un format objet)
	//~ console.log("arr trié");
	//~ console.log(arr);
	objLinks = {};
	arrLinks = [];
	l = new Object();
	for (i = 0; i < arr.length; i++) {
		if (objLinks.hasOwnProperty(arr[i].source)) {
			if (objLinks[arr[i].source].hasOwnProperty(arr[i].target)) {
				objLinks[arr[i].source][arr[i].target] += arr[i].value;
			} else {
				objLinks[arr[i].source][arr[i].target] = arr[i].value;
			}
		} else {
			objLinks[arr[i].source] = new Object();
			objLinks[arr[i].source][arr[i].target] = arr[i].value;
		}
	}
	// remise sous forme de liste
	for (s in objLinks) { 
		for (t in objLinks[s]) {
			l = new Object();
			l.source = s;
			l.target = t;
			l.value = objLinks[s][t];
			
			arrLinks.push(l)
		}
	}
	
	var sqc = new Object();
		sqc.nodes = arrNodes;
		sqc.links = arrLinks;
		console.log(sqc);
		
		// FORMAT :
		// sqc = {nodes :[id noeud : {libellé, effectif1 (value pour calculs), effectif2(étiquette), 
		//  proportion de l'effectif total, position, code (groupe), indice de largeur}],
		//  links : [id lien : {source (id noeud), cible (id noeud), valeur}]}

		graph(sqc);
}


function graph(sqc){
	// création du diagramme de Sankey

	d3.select("#graph1").selectAll("*").remove();
	
	// paramétrage de base
	var margin = {top: 10, right: 10, bottom: 10, left: 10},
		width = window.innerWidth*0.78,
		height = window.innerHeight*0.75;
		//~ width = +d3.select("#graph1").attr("width")- margin.left - margin.right,
		//~ height = +d3.select("#graph1").attr("height")- margin.top - margin.bottom;
	
	var svg = d3.select("#graph1").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "#svg1")
      .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");
    
	var formatNumber = d3.format(",.0f"),
		format = function(d) { 
			if (formatNumber(d) == "1") {
				return "1 passage"
			} else {
				return formatNumber(d) + " passages"; 
			}},
		color = d3.scaleOrdinal(d3.schemeCategory20);

	// création du diagramme
	var sankey = d3.sankey()
		.nodeWidth(15)
		.nodePadding(10)
		.extent([[1, 1], [width - 1, height - 6]])
		.nodeAlign(d3.sankeyCenter);

	// création des liens
	var link = svg.append("g")
		.attr("class", "links")
		.attr("fill", "none")
		.attr("stroke", "#000")
		.attr("stroke-opacity", 0.2)
	  .selectAll("path");

	// création des noeuds
	var node = svg.append("g")
		.attr("class", "nodes")
		.attr("font-family", "sans-serif")
		.attr("font-size", 10)
	  .selectAll("g");

	  //~ console.log("avant-sankey", sqc.nodes[5]);

	// élaboration du diagramme (script externe)
	  sankey(sqc);

	  //~ console.log("apres-sankey", sqc.nodes[5]);

	// informations graphiques des liens
	  link = link
		.data(sqc.links)
		.enter().append("path")
		  .attr("class", "link")
		  .attr("d", d3.sankeyLinkHorizontal())
		  .attr("stroke-width", function(d) { return Math.max(1, d.width); });

	  link.append("title")
		  .text(function(d) { return d.source.group + " → " + d.target.group + "\n" + format(d.value); });

	// informations graphiques des noeuds
	  node = node
		.data(sqc.nodes)
		.enter().append("g")
		  .attr("class", "node")
		  //~ .attr("transform", function(d) { 
		      //~ return "translate(" + d.x + "," + d.y + ")"; })
		//~ .call(d3.drag() // pas encore au point
          //~ .origin(function(d) { return d; })
          //~ .on("start", function() {
			  //~ this.parentNode.appendChild(this); })
          //~ .on("drag", dragmove))
          ;

	  node.append("rect")
		  .attr("x", function(d) { return d.x0; })
		  .attr("y", function(d) { return d.y0; })
		  .attr("height", function(d) { return d.y1 - d.y0; })
		   // coefficient en fonction de la DMS (par classes ou proportionnel) :
		  .attr("width", function(d) { return (d.x1 - d.x0)* d.coef; }) 
		  .attr("fill", function(d) { return color(d.group.replace(/ .*/, "")); })
		  .attr("stroke", "#000");

	  node.append("text")
		  .attr("x", function(d) { return d.x0 - 6; })
		  .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
		  .attr("dy", "0.35em")
		  .attr("text-anchor", "end")
		  .text(function(d) { return d.group; })
		.filter(function(d) { return d.x0 < width / 2; })
		  .attr("x", function(d) { return d.x1 + 10; })
		  .attr("text-anchor", "start");

	  node.append("title")
		  .text(function(d) { 
			  if ((d.libelle == 'début du séjour') || (d.libelle == 'suite du séjour')) {
			    return d.units + "\n" + format(d.effectif) + "\n"; 
			  } else if (d.libelle == 'autre') {
				return d.units + "\n" + format(d.effectif) + "\n";
			  } else {
			    return d.libelle + "\n" + format(d.effectif) + "\nDMS = " + d.dms; 
			  }});
}

function masquer1() {
	document.getElementById('tb1').style.display = 'none';
	document.getElementById('tb1bis').style.display = 'block';
}

function afficher1() {
	document.getElementById('tb1').style.display = 'block';
	document.getElementById('tb1bis').style.display = 'none';
}

function tbLabel1(annee, niv) {
	// tableau des libellés
	
	var request = new XMLHttpRequest();
	request.open('GET','db/lsLib.json');
	request.responseType = 'json';
	request.send();
	request.onload = function() {
		var label = request.response;
		var lab = []
		label = label[niv][annee];
		for(code in label) {
			lab.push([code, label[code].lib]);
		}
		lab.sort();
		var tab = document.getElementById('lib1');
		
		while (tab.firstChild) {
			tab.deleteRow(0);
		}
		for (code in lab) {
			if ((lab[code][0] != "taille") && (lab[code][0] != "0000")) {
				var ligne = tab.insertRow();
				ligne.insertCell().innerHTML = lab[code][0];
				ligne.insertCell().innerHTML = lab[code][1];
			}
		}
	}
}
