// Estado de la aplicación
const AppState = {
    patientName: '',
    imageSequence: [],
    currentStep: 0,
    totalImages: 72,
    results: [],
    
    // Contadores
    aciertos: 0,
    errores: 0,
    omisiones: 0,

    // Diccionario de Respuestas Correctas
    // Basado en el análisis visual de las 36 cartas (solo números impares tienen caras)
    correctAnswers: {
        1:  'Alegria', // F1
        3:  'Tristeza', // F2
        5:  'Enfado', // F3
        7:  'Miedo', // F4 (Miedo/Sorpresa)
        9:  'Asco', // F5
        11: 'Neutral', // F6
        13: 'Neutral', // F7
        15: 'Alegria', // F8 
        17: 'Alegria', // T1
        19: 'Alegria', // T2
        21: 'Alegria', // T3
        23: 'Alegria', // T4
        25: 'Alegria', // T5
        27: 'Tristeza', // T6
        29: 'Tristeza', // T7
        31: 'Tristeza', // T8
        33: 'Tristeza', // T9
        35: 'Tristeza', // T10
        37: 'Enfado', // T11
        39: 'Enfado', // T12
        41: 'Enfado', // T13
        43: 'Enfado', // T14
        45: 'Enfado', // T15
        47: 'Miedo', // T16
        49: 'Miedo', // T17
        51: 'Miedo', // T18
        53: 'Miedo', // T19
        55: 'Miedo', // T20
        57: 'Asco', // T21
        59: 'Asco', // T22
        61: 'Asco', // T23
        63: 'Asco', // T24
        65: 'Asco', // T25
        67: 'Neutral', // T26
        69: 'Neutral', // T27
        71: 'Neutral'  // T28
    }
};

// Elementos del DOM
const elements = {
    // Pantallas
    screenStart: document.getElementById('screen-start'),
    screenTest: document.getElementById('screen-test'),
    screenResults: document.getElementById('screen-results'),

    // Input
    patientNameInput: document.getElementById('patient-name'),
    btnStart: document.getElementById('btn-start'),

    // Test UI
    displayName: document.getElementById('display-name'),
    currentImageNum: document.getElementById('current-image-num'),
    faceCount: document.getElementById('face-count'),
    progressBar: document.getElementById('progress-bar'),
    emotionImage: document.getElementById('emotion-image'),
    imageLoader: document.getElementById('image-loader'),
    
    optionsPanel: document.getElementById('options-panel'),
    reversePanel: document.getElementById('reverse-panel'),
    btnNextReverse: document.getElementById('btn-next-from-reverse'),
    emotionButtons: document.querySelectorAll('.btn-emotion'),

    // Resultados
    resultName: document.getElementById('result-name'),
    scorePercentage: document.getElementById('score-percentage'),
    scoreCirclePath: document.getElementById('score-circle-path'),
    totalAciertos: document.getElementById('total-aciertos'),
    totalErrores: document.getElementById('total-errores'),
    totalOmisiones: document.getElementById('total-omisiones'),
    btnRestart: document.getElementById('btn-restart'),
    btnDownload: document.getElementById('btn-download')
};

// Inicialización
function init() {
    // Event Listeners
    elements.patientNameInput.addEventListener('input', handleNameInput);
    elements.patientNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && elements.patientNameInput.value.trim() !== '') {
            startTest();
        }
    });
    
    elements.btnStart.addEventListener('click', startTest);
    elements.btnNextReverse.addEventListener('click', () => nextImage());
    
    elements.emotionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const emotion = e.target.getAttribute('data-emotion');
            handleEmotionSelection(emotion);
        });
    });

    elements.btnRestart.addEventListener('click', resetApp);
    elements.btnDownload.addEventListener('click', downloadExcel);

    // Precargar las primeras imágenes para evitar parpadeos
    preloadImages([1, 2, 3]);
}

// Pantalla 1: Inicio
function handleNameInput(e) {
    const value = e.target.value.trim();
    elements.btnStart.disabled = value.length === 0;
}

function startTest() {
    AppState.patientName = elements.patientNameInput.value.trim();
    elements.displayName.textContent = AppState.patientName;
    
    generateSequence();
    
    switchScreen(elements.screenStart, elements.screenTest);
    loadImage();
}

// Generar secuencia aleatoria de pares
function generateSequence() {
    let pairs = [];
    for (let i = 1; i <= 71; i += 2) {
        pairs.push([i, i + 1]);
    }
    // Shuffle o Barajar pares (Fisher-Yates)
    for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    // Aplanar arreglo
    AppState.imageSequence = pairs.flat();
    AppState.currentStep = 0;
}

// Pantalla 2: Test
function preloadImages(imageIndexes) {
    imageIndexes.forEach(index => {
        const img = new Image();
        img.src = `images/${index}.png`;
    });
}

function updateProgressUI() {
    const currentNumber = AppState.currentStep + 1; // 1 a 72
    elements.currentImageNum.textContent = currentNumber;
    
    const faceNumber = Math.ceil(currentNumber / 2);
    elements.faceCount.textContent = faceNumber;
    
    const progressPercent = ((currentNumber - 1) / AppState.totalImages) * 100;
    elements.progressBar.style.width = `${progressPercent}%`;
}

