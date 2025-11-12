package com.example.mirutinavisual;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.text.TextUtils;
import android.util.Patterns;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

import java.util.Locale;

public class LoginActivity extends AppCompatActivity implements TextToSpeech.OnInitListener {

    private TextToSpeech textToSpeech;
    private FirebaseAuth firebaseAuth;
    
    private EditText emailEditText, passwordEditText;
    private Button loginButton, registerButton, dockerLoginButton, dockerRegisterButton;
    private TextView titleText, subtitleText;
    
    // Cliente para backend Docker
    private BackendClient backendClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        
        // Inicializar Firebase Auth
        firebaseAuth = FirebaseAuth.getInstance();
        
        // Inicializar Text-to-Speech
        textToSpeech = new TextToSpeech(this, this);
        
        // Inicializar cliente backend Docker
        backendClient = new BackendClient();
        
        // Verificar si ya hay usuario logueado
        FirebaseUser currentUser = firebaseAuth.getCurrentUser();
        if (currentUser != null) {
            // Usuario ya está logueado, ir a MainActivity
            handleUserAlreadyLoggedIn();
            return;
        }
        
        // Verificar si viene de una notificación
        checkNotificationIntent();
        
        // Inicializar vistas
        initViews();
        
        // Configurar listeners
        setupClickListeners();
        
