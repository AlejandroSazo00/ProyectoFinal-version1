const bcrypt = require('bcrypt');

// Base de datos de usuarios en memoria
let users = [];

// Usuario ADMIN por defecto
const adminUser = {
    id: 'admin_001',
    email: 'admin@mirutinavisual.com',
    password: bcrypt.hashSync('SecureAdmin2024!', 10), // Contraseña segura
    name: 'Administrador',
    provider: 'docker',
    role: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true
};

// Agregar admin por defecto
users.push(adminUser);
console.log('👑 ADMIN CREADO: admin@mirutinavisual.com / [CONTRASEÑA SEGURA]');

// Funciones para manejar usuarios
const UserDatabase = {
    
    // Buscar usuario por email
    findByEmail: (email) => {
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    },
    
    // Crear nuevo usuario
    createUser: (userData) => {
        // Verificar si ya existe
        if (UserDatabase.findByEmail(userData.email)) {
            throw new Error('El usuario ya existe');
        }
        
        const newUser = {
            id: 'user_' + Date.now(),
            email: userData.email.toLowerCase(),
            password: bcrypt.hashSync(userData.password, 10),
            name: userData.name || userData.email.split('@')[0],
            provider: 'docker',
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        users.push(newUser);
        
        console.log('🆕 USUARIO DOCKER CREADO:', {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            total_users: users.length
        });
        
        return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            provider: newUser.provider,
            createdAt: newUser.createdAt
        };
    },
    
    // Validar contraseña
    validatePassword: (user, password) => {
        return bcrypt.compareSync(password, user.password);
    },
    
    // Obtener todos los usuarios (sin contraseñas)
    getAllUsers: () => {
        return users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider,
            createdAt: user.createdAt,
            isActive: user.isActive
        }));
    },
    
    // Obtener estadísticas
    getStats: () => {
        return {
            total_users: users.length,
            active_users: users.filter(u => u.isActive).length,
            created_today: users.filter(u => {
                const today = new Date().toDateString();
                const userDate = new Date(u.createdAt).toDateString();
                return today === userDate;
            }).length
        };
    }
};

module.exports = UserDatabase;
