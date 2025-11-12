const mongoose = require('mongoose');

// Configuración de MongoDB Atlas
const connectDB = async () => {
    try {
        // Verificar si está en modo demo
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI || mongoURI.includes('DEMO_MODE') || mongoURI.includes('cluster0.mongodb.net')) {
            console.log('🔄 MongoDB en modo DEMO - usando base de datos en memoria');
            console.log('📋 Para usar MongoDB Atlas real:');
            console.log('   1. Crear cuenta en https://www.mongodb.com/cloud/atlas');
            console.log('   2. Crear cluster gratuito M0');
            console.log('   3. Configurar usuario y contraseña');
            console.log('   4. Actualizar MONGODB_URI en docker-compose.yml');
            return null;
        }
        
        console.log('🔗 Conectando a MongoDB Atlas...');
        
        const conn = await mongoose.connect(mongoURI);
        
        console.log('✅ MongoDB Atlas conectado:', conn.connection.host);
        console.log('📊 Base de datos:', conn.connection.name);
        
        return conn;
    } catch (error) {
        console.error('❌ Error conectando a MongoDB Atlas:', error.message);
        
        // Fallback a base de datos en memoria para desarrollo
        console.log('🔄 Usando base de datos en memoria como fallback...');
        console.log('💡 Tip: Verifique la URL de MongoDB Atlas y configuración de red');
        return null;
    }
};

// Verificar estado de conexión
const checkConnection = () => {
    const state = mongoose.connection.readyState;
    const states = {
        0: 'Desconectado',
        1: 'Conectado',
        2: 'Conectando',
        3: 'Desconectando'
    };
    
    return {
        state: state,
        status: states[state],
        isConnected: state === 1,
        host: mongoose.connection.host,
        database: mongoose.connection.name
    };
};

// Cerrar conexión
const closeConnection = async () => {
    try {
        await mongoose.connection.close();
        console.log('🔌 Conexión MongoDB cerrada');
    } catch (error) {
        console.error('❌ Error cerrando conexión:', error.message);
    }
};

module.exports = {
    connectDB,
    checkConnection,
    closeConnection
};
