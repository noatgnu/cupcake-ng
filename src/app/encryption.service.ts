import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private keyExchangeCompleted: Set<string> = new Set();
  keyPair: CryptoKeyPair | null = null;
  private peerPublicKeys: Map<string, CryptoKey> = new Map();
  private _encryptionEnabled = new BehaviorSubject<boolean>(false);
  encryptionEnabled$ = this._encryptionEnabled.asObservable();

  constructor() {}

  get isEncryptionEnabled(): boolean {
    return this._encryptionEnabled.value;
  }

  set encryptionEnabled(value: boolean) {
    this._encryptionEnabled.next(value);
  }

  /**
   * Generate RSA key pair for asymmetric encryption
   */
  async generateKeyPair(): Promise<boolean> {
    try {
      this.keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );
      //this._encryptionEnabled.next(true);
      console.log("Encryption keys generated");
      return true;
    } catch (error) {
      console.error("Error generating encryption keys:", error);
      return false;
    }
  }

  /**
   * Export public key to share with peers
   */
  async exportPublicKey(): Promise<string | null> {
    if (!this.keyPair?.publicKey) {
      return null;
    }

    try {
      const exportedKey = await window.crypto.subtle.exportKey(
        "spki",
        this.keyPair.publicKey
      );

      return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    } catch (error) {
      console.error("Error exporting public key:", error);
      return null;
    }
  }

  /**
   * Import a peer's public key
   */
  async importPeerPublicKey(peerId: string, publicKeyString: string): Promise<boolean> {
    try {
      const binaryString = atob(publicKeyString);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const publicKey = await window.crypto.subtle.importKey(
        "spki",
        bytes.buffer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["encrypt"]
      );

      this.peerPublicKeys.set(peerId, publicKey);
      this.keyExchangeCompleted.add(peerId);
      console.log(`Imported public key for peer ${peerId}`);
      return true;
    } catch (error) {
      console.error("Error importing peer public key:", error);
      return false;
    }
  }

  /**
   * Check if we have a public key for a specific peer
   */
  hasPeerPublicKey(peerId: string): boolean {
    return this.peerPublicKeys.has(peerId);
  }

  async encryptData(peerId: string, data: string): Promise<string | null> {
    if (!this.isEncryptionEnabled) {
      return null;
    }

    const peerPublicKey = this.peerPublicKeys.get(peerId);
    if (!peerPublicKey) {
      return null;
    }

    try {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(data);

      // Generate AES key for the actual data encryption
      const aesKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt"]
      );

      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the data with AES
      const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encoded
      );

      // Export AES key
      const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

      // Encrypt the AES key with RSA
      const encryptedKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        peerPublicKey,
        exportedAesKey
      );

      // Combine everything for transmission
      return JSON.stringify({
        encrypted: true,
        key: btoa(String.fromCharCode(...new Uint8Array(encryptedKey))),
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(encryptedData)))
      });
    } catch (error) {
      console.error("Encryption error:", error);
      return null;
    }
  }

  /**
   * Decrypt data from a peer
   */
  async decryptData(encryptedMessage: string): Promise<string | null> {
    if (!this.isEncryptionEnabled || !this.keyPair?.privateKey) {
      return null;
    }

    try {
      const message = JSON.parse(encryptedMessage);

      if (!message.encrypted) {
        return null;
      }

      // Decode the encrypted key
      const encryptedKeyBinary = atob(message.key);
      const encryptedKeyArray = new Uint8Array(encryptedKeyBinary.length);
      for (let i = 0; i < encryptedKeyBinary.length; i++) {
        encryptedKeyArray[i] = encryptedKeyBinary.charCodeAt(i);
      }

      // Decrypt the AES key with our private key
      const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        this.keyPair.privateKey,
        encryptedKeyArray.buffer
      );

      // Import the AES key
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        decryptedKeyBuffer,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      // Decode the IV
      const ivBinary = atob(message.iv);
      const iv = new Uint8Array(ivBinary.length);
      for (let i = 0; i < ivBinary.length; i++) {
        iv[i] = ivBinary.charCodeAt(i);
      }

      // Decode the encrypted data
      const encryptedDataBinary = atob(message.data);
      const encryptedDataArray = new Uint8Array(encryptedDataBinary.length);
      for (let i = 0; i < encryptedDataBinary.length; i++) {
        encryptedDataArray[i] = encryptedDataBinary.charCodeAt(i);
      }

      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encryptedDataArray.buffer
      );

      // Decode the decrypted data
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  }

  /**
   * Check if a message is encrypted
   */
  isEncryptedMessage(message: string): boolean {
    try {
      const parsed = JSON.parse(message);
      return parsed.encrypted === true;
    } catch {
      return false;
    }
  }

  hasCompletedKeyExchange(peerId: string): boolean {
    return this.keyExchangeCompleted.has(peerId);
  }

  reset(): void {
    this.keyPair = null;
    this.peerPublicKeys.clear();
    this.keyExchangeCompleted.clear();
    this._encryptionEnabled.next(false);
  }

  removePeerPublicKey(peerId: string): void {
    this.peerPublicKeys.delete(peerId);
  }
}
