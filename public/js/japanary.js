window.onload = function() {

var id;
var msg;
var socket;
var clients = [];

document.getElementById("btnConnecter").addEventListener("click", function() {
	id = document.getElementById("pseudo").value;
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

function party_create_listener() {
	var new_party = { alphabet : undefined, max_delay : 0,  laps_number : 0, is_private : false };
	document.getElementById("btnCreate").addEventListener("click", function() {
		document.getElementById("settings").style.display = "block";
	});
}

}
