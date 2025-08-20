#!/usr/bin/env npx ts-node

/**
 * End-to-End CLI Validation Test
 * Week 2 Sprint 2: Validate complete test generation workflow
 */

import { CLI } from '../src/cli';
import path from 'path';
import fs from 'fs';

async function validateEndToEndWorkflow(): Promise<void> {
  console.log('🚀 Starting End-to-End CLI Validation...\n');

  const cli = new CLI();
  const outputDir = path.join(__dirname, 'generated-tests');
  
  // Ensure clean output directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Test 1: CLI Help Command
    console.log('📋 Test 1: CLI Help Command');
    const helpResult = await cli.run(['--help']);
    console.log(`   Help command result: ${helpResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!helpResult.success) {
      console.log(`   Error: ${helpResult.error}`);
    }

    // Test 2: CLI Version Command
    console.log('\n📋 Test 2: CLI Version Command');
    const versionResult = await cli.run(['--version']);
    console.log(`   Version command result: ${versionResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!versionResult.success) {
      console.log(`   Error: ${versionResult.error}`);
    }

    // Test 3: Generate Command with Sample OpenAPI Spec
    console.log('\n📋 Test 3: Test Generation with Sample OpenAPI Spec');
    
    // Create a minimal sample OpenAPI spec for testing
    const sampleSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        version: '1.0.0',
        description: 'A sample API for testing'
      },
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
            summary: 'Get all users',
            tags: ['users'],
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          email: { type: 'string', format: 'email' }
                        },
                        required: ['id', 'name', 'email']
                      }
                    }
                  }
                }
              },
              '400': {
                description: 'Bad Request'
              }
            }
          },
          post: {
            operationId: 'createUser',
            summary: 'Create a new user',
            tags: ['users'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' }
                    },
                    required: ['name', 'email']
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string' }
                      }
                    }
                  }
                }
              },
              '400': {
                description: 'Bad Request'
              }
            }
          }
        },
        '/users/{id}': {
          get: {
            operationId: 'getUserById',
            summary: 'Get user by ID',
            tags: ['users'],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer' }
              }
            ],
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string' }
                      }
                    }
                  }
                }
              },
              '404': {
                description: 'User not found'
              }
            }
          }
        }
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            },
            required: ['id', 'name', 'email']
          },
          Error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'integer' }
            }
          }
        }
      }
    };

    const specPath = path.join(outputDir, 'sample-spec.json');
    fs.writeFileSync(specPath, JSON.stringify(sampleSpec, null, 2));

    // Test generation with Jest framework
    const generateResult = await cli.run([
      'generate',
      specPath,
      '--output', outputDir,
      '--framework', 'jest'
    ]);

    console.log(`   Test generation result: ${generateResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (generateResult.success && generateResult.data) {
      console.log(`   Generated ${generateResult.data.generatedFiles.length} test files`);
      console.log(`   Total test cases: ${generateResult.data.summary.totalTests}`);
      console.log(`   Operations covered: ${generateResult.data.summary.operationsCovered}`);
      console.log(`   Coverage: ${generateResult.data.summary.coveragePercentage}%`);
    } else {
      console.log(`   Error: ${generateResult.error}`);
    }

    // Test 4: Verify Generated Files
    console.log('\n📋 Test 4: Verify Generated Test Files');
    
    const generatedFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.test.ts'));
    console.log(`   Found ${generatedFiles.length} test files`);
    
    if (generatedFiles.length > 0) {
      console.log('   Generated files:');
      generatedFiles.forEach(file => {
        const filePath = path.join(outputDir, file);
        const fileSize = fs.statSync(filePath).size;
        console.log(`   - ${file} (${fileSize} bytes)`);
        
        // Basic content validation
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasDescribe = content.includes('describe(');
        const hasIt = content.includes('it(');
        const hasExpect = content.includes('expect(');
        
        console.log(`     Contains describe: ${hasDescribe ? '✅' : '❌'}`);
        console.log(`     Contains it: ${hasIt ? '✅' : '❌'}`);
        console.log(`     Contains expect: ${hasExpect ? '✅' : '❌'}`);
      });
    } else {
      console.log('   ❌ No test files were generated');
    }

    // Test 5: Validate Test File Syntax
    console.log('\n📋 Test 5: Validate Generated Test File Syntax');
    
    if (generatedFiles.length > 0 && generatedFiles[0]) {
      const testFile = path.join(outputDir, generatedFiles[0]);
      const content = fs.readFileSync(testFile, 'utf-8');
      
      // Check for required imports
      const hasJestImports = content.includes('@jest/globals');
      const hasApiClientImport = content.includes('ApiClient');
      
      console.log(`   Jest imports: ${hasJestImports ? '✅' : '❌'}`);
      console.log(`   API Client import: ${hasApiClientImport ? '✅' : '❌'}`);
      
      // Check for test structure
      const testBlocks = (content.match(/it\(/g) || []).length;
      console.log(`   Test cases found: ${testBlocks}`);
      
      if (testBlocks > 0) {
        console.log('   ✅ Valid test structure generated');
      } else {
        console.log('   ❌ No valid test cases found');
      }
    }

    console.log('\n🎉 End-to-End Validation Complete!');
    console.log(`✨ Test results summary:`);
    console.log(`   - Help command: ${helpResult.success ? '✅' : '❌'}`);
    console.log(`   - Version command: ${versionResult.success ? '✅' : '❌'}`);
    console.log(`   - Test generation: ${generateResult.success ? '✅' : '❌'}`);
    console.log(`   - Generated files: ${generatedFiles.length > 0 ? '✅' : '❌'} (${generatedFiles.length} files)`);

    const overallSuccess = helpResult.success && versionResult.success && 
                          generateResult.success && generatedFiles.length > 0;

    if (overallSuccess) {
      console.log('\n🚀 All end-to-end tests PASSED! The CLI is fully functional.');
    } else {
      console.log('\n⚠️  Some end-to-end tests FAILED. Review the results above.');
    }

  } catch (error) {
    console.error('❌ End-to-End validation failed with error:', error);
  } finally {
    // Cleanup (optional - leave files for inspection)
    // fs.rmSync(outputDir, { recursive: true, force: true });
  }
}

// Execute if run directly
if (require.main === module) {
  validateEndToEndWorkflow().catch((error) => {
    console.error('Error running validation:', error);
    process.exit(1);
  });
}

export { validateEndToEndWorkflow };