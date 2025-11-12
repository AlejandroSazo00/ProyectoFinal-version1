const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const UserDatabase = require('../database/users');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: user_1762827958734
 *         email:
 *           type: string
 *           format: email
 *           example: test@test.com
 *         name:
 *           type: string
 *           example: test
 *         provider:
 *           type: string
 *           example: docker
 *         createdAt:
 *           type: string
 *           format: date-time
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: test@test.com
 *         password:
 *           type: string
 *           minLength: 4
 *           example: "1234"
 *         name:
 *           type: string
 *           example: Test User
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: test@test.com
 *         password:
 *           type: string
 *           example: "1234"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

// Ruta para iniciar autenticación con Google
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);

// Callback de Google OAuth2.0
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/error' }),
    (req, res) => {
        try {
            console.log('✅ Callback exitoso de Google');
            
            // El usuario está en req.user (viene de passport)
            const user = req.user;
            
            // Para Android, redirigir con el token como parámetro
            const redirectUrl = `mirutinavisual://auth/success?token=${user.jwtToken}&user=${encodeURIComponent(JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture
            }))}`;
            
            // También enviar respuesta JSON para testing
            res.json({
                success: true,
                message: 'Autenticación exitosa',
                token: user.jwtToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                    provider: 'google'
                },
                redirectUrl: redirectUrl
            });
            
        } catch (error) {
            console.error('❌ Error en callback:', error);
            res.status(500).json({
                success: false,
                error: 'Error en autenticación'
            });
        }
    }
);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar nuevo usuario Docker
 *     description: Crear una nueva cuenta de usuario en el sistema Docker
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario registrado exitosamente
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Usuario ya existe
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Validación básica
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña requeridos'
            });
        }
        
        if (password.length < 4) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 4 caracteres'
            });
        }
        
        // Crear usuario
        const newUser = await UserDatabase.createUser({ email, password, name });
        
        res.json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: newUser
        });
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        if (error.message === 'El usuario ya existe') {
            return res.status(409).json({
                success: false,
                error: 'El usuario ya está registrado'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión con Docker
 *     description: Autenticar usuario y obtener token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenciales inválidas
 *       400:
 *         description: Datos requeridos faltantes
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validación básica
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña requeridos'
            });
        }
        
        // RESPUESTA INMEDIATA: Buscar usuario
        const user = await UserDatabase.findByEmail(email);
        
        if (!user) {
            // RESPUESTA RÁPIDA - Usuario no existe
            return res.status(401).json({
                success: false,
                error: 'Usuario no registrado. Por favor cree una cuenta primero.',
                code: 'USER_NOT_FOUND'
            });
        }
        
        // Validar contraseña - ARREGLO DEFINITIVO
        const bcrypt = require('bcrypt');
        
        console.log('🔍 DEBUG LOGIN:', {
            email: email,
            passwordLength: password.length,
            userPasswordHash: user.password ? user.password.substring(0, 20) + '...' : 'NO_HASH',
            userFromDB: !!user
        });
        
        // ARREGLO: Usar await para bcrypt.compare (versión async)
        let isValidPassword = false;
        try {
            isValidPassword = await bcrypt.compare(password, user.password);
        } catch (error) {
            console.log('❌ Error en bcrypt.compare:', error);
            isValidPassword = false;
        }
        
        console.log('🔍 PASSWORD VALIDATION:', {
            email: email,
            isValid: isValidPassword,
            providedPassword: password,
            hashFromDB: user.password ? 'EXISTS' : 'MISSING'
        });
        
        if (!isValidPassword) {
            console.log('❌ Contraseña incorrecta para:', email);
            return res.status(401).json({
                success: false,
                error: 'Contraseña incorrecta',
                code: 'INVALID_PASSWORD'
            });
        }
        
        // Login exitoso - Generar JWT
        const userForToken = {
            id: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider
        };
        
        const token = jwt.sign(
            userForToken,
            process.env.JWT_SECRET || 'mirutinavisual-jwt-secret-2024',
            { expiresIn: '24h' }
        );
        
        console.log('✅ LOGIN EXITOSO:', {
            email: user.email,
            name: user.name,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Login exitoso',
            token: token,
            user: userForToken
        });
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Verificar token JWT
router.post('/verify', (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token requerido'
            });
        }
        
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'mirutinavisual-jwt-secret-2024'
        );
        
        res.json({
            success: true,
            message: 'Token válido',
            user: decoded
        });
        
    } catch (error) {
        console.error('❌ Token inválido:', error);
        res.status(401).json({
            success: false,
            error: 'Token inválido o expirado'
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: 'Error al cerrar sesión'
            });
        }
        
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    });
});

