import unittest
from app import app

class TestAIService(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_health(self):
        res = self.client.get('/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'HEALTHY')
        self.assertEqual(data['currency'], 'INR (₹)')
        self.assertIsInstance(data['model_loaded'], bool)

    def test_predict_normal_transaction(self):
        payload = {
            'amount': 450.0,
            'merchant': 'Reliance Smart Supermarket',
            'location': 'Mumbai, India',
            'category': 'GROCERY',
            'website': ''
        }
        res = self.client.post('/predict', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertLess(data['risk_score'], 30)
        self.assertFalse(data['is_fraud'])
        self.assertEqual(data['recommendation'], 'APPROVE_TRANSACTION')

    def test_predict_high_risk_amount(self):
        payload = {
            'amount': 350000.0,
            'merchant': 'Offshore Crypto Exchange',
            'location': 'High Risk Offshore Zone',
            'category': 'CRYPTO',
            'website': 'https://crypto-anonymous.io'
        }
        res = self.client.post('/predict', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(data['risk_score'], 70)
        self.assertTrue(data['is_fraud'])
        self.assertEqual(data['recommendation'], 'BLOCK_TRANSACTION')

    def test_predict_illegal_website_regardless_of_amount(self):
        payload = {
            'amount': 100.0,  # Low amount
            'merchant': '5movierulz',
            'location': 'Hyderabad, India',
            'category': 'TRAVEL',
            'website': 'https://www.5movierulz.watch/vishwanath-and-sons'
        }
        res = self.client.post('/predict', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(data['risk_score'], 80)
        self.assertTrue(data['is_fraud'])
        self.assertEqual(data['recommendation'], 'BLOCK_TRANSACTION')

if __name__ == '__main__':
    unittest.main()
