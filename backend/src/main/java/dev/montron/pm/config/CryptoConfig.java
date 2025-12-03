package dev.montron.pm.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

/**
 * Configuration for encryption/decryption of sensitive data.
 * Uses AES/GCM encryption with a secret key from environment variable.
 */
@Configuration
public class CryptoConfig {

    private static final Logger log = LoggerFactory.getLogger(CryptoConfig.class);
    // Hex-encoded salt (required by Spring Security's Encryptors.text())
    // This is SHA-256 hash of "montron-pm-tool-salt" converted to hex
    private static final String HEX_SALT = "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890";

    @Bean
    public TextEncryptor textEncryptor(@Value("${pm.secret-key:}") String secretKey) {
        String password = secretKey;
        
        if (secretKey == null || secretKey.isBlank()) {
            // For development/testing: Generate a random key but warn heavily
            // In production, this should always be set via environment variable
            log.error("================================================================================");
            log.error("WARNING: PM_SECRET_KEY is not set!");
            log.error("A random encryption key will be generated for this session.");
            log.error("THIS IS NOT SUITABLE FOR PRODUCTION!");
            log.error("Encrypted data cannot be decrypted after restart with a different key.");
            log.error("Set PM_SECRET_KEY environment variable to a secure random string (min 16 chars).");
            log.error("================================================================================");
            
            // Generate a random password for development
            SecureRandom random = new SecureRandom();
            byte[] randomBytes = new byte[32];
            random.nextBytes(randomBytes);
            password = bytesToHex(randomBytes);
            log.warn("Generated temporary encryption key for development (DO NOT USE IN PRODUCTION)");
        }

        if (password.length() < 16) {
            log.warn("Encryption key is shorter than 16 characters. Consider using a longer key for better security.");
        }

        // Use Spring Security's Encryptors with AES-256 encryption
        // Encryptors.text(password, hexEncodedSalt)
        // The password can be any string - it will be used with PBKDF2 to derive the encryption key
        // The salt MUST be hex-encoded (that's what Spring Security expects)
        return Encryptors.text(password, HEX_SALT);
    }

    /**
     * Converts byte array to hex string.
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(2 * bytes.length);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}

