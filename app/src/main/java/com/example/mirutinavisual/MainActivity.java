package com.example.mirutinavisual;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.text.InputType;
import android.view.View;
import android.widget.EditText;
import androidx.appcompat.app.AlertDialog;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.util.Locale;

public class MainActivity extends AppCompatActivity implements TextToSpeech.OnInitListener {

    private TextToSpeech textToSpeech;
    private TextView welcomeText, userNameText;
    private ImageView profileImage;
    private ImageButton settingsButton;
    private CardView todayRoutineCard, profileCard, caregiverCard, childModeCard;
    private SharedPreferences sharedPreferences;
    private FirebaseAuth firebaseAuth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        
        // Inicializar Firebase Auth
        firebaseAuth = FirebaseAuth.getInstance();
        
        // Inicializar Text-to-Speech
        textToSpeech = new TextToSpeech(this, this);
        
        // Inicializar SharedPreferences por usuario
        String userId = getCurrentUserId();
        sharedPreferences = getSharedPreferences("UserProfile_" + userId, MODE_PRIVATE);
        
        // Verificar si viene de una notificación
        checkNotificationIntent();
        
        // Inicializar vistas
        initViews();
        
        // Configurar listeners
        setupClickListeners();
        
        // Cargar datos del usuario
        loadUserData();
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
        
