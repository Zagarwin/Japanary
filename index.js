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
var nomberGame = 1;

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    
    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;


    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous  
     */
    socket.on("message", function(msg) {
        console.log("Reçu message");   
        // si jamais la date n'existe pas, on la rajoute
        msg.date = Date.now();
        // si message privé, envoi seulement au destinataire
        if (msg.to != null && clients[msg.to] !== undefined) {
            console.log(" --> message privé");
            clients[msg.to].emit("message", msg);
            if (msg.from != msg.to) {
                socket.emit("message", msg);
            }
        }
        else {
            console.log(" --> broadcast");
            io.sockets.emit("message", msg);
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


    
    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
        while (clients[id]) {
            id = id + parseInt(Math.random()*999);  

        }
        currentID = id;
        currentPerson = new Person(currentID);
        console.log("add client "+currentID);
        clients[currentID] = currentPerson;

        socket.emit("loginReturn",currentID);

        
        console.log("Nouvel utilisateur : " + currentID);
        // envoi aux autres clients 
        // socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() } );
        // envoi de la nouvelle liste à tous les clients connectés 
    });
    
    socket.on("new_game", function(new_game) {
    	console.log("game pushed");
    	games.push(new_game);
    });

    // socket.on("begin", function(data){
    //     game = ;
    //     game.choosePainter;
    //     socket.emit("beginReturn", {gameID:data["gameID"], listPlayers:game["persons"], painter:game["painter"], result:game["result"], regles:game[regles]});
    //     console.log("Game is parti");
    // });

   socket.on("get_lobby", function() {
	console.log("games sended");
	socket.emit("lobby", games);
   });
   
   socket.on("command",function(command){
        command["gameID"]
        socket.emit("command2clients",command);
   });
    
    
});

function Person(name){
    this.id=name;
    this.score=0;
}


function Game(){
    this.persons=[];
    this.id = numberGame;
    numberGame++;
    this.painter = null;
    this.numberContinue = 0;
    this.result=null;
    this.regles=null;


    this.addPerson=function(p){
        this.persons.push(p);
    };

    this.hasPerson=function(name){
        for(p in this.persons){
            if(p.id == name){
                return true;
            }
        }
        return false;
    }

    this.start=function(){
        this.painter=this.persons[this.numberContinue%this.persons.size];
        this.numberContinue++;
    }


}
