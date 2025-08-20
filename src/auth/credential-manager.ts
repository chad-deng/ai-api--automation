/**
 * Credential Manager
 * Week 3 Sprint 1: Secure credential storage and management for API testing
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { AuthCredentials } from './auth-provider';

export interface CredentialProfile {
  name: string;
  description?: string;
  type: 'bearer' | 'apikey' | 'oauth2' | 'basic';
  credentials: AuthCredentials;
  environment?: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface CredentialStore {
  profiles: Record<string, CredentialProfile>;
  defaultProfile?: string;
  encryptionKey?: string;
}

export class CredentialManager {
  private storePath: string;
  private store: CredentialStore;

  constructor(storePath?: string) {
    this.storePath = storePath || path.join(os.homedir(), '.api-test-automation', 'credentials.json');
    this.store = { profiles: {} };
  }

  /**
   * Initialize credential store
   */
  async initialize(): Promise<void> {
    try {
      await this.ensureStoreDirectory();
      await this.loadStore();
    } catch (error) {
      // Create new store if it doesn't exist
      await this.saveStore();
    }
  }

  /**
   * Add or update credential profile
   */
  async setProfile(profile: CredentialProfile): Promise<void> {
    await this.loadStore();
    
    const existingProfile = this.store.profiles[profile.name];
    const updatedProfile: CredentialProfile = {
      ...profile,
      createdAt: existingProfile?.createdAt || new Date()
    };
    if (existingProfile?.lastUsed) {
      updatedProfile.lastUsed = existingProfile.lastUsed;
    }
    this.store.profiles[profile.name] = updatedProfile;

    await this.saveStore();
  }

  /**
   * Get credential profile
   */
  async getProfile(name: string): Promise<CredentialProfile | null> {
    await this.loadStore();
    
    const profile = this.store.profiles[name];
    if (!profile) {
      return null;
    }

    // Update last used timestamp
    profile.lastUsed = new Date();
    await this.saveStore();

    return profile;
  }

  /**
   * List all credential profiles
   */
  async listProfiles(): Promise<CredentialProfile[]> {
    await this.loadStore();
    
    return Object.values(this.store.profiles).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Delete credential profile
   */
  async deleteProfile(name: string): Promise<boolean> {
    await this.loadStore();
    
    if (!this.store.profiles[name]) {
      return false;
    }

    delete this.store.profiles[name];
    
    // Clear default if it was deleted
    if (this.store.defaultProfile === name) {
      delete this.store.defaultProfile;
    }

    await this.saveStore();
    return true;
  }

  /**
   * Set default profile
   */
  async setDefaultProfile(name: string): Promise<boolean> {
    await this.loadStore();
    
    if (!this.store.profiles[name]) {
      return false;
    }

    this.store.defaultProfile = name;
    await this.saveStore();
    return true;
  }

  /**
   * Get default profile
   */
  async getDefaultProfile(): Promise<CredentialProfile | null> {
    await this.loadStore();
    
    if (!this.store.defaultProfile) {
      return null;
    }

    return this.getProfile(this.store.defaultProfile);
  }

  /**
   * Create profile from environment variables
   */
  createProfileFromEnv(name: string, environment: string = 'development'): CredentialProfile | null {
    // Try to detect auth type and credentials from environment
    const token = process.env.API_TOKEN || process.env.BEARER_TOKEN || process.env.JWT_TOKEN;
    const apiKey = process.env.API_KEY || process.env.X_API_KEY;
    const clientId = process.env.CLIENT_ID || process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET;
    const username = process.env.API_USERNAME || process.env.AUTH_USERNAME;
    const password = process.env.API_PASSWORD || process.env.AUTH_PASSWORD;

    const credentials: AuthCredentials = {};
    let type: CredentialProfile['type'] = 'bearer';

    if (token) {
      type = 'bearer';
      credentials.token = token;
    } else if (apiKey) {
      type = 'apikey';
      credentials.apiKey = apiKey;
    } else if (clientId && clientSecret) {
      type = 'oauth2';
      credentials.clientId = clientId;
      credentials.clientSecret = clientSecret;
      const tokenUrl = process.env.OAUTH_TOKEN_URL;
      const scope = process.env.OAUTH_SCOPE;
      if (tokenUrl) credentials.tokenUrl = tokenUrl;
      if (scope) credentials.scope = scope;
    } else if (username && password) {
      type = 'basic';
      credentials.username = username;
      credentials.password = password;
    } else {
      return null;
    }

    return {
      name,
      description: `Auto-generated profile from environment variables (${environment})`,
      type,
      credentials,
      environment,
      createdAt: new Date()
    };
  }

  /**
   * Validate credentials
   */
  async validateCredentials(profile: CredentialProfile): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!profile.name.trim()) {
      errors.push('Profile name is required');
    }

    switch (profile.type) {
      case 'bearer':
        if (!profile.credentials.token) {
          errors.push('Bearer token is required');
        }
        break;

      case 'apikey':
        if (!profile.credentials.apiKey) {
          errors.push('API key is required');
        }
        break;

      case 'oauth2':
        if (!profile.credentials.clientId) {
          errors.push('OAuth2 client ID is required');
        }
        if (!profile.credentials.clientSecret) {
          errors.push('OAuth2 client secret is required');
        }
        break;

      case 'basic':
        if (!profile.credentials.username) {
          errors.push('Username is required for Basic Auth');
        }
        if (!profile.credentials.password) {
          errors.push('Password is required for Basic Auth');
        }
        break;

      default:
        errors.push(`Invalid authentication type: ${profile.type}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Import credentials from file
   */
  async importFromFile(filePath: string): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      if (data.profiles) {
        for (const [name, profileData] of Object.entries(data.profiles)) {
          try {
            const profile = profileData as CredentialProfile;
            const validation = await this.validateCredentials(profile);
            
            if (validation.valid) {
              await this.setProfile({ ...profile, name });
              imported++;
            } else {
              errors.push(`Profile '${name}': ${validation.errors.join(', ')}`);
            }
          } catch (error) {
            errors.push(`Profile '${name}': Invalid format`);
          }
        }
      }
    } catch (error) {
      errors.push(`Failed to import from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { imported, errors };
  }

  /**
   * Export credentials to file
   */
  async exportToFile(filePath: string, includeSecrets: boolean = false): Promise<void> {
    await this.loadStore();

    const exportData: any = {
      profiles: {},
      exportedAt: new Date().toISOString(),
      includeSecrets
    };

    for (const [name, profile] of Object.entries(this.store.profiles)) {
      const exportProfile: any = {
        name: profile.name,
        description: profile.description,
        type: profile.type,
        environment: profile.environment,
        createdAt: profile.createdAt,
        credentials: {}
      };

      if (includeSecrets) {
        exportProfile.credentials = profile.credentials;
      } else {
        // Export structure without secrets
        for (const key of Object.keys(profile.credentials)) {
          exportProfile.credentials[key] = '[REDACTED]';
        }
      }

      exportData.profiles[name] = exportProfile;
    }

    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
  }

  /**
   * Clear all stored credentials
   */
  async clearAll(): Promise<void> {
    this.store = { profiles: {} };
    await this.saveStore();
  }

  /**
   * Get store statistics
   */
  async getStatistics(): Promise<{
    totalProfiles: number;
    profilesByType: Record<string, number>;
    profilesByEnvironment: Record<string, number>;
    defaultProfile?: string;
    storeSize: number;
  }> {
    await this.loadStore();

    const profiles = Object.values(this.store.profiles);
    const profilesByType: Record<string, number> = {};
    const profilesByEnvironment: Record<string, number> = {};

    profiles.forEach(profile => {
      profilesByType[profile.type] = (profilesByType[profile.type] || 0) + 1;
      const env = profile.environment || 'unknown';
      profilesByEnvironment[env] = (profilesByEnvironment[env] || 0) + 1;
    });

    let storeSize = 0;
    try {
      const stats = await fs.stat(this.storePath);
      storeSize = stats.size;
    } catch {
      // Store doesn't exist yet
    }

    return {
      totalProfiles: profiles.length,
      profilesByType,
      profilesByEnvironment,
      ...(this.store.defaultProfile && { defaultProfile: this.store.defaultProfile }),
      storeSize
    };
  }

  private async ensureStoreDirectory(): Promise<void> {
    const dir = path.dirname(this.storePath);
    await fs.mkdir(dir, { recursive: true });
  }

  private async loadStore(): Promise<void> {
    try {
      const content = await fs.readFile(this.storePath, 'utf8');
      this.store = JSON.parse(content);
      
      // Ensure profiles object exists
      if (!this.store.profiles) {
        this.store.profiles = {};
      }
      
      // Convert date strings back to Date objects
      for (const profile of Object.values(this.store.profiles)) {
        if (typeof profile.createdAt === 'string') {
          profile.createdAt = new Date(profile.createdAt);
        }
        if (profile.lastUsed && typeof profile.lastUsed === 'string') {
          profile.lastUsed = new Date(profile.lastUsed);
        }
      }
    } catch (error) {
      // Store doesn't exist, start with empty store
      this.store = { profiles: {} };
    }
  }

  private async saveStore(): Promise<void> {
    await this.ensureStoreDirectory();
    await fs.writeFile(this.storePath, JSON.stringify(this.store, null, 2));
  }
}