        // Mensaje de bienvenida con voz
        speakText("¡Bienvenido a Mi Rutina Visual!");
    }

    private void initViews() {
        welcomeText = findViewById(R.id.welcomeText);
        userNameText = findViewById(R.id.userNameText);
        profileImage = findViewById(R.id.profileImage);
        settingsButton = findViewById(R.id.settingsButton);
        
        todayRoutineCard = findViewById(R.id.todayRoutineCard);
        profileCard = findViewById(R.id.profileCard);
        caregiverCard = findViewById(R.id.caregiverCard);
        childModeCard = findViewById(R.id.childModeCard);
    }

    private void setupClickListeners() {
        todayRoutineCard.setOnClickListener(v -> {
            speakText("Abriendo mi rutina de hoy");
            Intent intent = new Intent(MainActivity.this, TodayRoutineActivity.class);
            startActivity(intent);
        });


        profileCard.setOnClickListener(v -> {
            speakText("Abriendo mi perfil");
            Intent intent = new Intent(MainActivity.this, ProfileActivity.class);
            startActivity(intent);
        });

        caregiverCard.setOnClickListener(v -> {
            speakText("Acceso restringido. Ingrese contraseña del cuidador");
            showCaregiverPasswordDialog();
        });

        childModeCard.setOnClickListener(v -> {
            speakText("Acceso restringido. Ingrese PIN del niño");
            showChildPinDialog();
        });

        settingsButton.setOnClickListener(v -> {
            speakText("Cerrar sesión");
            firebaseAuth.signOut();
            Intent intent = new Intent(MainActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
        });

        profileImage.setOnClickListener(v -> {
            speakText("Mi foto de perfil");
            showToast("Toca para cambiar foto");
        });
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            // Configurar idioma español
            int result = textToSpeech.setLanguage(new Locale("es", "ES"));
            
            if (result == TextToSpeech.LANG_MISSING_DATA || 
                result == TextToSpeech.LANG_NOT_SUPPORTED) {
                // Si español no está disponible, usar inglés
                textToSpeech.setLanguage(Locale.US);
            }
            
            // Configurar velocidad de habla más lenta para mejor comprensión
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
            String activityName = intent.getStringExtra("activity_name");
            String activityId = intent.getStringExtra("activity_id");
            
            if (activityName != null) {
                System.out.println("MAIN: Usuario llegó desde notificación de: " + activityName);
                showToast("🔔 Recordatorio: " + activityName);
                speakText("Tienes un recordatorio para " + activityName + ". Puedes ir a Mi Rutina de Hoy para verlo.");
                
                // Opcional: Resaltar el botón "Mi Rutina de Hoy"
                highlightTodayRoutineButton();
            }
        }
    }
    
    // Método para resaltar visualmente el botón de rutina de hoy
    private void highlightTodayRoutineButton() {
        if (todayRoutineCard != null) {
            // Animación sutil para llamar la atención
            todayRoutineCard.animate()
                .scaleX(1.05f)
                .scaleY(1.05f)
                .setDuration(300)
                .withEndAction(() -> {
                    todayRoutineCard.animate()
                        .scaleX(1.0f)
                        .scaleY(1.0f)
                        .setDuration(300)
                        .start();
                })
                .start();
        }
    }

    private void loadUserData() {
        // Obtener usuario de Firebase
        FirebaseUser currentUser = firebaseAuth.getCurrentUser();
        
        // Actualizar SharedPreferences con el usuario actual
        if (currentUser != null) {
            String userId = currentUser.getUid();
            sharedPreferences = getSharedPreferences("UserProfile_" + userId, MODE_PRIVATE);
        }
        
        String userName = sharedPreferences.getString("user_name", "");
        if (!userName.isEmpty()) {
            welcomeText.setText("¡Hola " + userName + "!");
            userNameText.setText("Mi Rutina Visual");
        } else if (currentUser != null && currentUser.getEmail() != null) {
            // Usar email de Firebase si no hay nombre local
            String email = currentUser.getEmail();
            String displayName = email.substring(0, email.indexOf("@"));
            welcomeText.setText("¡Hola " + displayName + "!");
            userNameText.setText("Mi Rutina Visual");
        } else {
            welcomeText.setText("¡Hola!");
            userNameText.setText("Configura tu perfil");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Actualizar datos del usuario cuando regrese de la pantalla de perfil
        loadUserData();
    }
    
    private String getCurrentUserId() {
        FirebaseUser user = firebaseAuth.getCurrentUser();
        if (user != null) {
            return user.getUid();
        }
        return "default_user"; // Fallback
    }

    private void showCaregiverPasswordDialog() {
        // Crear el diálogo de contraseña
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("🔐 Acceso de Cuidador");
        builder.setMessage("Solo el cuidador puede acceder a esta sección.\nIngrese su contraseña:");

        // Crear campo de contraseña
        final EditText passwordInput = new EditText(this);
        passwordInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);
        passwordInput.setHint("Contraseña del cuidador");
        passwordInput.setTextSize(18);
        passwordInput.setTextColor(0xFF000000); // Negro
        passwordInput.setHintTextColor(0xFF888888); // Gris
        passwordInput.setPadding(50, 30, 50, 30);
        passwordInput.setBackgroundResource(android.R.drawable.edit_text);
        
        builder.setView(passwordInput);

        // Botón Acceder
        builder.setPositiveButton("🔑 Acceder", (dialog, which) -> {
            String enteredPassword = passwordInput.getText().toString().trim();
            
            if (enteredPassword.isEmpty()) {
                speakText("Debe ingresar una contraseña");
                showToast("Debe ingresar una contraseña");
                return;
            }
            
            // Verificar contraseña con Firebase Auth
            verifyPasswordAndAccess(enteredPassword);
        });

        // Botón Cancelar
        builder.setNegativeButton("❌ Cancelar", (dialog, which) -> {
            speakText("Acceso cancelado");
            dialog.dismiss();
        });

        AlertDialog dialog = builder.create();
        dialog.show();
        
        // Hacer que el diálogo sea más accesible
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextSize(16);
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextSize(16);
    }

    private void verifyPasswordAndAccess(String password) {
        // Obtener el email del usuario actual
        FirebaseUser currentUser = firebaseAuth.getCurrentUser();
        if (currentUser == null || currentUser.getEmail() == null) {
            speakText("Error de autenticación");
            showToast("Error de autenticación");
            return;
        }

        String email = currentUser.getEmail();
        
        // Intentar autenticar con la contraseña ingresada
        firebaseAuth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    // Contraseña correcta - acceder al modo cuidador
                    speakText("Acceso autorizado. Entrando al modo cuidador");
                    showToast("✅ Acceso autorizado");
                    
                    Intent intent = new Intent(MainActivity.this, CaregiverModeActivity.class);
                    startActivity(intent);
                } else {
                    // Contraseña incorrecta
                    speakText("Contraseña incorrecta. Acceso denegado");
                    showToast("❌ Contraseña incorrecta");
                }
            })
            .addOnFailureListener(e -> {
                speakText("Error al verificar contraseña");
                showToast("Error al verificar contraseña: " + e.getMessage());
            });
    }

    private void showChildPinDialog() {
        // Crear diálogo personalizado
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        
        // Crear vista personalizada
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_child_pin, null);
        builder.setView(dialogView);
        
        AlertDialog dialog = builder.create();
        dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        
        // Inicializar vistas del diálogo
        setupPinDialogViews(dialogView, dialog);
        
        dialog.show();
        
        // Obtener PIN para mensaje de audio dinámico - MISMO MÉTODO
        SharedPreferences audioPrefs = getSharedPreferences("MiRutinaVisual", MODE_PRIVATE);
        FirebaseUser audioUser = firebaseAuth.getCurrentUser();
        String audioUserId = (audioUser != null) ? audioUser.getUid() : "default";
        
        speakText("Ingresa tu PIN secreto de 4 dígitos para entrar");
    }

    private void verifyChildPin(String enteredPin) {
        // Obtener PIN guardado - MISMO MÉTODO QUE EN setupPinDialogViews
        SharedPreferences sharedPreferences = getSharedPreferences("MiRutinaVisual", MODE_PRIVATE);
        FirebaseUser currentUser = firebaseAuth.getCurrentUser();
        String userId = (currentUser != null) ? currentUser.getUid() : "default";
        
        // LEER PIN ESPECÍFICO POR USUARIO - COMO QUERÍAS ORIGINALMENTE
        String correctPin = sharedPreferences.getString("child_pin_" + userId, "1234");
        
        // DEBUG: Verificación
        System.out.println("VERIFY PIN - UserID: " + userId);
        System.out.println("VERIFY PIN - Ingresado: " + enteredPin);
        System.out.println("VERIFY PIN - Correcto: " + correctPin);
        showToast("VERIFY: Ingresado=" + enteredPin + " vs Correcto=" + correctPin);
        
        if (enteredPin.isEmpty()) {
            speakText("Debe ingresar el PIN");
            showToast("Debe ingresar el PIN");
            return;
        }
        
        if (enteredPin.equals(correctPin)) {
            // PIN correcto - ir a ChildModeActivity
            speakText("PIN correcto. Entrando al modo niño");
            showToast("✅ Acceso autorizado");
            
            Intent intent = new Intent(MainActivity.this, ChildModeActivity.class);
            startActivity(intent);
        } else {
            // PIN incorrecto
            speakText("PIN incorrecto. Acceso denegado");
            showToast("❌ PIN incorrecto");
        }
    }

    private void setupPinDialogViews(View dialogView, AlertDialog dialog) {
        // Variables para el PIN
        StringBuilder currentPin = new StringBuilder();
        View[] pinDots = new View[6];
        
        // Inicializar indicadores de PIN
        pinDots[0] = dialogView.findViewById(R.id.pinDot1);
        pinDots[1] = dialogView.findViewById(R.id.pinDot2);
        pinDots[2] = dialogView.findViewById(R.id.pinDot3);
        pinDots[3] = dialogView.findViewById(R.id.pinDot4);
        pinDots[4] = dialogView.findViewById(R.id.pinDot5);
        pinDots[5] = dialogView.findViewById(R.id.pinDot6);
        
        // Obtener PIN guardado para ajustar UI dinámicamente
        SharedPreferences sharedPreferences = getSharedPreferences("MiRutinaVisual", MODE_PRIVATE);
        FirebaseUser currentUser = firebaseAuth.getCurrentUser();
        String userId = (currentUser != null) ? currentUser.getUid() : "default";
        
        // LEER PIN ESPECÍFICO POR USUARIO - COMO QUERÍAS ORIGINALMENTE
        String correctPin = sharedPreferences.getString("child_pin_" + userId, "1234");
        
        // SIEMPRE 4 DÍGITOS
        int pinLength = 4;
        
        // DEBUG: Mostrar TODA la información
        System.out.println("MAIN DEBUG - Leyendo PIN...");
        System.out.println("MAIN DEBUG - Key buscada: child_pin_" + userId);
        System.out.println("MAIN DEBUG - PIN encontrado: " + correctPin);
        
        // CREAR NUEVO SHAREDPREFERENCES PARA VERIFICAR
        SharedPreferences verificarMain = getSharedPreferences("MiRutinaVisual", MODE_PRIVATE);
        String verificarPinMain = verificarMain.getString("child_pin_" + userId, "NO_ENCONTRADO");
        System.out.println("MAIN DEBUG - Con nuevo SP: " + verificarPinMain);
        
        showToast("🔍 MAIN LEE: " + correctPin + " | VERIFICA: " + verificarPinMain);
        
        // Actualizar mensaje de instrucciones
        TextView pinInstructionText = dialogView.findViewById(R.id.pinInstructionText);
        pinInstructionText.setText("Ingresa tu PIN secreto (4 dígitos)");
        
        // MOSTRAR SOLO 4 CÍRCULOS
        for (int i = 0; i < 4; i++) {
            pinDots[i].setVisibility(View.VISIBLE);
        }
        for (int i = 4; i < 6; i++) {
            pinDots[i].setVisibility(View.GONE);
        }
        
        // Configurar botones numéricos
        int[] numberButtons = {R.id.btn0, R.id.btn1, R.id.btn2, R.id.btn3, R.id.btn4, 
                              R.id.btn5, R.id.btn6, R.id.btn7, R.id.btn8, R.id.btn9};
        
        for (int i = 0; i < numberButtons.length; i++) {
            final int number = (i == 0) ? 0 : i; // btn0 es el primer elemento pero representa 0
            dialogView.findViewById(numberButtons[i]).setOnClickListener(v -> {
                if (currentPin.length() < pinLength) {
                    currentPin.append(number);
                    updatePinDots(pinDots, currentPin.length(), pinLength);
                    speakText(String.valueOf(number));
                    
                    // Verificar PIN automáticamente cuando esté completo
                    if (currentPin.length() == pinLength) {
                        new android.os.Handler().postDelayed(() -> {
                            verifyChildPin(currentPin.toString());
                            dialog.dismiss();
                        }, 300);
                    }
                }
            });
        }
        
        // Botón borrar
        dialogView.findViewById(R.id.btnDelete).setOnClickListener(v -> {
            if (currentPin.length() > 0) {
                currentPin.deleteCharAt(currentPin.length() - 1);
                updatePinDots(pinDots, currentPin.length(), pinLength);
                speakText("Borrar");
            }
        });
        
        // Botón cancelar
        dialogView.findViewById(R.id.btnCancel).setOnClickListener(v -> {
            speakText("Acceso cancelado");
            dialog.dismiss();
        });
    }
    
    private void updatePinDots(View[] pinDots, int filledCount, int totalCount) {
        for (int i = 0; i < totalCount; i++) {
            if (i < filledCount) {
                pinDots[i].setBackgroundResource(R.drawable.pin_dot_filled);
            } else {
                pinDots[i].setBackgroundResource(R.drawable.pin_dot_empty);
            }
        }
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