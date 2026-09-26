# Trazzo Whiteboard 🎨

**Trazzo Whiteboard** es una pizarra virtual de dibujo vectorial, diagramación en línea y bocetos a mano alzada moderna, ultrarrápida, 100% privada y construida desde cero con **Next.js**, **TypeScript**, **Tailwind CSS**, **Rough.js** y **Perfect Freehand**. Diseñada para crear diagramas de flujo, diagramas de arquitectura de software, wireframes y bocetos sin registro.

---

## ✨ Características Principales

- **Sin Registro / Sin Login**: Acceso instantáneo. Toda la información permanece en tu navegador de forma privada.
- **Múltiples Pizarras**:
  - Crea tantas pizarras como necesites.
  - Cambia entre pizarras al instante.
  - Renombra, duplica y elimina tableros con un solo clic.
  - Persistencia automática en `localStorage` (Offline-first).
- **Herramientas de Dibujo**:
  - 🖱️ **Selección & Mover**: Arrastra elementos o selección múltiple con recuadro (marquee).
  - 📐 **Redimensionamiento interactivo**: 8 tiradores de ajuste para escalar cualquier figura.
  - ✋ **Mano / Desplazamiento**: Mueve el lienzo con la herramienta de mano o manteniendo la barra espaciadora.
  - ✏️ **Lápiz a mano alzada**: Trazos orgánicos y fluidos con grosor dinámico mediante `perfect-freehand`.
  - ⬜ **Rectángulo**: Figuras con estilo boceto a mano alzada o líneas limpias.
  - 🔶 **Rombo**: Ideal para diagramas de flujo y esquemas.
  - ⭕ **Círculo / Elipse**: Formas curvas orgánicas.
  - ➡️ **Flecha**: Conector direccional para diagramas y notas.
  - ➖ **Línea**: Conexiones rectas.
  - 🔤 **Texto libre**: Edición directa en el lienzo con tipografía manuscrita legible.
  - 🧹 **Borrador**: Elimina cualquier trazo con solo pasar por encima o hacer clic.
- **Personalización Completa**:
  - Paleta de colores para trazo y relleno.
  - Rellenos: Sin relleno, Sólido, Rayado (*Hachure*) y Cruzado (*Cross-hatch*).
  - Grosor de trazo (1px, 2px, 4px, 6px).
  - Estilo de línea (Continua, Discontinua, Punteada).
  - Estilo a mano: Limpio, Boceto, Artístico.
  - Control de opacidad y capas (Traer al frente, Enviar al fondo).
- **Lienzo Infinito**:
  - Zoom interactivo con rueda del ratón (`Ctrl + Rueda`) o controles flotantes (+, -, 100%).
  - Paneo suave en cualquier dirección.
  - Cuadrícula de puntos sutil activable/desactivable.
  - Modo Oscuro y Modo Claro.
  - Deshacer (`Ctrl+Z`) y Rehacer (`Ctrl+Y`).
- **Exportación e Importación**:
  - 🖼️ **Exportar a PNG**: Guarda tu pizarra como imagen con fondo blanco, oscuro o transparente, con resolución de alta definición (2x).
  - 💾 **Exportar a `.trazzo`**: Formato de archivo nativo y portable en JSON para guardar y compartir tus dibujos. Permite exportar la pizarra actual o todas las pizarras juntas.
  - 📂 **Importar `.trazzo`**: Carga cualquier archivo `.trazzo` para continuar editando tus figuras en cualquier momento.

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+ o superior.

### Instalación
```bash
npm install
```

### Modo Desarrollo
```bash
npm run dev
```
Abre en tu navegador [http://localhost:3000](http://localhost:3000).

### Compilar para Producción
```bash
npm run build
npm run start
```

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
|---|---|
| `V` ó `1` | Herramienta de Selección |
| `H` ó `2` | Herramienta de Mano (Paneo) |
| `R` ó `3` | Rectángulo |
| `D` ó `4` | Rombo |
| `O` ó `5` | Círculo / Elipse |
| `A` ó `6` | Flecha |
| `L` ó `7` | Línea |
| `P` ó `8` | Lápiz a mano alzada |
| `T` ó `9` | Texto |
| `E` ó `0` | Borrador |
| `Espacio + Arrastrar` | Desplazar el lienzo |
| `Ctrl + Rueda` | Acercar / Alejar Zoom |
| `Ctrl + Z` | Deshacer |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Rehacer |
| `Ctrl + C` | Copiar selección |
| `Ctrl + V` | Pegar elementos |
| `Ctrl + X` | Cortar selección |
| `Supr` / `Backspace` | Eliminar elementos seleccionados |
| `Ctrl + D` | Duplicar elementos seleccionados |
| `Ctrl + A` | Seleccionar todos los elementos |
| `Arrastrar archivo` | Importar archivo `.trazzo` soltándolo en el lienzo |
| `Escape` | Deseleccionar / Cancelar herramienta |
