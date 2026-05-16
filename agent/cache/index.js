import Store from 'electron-store';
import crypto from 'crypto';

const schema = {
  socketStatus: { type: 'string', default: 'offline' },
  retryQueue: { type: 'array', default: [] },
  secureToken: { type: 'string', default: '' },
  projectContext: { type: 'object', default: {} }
};

const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.cwd()).digest();
const IV = Buffer.alloc(16, 0);

function encrypt(value) {
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(value) {
  if (!value) {
    return '';
  }
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(value, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function createCache() {
  const store = new Store({ schema, name: 'floating-ai-cache' });

  return {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    delete: (key) => store.delete(key),
    setSecureToken: (token) => store.set('secureToken', encrypt(token)),
    getSecureToken: () => decrypt(store.get('secureToken')),
    clearSecureToken: () => store.delete('secureToken')
  };
}
