#!/usr/bin/env python3
"""
测试OpenAPI JSON生成API tests的核心功能
"""

import asyncio
import json
from pathlib import Path
import sys

# 添加src到Python路径
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from src.generators.test_generator import TestGenerator
from src.database.models import SessionLocal

async def test_openapi_generation():
    """测试OpenAPI JSON生成功能"""
    
    # 示例OpenAPI JSON
    openapi_spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "Test API",
            "version": "1.0.0"
        },
        "paths": {
            "/api/users": {
                "post": {
                    "operationId": "createUser",
                    "summary": "Create a new user",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "name": {
                                            "type": "string",
                                            "minLength": 2,
                                            "maxLength": 50
                                        },
                                        "email": {
                                            "type": "string",
                                            "format": "email"
                                        },
                                        "age": {
                                            "type": "integer",
                                            "minimum": 18,
                                            "maximum": 120
                                        }
                                    },
                                    "required": ["name", "email"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "User created successfully"
                        },
                        "400": {
                            "description": "Bad request"
                        }
                    }
                }
            },
            "/api/users/{userId}": {
                "get": {
                    "operationId": "getUser",
                    "summary": "Get user by ID",
                    "parameters": [
                        {
                            "name": "userId",
                            "in": "path",
                            "required": True,
                            "schema": {
                                "type": "integer"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "User found"
                        },
                        "404": {
                            "description": "User not found"
                        }
                    }
                }
            }
        }
    }
    
    print("🚀 测试OpenAPI JSON生成API tests功能...")
    
    # 初始化测试生成器
    generator = TestGenerator()
    
    # 生成测试
    result = await generator.generate_from_openapi(openapi_spec)
    
    print("📊 生成结果:")
    print(f"  成功: {result.get('success', False)}")
    print(f"  生成文件数: {len(result.get('generated_files', []))}")
    print(f"  处理端点数: {result.get('total_endpoints_processed', 0)}")
    
    if 'generated_files' in result:
        print("\n📁 生成的测试文件:")
        for file_path in result['generated_files']:
            print(f"  ✓ {Path(file_path).name}")
    
    if 'quality_summary' in result:
        quality = result['quality_summary']
        print(f"\n📈 质量统计:")
        print(f"  平均质量分数: {quality.get('average_quality_score', 0):.2%}")
        print(f"  文件总数: {quality.get('total_files', 0)}")
        print(f"  通过质量检查: {quality.get('quality_passed_files', 0)}")
    
    if 'error' in result:
        print(f"❌ 错误: {result['error']}")
        return False
    
    return True

async def main():
    """主函数"""
    try:
        success = await test_openapi_generation()
        if success:
            print("\n✅ OpenAPI JSON生成API tests功能正常工作!")
        else:
            print("\n❌ OpenAPI JSON生成功能有问题")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())