const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Esquema de Usuario para MongoDB
const userSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return this.provider === 'docker';
        }
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    provider: {
        type: String,
        enum: ['docker', 'google', 'firebase'],
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    picture: {
        type: String,
        default: null
    },
    // Datos OAuth2.0
    googleId: {
        type: String,
        sparse: true
    },
    accessToken: {
        type: String,
        default: null
    },
    refreshToken: {
        type: String,
        default: null
    },
    // Metadatos
    lastLogin: {
        type: Date,
        default: null
    },
    loginCount: {
        type: Number,
        default: 0
    },
    ipAddress: {
        type: String,
        default: null
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'users'
});

// Índices para optimización
userSchema.index({ email: 1 });
userSchema.index({ provider: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Middleware pre-save para hash de contraseña
userSchema.pre('save', async function(next) {
    // Solo hash si la contraseña fue modificada
    if (!this.isModified('password')) return next();
    
    try {
        // Hash de contraseña para usuarios Docker
        if (this.provider === 'docker' && this.password) {
            this.password = await bcrypt.hash(this.password, 10);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Método para verificar contraseña
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para actualizar último login
userSchema.methods.updateLastLogin = async function(ipAddress = null) {
    this.lastLogin = new Date();
    this.loginCount += 1;
    if (ipAddress) this.ipAddress = ipAddress;
    return await this.save();
};

// Método para obtener datos públicos (sin contraseña)
userSchema.methods.toPublicJSON = function() {
    return {
        id: this.id,
        email: this.email,
        name: this.name,
        provider: this.provider,
        role: this.role,
        isActive: this.isActive,
        picture: this.picture,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        lastLogin: this.lastLogin,
        loginCount: this.loginCount
    };
};

// Métodos estáticos
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true });
};

userSchema.statics.findByProvider = function(provider) {
    return this.find({ provider: provider });
};

userSchema.statics.getStats = async function() {
    const totalUsers = await this.countDocuments();
    const activeUsers = await this.countDocuments({ isActive: true });
    const adminUsers = await this.countDocuments({ role: 'admin' });
    const regularUsers = await this.countDocuments({ role: 'user' });
    
    // Usuarios creados hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const createdToday = await this.countDocuments({
        createdAt: { $gte: today }
    });
    
    // Por proveedor
    const byProvider = await this.aggregate([
        { $group: { _id: '$provider', count: { $sum: 1 } } }
    ]);
    
    return {
        total_users: totalUsers,
        active_users: activeUsers,
        admin_users: adminUsers,
        regular_users: regularUsers,
        created_today: createdToday,
        by_provider: byProvider.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {})
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
