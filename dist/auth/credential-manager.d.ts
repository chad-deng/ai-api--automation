/**
 * Credential Manager
 * Week 3 Sprint 1: Secure credential storage and management for API testing
 */
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
export declare class CredentialManager {
    private storePath;
    private store;
    constructor(storePath?: string);
    /**
     * Initialize credential store
     */
    initialize(): Promise<void>;
    /**
     * Add or update credential profile
     */
    setProfile(profile: CredentialProfile): Promise<void>;
    /**
     * Get credential profile
     */
    getProfile(name: string): Promise<CredentialProfile | null>;
    /**
     * List all credential profiles
     */
    listProfiles(): Promise<CredentialProfile[]>;
    /**
     * Delete credential profile
     */
    deleteProfile(name: string): Promise<boolean>;
    /**
     * Set default profile
     */
    setDefaultProfile(name: string): Promise<boolean>;
    /**
     * Get default profile
     */
    getDefaultProfile(): Promise<CredentialProfile | null>;
    /**
     * Create profile from environment variables
     */
    createProfileFromEnv(name: string, environment?: string): CredentialProfile | null;
    /**
     * Validate credentials
     */
    validateCredentials(profile: CredentialProfile): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Import credentials from file
     */
    importFromFile(filePath: string): Promise<{
        imported: number;
        errors: string[];
    }>;
    /**
     * Export credentials to file
     */
    exportToFile(filePath: string, includeSecrets?: boolean): Promise<void>;
    /**
     * Clear all stored credentials
     */
    clearAll(): Promise<void>;
    /**
     * Get store statistics
     */
    getStatistics(): Promise<{
        totalProfiles: number;
        profilesByType: Record<string, number>;
        profilesByEnvironment: Record<string, number>;
        defaultProfile?: string;
        storeSize: number;
    }>;
    private ensureStoreDirectory;
    private loadStore;
    private saveStore;
}
//# sourceMappingURL=credential-manager.d.ts.map