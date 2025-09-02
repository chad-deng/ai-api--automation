# API测试生成指南

## 概述

本项目提供了多种方式来为你的API JSON生成自动化测试。

## 方法1: 简单脚本生成 (推荐)

### 使用方法
```bash
python simple_test_generator.py your_api.json [output_dir]
```

### 支持的JSON格式
```json
{
  "name": "API名称",
  "method": "GET|POST|PUT|DELETE|PATCH",
  "path": "/api/v1/endpoint",
  "description": "API描述",
  "requestBody": {
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "field1": {"type": "string"},
            "field2": {"type": "integer"}
          },
          "required": ["field1"]
        }
      }
    }
  },
  "responses": {
    "200": {"description": "成功响应"},
    "400": {"description": "错误请求"}
  }
}
```

### 生成的测试类型
- **Basic Tests** - 基础功能测试
- **CRUD Tests** - 增删改查操作测试
- **Error Scenarios** - 错误场景测试
- **Authentication** - 认证测试

### 示例
```bash
# 生成测试到默认目录
python simple_test_generator.py my_api.json

# 生成测试到指定目录
python simple_test_generator.py my_api.json tests/custom
```

## 方法2: 批量重新生成

### 使用现有脚本
```bash
python regenerate_all_tests.py
```

这将处理 `complete_api_specs.json` 文件中的所有API。

## 方法3: Webhook自动生成

### ApiFox Webhook
系统支持ApiFox webhook自动触发测试生成：

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/apifox \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test_123",
    "event_type": "api_created", 
    "project_id": "project_123",
    "timestamp": "2025-09-01T10:00:00Z",
    "data": {
      "api": {
        "name": "Test API",
        "method": "POST",
        "path": "/test"
      }
    }
  }'
```

## 方法4: 通过Web界面

访问 http://localhost:8000 查看生成的测试和系统状态。

## 配置环境变量

运行生成的测试前，设置以下环境变量：

```bash
export TEST_API_BASE_URL='http://your-api-server.com'
export TEST_AUTH_TOKEN='your-authentication-token'
```

## 运行生成的测试

```bash
# 运行所有生成的测试
pytest tests/generated/ -v

# 运行特定类型的测试
pytest tests/generated/ -k "basic" -v
pytest tests/generated/ -k "error_scenarios" -v

# 运行特定API的测试
pytest tests/generated/test_user_management_api_* -v
```

## 测试输出目录结构

```
tests/generated/
├── test_api_name_basic.py
├── test_api_name_crud.py  
├── test_api_name_error_scenarios.py
└── test_api_name_authentication.py
```

## 高级功能

### 质量检查
系统内置质量检查器，会对生成的测试进行评分和验证。

### 多种生成器
- Error Scenario Generator - 错误场景
- Performance Test Generator - 性能测试
- Validation Generator - 验证测试
- Boundary Test Generator - 边界测试
- Environment Config Generator - 环境配置测试
- Concurrency Generator - 并发测试

## 故障排除

### 常见问题

1. **数据库连接错误**
   - 确保数据库服务正在运行
   - 检查数据库连接配置

2. **模板渲染错误**
   - 检查API JSON格式是否正确
   - 确保必需字段存在

3. **测试执行失败**
   - 验证环境变量设置
   - 确认API服务器可访问

### 调试技巧

```bash
# 启用详细日志
export LOG_LEVEL=DEBUG

# 检查生成的测试文件语法
python -m py_compile tests/generated/test_*.py
```

## 贡献

如需添加新的测试生成器或改进现有功能，请参考：
- `src/generators/test_generator.py` - 主要生成器
- `src/templates/` - 测试模板  
- `simple_test_generator.py` - 简单生成器实现