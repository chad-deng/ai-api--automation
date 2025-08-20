import { describe, it, expect, beforeEach } from "@jest/globals";
import { ApiClient } from "../helpers/api-client";
import { CredentialManager } from "../auth/credential-manager";

describe('pet Tests', () => {
  let apiClient: ApiClient;
  let credentialManager: CredentialManager;

  beforeEach(async () => {
    credentialManager = new CredentialManager();
    await credentialManager.initialize();
    
    // Load authentication profile if specified
    
    const authProfile = await credentialManager.getDefaultProfile();
    
    
    apiClient = new ApiClient({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      timeout: 5000,
      auth: authProfile ? {
        type: authProfile.type,
        token: authProfile.credentials.token,
        apiKey: authProfile.credentials.apiKey,
        username: authProfile.credentials.username,
        password: authProfile.credentials.password,
        apiKeyHeader: authProfile.type === 'apikey' ? 'X-API-Key' : undefined
      } : undefined
    });
  });

  it('should POST /pet successfully (200)', async () => {
    // Add a new pet to the store
    const requestData = {
      "ref": "#/components/schemas/Pet"
};

    const response = await apiClient.post('/pet', requestData);

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      "ref": "#/components/schemas/Pet"
});

  });

  it('should handle POST /pet error (405)', async () => {
    // Test POST /pet error handling
    const requestData = {
      "ref": null
};

    const response = await apiClient.post('/pet', requestData);

    expect(response.status).toBe(405);
    expect(response.data).toMatchObject({
      "message": "Invalid input"
});

  });

  it('should PUT /pet successfully (200)', async () => {
    // Update an existing pet
    const requestData = {
      "ref": "#/components/schemas/Pet"
};

    const response = await apiClient.put('/pet', requestData);

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      "ref": "#/components/schemas/Pet"
});

  });

  it('should handle PUT /pet error (400)', async () => {
    // Test PUT /pet error handling
    const requestData = {
      "ref": null
};

    const response = await apiClient.put('/pet', requestData);

    expect(response.status).toBe(400);
    expect(response.data).toMatchObject({
      "message": "Invalid ID supplied"
});

  });

  it('should handle PUT /pet error (404)', async () => {
    // Test PUT /pet error handling
    const requestData = {
      "ref": null
};

    const response = await apiClient.put('/pet', requestData);

    expect(response.status).toBe(404);
    expect(response.data).toMatchObject({
      "message": "Pet not found"
});

  });

  it('should handle PUT /pet error (405)', async () => {
    // Test PUT /pet error handling
    const requestData = {
      "ref": null
};

    const response = await apiClient.put('/pet', requestData);

    expect(response.status).toBe(405);
    expect(response.data).toMatchObject({
      "message": "Validation exception"
});

  });

  it('should GET /pet/findByStatus successfully (200)', async () => {
    // Finds Pets by status
    const requestData = {
      "status": "available"
};

    const response = await apiClient.get('/pet/findByStatus', { params: requestData });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject([
      {
            "ref": "#/components/schemas/Pet"
      },
      {
            "ref": "#/components/schemas/Pet"
      }
]);

  });

  it('should handle GET /pet/findByStatus error (400)', async () => {
    // Test GET /pet/findByStatus error handling
    const requestData = {
      "status": null
};

    const response = await apiClient.get('/pet/findByStatus', { params: requestData });

    expect(response.status).toBe(400);
    expect(response.data).toMatchObject({
      "message": "Invalid status value"
});

  });

  it('should GET /pet/{petId} successfully (200)', async () => {
    // Find pet by ID
    const requestData = {
      "petId": 42
};

    const response = await apiClient.get('/pet/{petId}', { params: requestData });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      "ref": "#/components/schemas/Pet"
});

  });

  it('should handle GET /pet/{petId} error (400)', async () => {
    // Test GET /pet/{petId} error handling
    const requestData = {
      "petId": "invalid"
};

    const response = await apiClient.get('/pet/{petId}', { params: requestData });

    expect(response.status).toBe(400);
    expect(response.data).toMatchObject({
      "message": "Invalid ID supplied"
});

  });

  it('should handle GET /pet/{petId} error (404)', async () => {
    // Test GET /pet/{petId} error handling
    const requestData = {
      "petId": "invalid"
};

    const response = await apiClient.get('/pet/{petId}', { params: requestData });

    expect(response.status).toBe(404);
    expect(response.data).toMatchObject({
      "message": "Pet not found"
});

  });
});












