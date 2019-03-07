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
            send_2_clients(data.game_id, "message", {"text":data.player_id+" has known the word!!! Quickly!"});
        }
        else{
            send_2_clients(data.game_id, "message", {"text":data.player_id+" guess "+data.answer});
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
       socket.emit("new_gameReturn", {"game_id":game_id, "rule":games[game_id].rule});
       socket.emit("liste", games[game_id].players);
       socket.emit("message", {text: data.owner + " created the room", date: Date.now() });
    });

   socket.on("get_lobby", function() {
	console.log("games sended : " + games.length);
    var games_display = [];
    games.forEach(function(game) {
        games_display.push({ owner:game.owner, alphabet:game.alphabet, delay:game.delay, laps:game.laps, players:game.players.length, max_players:game.max_players, id:game.id});
    });
	socket.emit("lobby", games_display);
   });

   socket.on("command",function(command){
        command["gameID"];//wtf???
        socket.emit("command2clients",command);
   });

   socket.on("game_connect", function(whowhere) {
	console.log("Player (" + whowhere.player + ") connected to : " + whowhere.game);
	games[whowhere.game].connectPlayer(whowhere.player);
    socket.emit("initClient", {"game_id":whowhere.game, rule:games[whowhere.game].rule});
    send_2_clients(whowhere.game,"liste",games[whowhere.game].players);
    send_2_clients(whowhere.game,"message", {text: whowhere.player + " joins the room ", date: Date.now() });
   });


   socket.on("game_start", function(game_id){
    console.log("HEY id "+game_id);
    if((games[game_id].players.length>1)&&(games[game_id].laps>0)){
        games[game_id].start();
        send_2_clients(game_id, "tour1", {"player_id":games[game_id].painter});
    }
    else{
        console.log("game can't start!!! "+games[game_id].players.length + games[game_id].laps);

    }
   });

   socket.on("tour2",function(data){
    games[data.game_id].result=data.result;
    console.log(games[data.game_id].result);
    send_2_clients(data.game_id,"tour3",{"result":games[data.game_id].result})
   });


   socket.on("tour4",function(data){
    if(games[data.game_id].started==true){
        games[data.game_id].choosePainter();
        if(games[data.game_id].players.length>1){
            console.log("IM IN TOUR4");
            send_2_clients(data.game_id, "tour1",  {"player_id":games[game_id].painter});
        }
        else{
            socket.emit("gameOverByError",{raison:"Game over because the players must more than 2!"});
        }
    }
   });


   socket.on("roomOver",function(data){
    delete games[data.game_id];
   });


   socket.on("commande",function(data){
    send_2_clients(data.game_id, "commandeReturn", data);
   })



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
    new_game.rule = data.rule;
	new_game.connectPlayer(data.owner);
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
    this.laps = 3;
    this.alphabet = null;
    this.started = false;
    this.rule = [];
    this.result = null;
    this.lap_current = 1;

    this.hasPerson=function(name){
        for(p in this.persons){
            if(p.id == name){
                return true;
            }
        }
        return false;
    }

    this.start=function(){
        this.started=true;
        this.choosePainter();
    }
    this.choosePainter=function(){
        if(this.started){
            this.painter=this.players[this.numberContinue%this.players.length];
            this.lap_current = parseInt(this.numberContinue / this.players.length);
            this.numberContinue++;
            if(this.numberContinue==this.laps*this.players.length){
                this.started = false;
            }
        }
    };

    this.connectPlayer=function(player){
    	if (this.players.length >= this.max_players) {
    		return;
    	}
    	this.players.push(player);
    };
}

function send_2_clients(game_id, name, data){
    console.log("im send_2_clients: ", game_id);
    var size = games[game_id].players.length;
    for(var i=0; i<size; i++){
        clients[games[game_id].players[i]].emit(name, data);
    }
}
