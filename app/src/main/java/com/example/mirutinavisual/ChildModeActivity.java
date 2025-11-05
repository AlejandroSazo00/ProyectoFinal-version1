package com.example.mirutinavisual;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.util.Base64;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;

import java.util.Locale;

public class ChildModeActivity extends AppCompatActivity implements TextToSpeech.OnInitListener {

    private TextToSpeech textToSpeech;
    private ImageButton backButton;
    private CardView todayRoutineCard, rewardsCard;
    private TextView welcomeNameText;
    private ImageView profileRewardImage;
    private SharedPreferences sharedPreferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_child_mode);
        
        // Inicializar Text-to-Speech
        textToSpeech = new TextToSpeech(this, this);
        
        // Inicializar SharedPreferences
        sharedPreferences = getSharedPreferences("MiRutinaVisual", MODE_PRIVATE);
        
        // Inicializar vistas
        initViews();
        
        // Configurar listeners
        setupClickListeners();
        
        // Cargar datos del perfil
        loadUserProfile();
        
        // Mensaje de bienvenida personalizado
        String userName = sharedPreferences.getString("user_name", "");
        if (!userName.isEmpty()) {
            speakText("¡Hola " + userName + "! Aquí están tus rutinas y recompensas");
        } else {
            speakText("¡Hola! Aquí están tus rutinas y recompensas");
        }
    }

    private void initViews() {
        backButton = findViewById(R.id.backButton);
        todayRoutineCard = findViewById(R.id.todayRoutineCard);
        rewardsCard = findViewById(R.id.rewardsCard);
        welcomeNameText = findViewById(R.id.welcomeNameText);
        profileRewardImage = findViewById(R.id.profileRewardImage);
    }

    private void setupClickListeners() {
        backButton.setOnClickListener(v -> {
            speakText("Volviendo al menú principal");
            finish();
        });

        todayRoutineCard.setOnClickListener(v -> {
            speakText("Abriendo mi rutina de hoy");
            Intent intent = new Intent(ChildModeActivity.this, TodayRoutineActivity.class);
            startActivity(intent);
        });

        rewardsCard.setOnClickListener(v -> {
            speakText("Viendo mis recompensas");
            Intent intent = new Intent(ChildModeActivity.this, RewardsActivity.class);
            startActivity(intent);
        });
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            int result = textToSpeech.setLanguage(new Locale("es", "ES"));
            
            if (result == TextToSpeech.LANG_MISSING_DATA || 
                result == TextToSpeech.LANG_NOT_SUPPORTED) {
                textToSpeech.setLanguage(Locale.US);
            }
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

    private void loadUserProfile() {
        // Obtener ID del usuario actual
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        String userId = (currentUser != null) ? currentUser.getUid() : "default";
        
        // Cargar nombre específico del usuario
        String userName = sharedPreferences.getString("user_name_" + userId, "");
        if (!userName.isEmpty()) {
            welcomeNameText.setText("¡Hola " + userName + "! 😊");
        } else {
            welcomeNameText.setText("¡Hola! 😊");
        }
        
        // Cargar imagen de perfil específica del usuario
        loadProfileImage(userId);
    }
    
    private void loadProfileImage(String userId) {
        // DEBUG: Mostrar qué está buscando
        System.out.println("CHILD DEBUG - UserID: " + userId);
        System.out.println("CHILD DEBUG - Buscando avatar_type_" + userId);
        
        // PRIMERO: Buscar si hay un pictograma de recompensa
        String avatarType = sharedPreferences.getString("avatar_type_" + userId, "");
        System.out.println("CHILD DEBUG - Avatar type encontrado: '" + avatarType + "'");
        
        if ("pictogram".equals(avatarType)) {
            // Cargar pictograma de recompensa
            String pictogramId = sharedPreferences.getString("avatar_pictogram_id_" + userId, "");
            System.out.println("CHILD DEBUG - Pictogram ID encontrado: '" + pictogramId + "'");
            if (!pictogramId.isEmpty()) {
                loadPictogramAsAvatar(pictogramId);
                return; // Salir aquí si se cargó el pictograma
            }
        }
        
        // SEGUNDO: Si no hay pictograma, buscar imagen de foto
        String imageString = sharedPreferences.getString("profile_image_" + userId, "");
        
        if (!imageString.isEmpty()) {
            try {
                // Decodificar imagen desde Base64
                byte[] decodedString = Base64.decode(imageString, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                
                if (bitmap != null) {
                    // Mostrar imagen de perfil real
                    profileRewardImage.setImageBitmap(bitmap);
                    profileRewardImage.setScaleType(ImageView.ScaleType.CENTER_CROP);
                    profileRewardImage.setPadding(0, 0, 0, 0);
                } else {
                    // Usar ícono por defecto si hay error
                    setDefaultProfileImage();
                }
            } catch (Exception e) {
                // En caso de error, usar ícono por defecto
                setDefaultProfileImage();
            }
        } else {
            // No hay imagen guardada, usar ícono por defecto
            setDefaultProfileImage();
        }
    }
    
    private void loadPictogramAsAvatar(String pictogramId) {
        // Cargar pictograma desde recursos usando el ID
        try {
            // MAPEAR IDs de ARASAAC a recursos locales disponibles
            int resourceId = 0;
            
            // Usar algunos pictogramas genéricos que SÍ existen
            switch (pictogramId) {
                case "2558": // Ejemplo: check o logro
                    resourceId = R.drawable.ic_check; // Ícono de logro/completado
                    break;
                default:
                    // Para cualquier otro ID, usar un ícono de perfil especial
                    resourceId = R.drawable.ic_profile; // Ícono de perfil
                    break;
            }
            
            // Si no se encontró un mapeo específico, intentar buscar por nombre
            if (resourceId == 0) {
                String resourceName = "ic_pictogram_" + pictogramId;
                resourceId = getResources().getIdentifier(resourceName, "drawable", getPackageName());
            }
            
            if (resourceId != 0) {
                // Pictograma encontrado, cargarlo
                profileRewardImage.setImageResource(resourceId);
                profileRewardImage.setScaleType(ImageView.ScaleType.CENTER_CROP);
                profileRewardImage.setPadding(8, 8, 8, 8);
                System.out.println("CHILD MODE: Pictograma cargado con ID: " + resourceId);
            } else {
                // Pictograma no encontrado, usar ícono de perfil genérico
                System.out.println("CHILD MODE: Usando ícono de perfil genérico para ID: " + pictogramId);
                profileRewardImage.setImageResource(R.drawable.ic_profile);
                profileRewardImage.setScaleType(ImageView.ScaleType.CENTER_CROP);
                profileRewardImage.setPadding(8, 8, 8, 8);
            }
        } catch (Exception e) {
            System.out.println("CHILD MODE: Error cargando pictograma: " + e.getMessage());
            setDefaultProfileImage();
        }
    }
    
    private void setDefaultProfileImage() {
        profileRewardImage.setImageResource(R.drawable.ic_person_large);
        profileRewardImage.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        profileRewardImage.setPadding(20, 20, 20, 20);
    }

    @Override
    protected void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Recargar perfil cada vez que regrese a esta actividad
        loadUserProfile();
    }
}
