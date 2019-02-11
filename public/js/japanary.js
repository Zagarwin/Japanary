window.onload = function() {

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
