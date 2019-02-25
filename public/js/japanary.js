// function button_onclick(){
// 	console.log(this.id);
// 	if(this.id == choose.result){
// 		alert("ok");
// 	}
// 	else{
// 		alert("gg");
// 	}
// };

document.addEventListener("DOMContentLoaded", function(e) {
    
    var dessin = document.getElementById("dessin");
    var overlay = document.getElementById("overlay");
    
    var act = function(f, e) {
        var rect = dessin.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        f.call(currentCommand, x, y);
    }
    
    overlay.addEventListener("mousemove", function(e) {
        act(currentCommand.move, e); 
    });
    overlay.addEventListener("mousedown", function(e) {
        act(currentCommand.down, e); 
    });    
    overlay.addEventListener("mouseup", function(e) {
        act(currentCommand.up, e); 
    });                      
    overlay.addEventListener("mouseout", function(e) {
        act(currentCommand.out, e); 
    });                 
    
    
    var ctxBG = dessin.getContext("2d");
    var ctxFG = overlay.getContext("2d");
    
    document.getElementById("new").addEventListener("click", function(e) {
        ctxBG.clearRect(0, 0, ctxBG.width, ctxBG.height); 
    });
    


    // Tailles des zones 
    overlay.width = dessin.width = ctxBG.width = ctxFG.width = 500;
    overlay.height = dessin.height = ctxBG.height = ctxFG.height = 500;
    // Taille du crayon
    ctxBG.lineCap = ctxFG.lineCap = "round";
    
    
    /**
     *  Prototype de commande (classe abstraite)
     */
    function Commande() { 
        // bouton cliqué
        this.isDown = false;
        // fillStyle pour le dessin 
        this.fsBG = "white", 
        // fillStyle pour le calque
        this.fsFG = "white";
        // strokeStyle pour le dessin
        this.ssBG = "white";
        // strokeStyle pour le calque
        this.ssFG = "white";
    }
    // selection (paramétrage des styles)
    Commande.prototype.select = function() {
        ctxBG.fillStyle = this.fsBG; 
        ctxFG.fillStyle = this.fsFG; 
        ctxBG.strokeStyle = this.ssBG;
        ctxFG.strokeStyle = this.ssFG;
        currentCommand = this;
    };
    // action liée au déplacement de la souris
    Commande.prototype.move = function(x, y) { 
        ctxFG.clearRect(0, 0, ctxFG.width, ctxFG.height);
    };
    // action liée au relâchement du bouton de la souris
    Commande.prototype.up = function(x, y) { 
        this.isDown = false;
    };
    // action liée à l'appui sur le bouton de la souris
    Commande.prototype.down = function(x, y) { 
        this.isDown = true;
    }; 
    // action liée à la sortie de la souris de la zone
    Commande.prototype.out = function() {
        this.isDown = false;
        ctxFG.clearRect(0, 0, ctxFG.width, ctxFG.height);
    };
    
    
    /** 
     *  Commande pour tracer (dessine un point)
     *      au survol : affichage d'un point 
     *      au clic : dessin du point 
     */
    var tracer = new Commande();     
    tracer.dessiner = function(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, size.value/2, 0, 2*Math.PI);
        ctx.fill();
    }
    tracer.move = function(x, y) {
        // appel classe mère
        this.__proto__.move.call(this, x, y);
        // affichage sur le calque 
        this.dessiner(ctxFG, x, y);
        // si bouton cliqué : impression sur la zone de dessin
        if (this.isDown) {
            this.dessiner(ctxBG, x, y);
        }
    }
    tracer.down = function(x, y) {
        // appel classe mère
        this.__proto__.down.call(this, x, y);
        // impression sur la zone de dessin
        this.dessiner(ctxBG, x, y);
    }
    
    
    /** 
     *  Commande pour gommer (effacer une zone)
     *      au survol : affichage d'un rectangle représentant la zone à effacer 
     *      au clic : effacement de la zone
     */
    var gommer = new Commande();
    gommer.ssFG = "black";
    gommer.effacer = function(x, y) {
        ctxBG.clearRect(x - size.value/2, y - size.value/2, size.value, size.value);
    }
    gommer.move = function(x, y) {
        this.__proto__.move.call(this, x, y);
        ctxFG.lineWidth = 1;
        if (this.isDown) {
            this.effacer(x, y);
        }
        ctxFG.strokeRect(x - size.value/2, y - size.value/2, size.value, size.value);
    }
    gommer.down = function(x, y) {
        this.__proto__.down.call(this, x, y);    
        gommer.effacer(x,y);
    }

    
    /** 
     *  Commande pour tracer une ligne
     *      au survol si clic appuyé : ombrage de la ligne entre le point de départ et le point courant. 
     *      au relâchement du clic : tracé de la ligne sur la zone de dessin
     */
    var ligne = new Commande();
    ligne.ssFG = "white";
    ligne.dessiner = function(ctx, x, y) {
        ctx.lineWidth = size.value;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    ligne.move = function(x, y) {
        this.__proto__.move.call(this, x, y);
        ctxFG.lineWidth = size.value;
        if (this.isDown) {
            this.dessiner(ctxFG, x, y);
        }
        else tracer.dessiner(ctxFG, x, y);
    }
    ligne.down = function(x, y) {
        this.__proto__.down.call(this, x, y);
        this.startX = x;
        this.startY = y;
    }
    ligne.up = function(x, y) {
        this.__proto__.up.call(this, x, y);
        this.dessiner(ctxBG, x, y);
    }

    
    
    
    /** 
     *  Affectation des événements sur les boutons radios
     *  et detection du bouton radio en cours de sélection.
     */
    var radios = document.getElementsByName("radCommande");
    for (var i=0; i < radios.length; i++) {
        var selection = function() {
            if (this.checked) {
                currentCommand = eval(this.id);  
                currentCommand.select();
            }            
        }
        selection.apply(radios.item(i));
        radios.item(i).addEventListener("change", selection);
    }
    
    /** 
     *  Objet permettant de gérer les dessins enregistrés dans le localStorage
     *  Les dessins sont enregistrés à l'item "logos" du localStorage, sous la 
     *  forme d'un objet où la clé est le nom de l'image et la valeur son dessin. 
     */
    if (! localStorage.getItem("logos")) {      // verification d'usage
        localStorage.setItem("logos", JSON.stringify({}));   
    }
    var filemanager = {
        
        /**
         *  Afficher le gestionnaire de dessin : liste les dessins existants et 
         *      donne la possibilité de les ouvrir ou de les supprimer.
         */
        afficher: function() {
            var modal = document.getElementById("modal");
            modal.innerHTML = "";
            var h3 = document.createElement("h3");
            h3.innerHTML = "Images enregistrées";
            modal.appendChild(h3);
            var images = JSON.parse(localStorage.getItem("logos"));
            if (Object.keys(images).length > 0) {
                var table = document.createElement("table");
                for (var key in images) {
                    var tr = document.createElement("tr");
                    var cell1 = document.createElement("td");
                    cell1.innerHTML = key;
                    var cell2 = document.createElement("td");
                    var img = new Image();
                    img.src = 'data:image/png;base64,' + images[key];
                    img.addEventListener("click", filemanager.ouvrir.bind(filemanager, [key]), false);
                    cell2.appendChild(img);
                    var cell3 = document.createElement("td");
                    var btnSupprimer = new Image();
                    btnSupprimer.src = './images/icone-supprimer.png';
                    btnSupprimer.addEventListener("click", filemanager.supprimer.bind(filemanager, [key]), false);
                    cell3.appendChild(btnSupprimer);
                    tr.appendChild(cell1);
                    tr.appendChild(cell2);
                    tr.appendChild(cell3);
                    table.appendChild(tr);
                }
                modal.appendChild(table);
            }
            else {
                var p = document.createElement("p");
                p.innerHTML = "Pas d'image enregistrée.";
                p.style.textAlign = "center";
                modal.appendChild(p);
            }
            var btnFermer = document.createElement("div");
            btnFermer.id = "fermer";
            btnFermer.addEventListener("click", filemanager.fermer.bind(filemanager), false);
            modal.appendChild(btnFermer);
            modal.style.display = "block";   
        }

    }
});



