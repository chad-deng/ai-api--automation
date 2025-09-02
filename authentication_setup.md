# 🔐 API测试认证设置指南

## 现状总结

✅ **已完成**：
- 252个有效的API测试文件已生成
- 测试框架已配置完毕 (pytest + httpx)
- 环境配置文件已设置 (.env.local)
- Cookie认证系统已实现

❌ **待解决**：
- 需要有效的浏览器会话cookie (`connect.sid`)

## 🎯 快速解决方案

### 步骤1: 获取有效的会话Cookie

1. **打开浏览器，登录到系统**：
   ```
   https://mobileautomation.backoffice.test17.shub.us/login
   ```

2. **登录成功后，在浏览器Console中运行**：
   ```javascript
   console.log(document.cookie);
   ```

3. **找到 `connect.sid` cookie的值**，例如：
   ```
   connect.sid=s%3Aabcdefghijklmnop.xyz123456789
   ```

### 步骤2: 更新配置

将cookie值添加到 `.env.local` 文件：

```bash
echo 'TEST_COOKIE_CONNECT_SID="你的connect.sid值"' >> .env.local
```

### 步骤3: 验证认证

```bash
python -c "
import asyncio
import sys
sys.path.append('.')
from tests.conftest import load_test_env
load_test_env()

import httpx
import os

async def test():
    cookies = {
        '_HPVN': os.getenv('TEST_COOKIE_HPVN'),
        'perm_tid': os.getenv('TEST_COOKIE_PERM_TID'),
        'connect.sid': os.getenv('TEST_COOKIE_CONNECT_SID'),  # 关键cookie
        '_fbp': os.getenv('TEST_COOKIE_FBP'),
        'initialTrafficSource': os.getenv('TEST_COOKIE_INITIAL_TRAFFIC_SOURCE'),
        '_hjSession_3023053': os.getenv('TEST_COOKIE_HJ_SESSION'),
        '_hjSessionUser_3023053': os.getenv('TEST_COOKIE_HJ_SESSION_USER')
    }
    
    base_url = os.getenv('TEST_API_BASE_URL')
    async with httpx.AsyncClient(base_url=base_url, cookies=cookies) as client:
        response = await client.get('/api/v3/campaign/campaign-infos')
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            print('✅ 认证成功!')
            return True
        else:
            print('❌ 认证失败')
            return False

asyncio.run(test())
"
```

### 步骤4: 运行测试

认证成功后，运行API测试：

```bash
# 运行单个测试验证
python -m pytest tests/generated/test_campaign_revenue_log_post_crud.py -v --maxfail=1

# 运行所有CRUD测试
python run_tests.py --type crud

# 运行所有测试
python run_tests.py --type all
```

## 📋 技术详情

### 当前配置的Cookies

我们已经配置了以下cookies:

- `_HPVN`: 应用状态cookie ✅
- `perm_tid`: 永久追踪ID ✅ 
- `_fbp`: Facebook像素cookie ✅
- `initialTrafficSource`: 流量来源 ✅
- `_hjSession_3023053`: HotJar会话 ✅
- `_hjSessionUser_3023053`: HotJar用户 ✅
- `connect.sid`: **会话认证cookie** ❌ **需要从浏览器获取**

### 测试统计

- **总测试文件**: 397个
- **有效Python测试**: 252个
- **测试类型覆盖**: CRUD, 认证, 错误场景, 边界测试, 并发测试, 验证测试

### 支持的API端点

测试覆盖所有主要API端点：
- `/api/v3/campaign/*` - 活动管理
- `/api/v3/report/*` - 报告和分析
- `/api/v3/auth/*` - 认证相关
- 以及其他业务端点

## 🚀 下一步

1. **获取有效的 `connect.sid` cookie**
2. **更新配置文件**
3. **运行认证验证**
4. **开始执行API测试**

---

**准备好session cookie后，告诉我，我们就可以开始运行实际的API测试了！**