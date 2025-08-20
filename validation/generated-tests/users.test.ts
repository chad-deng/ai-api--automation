import { describe, it, expect, beforeEach } from "@jest/globals";
import { ApiClient } from "../helpers/api-client";

describe('users Tests', () => {
  let apiClient: any;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      timeout: 5000
    });
  });

  it('should GET /users successfully (200)', async () => {
    // Get all users
    const response = await apiClient.get('/users');

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject([
      {
            "id": 42,
            "name": "test-string",
            "email": "test@example.com"
      },
      {
            "id": 42,
            "name": "test-string",
            "email": "test@example.com"
      }
]);

  });

  it('should handle GET /users error (400)', async () => {
    // Test GET /users error handling
    const response = await apiClient.get('/users');

    expect(response.status).toBe(400);
    expect(response.data).toMatchObject({
      "message": "Bad Request"
});

  });

  it('should POST /users successfully (201)', async () => {
    // Create a new user
    const requestData = {
      "name": "test-string",
      "email": "test@example.com"
};

    const response = await apiClient.post('/users', requestData);

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      "email": "test-string"
});

  });

  it('should handle POST /users error (400)', async () => {
    // Test POST /users error handling
    const requestData = {
      "name": null,
      "email": null
};

    const response = await apiClient.post('/users', requestData);

    expect(response.status).toBe(400);
    expect(response.data).toMatchObject({
      "message": "Bad Request"
});

  });

  it('should GET /users/{id} successfully (200)', async () => {
    // Get user by ID
    const requestData = {
      "id": 42
};

    const response = await apiClient.get('/users/{id}', { params: requestData });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      "id": 42,
      "name": "test-string",
      "email": "test-string"
});

  });

  it('should handle GET /users/{id} error (404)', async () => {
    // Test GET /users/{id} error handling
    const requestData = {
      "id": "invalid"
};

    const response = await apiClient.get('/users/{id}', { params: requestData });

    expect(response.status).toBe(404);
    expect(response.data).toMatchObject({
      "message": "User not found"
});

  });
});







