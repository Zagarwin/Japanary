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
var id = null;
var game_id = null;
var msg;
var socket=io.connect();
var clients = [];
var rules=[];
var amIpainter = false;
var board1=null;
var shadow1=null;
var chance=0;
var answer=null;
var maxtime = 30; 
var result_japonese;


function shadow(){
	this.setShadow=function(){
		document.getElementById("choosingAlphabet").style.display="block";
		document.getElementById("dessin2").style.display="block";
		var dessin2 = document.getElementById("dessin2");
		var ctxBG2 = dessin2.getContext("2d");
		ctxBG2.fillStyle = "white";
	    ctxBG2.strokeStyle = "white";
		socket.on("commandeReturn", function(data){
			console.log("I HEARD COMMANDE RETURN:",data);
			if(data.name=="new"){
				console.log("I HEARD NEW:",data);
				ctxBG2.clearRect(0, 0, ctxBG2.width, ctxBG2.height);
			}
			else if(data.name=="tracer"){
				console.log("I HEARD TRACER:",data);
				ctxBG2.beginPath();
		        ctxBG2.arc(data.x, data.y, data.size/2, 0, 2*Math.PI);
		        ctxBG2.fill();
			}
			else if(data.name=="gommer"){
				console.log("I HEARD GOMMER:",data);
				ctxBG2.clearRect(data.x - data.size/2, data.y - data.size/2, data.size, data.size);
			}
			else if(data.name=="ligne"){
				console.log("I HEARD LIGNE:",data);
				ctxBG2.lineWidth = data.size;
		        ctxBG2.beginPath();
		        ctxBG2.moveTo(data.startX, data.startY);
		        ctxBG2.lineTo(data.x, data.y);
		        ctxBG2.stroke();
			}
		});
	}

	this.hideShadow=function(){
		var dessin2 = document.getElementById("dessin2");
		var ctxBG2 = dessin2.getContext("2d");
		ctxBG2.clearRect(0, 0, ctxBG2.width, ctxBG2.height);
		document.getElementById("dessin2").style.display="none";
	}
}


function board(){
	this.afficherToolbox=function(){
		toolboxHtml='<div id="toolbox"><input type="radio" name="radCommande" id="tracer" checked> <label for="tracer"></label><input type="radio" name="radCommande" id="gommer"> <label for="gommer"></label><input type="radio" name="radCommande" id="ligne">  <label for="ligne"></label><input type="range" id="size" min="1" max="50" value="5"><div id="new"></div></div>';
		document.getElementById("box").innerHTML=toolboxHtml;
	}

	this.hideBoard=function(){
		var dessin = document.getElementById("dessin");
		var ctxBG = dessin.getContext("2d");
		ctxBG.clearRect(0, 0, ctxBG.width, ctxBG.height);
		document.getElementById("dessin").style.display="none ";
		document.getElementById("overlay").style.display="none ";

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

	    if(document.getElementById("new")!=null){
		    document.getElementById("new").addEventListener("click", function(e) {
		        ctxBG.clearRect(0, 0, ctxBG.width, ctxBG.height);
		        socket.emit("commande",{game_id:game_id,name:"new", x:0, y:0, size:0});
		    });
		}


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
	            socket.emit("commande", {game_id:game_id, name:"tracer", x:x, y:y, size:size.value});
	        }
	    }
	    tracer.down = function(x, y) {
	        // appel classe mère
	        this.__proto__.down.call(this, x, y);
	        // impression sur la zone de dessin
	        this.dessiner(ctxBG, x, y);
	        socket.emit("commande", {game_id:game_id, name:"tracer", x:x, y:y, size:size.value});
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
	            socket.emit("commande",{game_id:game_id,name:"gommer", x:x, y:y, size:size.value});
	        }
	        ctxFG.strokeRect(x - size.value/2, y - size.value/2, size.value, size.value);
	    }
	    gommer.down = function(x, y) {
	        this.__proto__.down.call(this, x, y);
	        gommer.effacer(x,y);
	        socket.emit("commande",{game_id:game_id,name:"gommer", x:x, y:y, size:size.value});
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
	        socket.emit("commande",{game_id:game_id,name:"ligne", x:x, y:y, size:size.value, startX:startX, startY:startY});
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

	socket.on("bienvenue", function(id) {
        if (id) {
            document.querySelector("#chat main").innerHTML = "";
            document.getElementById("monMessage").value = "";
            //document.getElementById("login").innerHTML = id;
            document.getElementById("radio2").checked = true;
        }
    });
    socket.on("message", function(msg) {
        if (id) {
            afficherMessage(msg);
        }
    });
    socket.on("liste", function(liste) {
        if (id) {
            afficherListe(liste);
        }
    });


    /**
     *  Connexion de l'utilisateur au chat.
     */
    function connect() {
        console.log(sock);

        // recupération du pseudo
        var user = document.getElementById("pseudo").value.trim();
        if (! user) return;
        document.getElementById("radio2").check = true;
        id = user;
        sock.emit("login", user);
    }


    /**
     *  Affichage des messages
     */
    function afficherMessage(data) {
        if (!id) {
            return;
        }
        var classe = "";
        var bcMessages = document.querySelector("#chat main");
        bcMessages.innerHTML += "<p class='" + classe + "'>" + " - " + data.text + "</p>";
        document.querySelector("main > p:last-child").scrollIntoView();
    };




    /**
     *  Envoyer un message
     */
    function envoyer() {

        var msg = document.getElementById("monMessage").value.trim();
        if (!msg) return;

        // message privé
        var to = null;
        if (msg.startsWith("@")) {
            var i = msg.indexOf(" ");
            to = msg.substring(1, i);
            msg = msg.substring(i);
        }
        // envoi
        if(chance>0){
        	socket.emit("message", {"game_id":game_id, "answer":msg, "player_id":id});
        	chance=chance-1;
        }
        else{
        	alert("You have used all your 3 chances!!")
        }

        document.getElementById("monMessage").value = "";
    }


    /**
     *  Quitter le chat et revenir à la page d'accueil.
     */
    function quitter() {
        id = null;
        sock.emit("logout");
        document.getElementById("radio1").checked = true;
    };

    document.getElementById("btnQuitter").addEventListener("click", quitter);
    document.getElementById("btnEnvoyer").addEventListener("click", envoyer);
    document.getElementById("monMessage").addEventListener("keydown", function(e) {
        if (e.keyCode == 13) {
            envoyer();
        }
    });
}





