# CoffeeHouse

Aplicación de cafetería con Angular, Express, MySQL y un chatbot local con Ollama.

## Requisitos

- Node.js y npm
- MySQL
- Ollama y el modelo `gemma3:latest` (para habilitar el chatbot)

## Preparar MySQL

Desde la raíz del proyecto, importa la estructura vacía:

```powershell
cmd /c "mysql -u root -p < database\schema.sql"
```

La importación crea la base `coffeehouse_db` y las tablas `inicio`, `productos`, `usuarios` y `contactos`. No contiene datos personales ni registros de usuarios/contactos.

## Configurar y ejecutar el backend

```powershell
Copy-Item backend/.env.example backend/.env
```

Edita `backend/.env` con el usuario y contraseña de MySQL de tu equipo. Luego:

```powershell
cd backend
npm ci
node scripts/seedCatalog.js
node app.js
```

El script agrega los siete productos del catálogo que falten y crea la tabla de contactos si no existe. Puedes ejecutarlo más de una vez sin duplicar esos productos.

El backend queda disponible en `http://localhost:3000`. Las rutas del menú son `GET /api/productos` y `GET /api/cafeteria`.

## Ejecutar el frontend

En otra terminal, desde la raíz del proyecto:

```powershell
cd frontend
npm ci
npm start
```

Abre `http://localhost:4200`.

## Ollama

El chatbot usa el endpoint local `http://localhost:11434/api/generate` y el modelo configurado por `OLLAMA_MODEL` en `backend/.env`. Descarga el modelo antes de usarlo:

```powershell
ollama pull gemma3:latest
```

## Pruebas y compilación del frontend

```powershell
cd frontend
npm test -- --watch=false
npm run build
```
