const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de acceso requerido'
        });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'mirutinavisual-jwt-secret-2024', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido'
            });
        }
        req.user = user;
        next();
    });
};

// Middleware para verificar que el usuario es admin
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de acceso requerido para admin'
        });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'mirutinavisual-jwt-secret-2024', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido'
            });
        }
        
        // Verificar si es admin
        if (user.email !== 'admin@mirutinavisual.com') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado. Solo administradores.'
            });
        }
        
        req.user = user;
        next();
    });
};

// Ruta protegida - Información del usuario
router.get('/user', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user,
        message: 'Usuario autenticado correctamente'
    });
});

// Ruta protegida - Datos de la aplicación
router.get('/app-data', verifyToken, (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user,
            appVersion: '1.0.0',
            features: [
                'OAuth2.0 Authentication',
                'Firebase Integration', 
                'Docker Backend',
                'Autism Support Features'
            ],
            timestamp: new Date().toISOString()
        }
    });
});

// Proxy a Firebase (para mantener compatibilidad)
router.post('/firebase-proxy', verifyToken, (req, res) => {
    // Aquí podrías hacer llamadas a Firebase si fuera necesario
    res.json({
        success: true,
        message: 'Proxy a Firebase disponible',
        user: req.user,
        data: req.body
    });
});

// Endpoint para testing de conectividad
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        server: 'Docker Backend',
        version: '1.0.0'
    });
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 🔒 Ver solo administradores (Solo Admin)
 *     description: |
 *       **ENDPOINT PROTEGIDO** - Requiere autenticación de administrador.
 *       
 *       ⚠️ **ACCESO RESTRINGIDO**: Solo administradores autenticados pueden acceder.
 *       
 *       📋 **Pasos para acceder**:
 *       1. Hacer login en POST /auth/admin-login
 *       2. Copiar el token JWT
 *       3. Usar el botón "Authorize" 
 *       4. Ejecutar este endpoint
 *     tags: [🔒 Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ✅ Lista de usuarios obtenida exitosamente (Solo con token válido)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 admin_user:
 *                   type: string
 *                 total_users:
 *                   type: integer
 *                 users:
 *                   type: array
 *                   description: "Información confidencial - Solo visible con autenticación"
 *                 stats:
 *                   type: object
 *                   description: "Estadísticas del sistema"
 *       401:
 *         description: ❌ Token de acceso requerido - Debe hacer login como admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Acceso denegado. Token de autorización requerido.
 *                 code:
 *                   type: string
 *                   example: UNAUTHORIZED
 *       403:
 *         description: ❌ Token inválido o no es admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Acceso denegado. Solo administradores pueden ver usuarios.
 *                 code:
 *                   type: string
 *                   example: NOT_ADMIN
 */
router.get('/users', (req, res) => {
    // VERIFICAR TOKEN OBLIGATORIO
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Acceso denegado. Token de autorización requerido.',
            code: 'UNAUTHORIZED'
        });
    }
    
    // VERIFICAR TOKEN VÁLIDO
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET || 'mirutinavisual-jwt-secret-2024', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido o expirado. Haga login nuevamente.',
                code: 'INVALID_TOKEN'
            });
        }
        
        // VERIFICAR QUE ES ADMIN
        if (user.email !== 'admin@mirutinavisual.com') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado. Solo administradores pueden ver usuarios.',
                code: 'NOT_ADMIN'
            });
        }
        
        // SI TODO ESTÁ BIEN, MOSTRAR USUARIOS
        const UserDatabase = require('../database/users');
        
        try {
            const allUsers = UserDatabase.getAllUsers();
            const adminUsers = allUsers.filter(u => u.role === 'admin' || u.email === 'admin@mirutinavisual.com');
            const stats = UserDatabase.getStats();
            
            console.log('👑 ADMIN VE SOLO ADMINS:', {
                admin: user.email,
                admin_users: adminUsers.length,
                timestamp: new Date().toISOString()
            });
            
            res.json({
                success: true,
                message: 'Lista de administradores del sistema',
                admin_user: user.email,
                total_admins: adminUsers.length,
                admins: adminUsers.map(u => ({
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    provider: u.provider,
                    role: u.role || 'admin',
                    createdAt: u.createdAt,
                    isActive: u.isActive !== undefined ? u.isActive : true
                })),
                stats: {
                    total_users: stats.total_users,
                    admin_users: adminUsers.length,
                    regular_users: allUsers.length - adminUsers.length
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error obteniendo administradores',
                timestamp: new Date().toISOString()
            });
        }
    });
});

