#!/usr/bin/env python3
"""
快速认证测试脚本
用于验证cookie认证是否工作
"""
import asyncio
import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.append('.')

# Load environment
from tests.conftest import load_test_env
load_test_env()

import httpx
import json

async def test_authentication():
    """测试API认证是否工作"""
    print("🔐 测试API认证...")
    print("=" * 50)
    
    # 从环境变量获取cookies
    cookies = {}
    cookie_vars = [
        ("_HPVN", "TEST_COOKIE_HPVN"), 
        ("perm_tid", "TEST_COOKIE_PERM_TID"),
        ("connect.sid", "TEST_COOKIE_CONNECT_SID"),
        ("_fbp", "TEST_COOKIE_FBP"),
        ("initialTrafficSource", "TEST_COOKIE_INITIAL_TRAFFIC_SOURCE"),
        ("_hjSession_3023053", "TEST_COOKIE_HJ_SESSION"),
        ("_hjSessionUser_3023053", "TEST_COOKIE_HJ_SESSION_USER")
    ]
    
    print("📋 检查配置的cookies:")
    for cookie_name, env_var in cookie_vars:
        value = os.getenv(env_var)
        if value:
            cookies[cookie_name] = value
            print(f"   ✓ {cookie_name}: {value[:30]}...")
        else:
            print(f"   ✗ {cookie_name}: 未配置")
    
    if not cookies:
        print("\n❌ 没有配置任何cookies!")
        print("请先按照 AUTHENTICATION_SETUP.md 的指引配置认证信息")
        return False
    
    print(f"\n📡 测试API连接...")
    base_url = os.getenv("TEST_API_BASE_URL", "https://mobileautomation.backoffice.test17.shub.us")
    print(f"Base URL: {base_url}")
    
    # 设置浏览器风格的headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': f'{base_url}/',
        'X-Requested-With': 'XMLHttpRequest'
    }
    
    async with httpx.AsyncClient(
        base_url=base_url,
        timeout=30.0,
        cookies=cookies,
        headers=headers,
        follow_redirects=True
    ) as client:
        
        # 测试主要API端点
        test_endpoints = [
            "/api/v3/campaign/campaign-infos",
            "/api/v3/report/engages/campaignLogs",
            "/api/v3/auth/me"  # 获取用户信息
        ]
        
        for endpoint in test_endpoints:
            try:
                print(f"\n🧪 测试端点: {endpoint}")
                response = await client.get(endpoint)
                
                if response.status_code == 200:
                    print(f"   ✅ 成功! Status: {response.status_code}")
                    try:
                        data = response.json()
                        if isinstance(data, dict):
                            print(f"   📄 返回数据类型: dict, 包含 {len(data)} 个字段")
                            if "data" in data:
                                print(f"   📊 数据字段: {list(data.keys())[:5]}")
                        elif isinstance(data, list):
                            print(f"   📄 返回数据类型: list, 包含 {len(data)} 个项目")
                    except:
                        print(f"   📄 返回数据类型: {type(response.text)}")
                    
                    # 如果任何一个端点成功，认证就是工作的
                    print(f"\n🎉 认证配置正确! API可以正常访问")
                    print("=" * 50)
                    print("✅ 可以开始运行API测试了!")
                    print("\n推荐命令:")
                    print("  python -m pytest tests/generated/test_campaign_revenue_log_post_crud.py -v")
                    print("  python run_tests.py --type crud --maxfail=3")
                    return True
                    
                elif response.status_code == 401:
                    print(f"   ❌ 未授权 (401) - 需要有效的session cookie")
                    
                elif response.status_code == 403:
                    print(f"   ❌ 禁止访问 (403) - 权限不足")
                    
                else:
                    print(f"   ⚠️  状态码: {response.status_code}")
                    print(f"   响应: {response.text[:100]}...")
                    
            except Exception as e:
                print(f"   ❌ 请求失败: {e}")
    
    print(f"\n❌ 所有端点都认证失败")
    print("\n🔧 解决方案:")
    print("1. 确保你在浏览器中已经成功登录")
    print("2. 在浏览器Console中运行: console.log(document.cookie)")
    print("3. 复制 connect.sid 的值到 .env.local 文件中")
    print("4. 重新运行此脚本测试")
    
    return False

if __name__ == "__main__":
    print("🚀 快速API认证测试")
    print("此脚本会验证你的cookie认证配置是否正确")
    print("")
    
    success = asyncio.run(test_authentication())
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)