        // Mensaje de bienvenida
        speakText("Bienvenido a Mi Rutina Visual. Por favor inicia sesión o regístrate");
    }

    private void initViews() {
        titleText = findViewById(R.id.titleText);
        subtitleText = findViewById(R.id.subtitleText);
        emailEditText = findViewById(R.id.emailEditText);
        passwordEditText = findViewById(R.id.passwordEditText);
        loginButton = findViewById(R.id.loginButton);
        registerButton = findViewById(R.id.registerButton);
        dockerLoginButton = findViewById(R.id.dockerLoginButton);
        dockerRegisterButton = findViewById(R.id.dockerRegisterButton);
        
        // Forzar color negro en EditText para APK
        emailEditText.setTextColor(Color.BLACK);
        passwordEditText.setTextColor(Color.BLACK);
        emailEditText.setHintTextColor(Color.GRAY);
        passwordEditText.setHintTextColor(Color.GRAY);
    }

    private void setupClickListeners() {
        loginButton.setOnClickListener(v -> {
            speakText("Iniciando sesión");
            loginUser();
        });

        registerButton.setOnClickListener(v -> {
            speakText("Registrando nuevo usuario");
            registerUser();
        });

        dockerLoginButton.setOnClickListener(v -> {
            speakText("Conectando con backend Docker OAuth2.0");
            testDockerConnection();
        });

        dockerRegisterButton.setOnClickListener(v -> {
            speakText("Creando cuenta Docker");
            registerDockerUser();
        });

        emailEditText.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                speakText("Escribe tu correo electrónico");
            }
        });

        passwordEditText.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                speakText("Escribe tu contraseña");
            }
        });
    }

    private void loginUser() {
        String email = emailEditText.getText().toString().trim();
        String password = passwordEditText.getText().toString().trim();

        // Validaciones
        if (!validateInput(email, password)) {
            return;
        }

        // Mostrar progreso
        loginButton.setEnabled(false);
        loginButton.setText("Iniciando sesión...");

        // Autenticar con Firebase
        firebaseAuth.signInWithEmailAndPassword(email, password)
                .addOnCompleteListener(this, task -> {
                    loginButton.setEnabled(true);
                    loginButton.setText("Iniciar Sesión");

                    if (task.isSuccessful()) {
                        // Login exitoso
                        FirebaseUser user = firebaseAuth.getCurrentUser();
                        speakText("Bienvenido de nuevo");
                        showToast("¡Bienvenido!");
                        
                        // Ir a MainActivity (con posible notificación pendiente)
                        navigateToMainActivity();
                        
                    } else {
                        // Error en login
                        String errorMessage = "Error al iniciar sesión";
                        if (task.getException() != null) {
                            String error = task.getException().getMessage();
                            if (error != null) {
                                if (error.contains("password")) {
                                    errorMessage = "Contraseña incorrecta";
                                } else if (error.contains("email")) {
                                    errorMessage = "Usuario no encontrado";
                                } else if (error.contains("network")) {
                                    errorMessage = "Sin conexión a internet";
                                }
                            }
                        }
                        speakText(errorMessage);
                        showToast(errorMessage);
                    }
                });
    }

    private void registerUser() {
        String email = emailEditText.getText().toString().trim();
        String password = passwordEditText.getText().toString().trim();

        // Validaciones
        if (!validateInput(email, password)) {
            return;
        }

        // Validación adicional para registro
        if (password.length() < 6) {
            speakText("La contraseña debe tener al menos 6 caracteres");
            passwordEditText.setError("Mínimo 6 caracteres");
            passwordEditText.requestFocus();
            return;
        }

        // Mostrar progreso
        registerButton.setEnabled(false);
        registerButton.setText("Registrando...");

        // Registrar con Firebase
        firebaseAuth.createUserWithEmailAndPassword(email, password)
                .addOnCompleteListener(this, task -> {
                    registerButton.setEnabled(true);
                    registerButton.setText("Registrarse");

                    if (task.isSuccessful()) {
                        // Registro exitoso
                        FirebaseUser user = firebaseAuth.getCurrentUser();
                        speakText("Cuenta creada exitosamente. Bienvenido");
                        showToast("¡Cuenta creada! Bienvenido");
                        
                        // Ir a MainActivity (con posible notificación pendiente)
                        navigateToMainActivity();
                        
                    } else {
                        // Error en registro
                        String errorMessage = "Error al crear la cuenta";
                        if (task.getException() != null) {
                            String error = task.getException().getMessage();
                            if (error != null) {
                                if (error.contains("already in use")) {
                                    errorMessage = "Este correo ya está registrado";
                                } else if (error.contains("weak password")) {
                                    errorMessage = "Contraseña muy débil";
                                } else if (error.contains("network")) {
                                    errorMessage = "Sin conexión a internet";
                                }
                            }
                        }
                        speakText(errorMessage);
                        showToast(errorMessage);
                    }
                });
    }

    private boolean validateInput(String email, String password) {
        // Validar email
        if (TextUtils.isEmpty(email)) {
            speakText("Por favor escribe tu correo electrónico");
            emailEditText.setError("Campo requerido");
            emailEditText.requestFocus();
            return false;
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            speakText("Por favor escribe un correo válido");
            emailEditText.setError("Correo inválido");
            emailEditText.requestFocus();
            return false;
        }

        // Validar contraseña
        if (TextUtils.isEmpty(password)) {
            speakText("Por favor escribe tu contraseña");
            passwordEditText.setError("Campo requerido");
            passwordEditText.requestFocus();
            return false;
        }

        return true;
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            int result = textToSpeech.setLanguage(new Locale("es", "ES"));
            
            if (result == TextToSpeech.LANG_MISSING_DATA || 
                result == TextToSpeech.LANG_NOT_SUPPORTED) {
                textToSpeech.setLanguage(Locale.US);
            }
            
            textToSpeech.setSpeechRate(0.8f);
            textToSpeech.setPitch(1.0f);
        }
    }

    private void speakText(String text) {
        if (textToSpeech != null) {
            textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, null);
        }
    }

    private void showToast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
    
    // Método para verificar si viene de una notificación
    private void checkNotificationIntent() {
        Intent intent = getIntent();
        if (intent != null && intent.getBooleanExtra("from_notification", false)) {
            String activityName = intent.getStringExtra("pending_activity_name");
            if (activityName != null) {
                System.out.println("LOGIN: Usuario llegó desde notificación de: " + activityName);
                showToast("🔔 Tienes un recordatorio pendiente: " + activityName);
                speakText("Tienes un recordatorio pendiente para " + activityName + ". Por favor inicia sesión para continuar.");
            }
        }
    }
    
    // Método para manejar usuario ya logueado
    private void handleUserAlreadyLoggedIn() {
        Intent intent = getIntent();
        Intent mainIntent = new Intent(LoginActivity.this, MainActivity.class);
        
        // Si viene de notificación, pasar los datos
        if (intent != null && intent.getBooleanExtra("from_notification", false)) {
            mainIntent.putExtra("from_notification", true);
            mainIntent.putExtra("activity_name", intent.getStringExtra("pending_activity_name"));
            mainIntent.putExtra("activity_id", intent.getStringExtra("pending_activity_id"));
            System.out.println("LOGIN: Usuario ya logueado, redirigiendo desde notificación");
        }
        
        startActivity(mainIntent);
        finish();
    }
    
    // Método para navegar a MainActivity manejando notificaciones pendientes
    private void navigateToMainActivity() {
        Intent currentIntent = getIntent();
        Intent mainIntent = new Intent(LoginActivity.this, MainActivity.class);
        
        // Si viene de notificación, pasar los datos
        if (currentIntent != null && currentIntent.getBooleanExtra("from_notification", false)) {
            mainIntent.putExtra("from_notification", true);
            mainIntent.putExtra("activity_name", currentIntent.getStringExtra("pending_activity_name"));
            mainIntent.putExtra("activity_id", currentIntent.getStringExtra("pending_activity_id"));
            System.out.println("LOGIN: Redirigiendo a MainActivity con notificación pendiente");
        }
        
        startActivity(mainIntent);
        finish();
    }

    // Método para probar conexión con backend Docker
    private void testDockerConnection() {
        showToast("🐳 Conectando con backend Docker...");
        
        backendClient.checkHealth(new BackendClient.BackendCallback() {
            @Override
            public void onSuccess(com.google.gson.JsonObject response) {
                runOnUiThread(() -> {
                    showToast("✅ Backend Docker conectado!");
                    speakText("Backend Docker conectado correctamente");
                    
                    // Mostrar información del servidor
                    String message = response.get("message").getAsString();
                    String version = response.get("version").getAsString();
                    
                    showToast("📡 " + message + " v" + version);
                    
                    // Aquí podrías abrir el navegador para OAuth o hacer login directo
                    testDockerLogin();
                });
            }
            
            @Override
            public void onError(String error) {
                runOnUiThread(() -> {
                    showToast("❌ No se pudo conectar");
                    speakText("No se pudo conectar con el servidor. Verifique su conexión a internet.");
                });
            }
        });
    }
    
    // Método para probar login directo con Docker
    private void testDockerLogin() {
        String email = emailEditText.getText().toString().trim();
        String password = passwordEditText.getText().toString().trim();
        
        if (TextUtils.isEmpty(email) || TextUtils.isEmpty(password)) {
            showToast("⚠️ Ingresa email y contraseña para probar Docker login");
            return;
        }
        
        showToast("🔐 Probando login Docker...");
        
        backendClient.login(email, password, new BackendClient.BackendCallback() {
            @Override
            public void onSuccess(com.google.gson.JsonObject response) {
                runOnUiThread(() -> {
                    showToast("✅ Login Docker exitoso!");
                    speakText("Login con Docker exitoso");
                    
                    // Obtener token JWT
                    String token = response.get("token").getAsString();
                    com.google.gson.JsonObject user = response.getAsJsonObject("user");
                    
                    // Guardar token en SharedPreferences
                    SharedPreferences prefs = getSharedPreferences("MiRutinaVisual", MODE_PRIVATE);
                    prefs.edit()
                        .putString("docker_jwt_token", token)
                        .putString("docker_user_email", user.get("email").getAsString())
                        .putString("docker_user_name", user.get("name").getAsString())
                        .putBoolean("logged_with_docker", true)
                        .apply();
                    
                    showToast("🎯 Token JWT guardado. Redirigiendo...");
                    
                    // Ir a MainActivity
                    navigateToMainActivity();
                });
            }
            
            @Override
            public void onError(String error) {
                runOnUiThread(() -> {
                    if (error.contains("no registrado") || error.contains("USER_NOT_FOUND")) {
                        showToast("❌ Usuario no registrado");
                        speakText("No puede conectarse. Tiene que registrarse primero. Por favor cree una cuenta Docker.");
                    } else if (error.contains("Contraseña incorrecta")) {
                        showToast("❌ Contraseña incorrecta");
                        speakText("La contraseña es incorrecta. Intente de nuevo.");
                    } else if (error.contains("Error de conexión")) {
                        showToast("❌ Sin conexión");
                        speakText("No se pudo conectar. Verifique su conexión a internet.");
                    } else {
                        showToast("❌ Error de login");
                        speakText("Error al iniciar sesión. Intente de nuevo.");
                    }
                });
            }
        });
    }
    
    // Método para registrar usuario Docker
    private void registerDockerUser() {
        String email = emailEditText.getText().toString().trim();
        String password = passwordEditText.getText().toString().trim();
        
        if (TextUtils.isEmpty(email) || TextUtils.isEmpty(password)) {
            showToast("⚠️ Ingresa email y contraseña para registrarte");
            speakText("Por favor ingresa email y contraseña");
            return;
        }
        
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            showToast("⚠️ Formato de email inválido");
            speakText("El formato del email no es válido");
            return;
        }
        
        if (password.length() < 4) {
            showToast("⚠️ La contraseña debe tener al menos 4 caracteres");
            speakText("La contraseña es muy corta");
            return;
        }
        
        showToast("🆕 Registrando usuario Docker...");
        
        // Conectar con backend Docker
        backendClient.register(email, password, new BackendClient.BackendCallback() {
            @Override
            public void onSuccess(com.google.gson.JsonObject response) {
                runOnUiThread(() -> {
                    showToast("✅ Usuario Docker registrado exitosamente!");
                    speakText("Usuario Docker registrado exitosamente. Ahora puede hacer login.");
                    
                    // Limpiar campos
                    emailEditText.setText("");
                    passwordEditText.setText("");
                });
            }
            
            @Override
            public void onError(String error) {
                runOnUiThread(() -> {
                    if (error.contains("ya está registrado") || error.contains("ya existe")) {
                        showToast("❌ Usuario ya existe");
                        speakText("Este usuario ya está registrado. Intente hacer login.");
                    } else if (error.contains("Error de conexión")) {
                        showToast("❌ Sin conexión");
                        speakText("No se pudo conectar. Verifique su conexión a internet.");
                    } else {
                        showToast("❌ Error de registro");
                        speakText("Error al registrar usuario. Intente de nuevo.");
                    }
                });
            }
        });
    }

    @Override
    protected void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
    }
}