// Endpoint para logs (útil para debugging)
router.post('/log', verifyToken, (req, res) => {
    const { level, message, data } = req.body;
    
    console.log(`📱 [${level?.toUpperCase() || 'INFO'}] ${message}`, data || '');
    
    res.json({
        success: true,
        message: 'Log registrado',
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /api/all-users:
 *   get:
 *     summary: 🔒 Ver solo usuarios regulares (Solo Admin)
 *     description: |
 *       **ENDPOINT PROTEGIDO** - Requiere autenticación de administrador.
 *       
 *       ⚠️ **ACCESO RESTRINGIDO**: Solo administradores autenticados pueden ver todos los usuarios.
 *       
 *       📋 **Muestra TODOS los usuarios**: admin, test, demo, etc.
 *       
 *       📋 **Pasos para acceder**:
 *       1. Hacer login en POST /auth/admin-login
 *       2. Copiar el token JWT
 *       3. Usar el botón "Authorize" 
 *       4. Ejecutar este endpoint
 *     tags: [🔒 Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ✅ Todos los usuarios obtenidos exitosamente (Solo con token válido)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 admin_user:
 *                   type: string
 *                 total_users:
 *                   type: integer
 *                 all_users:
 *                   type: array
 *                   description: "Lista completa de usuarios - Solo visible con autenticación"
 *                 stats:
 *                   type: object
 *                   description: "Estadísticas detalladas del sistema"
 *       401:
 *         description: ❌ Token de acceso requerido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Acceso denegado. Token de autorización requerido.
 *                 code:
 *                   type: string
 *                   example: UNAUTHORIZED
 *       403:
 *         description: ❌ Token inválido o no es admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Acceso denegado. Solo administradores pueden ver usuarios.
 *                 code:
 *                   type: string
 *                   example: NOT_ADMIN
 */
router.get('/all-users', (req, res) => {
    // VERIFICAR TOKEN OBLIGATORIO
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Acceso denegado. Token de autorización requerido.',
            code: 'UNAUTHORIZED'
        });
    }
    
    // VERIFICAR TOKEN VÁLIDO
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET || 'mirutinavisual-jwt-secret-2024', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido o expirado. Haga login nuevamente.',
                code: 'INVALID_TOKEN'
            });
        }
        
        // VERIFICAR QUE ES ADMIN
        if (user.role !== 'admin' || user.email !== 'admin@mirutinavisual.com') {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado. Solo administradores pueden ver todos los usuarios.',
                code: 'NOT_ADMIN'
            });
        }
        
        // OBTENER SOLO USUARIOS REGULARES (NO ADMIN)
        const UserDatabase = require('../database/users');
        const allUsers = UserDatabase.getAllUsers();
        const regularUsers = allUsers.filter(u => u.role !== 'admin' && u.email !== 'admin@mirutinavisual.com');
        const stats = UserDatabase.getStats();
        
        console.log('👑 ADMIN VE SOLO USUARIOS REGULARES:', {
            admin: user.email,
            regular_users: regularUsers.length,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Lista de usuarios regulares del sistema (test, demo, etc.)',
            admin_user: user.email,
            total_regular_users: regularUsers.length,
            regular_users: regularUsers.map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                provider: u.provider,
                role: u.role || 'user',
                createdAt: u.createdAt,
                isActive: u.isActive !== undefined ? u.isActive : true
            })),
            stats: {
                total_users: stats.total_users,
                admin_users: allUsers.filter(u => u.role === 'admin' || u.email === 'admin@mirutinavisual.com').length,
                regular_users: regularUsers.length,
                active_users: stats.active_users,
                created_today: stats.created_today
            },
            timestamp: new Date().toISOString()
        });
    });
});

module.exports = router;
