const bcrypt = require('bcrypt');
const User = require('../models/User');

// Funciones para manejar usuarios con MongoDB Atlas
const UserDatabase = {
    
    // Buscar usuario por email
    findByEmail: async (email) => {
        try {
            const user = await User.findOne({ email: email.toLowerCase() });
            return user;
        } catch (error) {
            console.error('❌ Error buscando usuario:', error);
            return null;
        }
    },
    
    // Crear nuevo usuario
    createUser: async (userData) => {
        try {
            // Verificar si ya existe
            const existingUser = await UserDatabase.findByEmail(userData.email);
            if (existingUser) {
                throw new Error('El usuario ya existe');
            }
            
            const newUser = new User({
                id: 'user_' + Date.now(),
                email: userData.email.toLowerCase(),
                password: bcrypt.hashSync(userData.password, 10),
                name: userData.name || userData.email.split('@')[0],
                provider: 'docker',
                role: 'user',
                isActive: true
            });
            
            const savedUser = await newUser.save();
            
            console.log('🆕 USUARIO DOCKER CREADO EN MONGODB:', {
                id: savedUser.id,
                email: savedUser.email,
                name: savedUser.name,
                provider: savedUser.provider
            });
            
            return {
                id: savedUser.id,
                email: savedUser.email,
                name: savedUser.name,
                provider: savedUser.provider,
                createdAt: savedUser.createdAt
            };
        } catch (error) {
            console.error('❌ Error creando usuario:', error);
            throw error;
        }
    },
    
    // Validar contraseña
    validatePassword: (user, password) => {
        return bcrypt.compareSync(password, user.password);
    },
    
    // Obtener todos los usuarios (sin contraseñas)
    getAllUsers: async () => {
        try {
            const users = await User.find({}, '-password -__v');
            return users.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                provider: user.provider,
                role: user.role,
                createdAt: user.createdAt,
                isActive: user.isActive
            }));
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            return [];
        }
    },
    
    // Obtener estadísticas
    getStats: async () => {
        try {
            const totalUsers = await User.countDocuments();
            const activeUsers = await User.countDocuments({ isActive: true });
            const adminUsers = await User.countDocuments({ role: 'admin' });
            const regularUsers = await User.countDocuments({ role: 'user' });
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const createdToday = await User.countDocuments({ 
                createdAt: { $gte: today } 
            });
            
            return {
                total_users: totalUsers,
                admin_users: adminUsers,
                regular_users: regularUsers,
                active_users: activeUsers,
                created_today: createdToday
            };
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {
                total_users: 0,
                admin_users: 0,
                regular_users: 0,
                active_users: 0,
                created_today: 0
            };
        }
    }
};

module.exports = UserDatabase;
