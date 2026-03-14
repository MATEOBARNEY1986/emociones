# Test de Reconocimiento de Emociones Facial

Una aplicación web interactiva diseñada para evaluar la inteligencia emocional mediante el reconocimiento de emociones faciales. 

## Características
- **Flujo interactivo:** Presentación secuencial y aleatoria de rostros intercalados con cartas de control (reversos).
- **Calificación automática:** Evalúa las respuestas del paciente comparándolas con una clave clínica de emociones predefinidas (Alegría, Tristeza, Enfado, Miedo/Sorpresa, Asco, Inexpresividad).
- **Exportación de Resultados:** Genera y descarga un reporte detallado en formato Excel (.ods) con cada prueba.
- **Privacidad:** Toda la evaluación y generación de resultados se ejecuta localmente en el navegador, garantizando la confidencialidad de los datos del paciente.

## Cómo usar
1. Abre el archivo `index.html` en cualquier navegador moderno.
2. Ingresa el Identificador del Paciente.
3. Inicia la evaluación y selecciona la emoción correspondiente para cada rostro.
4. Al finalizar la secuencia, descarga el reporte de la sesión.

## Tecnologías
- HTML5, CSS3, JavaScript Vanilla
- SheetJS para la exportación de archivos `.ods`.
