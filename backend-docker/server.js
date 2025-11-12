const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { connectDB, checkConnection } = require('./config/database');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const oauthRoutes = require('./routes/oauth');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MiRutinaVisual API',
            version: '1.0.0',
            description: 'Backend Docker con OAuth2.0 para aplicación de apoyo a personas con autismo',
            contact: {
                name: 'AlejandroSazo00',
                email: 'alejandro@mirutinavisual.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'https://mirutinavisual-backend-route-https-msazol1-dev.apps.rm2.thpm.p1.openshiftapps.com',
                description: 'Servidor de producción OpenShift'
            },
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desarrollo local'
            },
            {
                url: 'http://10.0.2.2:3000',
                description: 'Servidor para emulador Android'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingrese SOLO el token JWT (sin "Bearer")'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware de seguridad
app.use(helmet());
app.use(morgan('combined'));

// Rate limiting para prevenir ataques de fuerza bruta
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: {
        error: 'Demasiadas solicitudes desde esta IP',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);

// Configurar sesiones para OAuth2.0
app.use(session({
    secret: process.env.SESSION_SECRET || 'mirutinavisual-session-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Inicializar Passport OAuth2.0
app.use(passport.initialize());
app.use(passport.session());

// CORS - ARREGLO DEFINITIVO PARA SWAGGER
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (como Swagger UI)
        if (!origin) return callback(null, true);
        
        // Lista de orígenes permitidos
        const allowedOrigins = [
            'http://localhost:3000',
            'http://10.0.2.2:3000',
            'https://mirutinavisual-backend-route-msazol1-dev.apps.rm2.thpm.p1.openshiftapps.com'
        ];
        
        // Permitir cualquier subdominio de OpenShift
        if (origin.includes('.apps.rm2.thpm.p1.openshiftapps.com')) {
            return callback(null, true);
        }
        
        // Verificar lista de permitidos
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        
        // Permitir por defecto (modo permisivo para debug)
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'mirutinavisual-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true en producción con HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurar estrategia OAuth2.0
require('./config/passport');

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MiRutinaVisual API Docs'
}));

// DEBUG - Verificar rutas cargadas
console.log('🔍 Cargando rutas...');
console.log('📁 authRoutes:', typeof authRoutes);
console.log('📁 apiRoutes:', typeof apiRoutes);
console.log('📁 oauthRoutes:', typeof oauthRoutes);

// Rutas principales
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/oauth', oauthRoutes);

// DEBUG - Ruta de prueba
app.get('/debug/routes', (req, res) => {
    res.json({
        message: 'Rutas disponibles',
        auth: '/auth/login, /auth/register, /auth/admin-login',
        api: '/api/users, /api/all-users',
        oauth: '/oauth/google, /oauth/status'
    });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar estado del servidor
 *     description: Endpoint para verificar que el servidor está funcionando correctamente
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: MiRutinaVisual Backend Docker está funcionando
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'MiRutinaVisual Backend Docker está funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Ruta raíz con instrucciones
app.get('/', (req, res) => {
    res.json({
        message: 'MiRutinaVisual Backend Docker',
        version: '1.0.0',
        documentation: 'http://localhost:3000/api-docs',
        admin_instructions: {
            step1: 'POST /auth/admin-login con admin@mirutinavisual.com / admin123',
            step2: 'Copiar el token de la respuesta',
            step3: 'En Swagger: Authorize → Pegar token → Authorize',
            step4: 'Candado cerrado = Autenticado ',
            step5: 'Para logout: Authorize → Logout → Close'
        },
        endpoints: {
            health: '/health',
            admin_login: '/auth/admin-login',
            users: '/api/users (requiere admin)',
            logout: '/auth/logout'
        }
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.originalUrl} no existe`
    });
});

// Función para iniciar servidor
const startServer = async () => {
    try {
        // Conectar a MongoDB Atlas
        await connectDB();
        
        // Crear usuario admin por defecto si no existe
        await createDefaultAdmin();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('👑 ADMIN CREADO: admin@mirutinavisual.com / [CONTRASEÑA SEGURA]');
            console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
            console.log(`🌐 Acceso local: http://localhost:${PORT}`);
            console.log(`📱 Acceso Android: http://10.0.2.2:${PORT}`);
            console.log('🔐 OAuth2.0 configurado');
            console.log('☁️ MongoDB Atlas conectado');
            console.log('🐳 Docker ready!');
        });
        
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
};

// Función para crear admin por defecto
const createDefaultAdmin = async () => {
    try {
        const User = require('./models/User');
        
        // Verificar si ya existe admin
        const existingAdmin = await User.findOne({ email: 'admin@mirutinavisual.com' });
        
        if (!existingAdmin) {
            const adminUser = new User({
                id: 'admin_001',
                email: 'admin@mirutinavisual.com',
                password: 'SecureAdmin2024!',
                name: 'Administrador',
                provider: 'docker',
                role: 'admin',
                isActive: true
            });
            
            await adminUser.save();
            console.log('👑 Usuario admin creado en MongoDB Atlas');
        } else {
            console.log('👑 Usuario admin ya existe en MongoDB Atlas');
        }
    } catch (error) {
        console.error('❌ Error creando admin:', error.message);
        // Continuar sin admin si hay error
    }
};

// Iniciar servidor
startServer();

module.exports = app;
