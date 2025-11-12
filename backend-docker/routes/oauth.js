const express = require('express');
const passport = require('../config/passport');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OAuth2User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del usuario de Google
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *         name:
 *           type: string
 *           description: Nombre completo del usuario
 *         picture:
 *           type: string
 *           format: uri
 *           description: URL de la foto de perfil
 *         provider:
 *           type: string
 *           example: google
 *         jwtToken:
 *           type: string
 *           description: Token JWT para autenticación
 */

/**
 * @swagger
 * /oauth/google:
 *   get:
 *     summary: 🔐 Iniciar OAuth2.0 con Google
 *     description: |
 *       **OAUTH2.0 REAL** - Redirige a Google para autenticación.
 *       
 *       🔐 **FLUJO OAUTH2.0**:
 *       1. Usuario hace clic en este endpoint
 *       2. Redirige a Google OAuth
 *       3. Usuario autoriza en Google
 *       4. Google redirige a /oauth/google/callback
 *       5. Recibe JWT token
 *     tags: [🔐 OAuth2.0]
 *     responses:
 *       302:
 *         description: Redirección a Google OAuth2.0
 *       500:
 *         description: Error en configuración OAuth
 */
router.get('/google', (req, res, next) => {
    // Verificar si está en modo demo
    if (process.env.GOOGLE_CLIENT_ID === 'DEMO_MODE') {
        return res.json({
            success: false,
            error: 'OAuth2.0 en modo DEMO',
            message: 'Para usar OAuth2.0 real, configure Google Cloud Console',
            demo_mode: true,
            instructions: {
                step1: 'Ir a https://console.cloud.google.com/',
                step2: 'Crear proyecto MiRutinaVisual',
                step3: 'Habilitar Google+ API',
                step4: 'Crear credenciales OAuth 2.0',
                step5: 'Configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET'
            },
            alternative: 'Use /auth/login para JWT básico mientras tanto'
        });
    }
    
    // OAuth2.0 real
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })(req, res, next);
});

/**
 * @swagger
 * /oauth/google/callback:
 *   get:
 *     summary: 🔄 Callback OAuth2.0 de Google
 *     description: |
 *       **CALLBACK OAUTH2.0** - Endpoint donde Google redirige después de autenticación.
 *       
 *       ⚠️ **NO LLAMAR DIRECTAMENTE** - Solo para Google OAuth2.0
 *     tags: [🔐 OAuth2.0]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Código de autorización de Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Estado de seguridad OAuth2.0
 *     responses:
 *       200:
 *         description: ✅ Autenticación OAuth2.0 exitosa
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
 *                   example: OAuth2.0 autenticación exitosa
 *                 oauth_flow:
 *                   type: string
 *                   example: google
 *                 user:
 *                   $ref: '#/components/schemas/OAuth2User'
 *                 jwt_token:
 *                   type: string
 *                   description: Token JWT para usar en Authorization Bearer
 *       401:
 *         description: ❌ Error en autenticación OAuth2.0
 *       403:
 *         description: ❌ Usuario denegó permisos en Google
 */
router.get('/google/callback',
    passport.authenticate('google', { 
        session: false,
        failureRedirect: '/oauth/error'
    }),
    (req, res) => {
        try {
            const user = req.user;
            
            console.log('✅ OAuth2.0 exitoso:', {
                email: user.email,
                name: user.name,
                provider: user.provider,
                timestamp: new Date().toISOString()
            });
            
            // Respuesta JSON con token JWT
            res.json({
                success: true,
                message: 'OAuth2.0 autenticación exitosa con Google',
                oauth_flow: 'google',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                    provider: user.provider,
                    loginTime: user.loginTime
                },
                jwt_token: user.jwtToken,
                instructions: 'Use el jwt_token en el header Authorization: Bearer <token>',
                expires_in: '24h'
            });
            
        } catch (error) {
            console.error('❌ Error en callback OAuth2.0:', error);
            res.status(500).json({
                success: false,
                error: 'Error procesando autenticación OAuth2.0',
                oauth_flow: 'google'
            });
        }
    }
);

/**
 * @swagger
 * /oauth/error:
 *   get:
 *     summary: ❌ Error OAuth2.0
 *     description: Página de error cuando falla la autenticación OAuth2.0
 *     tags: [🔐 OAuth2.0]
 *     responses:
 *       401:
 *         description: Error en autenticación OAuth2.0
 */
router.get('/error', (req, res) => {
    res.status(401).json({
        success: false,
        error: 'Error en autenticación OAuth2.0',
        message: 'La autenticación con Google falló o fue cancelada',
        oauth_flow: 'google',
        instructions: 'Intente nuevamente con /oauth/google'
    });
});

/**
 * @swagger
 * /oauth/status:
 *   get:
 *     summary: 📊 Estado OAuth2.0
 *     description: Verificar configuración y estado de OAuth2.0
 *     tags: [🔐 OAuth2.0]
 *     responses:
 *       200:
 *         description: Estado de configuración OAuth2.0
 */
router.get('/status', (req, res) => {
    const hasGoogleConfig = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    
    res.json({
        success: true,
        oauth2_configured: hasGoogleConfig,
        providers: ['google'],
        endpoints: {
            google_login: '/oauth/google',
            callback: '/oauth/google/callback',
            error: '/oauth/error'
        },
        configuration: {
            client_id_configured: !!process.env.GOOGLE_CLIENT_ID,
            client_secret_configured: !!process.env.GOOGLE_CLIENT_SECRET,
            callback_url: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/oauth/google/callback'
        }
    });
});

module.exports = router;
