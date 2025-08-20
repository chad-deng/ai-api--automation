/**
 * Credential Manager Tests
 * Week 3 Sprint 1: Comprehensive testing for credential storage and management
 */

import { CredentialManager, CredentialProfile } from '../../src/auth/credential-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('CredentialManager', () => {
  let manager: CredentialManager;
  let testStorePath: string;

  beforeEach(() => {
    const testDir = path.join(os.tmpdir(), 'api-test-credentials-test-' + Date.now());
    testStorePath = path.join(testDir, 'credentials.json');
    manager = new CredentialManager(testStorePath);
  });

  afterEach(async () => {
    try {
      const dir = path.dirname(testStorePath);
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors - directory might not exist
      console.log('Cleanup error (ignored):', error);
    }
  });

  const createTestProfile = (overrides: Partial<CredentialProfile> = {}): CredentialProfile => ({
    name: 'test-profile',
    type: 'bearer',
    credentials: { token: 'test-token-123' },
    environment: 'development',
    createdAt: new Date(),
    ...overrides
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await expect(manager.initialize()).resolves.not.toThrow();
    });

    test('should create store directory if it does not exist', async () => {
      await manager.initialize();
      const dir = path.dirname(testStorePath);
      const stats = await fs.stat(dir);
      expect(stats.isDirectory()).toBe(true);
    });

    test('should handle existing store file', async () => {
      const existingProfile = createTestProfile();
      await manager.initialize();
      await manager.setProfile(existingProfile);

      // Create new manager instance with same store path
      const manager2 = new CredentialManager(testStorePath);
      await manager2.initialize();

      const profiles = await manager2.listProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('test-profile');
    });
  });

  describe('Profile Management', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test('should set and get profile', async () => {
      const profile = createTestProfile();
      await manager.setProfile(profile);

      const retrieved = await manager.getProfile('test-profile');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('test-profile');
      expect(retrieved!.type).toBe('bearer');
      expect(retrieved!.credentials.token).toBe('test-token-123');
    });

    test('should update lastUsed timestamp when getting profile', async () => {
      const profile = createTestProfile();
      await manager.setProfile(profile);

      const before = Date.now();
      const retrieved = await manager.getProfile('test-profile');
      const after = Date.now();

      expect(retrieved!.lastUsed).toBeInstanceOf(Date);
      expect(retrieved!.lastUsed!.getTime()).toBeGreaterThanOrEqual(before);
      expect(retrieved!.lastUsed!.getTime()).toBeLessThanOrEqual(after);
    });

    test('should return null for non-existent profile', async () => {
      const retrieved = await manager.getProfile('non-existent');
      expect(retrieved).toBeNull();
    });

    test('should list all profiles', async () => {
      const profile1 = createTestProfile({ name: 'profile1' });
      const profile2 = createTestProfile({ 
        name: 'profile2', 
        type: 'apikey',
        credentials: { apiKey: 'key-123' }
      });

      await manager.setProfile(profile1);
      await manager.setProfile(profile2);

      const profiles = await manager.listProfiles();
      expect(profiles).toHaveLength(2);
      expect(profiles.map(p => p.name).sort()).toEqual(['profile1', 'profile2']);
    });

    test('should delete profile', async () => {
      const profile = createTestProfile();
      await manager.setProfile(profile);

      const deleted = await manager.deleteProfile('test-profile');
      expect(deleted).toBe(true);

      const retrieved = await manager.getProfile('test-profile');
      expect(retrieved).toBeNull();
    });

    test('should return false when deleting non-existent profile', async () => {
      const deleted = await manager.deleteProfile('non-existent');
      expect(deleted).toBe(false);
    });

    test('should preserve createdAt timestamp when updating profile', async () => {
      const profile = createTestProfile();
      await manager.setProfile(profile);

      // Get the original profile to capture its actual createdAt
      const originalProfile = await manager.getProfile('test-profile');
      const originalDate = originalProfile!.createdAt;

      // Update the same profile
      const updatedProfile = { ...profile, description: 'Updated description' };
      await manager.setProfile(updatedProfile);

      const retrieved = await manager.getProfile('test-profile');
      expect(retrieved!.createdAt).toEqual(originalDate);
      expect(retrieved!.description).toBe('Updated description');
    });
  });

  describe('Default Profile Management', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test('should set and get default profile', async () => {
      const profile = createTestProfile();
      await manager.setProfile(profile);

      const success = await manager.setDefaultProfile('test-profile');
      expect(success).toBe(true);

      const defaultProfile = await manager.getDefaultProfile();
      expect(defaultProfile).not.toBeNull();
      expect(defaultProfile!.name).toBe('test-profile');
    });

    test('should return false when setting non-existent profile as default', async () => {
      const success = await manager.setDefaultProfile('non-existent');
      expect(success).toBe(false);
    });

    test('should return null when no default profile is set', async () => {
      const defaultProfile = await manager.getDefaultProfile();
      expect(defaultProfile).toBeNull();
    });

    test('should clear default when deleting default profile', async () => {
      const profile = createTestProfile();
      await manager.setProfile(profile);
      await manager.setDefaultProfile('test-profile');

      await manager.deleteProfile('test-profile');

      const defaultProfile = await manager.getDefaultProfile();
      expect(defaultProfile).toBeNull();
    });
  });

  describe('Profile Validation', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test('should validate bearer token profile', async () => {
      const profile = createTestProfile();
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject profile without name', async () => {
      const profile = createTestProfile({ name: '' });
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Profile name is required');
    });

    test('should reject bearer profile without token', async () => {
      const profile = createTestProfile({ credentials: {} });
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Bearer token is required');
    });

    test('should validate API key profile', async () => {
      const profile = createTestProfile({
        type: 'apikey',
        credentials: { apiKey: 'test-key' }
      });
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject API key profile without key', async () => {
      const profile = createTestProfile({
        type: 'apikey',
        credentials: {}
      });
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('API key is required');
    });

    test('should validate OAuth2 profile', async () => {
      const profile = createTestProfile({
        type: 'oauth2',
        credentials: {
          clientId: 'client-123',
          clientSecret: 'secret-456'
        }
      });
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject OAuth2 profile without credentials', async () => {
      const profile = createTestProfile({
        type: 'oauth2',
        credentials: { clientId: 'client-123' } // Missing secret
      });
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('OAuth2 client secret is required');
    });

    test('should validate Basic Auth profile', async () => {
      const profile = createTestProfile({
        type: 'basic',
        credentials: {
          username: 'testuser',
          password: 'testpass'
        }
      });
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject Basic Auth profile without credentials', async () => {
      const profile = createTestProfile({
        type: 'basic',
        credentials: { username: 'testuser' } // Missing password
      });
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Password is required for Basic Auth');
    });

    test('should reject invalid authentication type', async () => {
      const profile = createTestProfile({
        type: 'invalid' as any,
        credentials: {}
      });
      const validation = await manager.validateCredentials(profile);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid authentication type: invalid');
    });
  });

  describe('Environment Profile Creation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should create bearer token profile from environment', () => {
      process.env.API_TOKEN = 'env-token-123';
      
      const profile = manager.createProfileFromEnv('env-profile');

      expect(profile).not.toBeNull();
      expect(profile!.name).toBe('env-profile');
      expect(profile!.type).toBe('bearer');
      expect(profile!.credentials.token).toBe('env-token-123');
    });

    test('should create API key profile from environment', () => {
      delete process.env.API_TOKEN;
      process.env.API_KEY = 'env-key-123';
      
      const profile = manager.createProfileFromEnv('env-profile');

      expect(profile).not.toBeNull();
      expect(profile!.type).toBe('apikey');
      expect(profile!.credentials.apiKey).toBe('env-key-123');
    });

    test('should create OAuth2 profile from environment', () => {
      delete process.env.API_TOKEN;
      delete process.env.API_KEY;
      process.env.CLIENT_ID = 'env-client-id';
      process.env.CLIENT_SECRET = 'env-client-secret';
      process.env.OAUTH_TOKEN_URL = 'https://oauth.example.com/token';
      process.env.OAUTH_SCOPE = 'read write';
      
      const profile = manager.createProfileFromEnv('env-profile');

      expect(profile).not.toBeNull();
      expect(profile!.type).toBe('oauth2');
      expect(profile!.credentials.clientId).toBe('env-client-id');
      expect(profile!.credentials.clientSecret).toBe('env-client-secret');
      expect(profile!.credentials.tokenUrl).toBe('https://oauth.example.com/token');
      expect(profile!.credentials.scope).toBe('read write');
    });

    test('should create Basic Auth profile from environment', () => {
      delete process.env.API_TOKEN;
      delete process.env.API_KEY;
      delete process.env.CLIENT_ID;
      delete process.env.CLIENT_SECRET;
      process.env.API_USERNAME = 'env-user';
      process.env.API_PASSWORD = 'env-pass';
      
      const profile = manager.createProfileFromEnv('env-profile');

      expect(profile).not.toBeNull();
      expect(profile!.type).toBe('basic');
      expect(profile!.credentials.username).toBe('env-user');
      expect(profile!.credentials.password).toBe('env-pass');
    });

    test('should return null when no credentials in environment', () => {
      // Clear all credential-related environment variables
      delete process.env.API_TOKEN;
      delete process.env.BEARER_TOKEN;
      delete process.env.JWT_TOKEN;
      delete process.env.API_KEY;
      delete process.env.X_API_KEY;
      delete process.env.CLIENT_ID;
      delete process.env.OAUTH_CLIENT_ID;
      delete process.env.CLIENT_SECRET;
      delete process.env.OAUTH_CLIENT_SECRET;
      delete process.env.API_USERNAME;
      delete process.env.AUTH_USERNAME;
      delete process.env.API_PASSWORD;
      delete process.env.AUTH_PASSWORD;
      
      const profile = manager.createProfileFromEnv('env-profile');

      expect(profile).toBeNull();
    });
  });

  describe('Import and Export', () => {
    let tempImportFile: string;
    let tempExportFile: string;

    beforeEach(async () => {
      await manager.initialize();
      tempImportFile = path.join(os.tmpdir(), 'import-test-' + Date.now() + '.json');
      tempExportFile = path.join(os.tmpdir(), 'export-test-' + Date.now() + '.json');
    });

    afterEach(async () => {
      try {
        await fs.unlink(tempImportFile);
      } catch (error) {
        // File might not exist
        console.log('Import file cleanup (ignored):', error);
      }
      try {
        await fs.unlink(tempExportFile);
      } catch (error) {
        // File might not exist 
        console.log('Export file cleanup (ignored):', error);
      }
    });

    test('should export profiles to file', async () => {
      const profile1 = createTestProfile({ name: 'profile1' });
      const profile2 = createTestProfile({ 
        name: 'profile2', 
        type: 'apikey',
        credentials: { apiKey: 'key-123' }
      });

      await manager.setProfile(profile1);
      await manager.setProfile(profile2);

      await manager.exportToFile(tempExportFile, false);

      const exported = JSON.parse(await fs.readFile(tempExportFile, 'utf8'));
      expect(exported.profiles).toBeDefined();
      expect(Object.keys(exported.profiles)).toHaveLength(2);
      expect(exported.includeSecrets).toBe(false);
      expect(exported.profiles.profile1.credentials.token).toBe('[REDACTED]');
    });

    test('should export profiles with secrets', async () => {
      const profile = createTestProfile();
      await manager.setProfile(profile);

      await manager.exportToFile(tempExportFile, true);

      const exported = JSON.parse(await fs.readFile(tempExportFile, 'utf8'));
      expect(exported.includeSecrets).toBe(true);
      expect(exported.profiles['test-profile'].credentials.token).toBe('test-token-123');
    });

    test('should import profiles from file', async () => {
      const importData = {
        profiles: {
          'imported-profile': {
            name: 'imported-profile',
            type: 'bearer',
            credentials: { token: 'imported-token' },
            environment: 'production',
            createdAt: new Date().toISOString(),
            description: 'Imported profile'
          }
        }
      };

      await fs.writeFile(tempImportFile, JSON.stringify(importData));

      const result = await manager.importFromFile(tempImportFile);

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);

      const imported = await manager.getProfile('imported-profile');
      expect(imported).not.toBeNull();
      expect(imported!.credentials.token).toBe('imported-token');
      expect(imported!.description).toBe('Imported profile');
    });

    test('should handle import errors gracefully', async () => {
      const invalidData = {
        profiles: {
          'invalid-profile': {
            name: '', // Invalid: empty name
            type: 'bearer',
            credentials: {}
          },
          'valid-profile': {
            name: 'valid-profile',
            type: 'bearer',
            credentials: { token: 'valid-token' },
            createdAt: new Date().toISOString()
          }
        }
      };

      await fs.writeFile(tempImportFile, JSON.stringify(invalidData));

      const result = await manager.importFromFile(tempImportFile);

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('invalid-profile');
    });

    test('should handle non-existent import file', async () => {
      const result = await manager.importFromFile('/non/existent/file.json');

      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to import');
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test('should provide accurate statistics', async () => {
      const profile1 = createTestProfile({ 
        name: 'profile1',
        type: 'bearer',
        environment: 'development'
      });
      const profile2 = createTestProfile({ 
        name: 'profile2',
        type: 'apikey',
        environment: 'production',
        credentials: { apiKey: 'key-123' }
      });
      const profile3 = createTestProfile({ 
        name: 'profile3',
        type: 'oauth2',
        environment: 'development',
        credentials: { clientId: 'client', clientSecret: 'secret' }
      });

      await manager.setProfile(profile1);
      await manager.setProfile(profile2);
      await manager.setProfile(profile3);
      await manager.setDefaultProfile('profile1');

      const stats = await manager.getStatistics();

      expect(stats.totalProfiles).toBe(3);
      expect(stats.profilesByType).toEqual({
        'bearer': 1,
        'apikey': 1,
        'oauth2': 1
      });
      expect(stats.profilesByEnvironment).toEqual({
        'development': 2,
        'production': 1
      });
      expect(stats.defaultProfile).toBe('profile1');
      expect(stats.storeSize).toBeGreaterThan(0);
    });

    test('should handle empty store statistics', async () => {
      const stats = await manager.getStatistics();

      expect(stats.totalProfiles).toBe(0);
      expect(stats.profilesByType).toEqual({});
      expect(stats.profilesByEnvironment).toEqual({});
      expect(stats.defaultProfile).toBeUndefined();
    });
  });

  describe('Clear All', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test('should clear all profiles', async () => {
      const profile1 = createTestProfile({ name: 'profile1' });
      const profile2 = createTestProfile({ name: 'profile2' });

      await manager.setProfile(profile1);
      await manager.setProfile(profile2);
      await manager.setDefaultProfile('profile1');

      await manager.clearAll();

      const profiles = await manager.listProfiles();
      const defaultProfile = await manager.getDefaultProfile();

      expect(profiles).toHaveLength(0);
      expect(defaultProfile).toBeNull();
    });
  });
});