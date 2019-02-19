// function button_onclick(){
// 	console.log(this.id);
// 	if(this.id == choose.result){
// 		alert("ok");
// 	}
// 	else{
// 		alert("gg");
// 	}
// };



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


choose.initGlyphes();
// setTimeout( function(){
// }, 1 * 1000 );
// console.log(choose.objGlyphes.getAllGlyphes("les2"));

// End of Yufei's Part





var id;
var msg;
var socket;
var clients = [];

document.getElementById("btnJoin").addEventListener("click", function() {
	id = document.getElementById("nickname").value;
	if (id == "") {
		return;
	}
	socket = io.connect('http://localhost:8080');
	socket.emit("login", id);
	socket.on("bienvenue", function(msg) {
		console.log("le serv m'a souaité la bienvenue");
	});
	document.getElementById("content").style.display = "block";
	document.getElementById("login").innerHTML = id;
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

function create_game_listener() {
	document.getElementbyId("btnConfirmCreate").addEventListener("click", function() {
		var new_game = { owner : id, alphabet : undefined, max_delay : 0,  laps_number : 0, is_private : false };
		/*
			Init fields
		*/		
		socket.emit("new_game", new_game);			
	});
} 

}