window.onload = function() {
	clients = [];

		//Object for choose
	var choose = {
		objGlyphes : null,
		alphabet : null,
		glyphes : null,
		result : null,
		size : null,


		displayAllGlyphes: function(glyphes){
			var chance = 3;
			this.size = glyphes.length;
			var doc = document.getElementById("choix");
			var docHtml = "<table id=allGlyphes><tr>";
			for(var i=0; i<this.size; i++){
				document.getElementById("choosingAlphabet").style.display="block";
				if(i%16==0 && i>0){
					docHtml += "</tr><tr>";
				}
				docHtml += "<td><button id="+glyphes[i]['key']+">"+glyphes[i]["key"]+" </button></td>";
			}
			docHtml += "</tr></table>";
			doc.innerHTML += docHtml;
			for(var j=0; j<this.size; j++){
				document.getElementById(this.glyphes[j]["key"]).addEventListener("click",(function(result){
					return function(){
						if(this.id == result){
							alert("NICE WP");
						}
						else{
							console.log("LOST");
						}
						if(chance>0){
							console.log("I SEND MESSA");
							socket.emit("message", {"player_id":id, "game_id":game_id, "answer":this.id });
							chance = chance-1;
						}
						else{
							alert("You have guessed already 3 times!");
						}

					}
				})(chance));
			}
		},



		setResult: function(res){
			this.result=res;
		},

		// updateResult: function(){
		// 	document.getElementById("choixx"+result).className="correct";
		// }



		initGlyphes: async function(){
			if (typeof fetch !== undefined) {
			    // avec des promesses et l'instruction fetch
			    var response = await fetch("./json/alphabet.json");
			    if (response.status == 200) {
			        var data = await response.json();
			        this.objGlyphes = new Glyphes(data);
			    }
				var alphabet = rules[0];
			    this.glyphes = this.objGlyphes.getAllGlyphes(alphabet);
			    this.size = this.glyphes.length;

			    console.log("res:",this.result);
			    console.log("gly:",this.glyphes);
			}
			else{
				console.log("Your navigateur can not accpet fetch");
			}
		}
	}

	function afficherListe(newList) {
        document.querySelector("#chat aside").innerHTML = newList.join("<br>");
    }



	function create_game_listener() {
		document.getElementById("btnConfirmCreate").addEventListener("click", function() {
			var cbs = document.querySelectorAll("#settings input[type=checkbox]:checked");
			var alphabet = document.querySelector('#settings input[name=radGlyphe]:checked').value;	
			var isPrivate = document.querySelector('#settings input[name=is_private]:checked').value;
			var delay = document.getElementById("delay").value;
			var laps = document.getElementById("laps").value;
			var rules = [];
			rules.push(alphabet);
			for (var i=0; i < cbs.length; i++) {
				rules.push(cbs[i].value)
            }	
			var new_game = { owner : id, alphabet : alphabet, delay : delay,  laps : laps, is_private : isPrivate , rule: rules};
			document.getElementById("settings").style.display="none";
			/*
				Init fields
			*/
			socket.emit("new_game", new_game);
		});
	}


	document.getElementById("watchJaponese").addEventListener("click",function(){
		document.getElementById("resultJaponese").style.display="block";
		document.getElementById("resultJaponese").innerHTML="<h1>&#"+result_japonese+"</h1>";
	});

	socket.on("liste", function(liste) {
        if (id) {
            afficherListe(liste);
        }
    });



	socket.on("new_gameReturn", function(data){
		console.log("HEY new_gameReturn" + data.game_id);
		game_id = data.game_id;
		document.getElementById("begin").style.display="block";
		rules=data.rule;
		board1 = new board();
		board1.setBoard();
		document.getElementById("chat").style.display="block";
		choose.initGlyphes();
	});

	socket.on("initClient",function(data){
		console.log("HAVE INIT CLIENT"+id);
		rules=data.rule;
		board1 = new board();
		shadow1 = new shadow();
		shadow1.setShadow();
		document.getElementById("chat").style.display="block";
		choose.initGlyphes();
		game_id = data.game_id;
	});


	document.getElementById("begin").addEventListener("click", function(){
		socket.emit("game_start", game_id);
		document.getElementById("begin").style.display="none";
	});




	socket.on("tour1", function(data){
		console.log("id: "+id+"    dataid:"+data.player_id);
		if(id == data.player_id){
			amIpainter = true;
			document.getElementById("bc1In3").style.display = "block";
			var res=[];
			var r0,r1,r2;
			do{
				r0 = parseInt(choose.size * Math.random());
				r1 = parseInt(choose.size * Math.random());
				r2 = parseInt(choose.size * Math.random());
			}while(r0 == r1 || r1 == r2 || r0 == r2);
			var temp = "<tr><td><h3>Choose one alphabet to paint:</h3></td><br></tr><tr><td><button id=choose"+choose.glyphes[r0]['key']+">"+choose.glyphes[r0]["key"]+"</td></tr>";
			temp += "<tr><td><button id=choose"+choose.glyphes[r1]['key']+">"+choose.glyphes[r1]["key"]+"</td></tr>";
			temp += "<tr><td><button id=choose"+choose.glyphes[r2]['key']+">"+choose.glyphes[r2]["key"]+"</td></tr>";
			document.getElementById("table1In3").innerHTML=temp;
			document.getElementById("choose"+choose.glyphes[r0]['key']).addEventListener("click",function(){
				result_japonese = choose.glyphes[r0]['ascii'];
				socket.emit("tour2",{"game_id":game_id, "result": choose.glyphes[r0]['key']});
				document.getElementById("bc1In3").style.display = "none";
			});
			document.getElementById("choose"+choose.glyphes[r1]['key']).addEventListener("click",function(){
				result_japonese = choose.glyphes[r1]['ascii'];
				socket.emit("tour2",{"game_id":game_id, "result": choose.glyphes[r1]['key']});
				document.getElementById("bc1In3").style.display = "none";
			});
			document.getElementById("choose"+choose.glyphes[r2]['key']).addEventListener("click",function(){
				result_japonese = choose.glyphes[r2]['ascii'];
				socket.emit("tour2",{"game_id":game_id, "result": choose.glyphes[r2]['key']});
				document.getElementById("bc1In3").style.display = "none";
			});
		}
		document.getElementById("state").innerHTML="Waitting painter choose the word!"
	});

	socket.on("tour3",function(data){
		maxtime=30;
		if(amIpainter){
			board1.afficherToolbox();
			board1.makeBoardWork();
			document.getElementById("chat").style.display="none";
			document.getElementById("watchJaponese").style.display="block";
		}
		else{
			shadow1.setShadow();
			add_listener_chat(socket,id);
			choose.setResult(data.result);
			answer=data.result;
			console.log(data.result);
			choose.displayAllGlyphes(choose.glyphes);
		}
		document.getElementById("state").innerHTML="Game is running!"


        function countDown(){
		  var timer=null;
		  timer=setInterval(function(){
			if (maxtime >= 0) {
                seconds = Math.floor(maxtime % 60);
                msg = "Reste Time: "+ seconds + " s";
                document.getElementById("timer").innerHTML = msg;
                maxtime = maxtime-1;
            } 
            else{
                clearInterval(timer);
                if(amIpainter){
                	amIpainter=false;
                	document.getElementById("toolbox").style.display="none";
                	document.getElementById("bc1In3").style.display = "none";
                	document.getElementById("watchJaponese").style.display="none";
                	document.getElementById("resultJaponese").style.display="none";
                	board1.hideBoard();
                	alert("Your turn is over!");
                	socket.emit("tour4",{game_id:game_id,player_id:id, point:myPoint});
                }
                else{
                	document.getElementById("allGlyphes").style.display="none";
                	shadow1.hideShadow();
                	alert("Time's up! Answer is: "+answer);
                }
            }
		  },1000);
		  if(timer<=0){
		    clearInterval(timer);
		  }
		}
		document.getElementById("timer").style.display="block";
		countDown();
		// socket.emit("begin",{owner:id, glyphes:choose.glyphes, result:choose.result })
	});


	socket.on("gameOverByError",function(data){
		alert(data.raison);
		socket.emit("roomOver", {game_id:game_id});
	})





	/**
	 *  Classe représentant l'ensemble des glyphes
	 */
	function Glyphes(glyphes) {
		this.glyphes = glyphes;
	    /**
	     *  Clés des glyphes éligibles par rapport aux options actuellement sélectionnées
	     *  (fonction privée -- interne à la classe)
	     */
	    var getGlyphKeys = function(alphabet) {
	        var cbs = rules;
	        return Object.keys(glyphes[alphabet]).filter(function(elem, _index, _array) {
	            // closure qui s'appuie sur les checkbox qui ont été sélectionnées (cbs)
	            var len = cbs.length;
	            if(cbs.length>1){
		            for (var i=1; i < cbs.length; i++) {
		                // on vérifie si la clé (elem) matche la regex définie comme valeur de la checkbox
		                var patt = new RegExp("\\b" + cbs[i] + "\\b", "g");
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





var msg;
var clients = [];

document.getElementById("btnCreate").addEventListener("click", function() {
	id = document.getElementById("nickname").value;
	if (id == "") {
		return;
	}
	connect(id);
	select_pane("settings");
	create_game_listener();

});


document.getElementById("btnJoin").addEventListener("click", function() {
	id = document.getElementById("nickname").value;
	if (id == "") {
		return;
	}
	connect(id);
	console.log("> 1");
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
	console.log("> 4");
	var l_size = games.length;
	for (var i = 0; i < l_size; i++) {
		game_display(games[i]);
	}
	console.log("> 5");
}

function game_display(game) {
	var html_id = "game_" + game.id;
	var game_tab = document.getElementById("lobby");
	var game_cell = document.createElement("tr");
	game_cell.setAttribute("id", html_id);
	game_cell.innerHTML = "<p> Owner: " + game.owner + " | Alphabet: " + game.alphabet + " | Speed: " + game.delay + " | Duration: " + game.laps + " | Players: " + game.players + "/" + game.max_players + "</p>";
	game_tab.appendChild(game_cell);
	game_cell.onclick = dynamic_game_click;
	function dynamic_game_click() {
		console.log("game clicked!");
		socket.emit("game_connect", { "player" : id, "game" : game.id });
	}

}

function lobby_call() {
	console.log("> 2");
	select_pane("lobby");
	socket.emit("get_lobby");
	console.log("> 2.5");
	socket.on("lobby", function(games) {
		console.log("> 3");
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



}
