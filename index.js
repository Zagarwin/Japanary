// Chargement des modules
var express = require('express');
var app = express();
var server = app.listen(8080, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Ecoute sur les websockets
var io = require('socket.io').listen(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/display.html');
});



/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket
var games = [];
var nbSameName = 1;
var gameTest = new Game(123456);
// games[gameTest.id]=gameTest;

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {

    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;

    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
        while (clients[id]) {
            id = id + "_";

        }
        currentID = id;
        currentPerson = new Person(currentID);
        console.log("add client "+currentID);
        clients[currentID] = currentPerson;
        gameTest.addPerson(currentPerson);

        socket.emit("loginReturn",currentID);


        console.log("Nouvel utilisateur : " + currentID);
        // envoi aux autres clients
        // socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() } );
        // envoi de la nouvelle liste à tous les clients connectés
    });

    socket.on("new_game", function(data) {
	game_id = init_game(data);
    });

    socket.on("beginTest", function(player_id){
        gameTest.addPerson(player_id);
        gameTest.choosePainter();
        socket.emit("initClient", gameTest);
        console.log("Game is parti");
    });

   socket.on("get_lobby", function() {
	console.log("games sended");
	socket.emit("lobby", games);
   });

   socket.on("command",function(command){
        socket.emit("command2clients",command);
   });

   socket.on("game_connect", function(whowhere) {
	console.log("Player (" + whowhere.player + ") connected to : " + whowhere.game);
	games[whowhere.game].connectPlayer(clients[whowhere.player]);
    socket.emit("initClient", games[whowhere.game]);
   });

});

function Person(name){
    this.id=name;


}

var max_id = 0;

function init_game(data) {
	var new_game = new Game();
	new_game.owner = data.owner;
	new_game.delay = data.delay;
	new_game.laps = data.laps;
	new_game.alphabet = data.alphabet;
	new_game.connectPlayer(clients[data.owner]);
	games.push(new_game);

    return new_game.id;
}

function Game(){

    this.owner = null;
    this.players=[];
    this.max_players = 5;
    this.id = max_id++;
    this.painter = null;
    this.numberContinue = 0;
    this.delay = 0;
    this.laps = 0;
    this.alphabet = null;

    this.addPerson=function(p){   // à enlever
        this.players.push(p);
    };

    this.choosePainter=function(){
        this.painter=this.players[this.numberContinue%this.players.length];
    };

    this.connectPlayer=function(player){
	if (this.players.length >= this.max_players) {
		return;
	}
	this.players.push(player);
    };


}