window.onload = function() {




// Yufei's Part




//Object for choose 
var choose = {
	chance : 3,
	objGlyphes : null,
	// var tab : null,
	alphabet : "les2",
	glyphes : null,
	result : null,


	displayAllGlyphes: function(glyphes){
		var size = glyphes.length;
		var doc = document.getElementById("choix");
		var docHtml = "<table><tr>";
		for(var i=0; i<size; i++){
			document.getElementById("choosingAlphabet").style.display="block";
			if(i%16==0 && i>0){
				docHtml += "</tr><tr>";
			}
			docHtml += "<td><button id=choixx"+glyphes[i]['ascii']+">"+glyphes[i]["key"]+" </button></td>"; 
		}
		docHtml += "</tr></table>";
		doc.innerHTML += docHtml;
		for(var j=0; j<size; j++){
			document.getElementById("choixx"+this.glyphes[j]["ascii"]).addEventListener("click",(function(result){
				return function(){
					if(this.id == "choixx"+result){
						alert("NICE WP");
					}
					else{
						console.log("LOST");
					}
				}
			})(this.result));
		}
	},

	getResult: function(old){
		var size = this.glyphes.length;
		var res = "";
		do{
			res = this.glyphes[size*Math.random()|0]["ascii"];
		}
		while(res == old);
		return res;
	},

	// updateResult: function(){
	// 	document.getElementById("choixx"+result).className="correct";
	// }
	


	initGlyphes: async function(alphabet){
		if (typeof fetch !== undefined) {       
		    // avec des promesses et l'instruction fetch
		    var response = await fetch("./json/alphabet.json"); 
		    if (response.status == 200) {
		        var data = await response.json();
		        this.objGlyphes = new Glyphes(data);
		    }
		    this.glyphes = this.objGlyphes.getAllGlyphes("les2");
		    this.result = this.getResult(this.result);
		    console.log("res:",this.result);
		    console.log("gly:",this.glyphes)
		    this.displayAllGlyphes(this.glyphes);
		}
		else{
			console.log("Your navigateur can not accpet fetch");
		}
	}
};






/**
 *  Classe représentant l'ensemble des glyphes
 */
function Glyphes(glyphes) {
    
    /** 
     *  Clés des glyphes éligibles par rapport aux options actuellement sélectionnées
     *  (fonction privée -- interne à la classe)
     */
    var getGlyphKeys = function(alphabet) {
        var cbs = document.querySelectorAll("#options input[type=checkbox]:checked");
        return Object.keys(glyphes[alphabet]).filter(function(elem, _index, _array) {
            // closure qui s'appuie sur les checkbox qui ont été sélectionnées (cbs)
            var len = cbs.length;
            if(cbs.length>0){
	            for (var i=0; i < cbs.length; i++) {
	                // on vérifie si la clé (elem) matche la regex définie comme valeur de la checkbox
	                var patt = new RegExp("\\b" + cbs[i].value + "\\b", "g");
	                if (patt.test(elem)) {
	                    return true;   
	                }
	            }
	            return false;
	        }
	        else{
	        	return true;
	        }
        });
    }
    
    
    /** 
     *  Choisit trois glyphes différents entre elles et différentes de celle dont la clé
     *  est passée en paramètre
     *  @param old          String  clé du glyphe 
     *  @param alphabet     String  alphabet considéré
     */
    this.getAllGlyphes = function(alphabet) {
    	if (alphabet == "les2") {
            alphabet = (Math.random() < 0.5) ? 'hiragana' : 'katakana';
            console.log(alphabet);   
        }
        var eligible = getGlyphKeys(alphabet);
        var aTrouver = [];
        var key;
        var size =eligible.length;
        for (var i=0; i < size; i++) {
        	aTrouver[i]={key: eligible[i], ascii:glyphes[alphabet][eligible[i]]};
            // do {
            //     key = eligible[Math.random() * eligible.length | 0];
            // }
            // while (aEviter.indexOf(key) >= 0);
            // aEviter.push(key);
            // aTrouver[i] = { key: key, ascii: glyphes[alphabet][key] };
        }
        console.log("aTrouver",aTrouver);
        
        return aTrouver;
    }
}


// choose.initGlyphes();



// setTimeout( function(){
// }, 1 * 1000 );
// console.log(choose.objGlyphes.getAllGlyphes("les2"));

// End of Yufei's Part





var id;
var msg;
var socket=io.connect();
var clients = [];


document.getElementById("btnJoin").addEventListener("click", function() {
	id = document.getElementById("nickname").value;
	if (id == "") {
		return;
	}
	socket.emit("login", id);
	socket.on("loginReturn",function(idFinal){
		id=idFinal;
		document.getElementById("login").innerHTML = id;
	});
	document.getElementById("content").style.display = "block";
	document.getElementById("login").innerHTML = id;
	document.getElementById("login").style.display = "none";
	lobby_call();
});

document.getElementById("btnCreate").addEventListener("click", function() {
	id = document.getElementById("nickname").value;
	if (id == "") {
		return;
	}
	document.getElementById("settings").style.display = "block";
	document.getElementById("login").style.display = "none";
	create_game_listener();

});

function lobby_call() {
	document.getElementById("lobby").style.display = "block";
	socket.emit("get_lobby");
	socket.on("lobby", function(games) {
		var lobby_view = "<table>";
		var l_size = games.length;
		console.log(l_size);
		for (var i = 0; i < l_size; i++) {
			var game_view = "<p> Owner: " + games[i].owner + " | Alphabet: " + games[i].alphabet + " | Speed: " + games[i].max_delay + " | Duration: " + games[i].laps_number + "</p>";
			lobby_view += "<tr>" + game_view + "</tr>";
		}
		lobby_view += "</table>";
		document.getElementById("lobby").innerHTML = lobby_view;
	});
}

function create_game_listener() {
	document.getElementById("btnConfirmCreate").addEventListener("click", function() {
		var new_game = { owner : id, alphabet : undefined, max_delay : 0,  laps_number : 0, is_private : false };
		/*
			Init fields
		*/		
		socket.emit("new_game", new_game);			
	});
} 

document.getElementById("gameTest").addEventListener("click", function(){
	socket.emit("beginTest");
	socket.on("initClient",function(game){
		if(!game.hasPerson(id)){
			return;
		}
		if(id==game.painter){

		}
		else{

		}
	});

});

}




