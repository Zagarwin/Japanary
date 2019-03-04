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

io.set('origins', '*:*');


/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket
var games = [];
var nbSameName = 1;
var nomberGame = 1;

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
        clients[currentID] = socket;

        socket.emit("loginReturn",currentID);


        console.log("Nouvel utilisateur : " + currentID);
        // envoi aux autres clients
        // socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() } );
        // envoi de la nouvelle liste à tous les clients connectés
    });



    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous
     */
    socket.on("message", function(data) {
        console.log("Reçu message:"+data.answer);
        // si jamais la date n'existe pas, on la rajoute
        date = Date.now();
        if(data.answer == games[data.game_id].result){
            socket.emit("message",{"text":data.player_id+" has known the word!!! Quickly!"});
        }
        else{
            socket.emit("message",{"text":data.player_id+" guess "+data.answer});
        }
    });



    /**
     *  Gestion des déconnexions
     */

    // fermeture
    socket.on("logout", function() {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() } );
                // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
    });


    // déconnexion de la socket
    socket.on("disconnect", function(reason) {
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() } );
                // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
        console.log("Client déconnecté");
    });




    socket.on("new_game", function(data) {
	   game_id = init_game(data);
       console.log("HEY new_game:"+ game_id);
       socket.emit("new_gameReturn", {"game_id":game_id});
    });

    socket.on("beginTest", function(player_id){
        gameTest.connectPlayer(player_id);
        gameTest.choosePainter();
        socket.emit("initClient", gameTest);
        console.log("Game is parti");
    });

   socket.on("get_lobby", function() {
	console.log("games sended : " + games.length);
	socket.emit("lobby", games);
   });

   socket.on("command",function(command){
        command["gameID"];//wtf???
        socket.emit("command2clients",command);
   });

   socket.on("game_connect", function(whowhere) {
	console.log("Player (" + whowhere.player + ") connected to : " + whowhere.game);
	games[whowhere.game].connectPlayer(clients[whowhere.player]);
    socket.emit("initClient", games[whowhere.game]);
   });


   socket.on("game_start", function(game_id){
    console.log("HEY id "+game_id);
    var rules = games[game_id].rule;
    console.log("HEY rules " + rules);
    socket.emit("game_init", {"game_id":game_id, "rule": rules});
    if((games[game_id].players.size>1)&&(games[game_id].laps>0)){
        games[game_id].start();
        socket.emit("tour1", games[game_id]);
    }
   });

   socket.on("tour2",function(data){
    games[data.game_id].result=data.result;
    socket.emit("tour3",games[data.id]);
   });



});

function Person(name){
    this.id=name;
    this.score=0;
}

var max_id = 0;


function init_game(data) {
    new_game = new Game();
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
    this.started = false;
    this.rule = ["hirakana"];
    this.result = null;

    this.hasPerson=function(name){
        for(p in this.persons){
            if(p.id == name){
                return true;
            }
        }
        return false;
    }

    this.start=function(){
        choosePainter();
        this.started=true;
    }
    this.choosePainter=function(){
        this.painter=this.players[this.numberContinue%this.players.length];
        this.numberContinue++;
    };

    this.connectPlayer=function(player){
	if (this.players.length >= this.max_players) {
		return;
	}
	this.players.push(player);
    };


}
