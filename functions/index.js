// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

exports.recountCapacities = functions.database.ref('/Capacities/Check-ins/{checkinid}').onWrite(async (change) => {
	
	// Grab the current (.after) value of what was written to the Realtime Database.
    const checkinsRef = change.after.ref.parent;
	const countsRef = admin.database().ref('Capacities/Count/');

	// Define a bunch of variables
	var comedorCount = 0;
	var salaDeLecturaCount = 0;
	var bibliotecaCount = 0;

	const comedorTimeout = 20*60; //20 minutos
	const salaDeLecturaTimeout = 6*60*60; //6 horas
	const bibliotecaTimeout = 6*60*60; //6 horas

	// Retrieve all check-ins and classify them
	const checkins = await checkinsRef.once('value');
	checkins.forEach((child) => {
      if (child.child("Room").val() === "Comedor") {
        comedorCount += 1;
      }else if (child.child("Room").val() === "SalaDeLectura"){
      	salaDeLecturaCount += 1;
      }else if (child.child("Room").val() === "Biblioteca"){
      	bibliotecaCount += 1;
      }
    });

    // Update child nodes "Count" with freshly counted data
    const counts = await countsRef.once('value');
    const updates = {};

    updates["Comedor/Current"] = comedorCount;
    updates["SalaDeLectura/Current"] = salaDeLecturaCount;
    updates["Biblioteca/Current"] = bibliotecaCount;

  	return countsRef.update(updates);
});