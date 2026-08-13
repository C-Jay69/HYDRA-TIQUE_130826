#!/usr/bin/env python3
"""
HYDRA-TIQUE Backend API Testing
Tests all backend endpoints with proper authentication
"""

import requests
import sys
import json
from datetime import datetime

class HydraTiqueAPITester:
    def __init__(self, base_url="https://artifact-id-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_session_token = "test_session_hydra_001"
        self.admin_session_token = "admin_session_hydra_001"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, headers=None, data=None, auth_type=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add authentication
        if auth_type == 'user':
            test_headers['Authorization'] = f'Bearer {self.test_session_token}'
        elif auth_type == 'admin':
            test_headers['Authorization'] = f'Bearer {self.admin_session_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        print(f"   Auth: {auth_type or 'none'}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:300]
                })

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_health_endpoint(self):
        """Test health check endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )

    def test_auth_me_with_user_token(self):
        """Test /auth/me with user token"""
        return self.run_test(
            "Auth Me (User Token)",
            "GET",
            "auth/me",
            200,
            auth_type='user'
        )

    def test_auth_me_with_admin_token(self):
        """Test /auth/me with admin token"""
        return self.run_test(
            "Auth Me (Admin Token)",
            "GET",
            "auth/me",
            200,
            auth_type='admin'
        )

    def test_auth_me_without_token(self):
        """Test /auth/me without token (should fail)"""
        return self.run_test(
            "Auth Me (No Token)",
            "GET",
            "auth/me",
            401
        )

    def test_user_credits(self):
        """Test user credits endpoint"""
        return self.run_test(
            "User Credits",
            "GET",
            "users/credits",
            200,
            auth_type='user'
        )

    def test_payment_packs(self):
        """Test payment packs endpoint"""
        return self.run_test(
            "Payment Packs",
            "GET",
            "payments/packs",
            200
        )

    def test_create_checkout(self):
        """Test create checkout endpoint"""
        checkout_data = {
            "pack_id": "starter",
            "origin_url": "https://artifact-id-1.preview.emergentagent.com"
        }
        return self.run_test(
            "Create Checkout Session",
            "POST",
            "payments/create-checkout",
            200,
            auth_type='user',
            data=checkout_data
        )

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        return self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            auth_type='admin'
        )

    def test_admin_users(self):
        """Test admin users endpoint"""
        return self.run_test(
            "Admin Users",
            "GET",
            "admin/users",
            200,
            auth_type='admin'
        )

    def test_admin_stats_with_user_token(self):
        """Test admin stats with user token (should fail)"""
        return self.run_test(
            "Admin Stats (User Token - Should Fail)",
            "GET",
            "admin/stats",
            403,
            auth_type='user'
        )

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("🚀 HYDRA-TIQUE Backend API Testing")
        print("=" * 60)
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print(f"Test User Token: {self.test_session_token}")
        print(f"Admin User Token: {self.admin_session_token}")
        print("=" * 60)

        # Basic endpoints
        self.test_health_endpoint()
        
        # Auth endpoints
        self.test_auth_me_without_token()
        self.test_auth_me_with_user_token()
        self.test_auth_me_with_admin_token()
        
        # User endpoints
        self.test_user_credits()
        
        # Payment endpoints
        self.test_payment_packs()
        self.test_create_checkout()
        
        # Admin endpoints
        self.test_admin_stats_with_user_token()  # Should fail
        self.test_admin_stats()
        self.test_admin_users()

        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['test']}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
                else:
                    print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                    print(f"   Response: {test['response']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = HydraTiqueAPITester()
    success = tester.run_all_tests()
    
    print(f"\n🏁 Testing completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())