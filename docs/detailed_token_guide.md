# 🔍 详细Token查找指南

你找到的token `eyJpZCI6Ijg5ZTY3NDUzLWNjODAtNWEyMi1hNGRkLTkyMTgzNDY4NTJiOCIsImNyZWF0ZWQiOjE3NTAxNTU3NzU5MTksImV4aXN0aW5nIjp0cnVlfQ==` 解码后是一个session ID，但测试显示它不能直接用于API认证。

让我们更深入地查找真正的认证信息：

## 🔍 步骤1：完整的Cookie检查

登录成功后，在开发者工具中：

1. **Application标签** -> **Cookies** -> `https://mobileautomation.backoffice.test17.shub.us`
2. **查看所有cookie**，特别注意：

```
请截图或复制所有cookie的名称和值：
□ connect.sid
□ session
□ auth-token  
□ jwt
□ access_token
□ PHPSESSID
□ laravel_session
□ XSRF-TOKEN
□ _token
□ user_token
□ api_token
□ authorization
□ _hjSessionUser_3023053 (你已经有这个)
□ 其他所有cookie
```

## 🔍 步骤2：检查登录后的第一个API请求

1. **登录成功后，不要刷新页面**
2. **在Network标签中寻找第一个API请求**（通常以`/api/`开头）
3. **点击该请求，查看Request Headers**
4. **寻找以下headers**：

```
□ Authorization: Bearer xxxxx
□ X-Auth-Token: xxxxx
□ X-API-Key: xxxxx  
□ Cookie: 多个cookie的组合
□ X-Requested-With: XMLHttpRequest
□ X-CSRF-Token: xxxxx
```

## 🔍 步骤3：检查JavaScript网络请求

1. **切换到Network标签的XHR/Fetch过滤器**
2. **登录后查看所有XHR请求**
3. **特别查看:**
   - 任何到`/api/`的请求
   - 认证相关的请求
   - 用户信息请求

## 🔍 步骤4：检查本地存储

1. **Application标签** -> **Local Storage** -> `https://mobileautomation.backoffice.test17.shub.us`
2. **查看是否有存储的token**：

```
□ token
□ access_token  
□ jwt
□ auth_token
□ user
□ session
□ api_key
```

3. **Session Storage也要检查**

## 🔍 步骤5：Console检查

1. **切换到Console标签**
2. **输入以下JavaScript代码检查**：

```javascript
// 检查本地存储的token
console.log('LocalStorage:', localStorage);
console.log('SessionStorage:', sessionStorage);

// 检查全局变量
console.log('window.token:', window.token);
console.log('window.authToken:', window.authToken);
console.log('window.user:', window.user);

// 检查所有cookie
console.log('All cookies:', document.cookie);
```

## 🔍 步骤6：检查页面源码中的token

1. **右键页面 -> 查看页面源代码**
2. **搜索以下关键词**：
   - `token`
   - `bearer`
   - `jwt`
   - `auth`
   - `api_key`

## 🆘 如果还是找不到

请提供以下信息：

1. **登录后页面的URL是什么？**
2. **能否截图Network标签显示的所有请求？**
3. **所有Cookies的完整列表**
4. **Console中运行上述JavaScript的输出**

## 🎯 可能的情况

根据经验，可能是以下情况之一：

1. **多Cookie组合认证** - 需要多个cookie一起工作
2. **CSRF Token** - 需要额外的CSRF保护token  
3. **Session-based认证** - 完全依赖session cookie
4. **动态Token** - token在JavaScript中动态生成
5. **不同域名认证** - 真正的API可能在不同的域名

---

**📝 请按照上述步骤再次检查，然后告诉我找到的所有信息。我们一定能找到正确的认证方式！**