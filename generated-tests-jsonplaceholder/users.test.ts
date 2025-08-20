import request from "supertest";

const baseURL = 'https://jsonplaceholder.typicode.com';
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
    describe('GET /users/{id}', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .get('/users/{id}')
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

    });
});

