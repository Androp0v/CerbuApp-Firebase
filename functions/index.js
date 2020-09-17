// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

exports.recountCapacities = functions.database.ref('/Capacities/Check-ins/{checkinid}').onWrite(async (change) => {
	
	// Grab the current (.after) value of what was written to the Realtime Database.
    const checkinsRef = change.after.ref.parent;
	const countsRef = admin.database().ref('Capacities/Count/');

	var comedorCount = 0;
	var salaDeLecturaCount = 0;
	var bibliotecaCount = 0;

	const comedorTimeout = 20*60; //20 minutos
	const salaDeLecturaTimeout = 6*60*60; //6 horas
	const bibliotecaTimeout = 6*60*60; //6 horas

	const checkins = await checkinsRef.once('value');
	checkins.forEach((child) => {

      //functions.logger.log("Hello from info. Here's the child.key object:", child.key); //LOG
      //functions.logger.log("Hello from info. Here's the child.child('Room').val() object:", child.child("Room").val()); //LOG

      if (child.child("Room").val() === "Comedor") {
        comedorCount += 1;
      }else if (child.child("Room").val() === "SalaDeLectura"){
      	salaDeLecturaCount += 1;
      }else if (child.child("Room").val() === "Biblioteca"){
      	bibliotecaCount += 1;
      }

    });

    //functions.logger.log("Hello from info. Here's the comedorCount object:", comedorCount); //LOG

    //functions.logger.log("Hello from info. Here's the checkinsRef object:", checkinsRef); //LOG
    //functions.logger.log("Hello from info. Here's the countsRef object:", countsRef); //LOG

    const counts = await countsRef.once('value');
    const updates = {};

    updates["Comedor/Current"] = comedorCount;
    updates["SalaDeLectura/Current"] = salaDeLecturaCount;
    updates["Biblioteca/Current"] = bibliotecaCount;

    //functions.logger.log("Hello from info. Here's the updates object:", updates); //LOG

  	return countsRef.update(updates);
});