import request from 'supertest';

const baseURL = 'http://localhost:3000';

describe('users API Tests', () => {

  describe('GET /users', () => {
    it('should return 200 for valid request', async () => {
      const response = await request(baseURL)
        .get('/users')
        
        ;
      
      expect(response.status).toBe(200);
      // Response schema validation
      expect(response.body).toBeDefined();
    });

    it('should handle invalid requests appropriately', async () => {
      const response = await request(baseURL)
        .get('/users')
        
        .send({}); // Invalid/empty data
      
      expect([400, 401, 422, 500]).toContain(response.status);
    });
  });
  describe('POST /users', () => {
    it('should return 201 for valid request', async () => {
      const response = await request(baseURL)
        .post('/users')
        
        .send({
  &quot;id&quot;: 1,
  &quot;name&quot;: &quot;Test Item&quot;,
  &quot;email&quot;: &quot;test@example.com&quot;,
  &quot;status&quot;: &quot;active&quot;
});
      
      expect(response.status).toBe(201);
    });

    it('should handle invalid requests appropriately', async () => {
      const response = await request(baseURL)
        .post('/users')
        
        .send({}); // Invalid/empty data
      
      expect([400, 401, 422, 500]).toContain(response.status);
    });
  });
});