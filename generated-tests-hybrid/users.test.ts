import request from "supertest";

const baseURL = 'http://localhost:3000';
describe('users API Tests', () => {
    describe('GET /users', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/users')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
    describe('POST /users', () => {
        it('should return 201 for valid request', async () => {
            const response = await request(baseURL)
            .post('/users')
            .send({
              "id": 632,
              "name": "Generated Test Data",
              "status": "active",
              "createdAt": "2025-08-14T09:40:11.763Z"
            })
            ;

            expect(response.status).toBe(201);
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/users')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
});