// Ruta de error
router.get('/error', (req, res) => {
    res.status(401).json({
        success: false,
        error: 'Error en autenticación',
        message: 'No se pudo autenticar con Google'
    });
});

// Estado de autenticación
router.get('/status', (req, res) => {
    res.json({
        authenticated: req.isAuthenticated(),
        user: req.user || null,
        session: req.session
    });
});

/**
 * @swagger
 * /auth/admin-login:
 *   post:
 *     summary: Login especial para administrador
 *     description: Endpoint específico para que el admin obtenga su token JWT
 *     tags: [🔒 Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@mirutinavisual.com
 *               password:
 *                 type: string
 *                 example: SecureAdmin2024!
 *     responses:
 *       200:
 *         description: Admin autenticado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin autenticado exitosamente
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: admin_001
 *                     email:
 *                       type: string
 *                       example: admin@mirutinavisual.com
 *                     name:
 *                       type: string
 *                       example: Administrador
 *                     role:
 *                       type: string
 *                       example: admin
 *       401:
 *         description: Credenciales de admin incorrectas
 */
router.post('/admin-login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validar que es el admin
        if (email !== 'admin@mirutinavisual.com' || password !== 'SecureAdmin2024!') {
            return res.status(401).json({
                success: false,
                error: 'Credenciales de administrador incorrectas',
                code: 'INVALID_ADMIN_CREDENTIALS'
            });
        }
        
        // Crear token para admin
        const adminUser = {
            id: 'admin_001',
            email: 'admin@mirutinavisual.com',
            name: 'Administrador',
            role: 'admin',
            provider: 'docker'
        };
        
        const token = jwt.sign(
            adminUser,
            process.env.JWT_SECRET || 'mirutinavisual-jwt-secret-2024',
            { expiresIn: '24h' }
        );
        
        console.log('👑 ADMIN LOGIN EXITOSO:', {
            email: adminUser.email,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Admin autenticado exitosamente',
            token: token,
            user: adminUser,
            instructions: 'Copie el token y úselo en el botón Authorize de Swagger'
        });
        
    } catch (error) {
        console.error('❌ Error en admin login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 🔒 Cerrar sesión de administrador
 *     description: |
 *       **ENDPOINT PROTEGIDO** - Requiere token de administrador válido.
 *       
 *       ⚠️ **SOLO ADMIN**: Solo administradores autenticados pueden cerrar sesión.
 *     tags: [🔒 Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ✅ Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sesión de administrador cerrada exitosamente
 *                 admin_user:
 *                   type: string
 *                   example: admin@mirutinavisual.com
 *       401:
 *         description: ❌ Token requerido
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
 *                   example: Token de autorización requerido para cerrar sesión.
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
 *                   example: Solo administradores pueden usar este endpoint.
 *                 code:
 *                   type: string
 *                   example: NOT_ADMIN
 */
router.post('/logout', (req, res) => {
    // VERIFICAR TOKEN OBLIGATORIO
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de autorización requerido para cerrar sesión.',
            code: 'UNAUTHORIZED'
        });
    }
    
    // VERIFICAR TOKEN VÁLIDO
    jwt.verify(token, process.env.JWT_SECRET || 'mirutinavisual-jwt-secret-2024', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Token inválido. No se puede cerrar sesión.',
                code: 'INVALID_TOKEN'
            });
        }
        
        // VERIFICAR QUE ES ADMIN
        if (user.email !== 'admin@mirutinavisual.com') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden usar este endpoint.',
                code: 'NOT_ADMIN'
            });
        }
        
        // LOGOUT EXITOSO
        console.log('👑 ADMIN LOGOUT:', {
            email: user.email,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Sesión de administrador cerrada exitosamente',
            admin_user: user.email,
            instructions: 'Para cerrar sesión en Swagger: Clic Authorize → Clic Logout → Clic Close'
        });
    });
});

module.exports = router;
