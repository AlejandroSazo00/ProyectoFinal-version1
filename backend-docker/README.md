# 🐳 MiRutinaVisual Backend Docker

Backend con OAuth2.0 para la aplicación MiRutinaVisual - Aplicación de apoyo para personas con autismo.

## 🎯 Características

- ✅ **OAuth2.0** con Google (implementado)
- ✅ **MongoDB Atlas** (base de datos en la nube)
- ✅ **Docker** containerizado
- ✅ **Swagger UI** documentación completa
- ✅ **CI/CD Pipeline** con GitHub Actions
- ✅ **Pruebas de seguridad** automatizadas

## 🚀 CI/CD Pipeline

### 📋 Flujo Automático:
1. **🧪 Tests** → Linting y pruebas unitarias
2. **🐳 Build** → Construcción de imagen Docker
3. **🔒 Security** → Escaneo de vulnerabilidades
4. **🚀 Deploy** → Despliegue automático

### 🌟 Badges de Estado:
![CI/CD](https://github.com/AlejandroSazo00/MiRutinaVisual/workflows/CI%2FCD%20Pipeline%20-%20MiRutinaVisual%20Backend/badge.svg)

## 📊 Endpoints API

- **🔐 OAuth2.0:** `/oauth/google`
- **👤 Usuarios:** `/api/users` (admin)
- **📚 Documentación:** `/api-docs`
- **❤️ Health:** `/health`
- ✅ **API RESTful**
- ✅ **Middleware de seguridad**
- ✅ **Compatible con Android**

## 🛠️ Instalación Local

### Prerrequisitos
- Docker y Docker Compose instalados
- Node.js 18+ (opcional, para desarrollo)

### 1. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales de Google
```

### 2. Ejecutar con Docker
```bash
# Construir y ejecutar
docker-compose up --build

# En segundo plano
docker-compose up -d --build
```

### 3. Verificar funcionamiento
```bash
# Salud del servidor
curl http://localhost:3000/health

# Información de la API
curl http://localhost:3000/
```

## 📱 Endpoints Principales

### Autenticación
- `GET /auth/google` - Iniciar OAuth con Google
- `POST /auth/login` - Login directo (testing)
- `POST /auth/verify` - Verificar JWT token
- `POST /auth/logout` - Cerrar sesión

### API Protegida
- `GET /api/user` - Información del usuario (requiere token)
- `GET /api/app-data` - Datos de la aplicación
- `POST /api/log` - Registrar logs desde Android

### Utilidades
- `GET /health` - Estado del servidor
- `GET /` - Información de la API

## 🔐 Configuración OAuth2.0

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto o seleccionar existente
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Configurar URLs autorizadas:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/google/callback`

## 📱 Integración con Android

El backend está configurado para recibir conexiones desde:
- Emulador Android: `http://10.0.2.2:3000`
- Dispositivo real: `http://192.168.1.X:3000`

## 🐳 Comandos Docker

```bash
# Construir imagen
docker build -t mirutinavisual-backend .

# Ejecutar contenedor
docker run -p 3000:3000 mirutinavisual-backend

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down
```

## 🔧 Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## 📊 Estructura del Proyecto

```
backend-docker/
├── config/
│   └── passport.js      # Configuración OAuth2.0
├── routes/
│   ├── auth.js         # Rutas de autenticación
│   └── api.js          # Rutas de API
├── middleware/
│   └── auth.js         # Middleware de autenticación
├── Dockerfile          # Configuración Docker
├── docker-compose.yml  # Orquestación Docker
├── package.json        # Dependencias Node.js
└── server.js          # Servidor principal
```

## 🛡️ Seguridad

- Helmet.js para headers de seguridad
- CORS configurado para Android
- JWT con expiración de 24h
- Usuario no-root en Docker
- Variables de entorno para secretos

## 📝 Logs

Los logs se muestran en la consola y incluyen:
- Requests HTTP (Morgan)
- Autenticación OAuth
- Errores del servidor
- Logs desde Android app

## 🚀 Despliegue

Para desplegar en producción:
1. Configurar variables de entorno de producción
2. Usar HTTPS para OAuth callbacks
3. Configurar dominio real en Google OAuth
4. Usar secretos seguros para JWT

## 👨‍💻 Autor

**AlejandroSazo00** - Proyecto Final MiRutinaVisual
