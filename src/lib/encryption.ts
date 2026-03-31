import crypto from 'crypto';

const getKeys = () => {
    // These should be set in your frontend .env.local
    const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY_HEX || '0000000000000000000000000000000000000000000000000000000000000000';
    const IV_HEX = process.env.ENCRYPTION_IV_HEX || '00000000000000000000000000000000';

    return {
        key: Buffer.from(ENCRYPTION_KEY_HEX, 'hex'),
        iv: Buffer.from(IV_HEX, 'hex'),
        ivHex: IV_HEX
    };
};

export function encrypt(data: string) {
  try {
    const { key, iv } = getKeys();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const urlSafeEncrypted = encrypted
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return encodeURIComponent(urlSafeEncrypted);
  } catch (e: any) {
    console.error('Encryption error:', e);
    throw new Error(`Encryption failed: ${e.message}`);
  }
}

export function decrypt(encryptedUrlParam: string) {
  if (!encryptedUrlParam) throw new Error('No token provided');
  
  try {
    const { key, iv, ivHex } = getKeys();
    const decoded = decodeURIComponent(encryptedUrlParam);
    
    let encryptedBase64UrlSafe = decoded;
    if (decoded.includes(':')) {
        const parts = decoded.split(':');
        if (parts[0] !== ivHex) throw new Error('Token IV mismatch');
        encryptedBase64UrlSafe = parts[1];
    } 
    
    let encrypted = encryptedBase64UrlSafe.replace(/-/g, '+').replace(/_/g, '/');
    while (encrypted.length % 4) encrypted += '=';

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (e: any) {
    throw new Error('Decryption Failed: ' + e.message);
  }
}
