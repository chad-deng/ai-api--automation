export async function setupAuth(): Promise<Record<string, string>> {
    // Configure authentication based on your API requirements
    // Customize based on your auth scheme

    return {
        'Authorization': `Bearer ${process.env.API_KEY || 'test-api-key'}`,
        'Content-Type': 'application/json'
    };
}
beforeAll(async () => {
    console.log('🧪 Setting up test environment');
    // Add any global setup logic here
});

afterAll(async () => {
    console.log('🧹 Cleaning up test environment');
    // Add any global cleanup logic here
});

