// ============================================================
// Configuración Supabase
// ============================================================
const SUPABASE_URL = 'https://qbdpnyjwnuxolwzuyvxu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZHBueWp3bnV4b2x3enV5dnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzI2MDMsImV4cCI6MjA4OTI0ODYwM30.hLjiHYI74a8UpKvyx5s-rgShdcSMyTaI6dnAjQs0HTY';

async function saveToSupabase() {
    try {
        // Calcular RT promedio
        const rts    = AppState.results.filter(r => r.rt !== null && r.selected !== 'Omision').map(r => r.rt / 1000);
        const avgRt  = rts.length ? parseFloat((rts.reduce((a, b) => a + b, 0) / rts.length).toFixed(2)) : null;

        // Puntuaciones por emoción
        const perEmo = {};
        AppState.emotions.forEach(emo => {
            perEmo[emo] = AppState.results.filter(r => r.correct === emo && r.isHit).length;
        });

        // Z-score global
        const norm   = AppState.normativeCutoffs.total;
        const zScore = parseFloat(((AppState.aciertos - norm.mean) / norm.sd).toFixed(2));

        const payload = {
            fecha:              new Date().toISOString().split('T')[0],
            hora:               new Date().toTimeString().split(' ')[0],
            identificador:      AppState.patientName,
            edad:               AppState.patientAge,
            sexo:               AppState.patientSex,
            educacion:          AppState.patientEducation,
            condicion:          AppState.patientDiagnosis,
            notas_clinicas:     AppState.patientCondition || null,
            aciertos_total:     AppState.aciertos,
            errores_total:      AppState.errores,
            omisiones_total:    AppState.omisiones,
            pct_global:         Math.round((AppState.aciertos / 36) * 100),
            rt_promedio_s:      avgRt,
            aciertos_alegria:   perEmo['Alegria'],
            aciertos_tristeza:  perEmo['Tristeza'],
            aciertos_enfado:    perEmo['Enfado'],
            aciertos_miedo:     perEmo['Miedo'],
            aciertos_asco:      perEmo['Asco'],
            aciertos_neutral:   perEmo['Neutral'],
            z_score:            zScore,
            version_app:        '2.0',
            pais:               'Colombia'
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/evaluaciones`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'apikey':        SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer':        'return=minimal'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Supabase error:', err);
            return false;
        }

        return true;

    } catch (e) {
        console.error('Error al guardar en Supabase:', e);
        return false;
    }
}

// ============================================================
// Estado de la aplicación
// ============================================================
const AppState = {
    // Datos del paciente / evaluado
    patientName: '',
    patientAge: null,
    patientSex: '',
    patientEducation: '',
    patientDiagnosis: '',   // 'control' | 'paciente'
    patientCondition: '',   // descripción libre opcional

    // Secuencia y progreso
    imageSequence: [],
    currentStep: 0,
    totalImages: 72,
    results: [],

    // Contadores globales
    aciertos: 0,
    errores: 0,
    omisiones: 0,

    // Tiempo de respuesta
    stepStartTime: null,

    // Clave clínica: imagen impar → emoción correcta
    correctAnswers: {
        1:  'Alegria',  3:  'Tristeza', 5:  'Enfado',
        7:  'Miedo',    9:  'Asco',     11: 'Neutral',
        13: 'Neutral',  15: 'Alegria',  17: 'Alegria',
        19: 'Alegria',  21: 'Alegria',  23: 'Alegria',
        25: 'Alegria',  27: 'Tristeza', 29: 'Tristeza',
        31: 'Tristeza', 33: 'Tristeza', 35: 'Tristeza',
        37: 'Enfado',   39: 'Enfado',   41: 'Enfado',
        43: 'Enfado',   45: 'Enfado',   47: 'Miedo',
        49: 'Miedo',    51: 'Miedo',    53: 'Miedo',
        55: 'Miedo',    57: 'Asco',     59: 'Asco',
        61: 'Asco',     63: 'Asco',     65: 'Asco',
        67: 'Neutral',  69: 'Neutral',  71: 'Neutral'
    },

    // Etiquetas de emociones evaluadas
    emotions: ['Alegria', 'Tristeza', 'Enfado', 'Miedo', 'Asco', 'Neutral'],
    emotionLabels: {
        Alegria: 'Alegría', Tristeza: 'Tristeza', Enfado: 'Enfado',
        Miedo: 'Miedo / Sorpresa', Asco: 'Asco', Neutral: 'Inexpresividad'
    },

    // Puntos de corte clínicos de referencia (baremo español, versión corta 36 ítems)
    // Umbral = 1.5 DT por debajo de la media normativa por subgrupo
    // Fuente: Molinero et al. 2015 (adaptado a versión 36 ítems, proporción)
    normativeCutoffs: {
        total: { mean: 29.5, sd: 3.8 },   // Puntuación sobre 36
        Alegria:  { mean: 5.8, sd: 0.5 },
        Tristeza: { mean: 4.6, sd: 1.1 },
        Enfado:   { mean: 4.4, sd: 1.2 },
        Miedo:    { mean: 3.9, sd: 1.4 },
        Asco:     { mean: 4.5, sd: 1.1 },
        Neutral:  { mean: 4.3, sd: 1.2 }
    }
};

// ============================================================
// Referencias DOM
// ============================================================
const elements = {
    // Pantallas
    screenStart:   document.getElementById('screen-start'),
    screenTest:    document.getElementById('screen-test'),
    screenResults: document.getElementById('screen-results'),

    // Formulario de inicio
    patientNameInput:  document.getElementById('patient-name'),
    patientAgeInput:   document.getElementById('patient-age'),
    patientSexSelect:  document.getElementById('patient-sex'),
    patientEduSelect:  document.getElementById('patient-education'),
    patientDiagSelect: document.getElementById('patient-diagnosis'),
    patientCondInput:  document.getElementById('patient-condition'),
    btnStart:          document.getElementById('btn-start'),

    // Test
    displayName:      document.getElementById('display-name'),
    currentImageNum:  document.getElementById('current-image-num'),
    faceCount:        document.getElementById('face-count'),
    progressBar:      document.getElementById('progress-bar'),
    emotionImage:     document.getElementById('emotion-image'),
    imageLoader:      document.getElementById('image-loader'),
    optionsPanel:     document.getElementById('options-panel'),
    reversePanel:     document.getElementById('reverse-panel'),
    btnNextReverse:   document.getElementById('btn-next-from-reverse'),
    emotionButtons:   document.querySelectorAll('.btn-emotion'),

    // Resultados
    resultName:        document.getElementById('result-name'),
    resultAge:         document.getElementById('result-age'),
    resultSex:         document.getElementById('result-sex'),
    resultEducation:   document.getElementById('result-education'),
    resultDiagnosis:   document.getElementById('result-diagnosis'),
    scorePercentage:   document.getElementById('score-percentage'),
    scoreCirclePath:   document.getElementById('score-circle-path'),
    totalAciertos:     document.getElementById('total-aciertos'),
    totalErrores:      document.getElementById('total-errores'),
    totalOmisiones:    document.getElementById('total-omisiones'),
    cutoffAlert:       document.getElementById('cutoff-alert'),
    emotionProfileBody:document.getElementById('emotion-profile-body'),
    avgResponseTime:   document.getElementById('avg-response-time'),
    btnRestart:        document.getElementById('btn-restart'),
    btnDownload:       document.getElementById('btn-download')
};

// ============================================================
// Inicialización
// ============================================================
function init() {
    // Validación dinámica del formulario
    const requiredFields = [
        elements.patientNameInput,
        elements.patientAgeInput,
        elements.patientSexSelect,
        elements.patientEduSelect,
        elements.patientDiagSelect
    ];

    requiredFields.forEach(f => f.addEventListener('change', validateForm));
    requiredFields.forEach(f => f.addEventListener('input', validateForm));

    elements.patientNameInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') validateForm();
    });

    elements.btnStart.addEventListener('click', startTest);
    elements.btnNextReverse.addEventListener('click', () => nextImage());

    elements.emotionButtons.forEach(btn => {
        btn.addEventListener('click', e => {
            handleEmotionSelection(e.target.getAttribute('data-emotion'));
        });
    });

    elements.btnRestart.addEventListener('click', resetApp);
    elements.btnDownload.addEventListener('click', downloadExcel);

    preloadImages([1, 2, 3]);
}

// ============================================================
// Validación del formulario de inicio
// ============================================================
function validateForm() {
    const name    = elements.patientNameInput.value.trim();
    const age     = elements.patientAgeInput.value;
    const sex     = elements.patientSexSelect.value;
    const edu     = elements.patientEduSelect.value;
    const diag    = elements.patientDiagSelect.value;

    const ageNum  = parseInt(age);
    const ageOk   = age !== '' && ageNum >= 5 && ageNum <= 110;

    elements.btnStart.disabled = !(name && ageOk && sex && edu && diag);
}

// ============================================================
// Inicio del test
// ============================================================
function startTest() {
    AppState.patientName      = elements.patientNameInput.value.trim();
    AppState.patientAge       = parseInt(elements.patientAgeInput.value);
    AppState.patientSex       = elements.patientSexSelect.value;
    AppState.patientEducation = elements.patientEduSelect.value;
    AppState.patientDiagnosis = elements.patientDiagSelect.value;
    AppState.patientCondition = elements.patientCondInput.value.trim();

    elements.displayName.textContent = AppState.patientName;

    generateSequence();
    switchScreen(elements.screenStart, elements.screenTest);
    loadImage();
}

// ============================================================
// Generación de secuencia
// ============================================================
function generateSequence() {
    let pairs = [];
    for (let i = 1; i <= 71; i += 2) pairs.push([i, i + 1]);
    for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    AppState.imageSequence = pairs.flat();
    AppState.currentStep = 0;
}

// ============================================================
// Carga y progreso de imágenes
// ============================================================
function preloadImages(indexes) {
    indexes.forEach(i => { const img = new Image(); img.src = `images/${i}.png`; });
}

function updateProgressUI() {
    const n = AppState.currentStep + 1;
    elements.currentImageNum.textContent = n;
    elements.faceCount.textContent = Math.ceil(n / 2);
    elements.progressBar.style.width = `${((n - 1) / AppState.totalImages) * 100}%`;
}

function loadImage() {
    elements.emotionImage.style.display = 'none';
    elements.imageLoader.style.display  = 'block';

    const imageId = AppState.imageSequence[AppState.currentStep];
    const isFace  = imageId % 2 !== 0;

    elements.optionsPanel.classList.toggle('hidden', !isFace);
    elements.reversePanel.classList.toggle('hidden', isFace);

    updateProgressUI();

    elements.emotionImage.onload  = () => {
        elements.imageLoader.style.display = 'none';
        elements.emotionImage.style.display = 'block';
        // Iniciar cronómetro solo para rostros
        if (isFace) AppState.stepStartTime = Date.now();
    };
    elements.emotionImage.onerror = () => {
        elements.imageLoader.style.display = 'none';
        console.error(`No se pudo cargar images/${imageId}.png`);
    };

    elements.emotionImage.src = `images/${imageId}.png`;

    // Precargar siguientes
    const nexts = [];
    if (AppState.currentStep + 1 < AppState.totalImages) nexts.push(AppState.imageSequence[AppState.currentStep + 1]);
    if (AppState.currentStep + 2 < AppState.totalImages) nexts.push(AppState.imageSequence[AppState.currentStep + 2]);
    preloadImages(nexts);
}

// ============================================================
// Manejo de respuesta emocional
// ============================================================
function handleEmotionSelection(selectedEmotion) {
    const imageId = AppState.imageSequence[AppState.currentStep];
    const isFace  = imageId % 2 !== 0;

    if (isFace) {
        const correctEmotion = AppState.correctAnswers[imageId];
        const rt = AppState.stepStartTime ? (Date.now() - AppState.stepStartTime) : null;
        let esAcierto = false;

        if (selectedEmotion === 'Omision') {
            AppState.omisiones++;
        } else if (selectedEmotion === correctEmotion) {
            AppState.aciertos++;
            esAcierto = true;
        } else {
            AppState.errores++;
        }

        AppState.results.push({
            imageNum:  imageId,
            faceNum:   Math.ceil(imageId / 2),
            selected:  selectedEmotion,
            correct:   correctEmotion,
            isHit:     esAcierto,
            rt:        rt  // milisegundos
        });
    }

    nextImage();
}

function nextImage() {
    if (AppState.currentStep < AppState.totalImages - 1) {
        AppState.currentStep++;
        loadImage();
    } else {
        showResults();
    }
}

// ============================================================
// Pantalla de Resultados
// ============================================================
function showResults() {
    switchScreen(elements.screenTest, elements.screenResults);

    // Datos del paciente
    const sexLabel  = { M: 'Masculino', F: 'Femenino', O: 'Otro' };
    const eduLabel  = {
        primaria:       'Primaria',
        secundaria:     'Secundaria/Bachillerato',
        tecnico:        'Técnico/Tecnológico',
        universitario:  'Universitario',
        posgrado:       'Posgrado'
    };
    const diagLabel = { control: 'Control sano', paciente: 'Paciente clínico' };

    elements.resultName.textContent       = AppState.patientName;
    elements.resultAge.textContent        = AppState.patientAge + ' años';
    elements.resultSex.textContent        = sexLabel[AppState.patientSex]  || AppState.patientSex;
    elements.resultEducation.textContent  = eduLabel[AppState.patientEducation] || AppState.patientEducation;
    elements.resultDiagnosis.textContent  = diagLabel[AppState.patientDiagnosis] || AppState.patientDiagnosis;

    // Estadísticas globales
    elements.totalAciertos.textContent  = AppState.aciertos;
    elements.totalErrores.textContent   = AppState.errores;
    elements.totalOmisiones.textContent = AppState.omisiones;

    // Porcentaje global
    const pct = Math.round((AppState.aciertos / 36) * 100);
    elements.scorePercentage.textContent              = `${pct}%`;
    elements.scoreCirclePath.style.strokeDasharray    = `${pct}, 100`;
    elements.scoreCirclePath.classList.remove('stroke-success', 'stroke-warning', 'stroke-danger');
    if      (pct >= 70) elements.scoreCirclePath.classList.add('stroke-success');
    else if (pct >= 40) elements.scoreCirclePath.classList.add('stroke-warning');
    else                elements.scoreCirclePath.classList.add('stroke-danger');

    // Tiempo de respuesta promedio
    const rts = AppState.results.filter(r => r.rt !== null && r.selected !== 'Omision').map(r => r.rt);
    const avgRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length / 1000 * 10) / 10 : null;
    elements.avgResponseTime.textContent = avgRt !== null ? `${avgRt} s` : '—';

    // Perfil por emoción
    buildEmotionProfile();

    // Punto de corte clínico
    buildCutoffAlert(pct);
}

// ============================================================
// Perfil por emoción
// ============================================================
function buildEmotionProfile() {
    const tbody = elements.emotionProfileBody;
    tbody.innerHTML = '';

    AppState.emotions.forEach(emo => {
        // Ítems correctos para esta emoción
        const total    = Object.values(AppState.correctAnswers).filter(v => v === emo).length;
        const hits     = AppState.results.filter(r => r.correct === emo && r.isHit).length;
        const omits    = AppState.results.filter(r => r.correct === emo && r.selected === 'Omision').length;
        const errors   = total - hits - omits;
        const pct      = total ? Math.round((hits / total) * 100) : 0;

        // Errores más frecuentes (confusión)
        const confusions = {};
        AppState.results
            .filter(r => r.correct === emo && !r.isHit && r.selected !== 'Omision')
            .forEach(r => { confusions[r.selected] = (confusions[r.selected] || 0) + 1; });
        const topConfusion = Object.entries(confusions).sort((a, b) => b[1] - a[1])[0];

        // Punto de corte
        const norm   = AppState.normativeCutoffs[emo];
        const cutoff = Math.round(norm.mean - 1.5 * norm.sd);
        const below  = hits < cutoff;

        const tr = document.createElement('tr');
        tr.classList.toggle('below-cutoff', below);
        tr.innerHTML = `
            <td><span class="emo-badge emo-${emo.toLowerCase()}">${AppState.emotionLabels[emo]}</span></td>
            <td class="text-center">${hits} / ${total}</td>
            <td class="text-center">${errors}</td>
            <td class="text-center">${omits}</td>
            <td class="text-center">
                <div class="mini-bar-wrap">
                    <div class="mini-bar" style="width:${pct}%;background:${pct>=70?'var(--success)':pct>=40?'var(--warning)':'var(--danger)'}"></div>
                    <span>${pct}%</span>
                </div>
            </td>
            <td class="text-center cutoff-col ${below ? 'text-danger' : 'text-success'}">
                ${below ? '⚠ Por debajo' : '✓ Normal'}
                <small>(≥${cutoff})</small>
            </td>
            <td class="text-center confusion-col">${topConfusion ? `${AppState.emotionLabels[topConfusion[0]] || topConfusion[0]} (${topConfusion[1]}×)` : '—'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================================
// Alerta de punto de corte global
// ============================================================
function buildCutoffAlert(pct) {
    const norm      = AppState.normativeCutoffs.total;
    const rawScore  = AppState.aciertos;
    const cutoff    = Math.round(norm.mean - 1.5 * norm.sd);
    const zScore    = ((rawScore - norm.mean) / norm.sd).toFixed(2);
    const alert     = elements.cutoffAlert;

    if (rawScore < cutoff) {
        alert.className  = 'cutoff-alert cutoff-alert--danger';
        alert.innerHTML  = `
            <strong>⚠ Rendimiento por debajo del punto de corte clínico</strong><br>
            Puntuación: ${rawScore}/36 — Umbral: ≥${cutoff} (media − 1.5 DT) — z = ${zScore}<br>
            <small>Referencia normativa provisional (baremo español, adaptado). Se recomienda evaluación complementaria.</small>
        `;
    } else {
        alert.className  = 'cutoff-alert cutoff-alert--ok';
        alert.innerHTML  = `
            <strong>✓ Rendimiento dentro del rango normativo</strong><br>
            Puntuación: ${rawScore}/36 — Umbral: ≥${cutoff} (media − 1.5 DT) — z = ${zScore}<br>
            <small>Referencia normativa provisional (baremo español, adaptado).</small>
        `;
    }
}

// ============================================================
// Exportación Excel enriquecida
// ============================================================
async function downloadExcel() {
    if (typeof XLSX === 'undefined') {
        alert("La librería de descarga no se ha cargado. Intenta recargar la página.");
        return;
    }

    // Guardar en Supabase en paralelo (silencioso, no bloquea la descarga)
    saveToSupabase().then(ok => {
        if (ok) console.log('✓ Datos guardados en Supabase');
        else    console.warn('⚠ No se pudieron guardar en Supabase');
    });

    const wb = XLSX.utils.book_new();

    // ── Hoja 1: Datos del evaluado ──────────────────────────
    const sexLabel  = { M: 'Masculino', F: 'Femenino', O: 'Otro' };
    const eduLabel  = {
        primaria: 'Primaria', secundaria: 'Secundaria/Bachillerato',
        tecnico: 'Técnico/Tecnológico', universitario: 'Universitario', posgrado: 'Posgrado'
    };
    const diagLabel = { control: 'Control sano', paciente: 'Paciente clínico' };

    const infoData = [
        ['DATOS DEL EVALUADO'],
        [],
        ['Identificador',      AppState.patientName],
        ['Edad',               AppState.patientAge],
        ['Sexo',               sexLabel[AppState.patientSex] || AppState.patientSex],
        ['Nivel Educativo',    eduLabel[AppState.patientEducation] || AppState.patientEducation],
        ['Condición',         diagLabel[AppState.patientDiagnosis] || AppState.patientDiagnosis],
        ['Notas Clínicas',     AppState.patientCondition || '—'],
        [],
        ['Fecha de Aplicación', new Date().toLocaleDateString('es-CO')],
        ['Hora de Aplicación',  new Date().toLocaleTimeString('es-CO')],
        [],
        ['RESULTADOS GLOBALES'],
        [],
        ['Aciertos Totales',   AppState.aciertos],
        ['Errores Totales',    AppState.errores],
        ['Omisiones',          AppState.omisiones],
        ['Precisión Global',   `${Math.round((AppState.aciertos / 36) * 100)}%`],
        [],
        ['PUNTO DE CORTE (Referencia Provisional — Baremo Español, adaptado 36 ítems)'],
        ['Media Normativa',    AppState.normativeCutoffs.total.mean],
        ['Desv. Estándar',     AppState.normativeCutoffs.total.sd],
        ['Umbral (M − 1.5DT)', Math.round(AppState.normativeCutoffs.total.mean - 1.5 * AppState.normativeCutoffs.total.sd)],
        ['z-score',            ((AppState.aciertos - AppState.normativeCutoffs.total.mean) / AppState.normativeCutoffs.total.sd).toFixed(2)],
        ['Interpretación',     AppState.aciertos >= Math.round(AppState.normativeCutoffs.total.mean - 1.5 * AppState.normativeCutoffs.total.sd) ? 'Rendimiento normal' : 'Por debajo del punto de corte'],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(infoData);
    ws1['!cols'] = [{ wch: 28 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Datos Evaluado');

    // ── Hoja 2: Perfil por emoción ───────────────────────────
    const profileData = [
        ['PERFIL POR EMOCIÓN'],
        [],
        ['Emoción', 'Aciertos', 'Errores', 'Omisiones', 'Total Ítems', '% Acierto', 'Umbral Clínico', 'Estado', 'Principal Confusión']
    ];
    AppState.emotions.forEach(emo => {
        const total   = Object.values(AppState.correctAnswers).filter(v => v === emo).length;
        const hits    = AppState.results.filter(r => r.correct === emo && r.isHit).length;
        const omits   = AppState.results.filter(r => r.correct === emo && r.selected === 'Omision').length;
        const errors  = total - hits - omits;
        const pct     = total ? Math.round((hits / total) * 100) : 0;
        const norm    = AppState.normativeCutoffs[emo];
        const cutoff  = Math.round(norm.mean - 1.5 * norm.sd);

        const confusions = {};
        AppState.results
            .filter(r => r.correct === emo && !r.isHit && r.selected !== 'Omision')
            .forEach(r => { confusions[r.selected] = (confusions[r.selected] || 0) + 1; });
        const topC = Object.entries(confusions).sort((a, b) => b[1] - a[1])[0];

        profileData.push([
            AppState.emotionLabels[emo],
            hits, errors, omits, total,
            `${pct}%`,
            `≥${cutoff}`,
            hits >= cutoff ? 'Normal' : 'Por debajo del corte',
            topC ? `${AppState.emotionLabels[topC[0]] || topC[0]} (${topC[1]}x)` : '—'
        ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(profileData);
    ws2['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Perfil Emocional');

    // ── Hoja 3: Respuestas ítem a ítem ───────────────────────
    const itemData = [
        ['RESPUESTAS ÍTEM A ÍTEM'],
        [],
        ['#Rostro', 'ID Imagen', 'Emoción Correcta', 'Respuesta Dada', 'Acierto', 'Tiempo Respuesta (s)']
    ];
    AppState.results.forEach((row, idx) => {
        const rtSec = row.rt !== null ? (row.rt / 1000).toFixed(2) : '—';
        const aciertoStr = row.selected === 'Omision' ? 'Omisión' : (row.isHit ? 'Sí' : 'No');
        itemData.push([
            row.faceNum,
            row.imageNum,
            AppState.emotionLabels[row.correct] || row.correct,
            AppState.emotionLabels[row.selected] || row.selected,
            aciertoStr,
            rtSec
        ]);
    });

    // Tiempo promedio
    const rts   = AppState.results.filter(r => r.rt !== null && r.selected !== 'Omision').map(r => r.rt / 1000);
    const avgRt = rts.length ? (rts.reduce((a, b) => a + b, 0) / rts.length).toFixed(2) : '—';
    itemData.push([]);
    itemData.push(['Tiempo Promedio de Respuesta:', `${avgRt} s`]);

    const ws3 = XLSX.utils.aoa_to_sheet(itemData);
    ws3['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Respuestas Detalladas');

    // ── Hoja 4: Datos crudos para baremo ─────────────────────
    const rawData = [
        ['DATOS PARA BAREMACIÓN — NO COMPARTIR'],
        ['Nota: Esta hoja es para recolección normativa. Excluir del reporte al paciente.'],
        [],
        ['ID_Sesion', 'Fecha', 'Edad', 'Sexo', 'Educacion', 'Condicion',
         'Total_Aciertos', 'Pct_Global',
         'Alegria', 'Tristeza', 'Enfado', 'Miedo', 'Asco', 'Neutral',
         'RT_Promedio_s']
    ];

    const perEmo = {};
    AppState.emotions.forEach(emo => {
        perEmo[emo] = AppState.results.filter(r => r.correct === emo && r.isHit).length;
    });

    rawData.push([
        AppState.patientName,
        new Date().toISOString().split('T')[0],
        AppState.patientAge,
        AppState.patientSex,
        AppState.patientEducation,
        AppState.patientDiagnosis,
        AppState.aciertos,
        Math.round((AppState.aciertos / 36) * 100),
        perEmo['Alegria'], perEmo['Tristeza'], perEmo['Enfado'],
        perEmo['Miedo'], perEmo['Asco'], perEmo['Neutral'],
        avgRt
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet(rawData);
    ws4['!cols'] = Array(16).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(wb, ws4, 'Datos Baremo');

    // Generar descarga
    const dateStr  = new Date().toISOString().split('T')[0];
    const safeName = AppState.patientName.replace(/[^a-z0-9]/gi, '_');
    XLSX.writeFile(wb, `REF_Emociones_${safeName}_${dateStr}.ods`);
}

// ============================================================
// Reset
// ============================================================
function resetApp() {
    Object.assign(AppState, {
        patientName: '', patientAge: null, patientSex: '',
        patientEducation: '', patientDiagnosis: '', patientCondition: '',
        currentStep: 0, imageSequence: [], results: [],
        aciertos: 0, errores: 0, omisiones: 0, stepStartTime: null
    });

    elements.patientNameInput.value  = '';
    elements.patientAgeInput.value   = '';
    elements.patientSexSelect.value  = '';
    elements.patientEduSelect.value  = '';
    elements.patientDiagSelect.value = '';
    elements.patientCondInput.value  = '';
    elements.btnStart.disabled       = true;
    elements.progressBar.style.width = '0%';
    elements.scoreCirclePath.style.strokeDasharray = '0, 100';

    switchScreen(elements.screenResults, elements.screenStart);
}

// ============================================================
// Utilidades
// ============================================================
function switchScreen(from, to) {
    from.classList.remove('active');
    from.classList.add('hidden');
    to.classList.remove('hidden');
    setTimeout(() => to.classList.add('active'), 10);
}

document.addEventListener('DOMContentLoaded', init);
