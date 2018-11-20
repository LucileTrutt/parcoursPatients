
document.getElementById('pm1').addEventListener('submit', function(e) {e.preventDefault();});
document.getElementById('pm2').addEventListener('submit', function(e) {e.preventDefault();});

document.getElementById('mask1').addEventListener('click', masquer1);
document.getElementById('mask1bis').addEventListener('click', afficher1);

document.getElementById('bouton1').addEventListener('click', change);

// action générale
function change() {
	var annee = document.getElementById('annee').value
	var minVenues = parseInt(document.getElementById('preci').value)
	var limiteMvtPre = - parseInt(document.getElementById('max_pre').value) -1
	var limiteMvtPost = parseInt(document.getElementById('max_post').value) +1
	
	if (limiteMvtPre == -1) {
		limiteMvtPre = 0
	}
	if (limiteMvtPost == 1) {
		limiteMvtPost = 0
	}

	var radios = document.getElementsByName('niveau');
	for(var i = 0; i < radios.length; i++){
		if(radios[i].checked){
		var niv = radios[i].value;
		}
	}
	
	if (this.form.preci.value && this.form.max_pre.value && this.form.max_post.value){
		dessin(annee, minVenues, limiteMvtPre, limiteMvtPost, niv);
		nombre(annee);
	}
};

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
};


function dessin(annee, minVenues, limiteMvtPre, limiteMvtPost, niv){
	//~ console.log("démarrage");
	if (document.getElementById('cumul').checked == true) {
		var request = new XMLHttpRequest();
		request.open('GET','db/nodesbis.json');
		request.responseType = 'json';
		request.send();
		request.onload = function() {
			var nodes = request.response;
			//console.log(nodes[annee][niv]["+0"]["0000"]["value"]);
			var resultat1 = triNodes(nodes[annee][niv], minVenues, limiteMvtPre, limiteMvtPost);
			var arrNodes = resultat1['arr'];
			var dictNodes = resultat1['dict'];
			//console.log("coucou", arrNodes[5]);


			var request2 = new XMLHttpRequest();
			request2.open('GET','db/linksbis.json');
			request2.responseType = 'json';
			request2.send();
			request2.onload = function() {
				var links = request2.response;
				var arrLinks = triLinks(links[annee][niv], dictNodes, arrNodes, minVenues, limiteMvtPre, limiteMvtPost);
			}
		}
	} else {
		var request = new XMLHttpRequest();
		request.open('GET','db/nodes.json');
		request.responseType = 'json';
		request.send();
		request.onload = function() {
			var nodes = request.response;
			console.log('data', nodes[annee][niv]);
			var resultat1 = triNodes(nodes[annee][niv], minVenues, limiteMvtPre, limiteMvtPost);
			var arrNodes = resultat1['arr'];
			var dictNodes = resultat1['dict'];
			//~ console.log("arrNodes");
			//~ console.log(arrNodes);
			//~ console.log("dictNodes");
			//~ console.log(dictNodes);
			
			var request2 = new XMLHttpRequest();
			request2.open('GET','db/links.json');
			request2.responseType = 'json';
			request2.send();
			request2.onload = function() {
				var links = request2.response;
				//~ console.log("links[annee][niv]")
				//~ console.log(links[annee][niv]);
				var arrLinks = triLinks(links[annee][niv], dictNodes, arrNodes, minVenues, limiteMvtPre, limiteMvtPost);
				//~ console.log(arrLinks);
				
			}
		}
	}
};


