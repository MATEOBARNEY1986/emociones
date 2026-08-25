# 😊 Test de Reconocimiento de Emociones Faciales

![License: MIT](https://img.shields.io/badge/code-MIT-green.svg)
![No dependencies](https://img.shields.io/badge/deps-minimal-brightgreen.svg)
![Privacy](https://img.shields.io/badge/data-local--only-blue.svg)

> **A browser-based facial-emotion-recognition test** for screening emotional intelligence.
> Illustrated faces are shown one by one (interleaved with control cards); the user picks
> the emotion, and the app scores answers against a clinical key and exports a report.
> Runs **entirely in the browser** — no patient data leaves the device.

Aplicación web para evaluar el **reconocimiento de emociones faciales**. Los rostros
(ilustraciones propias, no personas reales) se presentan de forma aleatoria intercalados
con cartas de control; el usuario elige la emoción y la app califica contra una clave
clínica (Alegría, Tristeza, Enfado, Miedo/Sorpresa, Asco, Inexpresividad) y exporta un
reporte.

> ⚠️ **Herramienta educativa / de apoyo**, no un instrumento diagnóstico validado. Úsese
> bajo criterio profesional.

## ✨ Características

- **Flujo interactivo** — rostros aleatorios intercalados con reversos de control
- **Calificación automática** contra una clave clínica de 6 emociones
- **Exportación** de resultados a `.ods` (SheetJS)
- **Privacidad** — toda la evaluación corre localmente en el navegador; **no** se envían datos
- **Arte propio** — rostros ilustrados generados con IA (no fotografías de personas reales)

## 🚀 Uso

La app está en la carpeta [`emociones/`](emociones/):

```bash
cd emociones
python3 -m http.server 8000   # http://localhost:8000
# o abrir emociones/index.html directamente
```

1. Ingresa el identificador del paciente.
2. Selecciona la emoción para cada rostro.
3. Al terminar, descarga el reporte de la sesión.

## 🧩 Tecnologías

HTML5 · CSS3 · JavaScript vanilla · [SheetJS](https://sheetjs.com/) para exportar `.ods`.

## 📄 Licencia

- **Código**: [MIT](LICENSE).
- **Arte** (rostros ilustrados en `emociones/images/`): creado por el autor con IA; libre para uso educativo, atribución apreciada.

## 👤 Autor

[@MATEOBARNEY1986](https://github.com/MATEOBARNEY1986).
