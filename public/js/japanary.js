// function button_onclick(){
// 	console.log(this.id);
// 	if(this.id == choose.result){
// 		alert("ok");
// 	}
// 	else{
// 		alert("gg");
// 	}
// };
var myPoint=0;

function board(){
	this.afficherToolbox=function(){
		toolboxHtml='<div id="toolbox"><input type="radio" name="radCommande" id="tracer" checked> <label for="tracer"></label><input type="radio" name="radCommande" id="gommer"> <label for="gommer"></label><input type="radio" name="radCommande" id="ligne">  <label for="ligne"></label><input type="range" id="size" min="1" max="50" value="5"><div id="new"></div></div>';
		document.getElementById("box").innerHTML=toolboxHtml;
	}





	this.setBoard=function(){
		document.getElementById("choosingAlphabet").style.display="block";
		document.getElementById("dessin").style.display="block ";
		document.getElementById("overlay").style.display="block ";
	    var dessin = document.getElementById("dessin");
	    var overlay = document.getElementById("overlay");
	}
	    
	this.makeBoardWork=function(){
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
	        socket.emit("new",)
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
	}
};




function add_listener_chat(socket,real_pseudo){
	//chat

	socket.on("liste", function(list) {
		var listeClient = document.getElementsByTagName("aside")[0];
		var html = "<table>";
		for(var i in list){
			html += "<tr><td>"+list[i]+"</td></tr>";
		}
		html += "</table>" ;
		listeClient.innerHTML = html ;
	});
	socket.on("message", function(message){
		var main = document.getElementsByTagName("main")[0];
		var time = new Date(message["date"]);
		time = time.getHours()+":"+time.getMinutes()+":"+time.getSeconds()+" ";
		var color;
		var sender;
		var embracer;
		var found=(message["text"].match(/\[img:.*\]/));
		if(found!=null){
			var color_num = message["from"].charCodeAt(0)%8;
			color_0 = colors[color_num];
			color = 'color:'+color_0;
			sender = " - "+message["from"]+" : ";
			var url_0 = found[0].substring(5, found[0].length-1);
			console.log(url_0);
			message["text"]="<img src=\'"+url_0+"\'/>";
			embracer = "";
		}
		else if((message["from"]==null) && (message["to"]==null)){
			color = 'color:red';
			sender = "- [admin] : ";
			embracer = "";
		}
		else if((message["to"]==null)){ 
			var color_num = message["from"].charCodeAt(0)%8;
			color_0 = colors[color_num];
			color = 'color:'+color_0;
			sender = " - "+message["from"]+" : ";
			embracer = "";
		}
		else{
			var color_num = message["from"].charCodeAt(0)%8;
			color_0 = colors[color_num];
			color = 'color:'+color_0;
			sender = message["from"]+" :";
			embracer = "(à "+message["to"]+") : ";
		}
		if((message["from"]==real_pseudo)||(message["to"]==real_pseudo)||(message["to"]==null)){
			main.innerHTML += "<p style="+color+">"+time+sender+embracer+message["text"]+"</p>";
		}
	});
	var envoyer = document.getElementById("btnEnvoyer");
	envoyer.addEventListener("click", function(e){
		var monMessage = document.getElementById("monMessage").value;
		if(monMessage.length>0){
			// var regStr1 = monMessage.match(/^@\s/);
			// for(var i in regStr1){
			// 	console.log(regStr1[i]);
			// }
			var to_0 = null;
			var message_text = monMessage;
			var str1 = monMessage.split(' ');
			if(str1[0].charAt(0) == "@"){
				to_0 = str1[0].slice(1);
				message_text = monMessage.slice(str1[0].length);
			}
			
			var mes={
				from:  real_pseudo,
				to : to_0,
				text : message_text,
				date : Date.now()
			};
		socket.emit("message", mes);
			document.getElementById("monMessage").value="";
		}
	});
	var exit = document.getElementById("btnQuitter");
	exit.addEventListener("click", function(e){
		location.reload();
		// socket.emit("disconnect", "bye");
		// logScreen.style.display = "block";
		// content.style.display = "none";
	});
}





