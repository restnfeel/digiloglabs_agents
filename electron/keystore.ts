import Store from 'electron-store';

const SERVICE_NAME = 'digiloglabs-agents';
const OPENROUTER_ACCOUNT = 'openrouter-api-key';
const STORE_KEY_OPENROUTER = 'openrouter-api-key-fallback';

const store = new Store<{
  'digilog-jwt': string | null;
  'custom-keys': Record<string, string>;
  [STORE_KEY_OPENROUTER]: string | null;
}>({
  encryptionKey: 'dlabs-agents-2026',
  name: 'secure-config',
});

async function getKeytar(): Promise<typeof import('keytar') | null> {
  try {
    return await import('keytar');
  } catch {
    return null;
  }
}

export const keystore = {
  async getOpenRouterKey(): Promise<string | null> {
    const keytar = await getKeytar();
    if (keytar) {
      const value = await keytar.getPassword(SERVICE_NAME, OPENROUTER_ACCOUNT);
      if (value) return value;
    }
    return store.get(STORE_KEY_OPENROUTER, null);
  },

  async setOpenRouterKey(key: string): Promise<void> {
    const keytar = await getKeytar();
    if (keytar) {
      await keytar.setPassword(SERVICE_NAME, OPENROUTER_ACCOUNT, key);
    }
    store.set(STORE_KEY_OPENROUTER, key);
  },

  async deleteOpenRouterKey(): Promise<void> {
    const keytar = await getKeytar();
    if (keytar) {
      try {
        await keytar.deletePassword(SERVICE_NAME, OPENROUTER_ACCOUNT);
      } catch {
        /* ignore */
      }
    }
    store.delete(STORE_KEY_OPENROUTER);
  },

  getDigilogToken(): string | null {
    return store.get('digilog-jwt', null);
  },

  setDigilogToken(token: string): void {
    store.set('digilog-jwt', token);
  },

  clearDigilogToken(): void {
    store.delete('digilog-jwt');
  },

  getCustomKey(name: string): string | null {
    const keys = store.get('custom-keys', {});
    return keys[name] ?? null;
  },

  setCustomKey(name: string, value: string): void {
    const keys = store.get('custom-keys', {});
    store.set('custom-keys', { ...keys, [name]: value });
  },
};