function triNodes(lsNodes, minVenues, limiteMvtPre, limiteMvtPost){
	for (position in lsNodes){
		if((position < limiteMvtPre) || (position > limiteMvtPost)){
			delete lsNodes[position];
		} else if ((position == limiteMvtPre) && (limiteMvtPre != 0)) { // crea du node "début"
			for (code in lsNodes[position]) {
				if (typeof lsNodes[position]['debut'] != "undefined") {
					lsNodes[position]['debut'].units += ", " + code;
					lsNodes[position]['debut'].lsId.push(lsNodes[position][code].id);
					lsNodes[position]['debut'].value += lsNodes[position][code].value;
					lsNodes[position]['debut'].effectif += lsNodes[position][code].effectif;
					delete lsNodes[position][code];
				} else {
					lsNodes[position]['debut'] = new Object({libelle: 'début du séjour', value : lsNodes[position][code].value, effectif : lsNodes[position][code].effectif,
					 id : 'debut' + position, units : code, lsId : [lsNodes[position][code].id], group : 'début du séjour', coef : 1.2});
					delete lsNodes[position][code];
				}
			}
		} else if ((position == limiteMvtPost) && (limiteMvtPost != 0)) { // crea du node "suite"
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
			for (code in lsNodes[position]) {
				if ((lsNodes[position][code].prop < minVenues) && (lsNodes[position][code]["libelle"] != "Bloc CTCV")) { // crea du node "autre"
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
		if (position == "+0") {
			console.log('test bloc 1', lsNodes[position])
		}
	}
	// créa de la liste des nodes avec leur indice
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
					
					//~ if ((limiteMvtPre == 0) && (lsNodes[position][code]['libelle'] == 'début du séjour')){
						//~ lsNodes[position][code]['libelle'] = 'Bloc CTCV'
						//~ lsNodes[position][code]['group'] = 'Bloc CTCV'
					//~ } else if ((limiteMvtPost == 0) && (lsNodes[position][code]['libelle'] == 'suite du séjour')){
						//~ lsNodes[position][code]['libelle'] = 'Bloc CTCV'
						//~ lsNodes[position][code]['group'] = 'Bloc CTCV'
					//~ }
				});
			} else if (position == "+0") {
				
				dictNodes[lsNodes[position][code]['id']] = lsNodes[position][code]['indice'];
				console.log('test bloc 2', dictNodes[lsNodes[position][code]['id']])
			} else {
				dictNodes[lsNodes[position][code]['id']] = lsNodes[position][code]['indice'];
			}
			i += 1;
		}
	}

	return {arr : arrNodes, dict : dictNodes};
}

	
function triLinks(arr, dictNodes, arrNodes, minVenues, limiteMvtPre, limiteMvtPost) {
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
	// cumul des doublons en poassant par un objet
	//~ console.log("arr trié");
	//~ console.log(arr);
	objLinks = {};
	arrLinks = [];
	l = new Object();
	for (i = 0; i < arr.length; i++) {
		if (objLinks.hasOwnProperty(arr[i].source)) {
			if (objLinks[arr[i].source].hasOwnProperty(arr[i].target)) {
				//~ console.log(obj[arr[i].source])
				objLinks[arr[i].source][arr[i].target] += arr[i].value;
				//~ console.log(obj[arr[i].source])
			} else {
				objLinks[arr[i].source][arr[i].target] = arr[i].value;
			}
		} else {
			objLinks[arr[i].source] = new Object();
			objLinks[arr[i].source][arr[i].target] = arr[i].value;
		}
	}
	for (s in objLinks) { // remise sous forme de liste
		for (t in objLinks[s]) {
			l = new Object();
			l.source = s;
			l.target = t;
			l.value = objLinks[s][t];
			
			arrLinks.push(l)
		}
	}
	//~ console.log("objLinks");
	//~ console.log(objLinks);
	//~ console.log("arrLinks");
	//~ console.log(arrLinks);
	
	
	var sqc = new Object();
		sqc.nodes = arrNodes;
		sqc.links = arrLinks;
		console.log(sqc);
			
		graph(sqc);

	//~ return arrLinks;

}


