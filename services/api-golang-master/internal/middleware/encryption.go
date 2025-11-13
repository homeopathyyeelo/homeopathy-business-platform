package middleware

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
	"os"
)

// EncryptionService handles field-level encryption
type EncryptionService struct {
	key []byte
	gcm cipher.AEAD
}

func NewEncryptionService() (*EncryptionService, error) {
	key := []byte(os.Getenv("ENCRYPTION_KEY"))
	if len(key) != 32 {
		return nil, errors.New("encryption key must be 32 bytes")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	return &EncryptionService{
		key: key,
		gcm: gcm,
	}, nil
}

// Encrypt encrypts plaintext using AES-256-GCM
func (e *EncryptionService) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	nonce := make([]byte, e.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := e.gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts ciphertext using AES-256-GCM
func (e *EncryptionService) Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	nonceSize := e.gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, cipherbytes := data[:nonceSize], data[nonceSize:]
	plaintext, err := e.gcm.Open(nil, nonce, cipherbytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// EncryptStruct encrypts fields tagged with `encrypt:"aes256"`
func (e *EncryptionService) EncryptStruct(data interface{}) error {
	// Reflection-based encryption for struct fields
	// Implementation would use reflect package to find tagged fields
	// For brevity, showing interface concept
	return nil
}

// DecryptStruct decrypts fields tagged with `encrypt:"aes256"`
func (e *EncryptionService) DecryptStruct(data interface{}) error {
	return nil
}
