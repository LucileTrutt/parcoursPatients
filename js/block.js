document.getElementById('pm2').addEventListener('submit', function(e) {e.preventDefault();});

document.getElementById('bouton2').addEventListener('click', tableau);
document.getElementById('mask2').addEventListener('click', masquer2);
document.getElementById('mask2bis').addEventListener('click', afficher2);
document.getElementById('suppl2').addEventListener('click', afficher3);
document.getElementById('suppl2bis').addEventListener('click', masquer3);

function tableau() {
	var annee = document.getElementById('annee').value;
	var radios = document.getElementsByName('niveau');
	for(var i = 0; i < radios.length; i++){
		if(radios[i].checked){
			var niv = radios[i].value;
		}
	}
	var min = document.getElementById('nb_motif_min').value;
	var max = document.getElementById('nb_motif_max').value;
	
	if (annee && niv && min && max){
		console.log('* Module 2 *')
		
		// vidange du tableau
		var tab = document.getElementById('block1')
		while (tab.firstChild) {
		  tab.deleteRow(0);
		}
		charger(annee, niv, min, max);
		tbLabel2(annee, niv);
		nombre(annee);
		//~ console.log(annee, niv, fixation, debut, min, max);
	}
}

function charger(annee, niv, min, max){
	// récupération les séquences de l'année et du niveau d'agrtéagation
	var request = new XMLHttpRequest();
	request.open('GET','db/motifs-'+niv+annee+'.json');
	request.responseType = 'json';
	request.send();
	request.onload = function() {
		var motifs = request.response;
		
		// FORMAT : 
		// motifs = {séquence (sep = '/'): {'liste' : [[code, DMS, libellé,
		//  indice couleur]], séquence (sep = '/'), support (= effectif en séjours),
		//  occurences (= nombre d'apparitions), proportion, booléen bloc,
		//  fréquence d'association *4}
		
		console.log(motifs[0]);
		sqc(motifs, min, max);
	}
}