window.onload = function() {
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

	document.getElementById("begin").addEventListener("click", function(){
		var amIpainter = false;
		if(amIpainter){
			var board1 = new board();
			board1.afficherToolbox();
			board1.setBoard();
			board1.makeBoardWork();
			choose.initGlyphes(12354,amIpainter);
			console.log(choose.getResult());
		}
		else{
			var board2 = new board();
			board2.setBoard();
			choose.initGlyphes(12354,amIpainter);
			document.getElementById("chat").style.display="block";
			add_listener_chat(socket,id);
		}
		socket.emit("begin",{owner:id, glyphes:choose.glyphes, result:choose.result })
	});




	// Yufei's Part

	//Object for choose 
	var choose = {
		chance : 3,
		objGlyphes : null,
		// var tab : null,
		alphabet : null,
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

		setResult: function(res){
			this.result=res;
		},

		// updateResult: function(){
		// 	document.getElementById("choixx"+result).className="correct";
		// }
		


		initGlyphes: async function(res,isPainter){
			if (typeof fetch !== undefined) {       
			    // avec des promesses et l'instruction fetch
			    var response = await fetch("./json/alphabet.json"); 
			    if (response.status == 200) {
			        var data = await response.json();
			        this.objGlyphes = new Glyphes(data);
			    }
			    if(document.querySelector('#options input[name=radGlyphe]:checked')!=null){
				    var alphabet = document.querySelector('#options input[name=radGlyphe]:checked').value;
			    }
			   	else{
			   		var alphabet = "hiragana";
			   	}
			    this.glyphes = this.objGlyphes.getAllGlyphes(alphabet);
			    this.setResult(res);
			    console.log("res:",this.result);
			    console.log("gly:",this.glyphes);
			    if(!isPainter){
			    	this.displayAllGlyphes(this.glyphes);
			    }
			}
			else{
				console.log("Your navigateur can not accpet fetch");
			}
		}
	}






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
	connect(id);
	select_pane("settings");
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
		var new_game = { owner : id, alphabet : undefined, delay : 0,  laps : 0, is_private : false };
		/*
			Init fields
		*/
		console.log("game client-created");
		socket.emit("new_game", new_game);
	});
}

document.getElementById("btnJoin").addEventListener("click", function() {
	id = document.getElementById("nickname").value;
	if (id == "") {
		return;
	}
	connect(id);
	lobby_call();
});

function connect(player_id) {
	socket.emit("login", player_id);
	socket.on("loginReturn",function(real_id){
		id = real_id;
		console.log("You connected as " + id);
	});
}

function hide_pane(pane) {
    document.getElementById(pane).style.display = "none";
}

function select_pane(pane, close_others=true) {
	var panes = ["login","settings","lobby","choosingAlphabet"];
	if (!panes.includes(pane)) { console.log("pane not found"); return; }
    if (!close_others) {
        document.getElementById(element).style.display = "block";
        return;
    }
	panes.forEach(function(element) {
		var modif;
  		if (element == pane) {
			modif = "block";
            console.log("selected pane : " + element);
		}
		else {
			modif = "none";
		}
		document.getElementById(element).style.display = modif;
	});
}

function lobby_display(games) {
	var l_size = games.length;
	for (var i = 0; i < l_size; i++) {
		game_display(games[i]);
	}
}

function game_display(game) {
	var html_id = "game_" + game.id;
	var game_tab = document.getElementById("lobby");
	var game_cell = document.createElement("tr");
	game_cell.setAttribute("id", html_id);
	game_cell.innerHTML = "<p> Owner: " + game.owner + " | Alphabet: " + game.alphabet + " | Speed: " + game.delay + " | Duration: " + game.laps + " | Players: " + game.players.length + "/" + game.max_players + "</p>";
	game_tab.appendChild(game_cell);
	game_cell.onclick = dynamic_game_click;
	function dynamic_game_click() {
		console.log("game clicked!");
		socket.emit("game_connect", { player : id, game : game.id });
	}

}

function lobby_call() {
	select_pane("lobby");
	socket.emit("get_lobby");
	socket.on("lobby", function(games) {
		lobby_display(games);
	});
}

function is_included(game){
    console.log("There are " + game.players.length + " players in the game");
    var found = false;
    game.players.forEach(function(p) {
        if(p.id == id){
            console.log("player found");
            found = true;
        }
    });
    return found;
};

socket.on("initClient",function(game){
    if(!is_included(game)){
        console.log("I'm not in the game :(");
        return;
    }
    select_pane("choosingAlphabet");
    if(id==game.painter){
        console.log("I am the painter!");
    }
    else{
        console.log("I am not the painter..");
        hide_pane("toolbox");
    }
});

}
