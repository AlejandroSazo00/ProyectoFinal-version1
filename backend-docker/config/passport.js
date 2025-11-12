const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

// Configurar estrategia de Google OAuth2.0
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'tu-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'tu-google-client-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔐 Usuario autenticado con Google:', profile.displayName);
        
        // Crear objeto de usuario
        const user = {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0].value,
            provider: 'google',
            accessToken: accessToken,
            refreshToken: refreshToken,
            loginTime: new Date().toISOString()
        };
        
        // Generar JWT token
        const jwtToken = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                name: user.name,
                provider: 'google'
            },
            process.env.JWT_SECRET || 'mirutinavisual-jwt-secret-2024',
            { expiresIn: '24h' }
        );
        
        user.jwtToken = jwtToken;
        
        return done(null, user);
    } catch (error) {
        console.error('❌ Error en autenticación Google:', error);
        return done(error, null);
    }
}));

// Serializar usuario para la sesión
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserializar usuario de la sesión
passport.deserializeUser((id, done) => {
    // En una aplicación real, aquí buscarías el usuario en la base de datos
    // Por ahora, creamos un usuario básico
    const user = { id: id, provider: 'google' };
    done(null, user);
});

module.exports = passport;
