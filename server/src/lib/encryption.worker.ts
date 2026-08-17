const ALGORITHM = "AES-GCM";

// Get the master key from env or use a fallback for development (32 bytes)
const MASTER_KEY = "0123456789abcdef0123456789abcdef";

async function importKey(keyString: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  
  if (keyData.length !== 32) {
    throw new Error("MASTER_KEY must be exactly 32 bytes (characters) long for AES-256-GCM");
  }

  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const view = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return view.buffer;
}

export interface WorkerEncryptionResult {
  iv: string;
  authTag: string;
  encryptedBuffer: ArrayBuffer;
}

export const WorkerEncryptionService = {
  async encryptBuffer(data: ArrayBuffer, envKey?: string): Promise<WorkerEncryptionResult> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Standard 96-bit IV for AES-GCM
    const key = await importKey(envKey || MASTER_KEY);
    
    // AES-GCM automatically appends the auth tag at the end of the ciphertext
    const encryptedWithTag = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      data
    );

    // In WebCrypto, the last 16 bytes (128 bits) of the result are the Auth Tag.
    const encryptedBytes = new Uint8Array(encryptedWithTag);
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);
    const authTag = encryptedBytes.slice(encryptedBytes.length - 16);

    return {
      iv: bufferToHex(iv.buffer),
      authTag: bufferToHex(authTag.buffer),
      encryptedBuffer: ciphertext.buffer,
    };
  },

  async decryptBuffer(
    encryptedData: ArrayBuffer, 
    ivHex: string, 
    authTagHex: string,
    envKey?: string
  ): Promise<ArrayBuffer> {
    const key = await importKey(envKey || MASTER_KEY);
    const iv = hexToBuffer(ivHex);
    const authTag = hexToBuffer(authTagHex);
    
    // WebCrypto requires the ciphertext and auth tag to be concatenated
    const combined = new Uint8Array(encryptedData.byteLength + authTag.byteLength);
    combined.set(new Uint8Array(encryptedData), 0);
    combined.set(new Uint8Array(authTag), encryptedData.byteLength);

    return await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: new Uint8Array(iv),
      },
      key,
      combined.buffer
    );
  }
};
