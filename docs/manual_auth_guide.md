# 手动获取认证Token指南

由于自动登录遇到了技术难题，这里提供手动获取认证token的方法：

## 方法1: 浏览器开发者工具

1. **打开浏览器开发者工具**
   ```
   Chrome/Safari: F12 或 右键 -> 检查元素
   ```

2. **访问登录页面**
   ```
   https://mobileautomation.backoffice.test17.shub.us/login
   ```

3. **切换到Network（网络）标签**
   - 确保"记录网络活动"开启
   - 可选择只显示XHR/Fetch请求

4. **执行登录**
   - 输入邮箱: `mobileautomation@storehub.com`
   - 输入密码: `123456`
   - 点击登录

5. **查找认证信息**
   
   **方式A - 查找登录响应**:
   - 在Network标签中找到登录请求（通常是POST到/login或/auth/login）
   - 查看响应，寻找：
     - `token`
     - `access_token`
     - `jwt`
     - `bearer`
   
   **方式B - 查找后续API请求**:
   - 登录成功后，查看任何API请求（如/api/v3/...）
   - 在Request Headers中查找：
     - `Authorization: Bearer <token>`
     - `X-Auth-Token: <token>`
   
   **方式C - 查找Cookies**:
   - 在Application/Storage标签查看Cookies
   - 寻找包含token的cookie值

6. **复制token**
   - 找到token后，复制完整的值（不包括"Bearer "前缀）

## 方法2: 使用认证Token

找到token后，按以下步骤配置：

1. **更新配置文件**
   ```bash
   # 编辑 .env.local
   nano .env.local
   
   # 或使用以下命令直接更新（替换YOUR_TOKEN_HERE为实际token）
   echo "TEST_AUTH_TOKEN=YOUR_TOKEN_HERE" >> .env.local
   ```

2. **验证token有效性**
   ```bash
   python -c "
   import httpx
   import asyncio
   import os
   
   async def test_token():
       token = 'YOUR_TOKEN_HERE'  # 替换为实际token
       base_url = 'https://mobileautomation.backoffice.test17.shub.us'
       
       headers = {'Authorization': f'Bearer {token}'}
       
       async with httpx.AsyncClient(base_url=base_url) as client:
           response = await client.get('/api/v3/campaign/campaign-infos', headers=headers)
           print(f'Status: {response.status_code}')
           if response.status_code == 200:
               print('✅ Token works!')
           else:
               print('❌ Token invalid or expired')
   
   asyncio.run(test_token())
   "
   ```

## 方法3: Session Cookie认证

如果API使用session cookies而不是token：

1. **获取登录后的cookies**
   - 在浏览器中成功登录
   - 在开发者工具的Application/Storage -> Cookies中查看
   - 复制所有cookie值

2. **配置cookie认证**
   - 在测试代码中使用cookies而不是Authorization header

## 下一步: 运行测试

token配置好后，运行：

```bash
# 验证认证配置
python -m pytest tests/test_config_validation.py::TestConfiguration::test_environment_variables_loaded -v

# 运行单个API测试
python -m pytest tests/generated/test_campaign_revenue_log_post_crud.py -v --maxfail=1

# 运行所有CRUD测试
python run_tests.py --type crud
```

## 故障排除

**如果token不工作**:
1. 检查token是否完整（JWT token通常很长，包含两个点号）
2. 确认token未过期
3. 检查是否需要特定的header格式
4. 尝试在浏览器中访问API确认登录状态

**如果找不到token**:
1. 这个系统可能使用session cookies认证
2. 或者使用其他认证方式（OAuth等）
3. 可能需要特殊的API key或其他凭据

---

**准备好token后，告诉我，我会帮你配置并运行测试！**