function sqc(motifs, min, max) {
	
	// définition du premier élément du motif
	var radioDeb = document.getElementsByName('debut');
	for(var i = 0; i < radioDeb.length; i++){
		if(radioDeb[i].checked){
			var debut = radioDeb[i].value;
		}
	}
	if (debut == "unite") {
		var codeDeb = document.getElementById('codeDeb').value;
		if (codeDeb == "") {
			window.alert("Merci de renseigner un code");
			return false;
		} else {
			debut = codeDeb
		}
	} else {
		document.getElementById('codeDeb').value = ""
	}
	
	// définition du dernier élément du motif
	var radioFin = document.getElementsByName('fin');
	for(var i = 0; i < radioFin.length; i++){
		if(radioFin[i].checked){
			var fin = radioFin[i].value;
		}
	}
	if (fin == "unite") {
		var codeFin = document.getElementById('codeFin').value;
		if (codeFin == "") {
			window.alert("Veuillez renseigner un code ou choisir une autre option");
			return false;
		} else {
			fin = codeFin
		}
	} else {
		document.getElementById('codeFin').value = ""
	}
	
	// tri des séquences selon la longueur et les éventuels paramètres indiqué sur le début ou la fin
	var lsMotif = [];
	if (debut) {
		if (fin) {
			console.log('debut', debut, 'fin', fin)
			for (i in motifs) {
				if ((motifs[i]['liste'][0][0] == debut) && 
				 (motifs[i]['liste'][motifs[i]['liste'].length-1][0] == fin)  && 
				 (motifs[i]['liste'].length >= min) && (motifs[i]['liste'].length <= max)){
					lsMotif.push(motifs[i]);
				}
			}
		} else {
			console.log('debut', debut)
			for (i in motifs) {
				if ((motifs[i]['liste'][0][0] == debut) && 
				 (motifs[i]['liste'].length >= min) && 
				 (motifs[i]['liste'].length <= max)){
					lsMotif.push(motifs[i]);
				}
			}
		}
	} else if (fin) {
		console.log('fin', fin)
		for (i in motifs) {
			if ((motifs[i]['liste'][motifs[i]['liste'].length-1][0] == fin)  && 
			 (motifs[i]['liste'].length >= min) && 
			 (motifs[i]['liste'].length <= max)){
				lsMotif.push(motifs[i]);
			}
		}
	} else {
		console.log('rien')
		for (i in motifs) {
			if ((motifs[i]['liste'].length >= min) && (motifs[i]['liste'].length <= max)) {
				lsMotif.push(motifs[i]);
			}
		}
	}
	
	// FORMAT :
	// lsMotif = [{ effectif (séjours), occurences (motifs),
	// proportion (séjours), booléen bloc, booléen bloc à la fin, fréquence d'association *4,
	// liste : [[code, DMS, libellé, indice couleur]], séquence (sep = '/')}]
	
	// choix des colonnes de calculs à afficher :
	if (document.getElementById('fq_ps').checked == true){
		var fq_ps = true
		document.getElementById('tb_ps').style.display = 'table-cell';
	} else {
		var fq_ps = false
		document.getElementById('tb_ps').style.display = 'none';
	}
	if (document.getElementById('fq_sp').checked == true){
		var fq_sp = true
		document.getElementById('tb_sp').style.display = 'table-cell';
	} else {
		var fq_sp = false
		document.getElementById('tb_sp').style.display = 'none';
	}
	if (document.getElementById('fq_sd').checked == true){
		var fq_sd = true
		document.getElementById('tb_sd').style.display = 'table-cell';
	} else {
		var fq_sd = false
		document.getElementById('tb_sd').style.display = 'none';
	}
	if (document.getElementById('fq_ds').checked == true){
		var fq_ds = true
		document.getElementById('tb_ds').style.display = 'table-cell';
	} else {
		var fq_ds = false
		document.getElementById('tb_ds').style.display = 'none';
	}
	
	// tri des motifs par ordre décroissant d'occurence
	lsMotif.sort(function (a, b) {
		return b.occ - a.occ;
	});
	//~ console.log(lsMotif)
	
	// ajout des lignes dans le tableaux des motifs	
	var tab = document.getElementById('block1');

	// création de l'échelle de couleur selon la longueur max
	var long = 0
	var etendue = 0
	for (i = 0; i < lsMotif.length; i++) {
		if (lsMotif[i]['liste'].length*2 > long) {
			long = lsMotif[i]['liste'].length*2;
		}
		for (j = 0; j < lsMotif[i]['liste'].length; j++) {
			if (lsMotif[i]['liste'][j][3] > etendue) {
				etendue = lsMotif[i]['liste'][j][3];
			}
		}
	}
	console.log('longueur max', long/2)

	color = d3.scaleLinear().domain([0,etendue])
      .interpolate(d3.interpolateHcl)
      // .interpolate(d3.interpolateCubehelix.gamma(1))
      .range([d3.rgb('#183152'), d3.rgb("yellow")]);
	
	// remplissage du tableau de motifs
	for (i = 0; i < lsMotif.length; i++) {
		var ligne = tab.insertRow()
		for (j = 0; j < lsMotif[i]['liste'].length*2; j += 2) {
			ligne.insertCell();
			ligne.cells[j].className = "carre1";
			ligne.cells[j].innerHTML = lsMotif[i]['liste'][j/2][0];
			if (lsMotif[i]['liste'][j/2][0] == "Sortie") {
				ligne.cells[j].style.backgroundColor = "#9F9099";
				ligne.cells[j].title = "Fin du séjour";
			} else if (lsMotif[i]['liste'][j/2][0] == "Bloc CTCV") {
				ligne.cells[j].style.backgroundColor = "#FF8830";
				ligne.cells[j].innerHTML = "Bloc\u00a0CTCV";
				ligne.cells[j].title = "Bloc\u00a0CTCV\nDMS : " + lsMotif[i]['liste'][j/2][1];
			} else if (lsMotif[i]['liste'][j/2][0] == "Entrée") {
				ligne.cells[j].style.backgroundColor = "#9F9099";
				ligne.cells[j].title = "Début du séjour";
				ligne.cells[j].title = lsMotif[i]['liste'][j/2][2] + "\nDMS : " + lsMotif[i]['liste'][j/2][1];
			} else {
				//~ console.log(lsMotif[i]['liste'][j/2][3],etendue)
				ligne.cells[j].style.backgroundColor = color(lsMotif[i]['liste'][j/2][3]); // remplacer par d3.interpolateCool si besoin
				ligne.cells[j].title = lsMotif[i]['liste'][j/2][2] + "\nDMS : " + lsMotif[i]['liste'][j/2][1];
			}
			ligne.insertCell();
			ligne.cells[j+1].className = "carre2";
			ligne.cells[j+1].style.color = "black";
			ligne.cells[j+1].style.textShadow = "none";
			ligne.cells[j+1].innerHTML = "\u279d";
		}

		ligne.deleteCell(-1);
		if (lsMotif[i]['liste'].length * 2 < long) {
			ligne.insertCell().className = "carre2";
			ligne.cells[lsMotif[i]['liste'].length * 2 - 1].colSpan = long - lsMotif[i]['liste'].length * 2 ;

		}
		ligne.insertCell().innerHTML = lsMotif[i]['n'];
		ligne.insertCell().innerHTML = lsMotif[i]['prop'];
		ligne.insertCell().innerHTML = lsMotif[i]['occ'];
		
		
		// ajout des colonnes de calcul
		if(fq_ps) {
			if ((lsMotif[i]['conf-ps']) && (lsMotif[i]['liste'].length != 1)) {
				ligne.insertCell().innerHTML = lsMotif[i]['conf-ps'];
			} else {
				ligne.insertCell().innerHTML = 'non applicable';
			}
		}
		if(fq_sp) {
			if ((lsMotif[i]['conf-sp']) && (lsMotif[i]['liste'].length != 1)) {
				ligne.insertCell().innerHTML = lsMotif[i]['conf-sp'];
			} else {
				ligne.insertCell().innerHTML = 'non applicable';
			}
		}
		if(fq_sd) {
			if ((lsMotif[i]['conf-sd']) && (lsMotif[i]['liste'].length != 1))  {
				ligne.insertCell().innerHTML = lsMotif[i]['conf-sd'];
			} else {
				ligne.insertCell().innerHTML = 'non applicable';
			}
		}
		if(fq_ds) {
			if ((lsMotif[i]['conf-ds']) && (lsMotif[i]['liste'].length != 1)) {
				ligne.insertCell().innerHTML = lsMotif[i]['conf-ds'];
			} else {
				ligne.insertCell().innerHTML = 'non applicable';
			}
		}
		
	}
	console.log(tab.rows.length, 'lignes')
	for (i = 0; i <  tab.rows[tab.rows.length-1].length; i++) {
		tab.rows[tab.rows.length-1].cells[i].style.borderBottom = "2px solid black";
	}
	var tabHead = document.getElementById('block0');
	tabHead.rows[0].cells[0].colSpan = long-1;

}

function masquer2() {
	document.getElementById('tb2').style.display = 'none';
	document.getElementById('tb2bis').style.display = 'block';
}

function afficher2() {
	document.getElementById('tb2').style.display = 'block';
	document.getElementById('tb2bis').style.display = 'none';
}

function masquer3() {
	var hide = document.getElementsByClassName('sup');
	for(var i = 0; i < hide.length; i++){
        hide[i].style.display = "none";
    }
	document.getElementById('suppl2').style.display = 'flex';
}

function afficher3() {
	var hide = document.getElementsByClassName('sup');
	for(var i = 0; i < hide.length; i++){
        hide[i].style.display = "flex"; 
    }
		document.getElementById('suppl2').style.display = 'none';
}

function tbLabel2(annee, niv) { 
	// tableau des libellés
	
	var request = new XMLHttpRequest();
	request.open('GET','db/lsLib.json');
	request.responseType = 'json';
	request.send();
	request.onload = function() {
		var label = request.response;
		label = label[niv][annee];
		var lab = [];
		for(code in label) {
			lab.push([code, label[code].lib]);
		}
		lab.sort();
		var tab = document.getElementById('lib2');
		
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
