package dev.montron.pm.integration.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Service for encrypting/decrypting service tokens before storing in the database.
 * Uses AES-256 encryption with a key derived from configuration.
 */
@Service
public class TokenEncryptionService {

    private static final Logger log = LoggerFactory.getLogger(TokenEncryptionService.class);
    private static final String ALGORITHM = "AES";
    private static final int KEY_SIZE = 256;

    private final SecretKey secretKey;

    public TokenEncryptionService(@Value("${form-api.encryption-key:}") String encryptionKey) {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            log.warn("No encryption key configured. Generating a random key (NOT PERSISTENT). " +
                    "Set form-api.encryption-key for production use.");
            this.secretKey = generateRandomKey();
        } else {
            // Use the provided key (should be at least 32 bytes for AES-256)
            byte[] keyBytes = encryptionKey.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 32) {
                log.warn("Encryption key is too short. Padding to 32 bytes.");
                byte[] padded = new byte[32];
                System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
                this.secretKey = new SecretKeySpec(padded, ALGORITHM);
            } else {
                byte[] trimmed = new byte[32];
                System.arraycopy(keyBytes, 0, trimmed, 0, 32);
                this.secretKey = new SecretKeySpec(trimmed, ALGORITHM);
            }
        }
    }

    /**
     * Encrypts a plaintext token for storage in the database.
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return null;
        }

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(encrypted);
        } catch (Exception e) {
            log.error("Failed to encrypt token", e);
            throw new RuntimeException("Failed to encrypt token", e);
        }
    }

    /**
     * Decrypts an encrypted token from the database.
     */
    public String decrypt(String encrypted) {
        if (encrypted == null || encrypted.isBlank()) {
            return null;
        }

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decoded = Base64.getUrlDecoder().decode(encrypted);
            byte[] decrypted = cipher.doFinal(decoded);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to decrypt token", e);
            throw new RuntimeException("Failed to decrypt token", e);
        }
    }

    private SecretKey generateRandomKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
            keyGenerator.init(KEY_SIZE);
            return keyGenerator.generateKey();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate encryption key", e);
        }
    }
}

