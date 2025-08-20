import request from 'supertest';

const baseURL = 'https://petstore.swagger.io/v2';

describe('pets API Tests', () => {

  describe('GET /pets', () => {
    it('should return 200 for valid request', async () => {
      const response = await request(baseURL)
        .get('/pets')
        
        ;
      
      expect(response.status).toBe(200);
      // Response schema validation
      expect(response.body).toBeDefined();
    });

    it('should handle invalid requests appropriately', async () => {
      const response = await request(baseURL)
        .get('/pets')
        
        .send({}); // Invalid/empty data
      
      expect([400, 401, 422, 500]).toContain(response.status);
    });
  });
  describe('POST /pets', () => {
    it('should return 201 for valid request', async () => {
      const response = await request(baseURL)
        .post('/pets')
        
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
        .post('/pets')
        
        .send({}); // Invalid/empty data
      
      expect([400, 401, 422, 500]).toContain(response.status);
    });
  });
  describe('GET /pets/{petId}', () => {
    it('should return 200 for valid request', async () => {
      const response = await request(baseURL)
        .get('/pets/:petId')
        
        ;
      
      expect(response.status).toBe(200);
      // Response schema validation
      expect(response.body).toBeDefined();
    });

    it('should handle invalid requests appropriately', async () => {
      const response = await request(baseURL)
        .get('/pets/:petId')
        
        .send({}); // Invalid/empty data
      
      expect([400, 401, 422, 500]).toContain(response.status);
    });
  });
  describe('DELETE /pets/{petId}', () => {
    it('should return 204 for valid request', async () => {
      const response = await request(baseURL)
        .delete('/pets/:petId')
        
        ;
      
      expect(response.status).toBe(204);
    });

    it('should handle invalid requests appropriately', async () => {
      const response = await request(baseURL)
        .delete('/pets/:petId')
        
        .send({}); // Invalid/empty data
      
      expect([400, 401, 422, 500]).toContain(response.status);
    });
  });
});