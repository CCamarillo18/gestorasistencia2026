# Estructura de Build
- Prohibido generar la carpeta `dist/client`. 
- El build de Vite debe configurarse para que `index.html` y los assets queden directamente en la raíz de la carpeta `dist`.
- El archivo `_redirects` debe estar siempre en la raíz de `dist` con el contenido: `/* /index.html 200`.