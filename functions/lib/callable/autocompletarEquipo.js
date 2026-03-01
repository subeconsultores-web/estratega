"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autocompletarEquipo = void 0;
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v2/https");
const db = admin.firestore();
exports.autocompletarEquipo = (0, https_1.onCall)({
    cors: true,
    memory: '256MiB',
    maxInstances: 10
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'El usuario debe estar autenticado.');
    }
    const tenantId = request.auth.token['tenantId'];
    if (!tenantId) {
        throw new https_1.HttpsError('permission-denied', 'No se encontró tenantId.');
    }
    const { proyectoId, skillsRequeridos } = request.data;
    if (!proyectoId || !skillsRequeridos || !Array.isArray(skillsRequeridos) || skillsRequeridos.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'Se requiere proyectoId y un array de skillsRequeridos.');
    }
    try {
        console.log(`Autocompletando equipo para proyecto ${proyectoId} con skills: ${skillsRequeridos.join(', ')}`);
        // 1. Fetch all active users with skills
        const usersSnapshot = await db.collection('users')
            .where('tenantId', '==', tenantId)
            .where('activo', '==', true)
            .get();
        if (usersSnapshot.empty) {
            return { success: true, data: { equipo: [], mensaje: 'No hay usuarios activos en el tenant.' } };
        }
        // 2. Calculate current workload for each user
        const tareasSnapshot = await db.collection('tareas')
            .where('tenantId', '==', tenantId)
            .where('estado', 'in', ['todo', 'in_progress', 'review', 'pendiente', 'en_progreso', 'en_revision'])
            .get();
        // Build a map of userId -> total pending hours
        const cargaPorUsuario = new Map();
        tareasSnapshot.forEach(doc => {
            const t = doc.data();
            const userId = t.asignadoA;
            if (userId) {
                const restante = Math.max(0, (t.tiempoEstimado || t.horasEstimadas || 0) - (t.tiempoConsumido || t.horasReales || 0));
                cargaPorUsuario.set(userId, (cargaPorUsuario.get(userId) || 0) + restante);
            }
        });
        // 3. Score each user against the required skills
        const candidatos = [];
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const userSkills = (user.skills || []).map((s) => s.toLowerCase().trim());
            const reqSkillsNorm = skillsRequeridos.map((s) => s.toLowerCase().trim());
            // Calculate match score
            const matchingSkills = reqSkillsNorm.filter((rs) => userSkills.includes(rs));
            const matchScore = reqSkillsNorm.length > 0
                ? Math.round((matchingSkills.length / reqSkillsNorm.length) * 100)
                : 0;
            if (matchScore > 0) {
                candidatos.push({
                    uid: doc.id,
                    nombre: user.nombre || user.email,
                    email: user.email,
                    skills: user.skills || [],
                    costoHora: user.costoHora || 0,
                    cargaActualHoras: cargaPorUsuario.get(doc.id) || 0,
                    matchScore
                });
            }
        });
        // 4. Sort by matchScore (desc), then by lowest current workload (asc)
        candidatos.sort((a, b) => {
            if (b.matchScore !== a.matchScore)
                return b.matchScore - a.matchScore;
            return a.cargaActualHoras - b.cargaActualHoras;
        });
        // 5. Return top 5 candidates
        const equipoSugerido = candidatos.slice(0, 5);
        return {
            success: true,
            data: {
                equipo: equipoSugerido,
                totalCandidatos: candidatos.length,
                skillsRequeridos,
                mensaje: equipoSugerido.length > 0
                    ? `Se encontraron ${equipoSugerido.length} profesionales compatibles.`
                    : 'No se encontraron usuarios con las habilidades requeridas. Considere ampliar los criterios o añadir skills a los perfiles del equipo.'
            }
        };
    }
    catch (error) {
        console.error('Error autocompletando equipo:', error);
        throw new https_1.HttpsError('internal', 'Error procesando la recomendación del equipo IA.');
    }
});
//# sourceMappingURL=autocompletarEquipo.js.map