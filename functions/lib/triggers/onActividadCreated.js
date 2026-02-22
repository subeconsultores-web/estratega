"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onActividadCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
exports.onActividadCreated = (0, firestore_1.onDocumentCreated)('actividades/{actividadId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log('No hay datos asociados a este evento.');
        return;
    }
    const actividad = snapshot.data();
    const clienteId = actividad['clienteId'];
    if (!clienteId) {
        console.log('La actividad no tiene un cliente asignado.');
        return;
    }
    let scorePoints = 0;
    // Asignación de puntaje base por tipo de actividad
    switch (actividad['tipo']) {
        case 'reunion':
            scorePoints = 20;
            break;
        case 'llamada':
            scorePoints = 10;
            break;
        case 'email':
            scorePoints = 5;
            break;
        case 'seguimiento':
            scorePoints = 5;
            break;
        default:
            scorePoints = 2; // Actividad general
    }
    // Modificadores por sentimiento/resultado
    if (actividad['resultado'] === 'positivo') {
        scorePoints += 10;
    }
    else if (actividad['resultado'] === 'negativo') {
        scorePoints -= 5;
    }
    const db = admin.firestore();
    const clienteRef = db.collection('clientes').doc(clienteId);
    try {
        await clienteRef.update({
            score: admin.firestore.FieldValue.increment(scorePoints),
            ultimaInteraccion: admin.firestore.FieldValue.serverTimestamp() // Mantener el registro fresco para la IA estrato
        });
        console.log(`Métrica Lead Score actualizada para Cliente ${clienteId} sumando ${scorePoints} pts.`);
    }
    catch (error) {
        console.error(`Error actualizando el Score del Cliente ${clienteId}:`, error);
    }
});
//# sourceMappingURL=onActividadCreated.js.map