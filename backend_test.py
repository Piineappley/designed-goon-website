import requests
import sys
import json
from datetime import datetime

class ThreadLabAPITester:
    def __init__(self, base_url="https://threadlab-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_user_registration(self):
        """Test user registration"""
        test_user = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if response and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user
        test_user = {
            "name": f"Login Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"login_test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "LoginTest123!"
        }
        
        # Register
        register_response = self.run_test(
            "User Registration for Login Test",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if not register_response:
            return False
        
        # Now test login
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return response and 'access_token' in response

    def test_get_current_user(self):
        """Test getting current user info"""
        response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return response is not None

    def test_get_products(self):
        """Test getting all products"""
        response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        
        if response and isinstance(response, list) and len(response) > 0:
            self.product_id = response[0]['id']  # Store for later tests
            return True
        return False

    def test_get_single_product(self):
        """Test getting a single product"""
        if not hasattr(self, 'product_id'):
            self.log_test("Get Single Product", False, "No product ID available")
            return False
            
        response = self.run_test(
            "Get Single Product",
            "GET",
            f"products/{self.product_id}",
            200
        )
        return response is not None

    def test_create_design(self):
        """Test creating a design"""
        if not hasattr(self, 'product_id'):
            self.log_test("Create Design", False, "No product ID available")
            return False
            
        design_data = {
            "product_id": self.product_id,
            "design_data": {
                "images": [],
                "texts": [
                    {
                        "id": "text-1",
                        "text": "Test Design",
                        "x": 100,
                        "y": 100,
                        "fontSize": 32,
                        "fontFamily": "Arial",
                        "color": "#000000",
                        "rotation": 0
                    }
                ]
            },
            "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }
        
        response = self.run_test(
            "Create Design",
            "POST",
            "designs",
            200,
            data=design_data
        )
        
        if response and 'id' in response:
            self.design_id = response['id']
            return True
        return False

    def test_get_user_designs(self):
        """Test getting user's designs"""
        response = self.run_test(
            "Get User Designs",
            "GET",
            "designs",
            200
        )
        return response is not None

    def test_get_single_design(self):
        """Test getting a single design"""
        if not hasattr(self, 'design_id'):
            self.log_test("Get Single Design", False, "No design ID available")
            return False
            
        response = self.run_test(
            "Get Single Design",
            "GET",
            f"designs/{self.design_id}",
            200
        )
        return response is not None

    def test_update_design(self):
        """Test updating a design"""
        if not hasattr(self, 'design_id') or not hasattr(self, 'product_id'):
            self.log_test("Update Design", False, "No design or product ID available")
            return False
            
        updated_design_data = {
            "product_id": self.product_id,
            "design_data": {
                "images": [],
                "texts": [
                    {
                        "id": "text-1",
                        "text": "Updated Test Design",
                        "x": 150,
                        "y": 150,
                        "fontSize": 40,
                        "fontFamily": "Arial",
                        "color": "#FF0000",
                        "rotation": 0
                    }
                ]
            },
            "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }
        
        response = self.run_test(
            "Update Design",
            "PUT",
            f"designs/{self.design_id}",
            200,
            data=updated_design_data
        )
        return response is not None

    def test_create_order(self):
        """Test creating an order (mock checkout)"""
        if not hasattr(self, 'design_id') or not hasattr(self, 'product_id'):
            self.log_test("Create Order", False, "No design or product ID available")
            return False
            
        order_data = {
            "design_id": self.design_id,
            "product_id": self.product_id,
            "quantity": 1
        }
        
        response = self.run_test(
            "Create Order (Mock Checkout)",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if response and 'id' in response:
            self.order_id = response['id']
            return True
        return False

    def test_get_user_orders(self):
        """Test getting user's orders"""
        response = self.run_test(
            "Get User Orders",
            "GET",
            "orders",
            200
        )
        return response is not None

    def test_delete_design(self):
        """Test deleting a design"""
        if not hasattr(self, 'design_id'):
            self.log_test("Delete Design", False, "No design ID available")
            return False
            
        response = self.run_test(
            "Delete Design",
            "DELETE",
            f"designs/{self.design_id}",
            200
        )
        return response is not None

    def test_seed_products(self):
        """Test seeding products"""
        response = self.run_test(
            "Seed Products",
            "POST",
            "seed-products",
            200
        )
        return response is not None

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting ThreadLab API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)

        # Test product seeding first
        self.test_seed_products()
        
        # Test authentication flow
        if not self.test_user_registration():
            print("❌ Registration failed, stopping tests")
            return False
            
        self.test_user_login()
        self.test_get_current_user()
        
        # Test products
        if not self.test_get_products():
            print("❌ Failed to get products, stopping design tests")
            return False
            
        self.test_get_single_product()
        
        # Test design workflow
        if self.test_create_design():
            self.test_get_user_designs()
            self.test_get_single_design()
            self.test_update_design()
            
            # Test order workflow
            if self.test_create_order():
                self.test_get_user_orders()
            
            # Clean up - delete design
            self.test_delete_design()

        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
            return 1

def main():
    tester = ThreadLabAPITester()
    tester.run_all_tests()
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())