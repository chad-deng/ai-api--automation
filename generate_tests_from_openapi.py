#!/usr/bin/env python3
"""
从OpenAPI JSON生成API tests - 专注核心功能
使用方法: python generate_tests_from_openapi.py openapi.json
"""

import asyncio
import json
import sys
from pathlib import Path

# 添加src到Python路径
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from src.generators.test_generator import TestGenerator

def print_usage():
    """打印使用说明"""
    print("""
🚀 OpenAPI JSON测试生成工具

核心功能: 传入OpenAPI JSON → 生成高质量API tests

使用方法:
    python generate_tests_from_openapi.py <openapi.json>

示例:
    python generate_tests_from_openapi.py my_openapi_spec.json

支持的OpenAPI格式:
    - OpenAPI 3.0+ JSON格式
    - 包含paths、methods、requestBody、responses

生成的测试类型:
    - 错误场景测试 (HTTP 4xx/5xx)
    - 并发测试 (并发请求处理)
    - 质量评分 >95%

输出目录: tests/generated/
    """)

async def main():
    """主函数"""
    if len(sys.argv) != 2:
        print_usage()
        sys.exit(1)
    
    openapi_file = sys.argv[1]
    
    if not Path(openapi_file).exists():
        print(f"❌ 文件不存在: {openapi_file}")
        sys.exit(1)
    
    try:
        # 读取OpenAPI JSON
        with open(openapi_file, 'r', encoding='utf-8') as f:
            openapi_spec = json.load(f)
        
        print(f"📖 读取OpenAPI规格: {openapi_file}")
        
        # 验证OpenAPI格式
        if 'openapi' not in openapi_spec and 'swagger' not in openapi_spec:
            print("❌ 不是有效的OpenAPI规格文件")
            sys.exit(1)
        
        if 'paths' not in openapi_spec:
            print("❌ OpenAPI规格中缺少paths定义")
            sys.exit(1)
        
        paths_count = len(openapi_spec['paths'])
        endpoints_count = sum(len(methods) for methods in openapi_spec['paths'].values())
        
        print(f"📍 发现API路径: {paths_count}个")
        print(f"🔗 发现端点总数: {endpoints_count}个")
        
        print(f"\n🚀 开始生成测试...")
        
        # 生成测试
        generator = TestGenerator()
        result = await generator.generate_from_openapi(openapi_spec)
        
        # 输出结果
        if result.get('success', False):
            print(f"\n✅ 测试生成成功!")
            print(f"📊 生成统计:")
            print(f"  处理端点数: {result.get('total_endpoints_processed', 0)}")
            print(f"  生成文件数: {len(result.get('generated_files', []))}")
            
            if 'quality_summary' in result:
                quality = result['quality_summary']
                avg_quality = quality.get('average_quality_score', 0) * 100
                print(f"  平均质量分数: {avg_quality:.1f}%")
                print(f"  通过质量检查: {quality.get('quality_passed_files', 0)}")
            
            print(f"\n📁 生成的测试文件:")
            for i, file_path in enumerate(result.get('generated_files', []), 1):
                file_name = Path(file_path).name
                print(f"  {i:2d}. {file_name}")
            
            print(f"\n🧪 运行测试:")
            print(f"  export TEST_API_BASE_URL='http://your-api-server'")
            print(f"  export TEST_AUTH_TOKEN='your-auth-token'") 
            print(f"  pytest tests/generated/ -v")
            
        else:
            print(f"❌ 生成失败: {result.get('error', '未知错误')}")
            sys.exit(1)
            
    except json.JSONDecodeError as e:
        print(f"❌ JSON格式错误: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 生成失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())