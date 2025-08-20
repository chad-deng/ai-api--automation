import request from "supertest";

const baseURL = 'https://petstore.swagger.io/v2';
describe('pets API Tests', () => {
    describe('GET /pets', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/pets')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /pets', () => {
        it('should return 201 for valid request', async () => {
            const response = await request(baseURL)
            .post('/pets')
            .send({
              "id": 49,
              "name": "Generated Test Data",
              "status": "active",
              "createdAt": "2025-08-14T09:41:02.134Z"
            })
            ;

            expect(response.status).toBe(201);
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/pets')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
    describe('GET /pets/{petId}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/pets/270')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('DELETE /pets/{petId}', () => {
        it('should return 204 for valid request', async () => {
            const response = await request(baseURL)
            .delete('/pets/707')
            ;

            expect(response.status).toBe(204);
        });

    });
});