function graph(sqc){

	d3.select("#graph1").selectAll("*").remove();
	
	//~ var dragmove = function(d) {
		//~ d3.select(this).attr("transform", 
			//~ "translate(" + d.x + "," + (
					//~ d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
				//~ ) + ")");
		//~ sankey.relayout();
		//~ link.attr("d", path);}
		
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

	var sankey = d3.sankey()
		.nodeWidth(15)
		.nodePadding(10)
		.extent([[1, 1], [width - 1, height - 6]])
		.nodeAlign(d3.sankeyCenter);

	var link = svg.append("g")
		.attr("class", "links")
		.attr("fill", "none")
		.attr("stroke", "#000")
		.attr("stroke-opacity", 0.2)
	  .selectAll("path");

	var node = svg.append("g")
		.attr("class", "nodes")
		.attr("font-family", "sans-serif")
		.attr("font-size", 10)
	  .selectAll("g");

	//~ d3.json(sqc, function(error, sqc2) {
	  //~ if (error) throw error;

	  console.log("avant-sankey", sqc.nodes[5]);

	  sankey(sqc);

	  console.log("apres-sankey", sqc.nodes[5]);

	  link = link
		.data(sqc.links)
		.enter().append("path")
		  .attr("class", "link")
		  .attr("d", d3.sankeyLinkHorizontal())
		  .attr("stroke-width", function(d) { return Math.max(1, d.width); });

	  link.append("title")
		  .text(function(d) { return d.source.group + " → " + d.target.group + "\n" + format(d.value); });

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
		  .attr("width", function(d) { return (d.x1 - d.x0)* d.coef; })  // *******************  coef en fct dms
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
}; 

function masquer1() {
	document.getElementById('tb1').style.display = 'none';
	document.getElementById('tb1bis').style.display = 'block';
}

function afficher1() {
	document.getElementById('tb1').style.display = 'block';
	document.getElementById('tb1bis').style.display = 'none';
}




//~ function modifyText() {
  //~ var t2 = document.getElementById("t2");
  //~ if (t2.firstChild.nodeValue == "three") {
    //~ t2.firstChild.nodeValue = "two";
  //~ } else {
    //~ t2.firstChild.nodeValue = "three";
  //~ }
//~ }

//~ // ajout d'un écouteur d'évènement au tableau
//~ var el = document.getElementById("outside");
//~ el.addEventListener("click", modifyText, false);




//~ var q = squel.select();
//~ console.log(
    //~ squel.select()
        //~ .from("nodes")
        //~ .field("nodes.code")
        //~ .field("nodes.libelle")
        //~ .where("nodes.annee = '2017'")
        //~ .where("nodes.niveau = 'autoris'")
        //~ .toParam()
//~ );

//~ var connection = new ActiveXObject("ADODB.Connection") ;

//~ var connectionstring="Data Source=<server>;Initial Catalog=<catalog>;User ID=<user>;Password=<password>;Provider=SQLOLEDB";

//~ connection.Open(connectionstring);
//~ var rs = new ActiveXObject("ADODB.Recordset");

//~ rs.Open("SELECT * FROM table", connection);
//~ rs.MoveFirst
//~ while(!rs.eof)
//~ {
   //~ document.write(rs.fields(1));
   //~ rs.movenext;
//~ }

//~ rs.close;
//~ connection.close; 

//~ var bouton = document.getElementById('bouton1');

//~ bouton.addEventListener('click', liste);

//~ var db = openDatabase('base.db');
//~ var liste = function(){
//~ db.transaction(function (tx) {
  //~ tx.executeSql('SELECT * FROM nodes', [], function (tx, results) {
  //~ var len = results.rows.length, i;
  //~ for (i = 0; i < len; i++) {
    //~ console.log(results.rows.item(i).text);
  //~ }
//~ });
//~ });
//~ };






//~ var liste = function() {
	//~ var xhr_object = new XMLHttpRequest(); 

	//~ xhr_object.open("POST", "test.php", true); 

	//~ xhr_object.onreadystatechange = function() { 
		//~ if (xhr_object.readyState == 4) 
			//~ eval(xhr_object.responseText); 
	//~ } 
	 
	//~ xhr_object.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
	//~ var data = "family="+escape(l1.options[index].value)+"&form="+f.name+"&select=list2"; 
	//~ xhr_object.send('2016'); 
		//~ }
//~ }
