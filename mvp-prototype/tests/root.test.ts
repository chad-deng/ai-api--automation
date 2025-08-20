import request from "supertest";

const baseURL = 'http://localhost:3000';
describe('root API Tests', () => {
    describe('POST /', () => {
        it('should return 200 for valid request', async () => {
            const response = await request(baseURL)
            .post('/')
            .send({
              "query": "Test String",
              "variables": {
                "receiptNumber": "Test String"
              }
            })
            ;

            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            // TODO: Add detailed response schema validation
        });

        it('should handle invalid request data appropriately', async () => {
            const response = await request(baseURL)
            .post('/')
            .send({}) // Empty/invalid data
            ;

            expect([400, 401, 422, 500]).toContain(response.status);
        });
    });
});

