#!/usr/bin/env python3
"""
优化的API测试生成脚本
支持传入JSON文件和目标文件夹名称作为参数
"""

import asyncio
import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Any
import structlog

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.generators.test_generator import TestGenerator
from src.config.settings import Settings

logger = structlog.get_logger()


def load_json_file(file_path: str) -> Dict[str, Any]:
    """
    加载JSON文件
    
    Args:
        file_path: JSON文件路径
    
    Returns:
        Dict[str, Any]: 解析后的JSON数据
    
    Raises:
        FileNotFoundError: 文件不存在
        json.JSONDecodeError: JSON格式错误
    """
    path = Path(file_path)
    
    if not path.exists():
        raise FileNotFoundError(f"JSON文件不存在: {file_path}")
    
    if not path.suffix.lower() == '.json':
        raise ValueError(f"文件必须是JSON格式: {file_path}")
    
    with open(path, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError as e:
            raise json.JSONDecodeError(f"JSON格式错误: {e}", f.doc, f.pos)


def create_target_directory(target_folder: str) -> Path:
    """
    创建目标文件夹
    
    Args:
        target_folder: 目标文件夹名称
    
    Returns:
        Path: 创建的目录路径
    """
    target_path = Path(target_folder)
    target_path.mkdir(parents=True, exist_ok=True)
    return target_path


def validate_openapi_spec(spec: Dict[str, Any]) -> bool:
    """
    验证OpenAPI规范是否有效
    
    Args:
        spec: OpenAPI规范数据
    
    Returns:
        bool: 是否为有效的OpenAPI规范
    """
    # 基础验证
    if not isinstance(spec, dict):
        return False
    
    # 检查OpenAPI版本
    if 'openapi' not in spec and 'swagger' not in spec:
        return False
    
    # 检查必要字段
    if 'paths' not in spec:
        return False
    
    # 检查info字段
    if 'info' not in spec or not isinstance(spec['info'], dict):
        return False
    
    return True


async def generate_tests_from_json(
    json_file_path: str,
    target_folder: str,
    test_types: list = None
) -> Dict[str, Any]:
    """
    从JSON文件生成API测试
    
    Args:
        json_file_path: JSON文件路径
        target_folder: 目标文件夹
        test_types: 生成的测试类型列表，默认为None（生成所有类型）
    
    Returns:
        Dict[str, Any]: 生成结果
    """
    try:
        logger.info("开始从JSON文件生成API测试", 
                   json_file=json_file_path,
                   target_folder=target_folder)
        
        # 1. 加载JSON文件
        print(f"📁 加载JSON文件: {json_file_path}")
        spec_data = load_json_file(json_file_path)
        
        # 2. 验证规范格式
        print("✅ 验证OpenAPI规范格式...")
        if not validate_openapi_spec(spec_data):
            raise ValueError("无效的OpenAPI规范格式")
        
        # 3. 创建目标目录
        print(f"📂 创建目标目录: {target_folder}")
        target_path = create_target_directory(target_folder)
        
        # 4. 初始化测试生成器
        print("🔧 初始化测试生成器...")
        generator = TestGenerator()
        
        # 5. 临时设置输出目录到指定的目标文件夹
        original_output_dir = generator.settings.test_output_dir
        generator.settings.test_output_dir = str(target_path)
        
        try:
            # 6. 生成测试
            print("🚀 开始生成API测试...")
            result = await generator.generate_from_openapi(spec_data)
            
            # 7. 处理结果
            if result.get('success', False):
                print(f"✅ 成功生成测试!")
                print(f"   - 生成文件数: {len(result.get('generated_files', []))}")
                print(f"   - 处理端点数: {result.get('total_endpoints_processed', 0)}")
                
                # 显示生成的文件列表
                if 'generated_files' in result:
                    print("\n📄 生成的测试文件:")
                    for file_path in result['generated_files']:
                        relative_path = Path(file_path).relative_to(target_path)
                        print(f"   ✓ {relative_path}")
                
                # 显示质量统计
                if 'quality_summary' in result:
                    quality = result['quality_summary']
                    print(f"\n📊 质量统计:")
                    print(f"   - 平均质量分数: {quality.get('average_quality_score', 0):.2%}")
                    print(f"   - 高质量文件: {quality.get('high_quality_files', 0)}/{quality.get('total_files', 0)}")
                    print(f"   - 中等质量文件: {quality.get('medium_quality_files', 0)}")
                    print(f"   - 低质量文件: {quality.get('low_quality_files', 0)}")
                    print(f"   - 总测试数量: {quality.get('total_tests', 0)}")
                    if quality.get('total_issues', 0) > 0:
                        print(f"   - 发现问题: {quality.get('total_issues', 0)} (错误: {quality.get('error_count', 0)}, 警告: {quality.get('warning_count', 0)})")
            else:
                print(f"❌ 生成失败: {result.get('error', '未知错误')}")
                return result
            
            return result
            
        finally:
            # 恢复原始输出目录设置
            generator.settings.test_output_dir = original_output_dir
        
    except FileNotFoundError as e:
        error_msg = f"文件未找到: {e}"
        logger.error(error_msg)
        print(f"❌ {error_msg}")
        return {"success": False, "error": error_msg}
    
    except json.JSONDecodeError as e:
        error_msg = f"JSON解析错误: {e}"
        logger.error(error_msg)
        print(f"❌ {error_msg}")
        return {"success": False, "error": error_msg}
    
    except ValueError as e:
        error_msg = f"数据验证错误: {e}"
        logger.error(error_msg)
        print(f"❌ {error_msg}")
        return {"success": False, "error": error_msg}
    
    except Exception as e:
        error_msg = f"生成测试时发生错误: {e}"
        logger.error(error_msg, exc_info=True)
        print(f"❌ {error_msg}")
        return {"success": False, "error": error_msg}


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="从OpenAPI JSON文件生成API测试",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python scripts/generate_api_tests.py examples/openapi.json tests/generated
  python scripts/generate_api_tests.py -j examples/openapi.json -o output/tests
  python scripts/generate_api_tests.py --json-file examples/openapi.json --output-dir my_tests
        """
    )
    
    parser.add_argument(
        'input_file',
        nargs='?',
        help='OpenAPI JSON文件路径'
    )
    
    parser.add_argument(
        'output_folder', 
        nargs='?',
        help='目标文件夹路径'
    )
    
    parser.add_argument(
        '-j', '--json-file',
        help='OpenAPI JSON文件路径（与位置参数二选一）'
    )
    
    parser.add_argument(
        '-o', '--output-dir',
        help='目标文件夹路径（与位置参数二选一）'
    )
    
    parser.add_argument(
        '--test-types',
        nargs='+',
        choices=['basic', 'crud', 'error_scenarios', 'authentication', 'performance', 'validation', 'boundary_testing', 'environment_config', 'concurrency'],
        help='指定要生成的测试类型'
    )
    
    parser.add_argument(
        '--validate-only',
        action='store_true',
        help='仅验证JSON文件格式，不生成测试'
    )
    
    args = parser.parse_args()
    
    # 确定输入文件和输出目录  
    json_file_path = args.json_file or args.input_file
    target_folder = args.output_dir or args.output_folder
    
    # 检查参数
    if not json_file_path:
        parser.error("必须指定JSON文件路径")
    
    if not target_folder and not args.validate_only:
        parser.error("必须指定目标文件夹")
    
    # 仅验证模式
    if args.validate_only:
        try:
            print(f"🔍 验证JSON文件: {json_file_path}")
            spec_data = load_json_file(json_file_path)
            if validate_openapi_spec(spec_data):
                print("✅ OpenAPI规范格式有效")
                # 显示基本信息
                info = spec_data.get('info', {})
                paths = spec_data.get('paths', {})
                endpoints_count = sum(len(methods) for methods in paths.values())
                
                print(f"📋 规范信息:")
                print(f"   - 标题: {info.get('title', 'N/A')}")
                print(f"   - 版本: {info.get('version', 'N/A')}")
                print(f"   - 端点数量: {endpoints_count}")
                sys.exit(0)
            else:
                print("❌ 无效的OpenAPI规范格式")
                sys.exit(1)
        except Exception as e:
            print(f"❌ 验证失败: {e}")
            sys.exit(1)
    
    # 生成测试
    try:
        print("🎯 API测试生成器")
        print("=" * 50)
        
        result = asyncio.run(generate_tests_from_json(
            json_file_path, 
            target_folder,
            args.test_types
        ))
        
        if result.get('success', False):
            print("\n🎉 API测试生成完成!")
            sys.exit(0)
        else:
            print(f"\n💥 生成失败")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️  用户中断操作")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 意外错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()