# Test Fixtures for API Test Generator

## Overview

This directory contains 30+ real-world OpenAPI specifications for comprehensive testing of our Hybrid Template+AST generator. These specs cover various complexity levels and edge cases to ensure robust handling of diverse API patterns.

## Fixture Categories

### Simple APIs (5 specs)
Basic APIs with straightforward endpoints and schemas
- `simple-blog.yaml` - Basic blog API with posts and comments
- `todo-list.yaml` - Simple task management API
- `weather-simple.yaml` - Basic weather information API
- `user-management.yaml` - Simple user CRUD operations
- `product-catalog-simple.yaml` - Basic product listing API

### Medium Complexity APIs (10 specs)
APIs with moderate complexity including authentication and nested schemas
- `jsonplaceholder.yaml` - Complete JSONPlaceholder API specification
- `petstore.yaml` - OpenAPI 3.0 Petstore example with auth
- `ecommerce-api.yaml` - E-commerce platform with orders, payments
- `social-media.yaml` - Social platform with posts, likes, follows
- `cms-api.yaml` - Content management system API
- `booking-system.yaml` - Hotel/service booking platform
- `finance-api.yaml` - Financial transactions and accounts
- `inventory-management.yaml` - Warehouse inventory system
- `event-management.yaml` - Event planning and ticketing
- `notification-service.yaml` - Multi-channel notification API

### Complex Enterprise APIs (10 specs)
Large-scale APIs with extensive schemas and advanced features
- `stripe-subset.yaml` - Subset of Stripe API (100+ endpoints)
- `github-api-subset.yaml` - GitHub REST API subset
- `aws-ec2-subset.yaml` - AWS EC2 API subset
- `slack-api-subset.yaml` - Slack Web API subset
- `shopify-api-subset.yaml` - Shopify Admin API subset
- `salesforce-subset.yaml` - Salesforce REST API subset
- `kubernetes-api-subset.yaml` - Kubernetes API subset
- `azure-subset.yaml` - Azure REST API subset
- `google-drive-subset.yaml` - Google Drive API subset
- `twilio-subset.yaml` - Twilio Communications API subset

### Edge Case APIs (8 specs)
APIs designed to test specific edge cases and error conditions
- `circular-refs.yaml` - Circular schema references
- `deep-nesting.yaml` - Deeply nested object schemas (10+ levels)
- `large-enums.yaml` - Schemas with large enum value sets
- `polymorphic.yaml` - oneOf/anyOf/allOf schema compositions
- `malformed-partial.yaml` - Partially invalid specification
- `no-responses.yaml` - Endpoints missing response definitions
- `complex-auth.yaml` - Multiple authentication schemes
- `binary-content.yaml` - File upload/download endpoints

### Performance Test APIs (2 specs)
Large APIs for performance and scalability testing
- `massive-api.yaml` - 500+ endpoints for scale testing
- `complex-schemas.yaml` - Highly complex nested schemas

## Usage in Tests

### Unit Tests
```typescript
describe('Parser Edge Cases', () => {
  test.each([
    'circular-refs.yaml',
    'deep-nesting.yaml',
    'malformed-partial.yaml'
  ])('handles %s gracefully', async (fixture) => {
    const spec = await loadFixture(fixture);
    const result = await parser.parse(spec);
    expect(result.errors).toBeDefined();
    expect(result.warnings).toBeDefined();
  });
});
```

### Integration Tests
```typescript
describe('E2E Generation', () => {
  const realWorldAPIs = [
    'jsonplaceholder.yaml',
    'petstore.yaml',
    'ecommerce-api.yaml'
  ];
  
  test.each(realWorldAPIs)('generates working tests for %s', async (fixture) => {
    const outputDir = `./test-output/${fixture}`;
    await generator.generate(fixture, outputDir);
    const testResults = await runGeneratedTests(outputDir);
    expect(testResults.passRate).toBeGreaterThan(0.6);
  });
});
```

### Performance Tests
```typescript
describe('Performance Benchmarks', () => {
  test('handles massive API within time limits', async () => {
    const start = Date.now();
    await generator.generate('massive-api.yaml');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
});
```

## Fixture Maintenance

### Adding New Fixtures
1. Add specification to appropriate category directory
2. Update this README with fixture description
3. Add to relevant test suites
4. Validate fixture with OpenAPI validator

### Quality Standards
- All fixtures must be valid OpenAPI 3.0+ specifications
- Include realistic data examples and constraints
- Provide meaningful operation IDs and descriptions
- Include authentication schemes where applicable

### Update Schedule
- Monthly review of public API changes
- Quarterly addition of new edge cases
- Annual comprehensive fixture audit

## Coverage Metrics

Target coverage across fixture categories:
- **Simple APIs**: 100% successful generation
- **Medium APIs**: 90%+ successful generation  
- **Complex APIs**: 80%+ successful generation
- **Edge Cases**: Graceful failure handling
- **Performance**: Meet all benchmark targets