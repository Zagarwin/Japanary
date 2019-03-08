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
            id = id + "@";
        }
        currentID = id;
        console.log("add client "+currentID);
        clients[currentID] = socket;

        socket.emit("loginReturn",currentID);

        console.log("Nouvel utilisateur : " + currentID);
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
            games[data.game_id].playerIsDone();  // Ce joueur ne joue plus
        }
        else{
            send_2_clients(data.game_id, "message", {"text":data.player_id+" guess "+data.answer});
        }
    });



    /**
     *  Gestion des déconnexions
     */

    // fermeture
    socket.on("logout", function(data) {
        delete clients[data.player_id];
        if(games[data.game_id].owner==data.player_id){
            if(games[data.game_id].changeOwner()=="empty_room"){
                delete games[data.game_id];
            }
            delete games[data.game_id].clients[data.player_id];
            delete gemes[data.game_id].points[data.player_id];
            send_2_clients(data.game_id, "message", {text:"The owner of this room "+data.player_id+" has leaved. Now the new ower is "+games[data.game_id].owner});
            send_2_clients(data.game_id, "liste", {points:games[data.game_id].points});
        }
        delete games[data.game_id].clients[data.player_id];
        delete gemes[data.game_id].points[data.player_id];
        send_2_clients(data.game_id, "message", {text: data.player_id+" leave the room."});
        send_2_clients(data.game_id, "liste", {points:games[data.game_id].points});
    });


    // déconnexion de la socket
    socket.on("disconnect", function(reason) {
        // if (currentID) {
        //     console.log("disdis::",currentID);
        //     var game_id=-1;
        //     for(var i=0; i<games.length; i++){
        //         if(games[i].hasPerson(currentID)){
        //             game_id=games[i].id;
        //         }
        //     }
        //     console.log("DISDIS::",game_id);
        //     delete clients[currentID];
        //     if(games[game_id].owner==currentID){
        //         if(games[game_id].changeOwner()=="empty_room"){
        //             delete games[game_id];
        //         }
        //         delete games[game_id].clients[currentID];
        //         delete gemes[game_id].points[currentID];
        //         send_2_clients(game_id, "message", {text:"The owner of this room "+currentID+" has leaved. Now the new ower is "+games[game_id].owner});
        //         send_2_clients(game_id, "liste", {points:games[game_id].points});
        //     }
        //     delete games[game_id].clients[currentID];
        //     delete gemes[game_id].points[currentID];
        //     send_2_clients(game_id, "message", {text: currentID+" leave the room."});
        //     send_2_clients(game_id, "liste", {points:games[game_id].points});
        // }
    });




    socket.on("new_game", function(data) {
	   game_id = init_game(data);
       socket.emit("new_gameReturn", {"game_id":game_id, "rule":games[game_id].rule});
       socket.emit("liste", games[game_id].points);
       socket.emit("message", {text: data.owner + " created the room", date: Date.now() });
    });

   socket.on("get_lobby", function() {
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
    send_2_clients(whowhere.game,"liste",games[whowhere.game].points);
    send_2_clients(whowhere.game,"message", {text: whowhere.player + " joins the room ", date: Date.now() });
   });


   socket.on("game_start", function(game_id){
    if((games[game_id].players.length>1)){
        games[game_id].start();
        send_2_clients(game_id, "tour1", {"player_id":games[game_id].painter});
    }
    else{
        socket.emit("game_start_fail", {raison: "Begin game must have at least 2 persons."});
    }
   });

   socket.on("tour2",function(data){
    games[data.game_id].result=data.result;
    games[data.game_id].launchTimer();
    send_2_clients(data.game_id,"tour3",{"result":games[data.game_id].result})
   });


   socket.on("tour4",function(data){
    if(games[data.game_id].started==true){
        games[data.game_id].choosePainter();
        if(games[data.game_id].players.length>1){
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
   });

   socket.on("I_invite", function(data){
        if(clients[data.to]!=null){
            console.log("invite OK");
            clients[data.to].emit("invite_me", {from: data.from, game_id:game_id});
        }
    });
   socket.on("i_am_done", function(g_id) {
       games[g_id].playerIsDone();  // Un joueur ne joue plus
   });


});


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
    this.points={};
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
    this.left_playing = -1;
    this.timer = null;
    this.remainingTime = 30;

    this.playerIsDone=function() {
        console.log("a player is done");
        this.left_playing--;
        if (this.left_playing == 0) {
            this.contiue();
        }
    }

    this.hasPerson=function(name){
        var l=this.players.length;
        for(var i=0;i<l;i++){
            if(this.players[i]==name){
                return true;
            }
        }
        return false;
    }

    this.start=function(){
        this.started=true;
        this.choosePainter();
    }

    this.contiue=function(){
        console.log("game continue");
        clearInterval(this.timer);
        this.remainingTime = 30;
        if(this.started==true){
            this.choosePainter();
            if(this.players.length>1){
                console.log("send tour 1");
                send_2_clients(this.id, "tour1",  {"player_id":this.painter});
            }
            else{
                socket.emit("gameOverByError",{raison:"Game over because the players must more than 2!"});
            }
        }
        this.left_playing = this.players.length - 1;
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
        this.points[player]=0;
        this.left_playing++;
    };
    this.changeOwner=function(){
        if(this.players.length>0){
            var i=0;
            do{
                i++;
            }while(this.players[(this.numberContinue+i)%this.players.length]==null)
            this.owner=this.players[(this.numberContinue+i)%this.players.length];
        }
        else{
            return "empty_room";
        }
    };
    this.updatePoints=function(name,new_point){
        this.points[name]=new_point;
    };

    this.launchTimer=function() {
        this.timer=setInterval(function() {
            this.remainingTime--;
            if (this.remainingTime == 0) {
                this.contiue();
            }
        }, 1000);
    };
}

function send_2_clients(game_id, name, data){
    var size = games[game_id].players.length;
    for(var i=0; i<size; i++){
        clients[games[game_id].players[i]].emit(name, data);
    }
}