function loadImage() {
    // UI Loading state
    elements.emotionImage.style.display = 'none';
    elements.imageLoader.style.display = 'block';
    
    const imageId = AppState.imageSequence[AppState.currentStep];
    const isFace = imageId % 2 !== 0; // Impares son rostros
    
    if (isFace) {
        elements.optionsPanel.classList.remove('hidden');
        elements.reversePanel.classList.add('hidden');
    } else {
        elements.optionsPanel.classList.add('hidden');
        elements.reversePanel.classList.remove('hidden');
    }

    updateProgressUI();

    // Cargar imagen
    elements.emotionImage.onload = () => {
        elements.imageLoader.style.display = 'none';
        elements.emotionImage.style.display = 'block';
    };
    
    // Fallback de manejo de error local
    elements.emotionImage.onerror = () => {
        console.error(`No se pudo cargar la imagen images/${imageId}.png`);
        elements.imageLoader.style.display = 'none';
    };
    
    elements.emotionImage.src = `images/${imageId}.png`;
    
    // Precargar las siguientes 2 imágenes de la secuencia
    let nextImages = [];
    if (AppState.currentStep + 1 < AppState.totalImages) nextImages.push(AppState.imageSequence[AppState.currentStep + 1]);
    if (AppState.currentStep + 2 < AppState.totalImages) nextImages.push(AppState.imageSequence[AppState.currentStep + 2]);
    preloadImages(nextImages);
}

function handleEmotionSelection(selectedEmotion) {
    const imageId = AppState.imageSequence[AppState.currentStep];
    const isFace = imageId % 2 !== 0;
    
    if (isFace) {
        let esAcierto = false;
        const correctEmotion = AppState.correctAnswers[imageId];
        
        if (selectedEmotion === 'Omision') {
            AppState.omisiones++;
        } else if (selectedEmotion === correctEmotion) {
            AppState.aciertos++;
            esAcierto = true;
        } else {
            AppState.errores++;
        }

        AppState.results.push({
            imageNum: imageId,
            faceNum: Math.ceil(imageId / 2),
            selected: selectedEmotion,
            correct: correctEmotion,
            isHit: esAcierto
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

// Pantalla 3: Resultados
function showResults() {
    switchScreen(elements.screenTest, elements.screenResults);
    
    elements.resultName.textContent = AppState.patientName;
    elements.totalAciertos.textContent = AppState.aciertos;
    elements.totalErrores.textContent = AppState.errores;
    elements.totalOmisiones.textContent = AppState.omisiones;

    // Calcular Porcentaje (sobre el total de imágenes evaluadas: 36 caras)
    const totalFaces = 36;
    const answered = AppState.aciertos + AppState.errores; // excluye omisiones
    let percentage = 0;
    
    if (totalFaces > 0) {
        percentage = Math.round((AppState.aciertos / totalFaces) * 100);
    }

    elements.scorePercentage.textContent = `${percentage}%`;
    elements.scoreCirclePath.style.strokeDasharray = `${percentage}, 100`;

    // Cambiar color del círculo según precisión
    elements.scoreCirclePath.classList.remove('stroke-success', 'stroke-warning', 'stroke-danger');
    if (percentage >= 70) {
        elements.scoreCirclePath.classList.add('stroke-success');
    } else if (percentage >= 40) {
        elements.scoreCirclePath.classList.add('stroke-warning');
    } else {
        elements.scoreCirclePath.classList.add('stroke-danger');
    }
}

function downloadExcel() {
    if (typeof XLSX === 'undefined') {
        alert("La librería de descarga no se ha cargado correctamente. Intenta recargar la página.");
        return;
    }

    const data = [];
    // Cabeceras
    data.push(["Paciente", "ID Imagen Mostrada", "ID Rostro Original", "Emoción Escogida", "Emoción Correcta", "Acierto"]);
    
    AppState.results.forEach(row => {
        let aciertoStr = row.selected === 'Omision' ? "Omisión" : (row.isHit ? "Sí" : "No");
        data.push([AppState.patientName, row.imageNum, row.faceNum, row.selected, row.correct, aciertoStr]);
    });

    // Agregar filas vacías para separación
    data.push([]);
    
    // Resumen
    data.push(["", "", "", "Totales:", "", ""]);
    data.push(["", "", "", "Aciertos:", AppState.aciertos, ""]);
    data.push(["", "", "", "Errores:", AppState.errores, ""]);
    data.push(["", "", "", "Omisiones:", AppState.omisiones, ""]);
    
    // Crear hoja y libro
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    
    // Generar archivo
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Resultados_Emociones_${AppState.patientName.replace(/ /g, '_')}_${dateStr}.ods`;
    
    XLSX.writeFile(wb, fileName);
}

function resetApp() {
    // Resetear estado
    AppState.patientName = '';
    AppState.currentStep = 0;
    AppState.imageSequence = [];
    AppState.results = [];
    AppState.aciertos = 0;
    AppState.errores = 0;
    AppState.omisiones = 0;

    // Resetear UI
    elements.patientNameInput.value = '';
    elements.btnStart.disabled = true;
    elements.progressBar.style.width = '0%';
    elements.scoreCirclePath.style.strokeDasharray = '0, 100';
    
    switchScreen(elements.screenResults, elements.screenStart);
}

// Utilidades
function switchScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('active');
    fromScreen.classList.add('hidden');
    
    toScreen.classList.remove('hidden');
    // Pequeño timeout para permitir que el display:block asiente antes de la animación
    setTimeout(() => {
        toScreen.classList.add('active');
    }, 10);
}

// Arrancar App
document.addEventListener('DOMContentLoaded', init);
