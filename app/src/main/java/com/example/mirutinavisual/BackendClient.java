package com.example.mirutinavisual;

import android.content.Context;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;

public class BackendClient {
    private static final String TAG = "BackendClient";
    
    // URL del backend Docker (cambiar según tu configuración)
    private static final String BASE_URL = "https://mirutinavisual-backend-route-https-msazol1-dev.apps.rm2.thpm.p1.openshiftapps.com"; // OpenShift
    // private static final String BASE_URL = "http://10.0.2.2:3000"; // Para emulador local
    // private static final String BASE_URL = "http://192.168.5.235:3000"; // Tu IP real
    
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    private OkHttpClient client;
    private Gson gson;
    
    public BackendClient() {
        // Configurar logging para debug
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);
        
        // Crear cliente HTTP
        client = new OkHttpClient.Builder()
                .addInterceptor(logging)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
                
        gson = new Gson();
    }
    
    // Interface para callbacks
    public interface BackendCallback {
        void onSuccess(JsonObject response);
        void onError(String error);
    }
    
    // Verificar salud del servidor
    public void checkHealth(BackendCallback callback) {
        Request request = new Request.Builder()
                .url(BASE_URL + "/health")
                .build();
                
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Error checking health: " + e.getMessage());
                callback.onError("No se pudo conectar al servidor");
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseBody = response.body().string();
                    JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
                    callback.onSuccess(jsonResponse);
                } else {
                    callback.onError("Error del servidor: " + response.code());
                }
            }
        });
    }
    
    // Registrar usuario Docker
    public void register(String email, String password, BackendCallback callback) {
        JsonObject registerData = new JsonObject();
        registerData.addProperty("email", email);
        registerData.addProperty("password", password);
        
        RequestBody body = RequestBody.create(gson.toJson(registerData), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/auth/register")
                .post(body)
                .build();
                
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Error en registro: " + e.getMessage());
                callback.onError("Error de conexión");
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = response.body().string();
                JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
                
                if (response.isSuccessful()) {
                    callback.onSuccess(jsonResponse);
                } else {
                    String error = jsonResponse.has("error") ? 
                        jsonResponse.get("error").getAsString() : 
                        "Error desconocido";
                    callback.onError(error);
                }
            }
        });
    }

    // Login directo (validación real)
    public void login(String email, String password, BackendCallback callback) {
        JsonObject loginData = new JsonObject();
        loginData.addProperty("email", email);
        loginData.addProperty("password", password);
        
        RequestBody body = RequestBody.create(gson.toJson(loginData), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/auth/login")
                .post(body)
                .build();
                
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Error en login: " + e.getMessage());
                callback.onError("Error de conexión");
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = response.body().string();
                JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
                
                if (response.isSuccessful()) {
                    callback.onSuccess(jsonResponse);
                } else {
                    String error = jsonResponse.has("error") ? 
                        jsonResponse.get("error").getAsString() : 
                        "Error desconocido";
                    callback.onError(error);
                }
            }
        });
    }
    
    // Verificar token JWT
    public void verifyToken(String token, BackendCallback callback) {
        JsonObject tokenData = new JsonObject();
        tokenData.addProperty("token", token);
        
        RequestBody body = RequestBody.create(gson.toJson(tokenData), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/auth/verify")
                .post(body)
                .build();
                
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Error verificando token: " + e.getMessage());
                callback.onError("Error de conexión: " + e.getMessage());
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = response.body().string();
                JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
                
                if (response.isSuccessful()) {
                    callback.onSuccess(jsonResponse);
                } else {
                    String error = jsonResponse.has("error") ? 
                        jsonResponse.get("error").getAsString() : 
                        "Token inválido";
                    callback.onError(error);
                }
            }
        });
    }
    
    // Obtener datos del usuario (requiere token)
    public void getUserData(String token, BackendCallback callback) {
        Request request = new Request.Builder()
                .url(BASE_URL + "/api/user")
                .addHeader("Authorization", "Bearer " + token)
                .build();
                
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Error obteniendo datos: " + e.getMessage());
                callback.onError("Error de conexión: " + e.getMessage());
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = response.body().string();
                JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
                
                if (response.isSuccessful()) {
                    callback.onSuccess(jsonResponse);
                } else {
                    String error = jsonResponse.has("error") ? 
                        jsonResponse.get("error").getAsString() : 
                        "Error obteniendo datos";
                    callback.onError(error);
                }
            }
        });
    }
    
    // URL para OAuth2.0 con Google
    public String getGoogleOAuthUrl() {
        return BASE_URL + "/auth/google";
    }
    
    // Enviar log al servidor
    public void sendLog(String token, String level, String message, BackendCallback callback) {
        JsonObject logData = new JsonObject();
        logData.addProperty("level", level);
        logData.addProperty("message", message);
        logData.addProperty("timestamp", System.currentTimeMillis());
        
        RequestBody body = RequestBody.create(gson.toJson(logData), JSON);
        Request request = new Request.Builder()
                .url(BASE_URL + "/api/log")
                .addHeader("Authorization", "Bearer " + token)
                .post(body)
                .build();
                
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Error enviando log: " + e.getMessage());
                if (callback != null) callback.onError("Error enviando log");
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (callback != null) {
                    if (response.isSuccessful()) {
                        JsonObject jsonResponse = gson.fromJson(response.body().string(), JsonObject.class);
                        callback.onSuccess(jsonResponse);
                    } else {
                        callback.onError("Error del servidor");
                    }
                }
            }
        });
    }
}
