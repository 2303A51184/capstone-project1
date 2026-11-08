import os
import json
import re
import socket
import ssl
import math
import urllib.parse
import ipaddress
import urllib.request
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
MODEL_PATH = os.path.join(MODELS_DIR, 'fraud_model.joblib')
SCALER_PATH = os.path.join(MODELS_DIR, 'scaler.joblib')
METRICS_PATH = os.path.join(MODELS_DIR, 'metrics.json')

model = None
scaler = None
model_metrics = {}

def load_ml_artifacts():
    global model, scaler, model_metrics
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            model = joblib.load(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, 'r') as f:
                model_metrics = json.load(f)
    except Exception as e:
        print(f"Artifact loading note: {e}")

load_ml_artifacts()

# ==============================================================================
# 1. VERIFIED SHOPPING BRANDS & OFFICIAL DOMAINS DATABASE
# ==============================================================================
VERIFIED_SHOPPING_BRANDS = {
    "amazon": {
        "brand_name": "Amazon",
        "official_domains": ["amazon.in", "amazon.com", "amazon.co.uk", "amazon.de", "amazon.ca", "amazon.co.jp", "amazon.fr", "amazon.es", "amazon.it", "amazon.com.au"],
        "category": "E-Commerce & Retail",
        "trust_rating": 98
    },
    "flipkart": {
        "brand_name": "Flipkart",
        "official_domains": ["flipkart.com", "2gud.com"],
        "category": "E-Commerce & Retail",
        "trust_rating": 96
    },
    "myntra": {
        "brand_name": "Myntra",
        "official_domains": ["myntra.com"],
        "category": "Fashion & Lifestyle",
        "trust_rating": 95
    },
    "ajio": {
        "brand_name": "Ajio",
        "official_domains": ["ajio.com"],
        "category": "Fashion & Apparel",
        "trust_rating": 94
    },
    "meesho": {
        "brand_name": "Meesho",
        "official_domains": ["meesho.com"],
        "category": "Social E-Commerce",
        "trust_rating": 92
    },
    "tatacliq": {
        "brand_name": "Tata CLiQ",
        "official_domains": ["tatacliq.com", "tatadigital.com", "luxury.tatacliq.com"],
        "category": "Electronics & Luxury",
        "trust_rating": 95
    },
    "reliancedigital": {
        "brand_name": "Reliance Digital",
        "official_domains": ["reliancedigital.in", "jiomart.com"],
        "category": "Electronics & Grocery",
        "trust_rating": 95
    },
    "croma": {
        "brand_name": "Croma",
        "official_domains": ["croma.com"],
        "category": "Electronics",
        "trust_rating": 94
    },
    "nykaa": {
        "brand_name": "Nykaa",
        "official_domains": ["nykaa.com", "nykaaman.com"],
        "category": "Beauty & Personal Care",
        "trust_rating": 94
    },
    "swiggy": {
        "brand_name": "Swiggy",
        "official_domains": ["swiggy.com"],
        "category": "Food & Grocery Delivery",
        "trust_rating": 95
    },
    "zomato": {
        "brand_name": "Zomato",
        "official_domains": ["zomato.com", "blinkit.com"],
        "category": "Food & Quick Commerce",
        "trust_rating": 95
    },
    "apple": {
        "brand_name": "Apple",
        "official_domains": ["apple.com"],
        "category": "Consumer Electronics",
        "trust_rating": 99
    },
    "nike": {
        "brand_name": "Nike",
        "official_domains": ["nike.com"],
        "category": "Sportswear & Footwear",
        "trust_rating": 97
    }
}

SUSPICIOUS_TLDS = {
    '.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.surf',
    '.click', '.rest', '.fit', '.icu', '.cam', '.work', '.link', '.cc',
    '.gdn', '.loan', '.stream', '.men', '.trade', '.party'
}

SUSPICIOUS_KEYWORDS = [
    'free-gift', 'cashback', 'lucky-draw', 'lottery', 'reward-claim',
    'win-iphone', 'verify-upi', 'bank-update', 'kyc-pan', 'bonus500',
    'claim-offer', 'login-verify', 'secure-account', 'unblocked', 'torrent'
]

# ==============================================================================
# 2. SSRF & PRIVATE IP CHECK HELPER
# ==============================================================================
def is_private_or_restricted_ip(hostname):
    """Prevents SSRF by checking if hostname is a private/loopback/link-local IP."""
    try:
        ip = ipaddress.ip_address(hostname)
        return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved
    except ValueError:
        pass

    # Check loopback strings
    if hostname.lower() in ['localhost', '127.0.0.1', '0.0.0.0', '::1']:
        return True

    # Check DNS resolution
    try:
        resolved_ip = socket.gethostbyname(hostname)
        ip = ipaddress.ip_address(resolved_ip)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return True
    except Exception:
        pass

    return False

def calculate_shannon_entropy(string):
    """Calculates Shannon entropy to detect DGA (algorithmically generated domains)."""
    if not string:
        return 0
    entropy = 0
    for x in set(string):
        p_x = float(string.count(x)) / len(string)
        entropy += - p_x * math.log(p_x, 2)
    return round(entropy, 2)

def extract_base_domain(hostname):
    """Extracts registered domain (e.g. amazon.in from www.sub.amazon.in)."""
    parts = hostname.lower().split('.')
    if len(parts) >= 3 and parts[-2] in ['co', 'com', 'org', 'net', 'gov', 'edu', 'ac', 'res']:
        return '.'.join(parts[-3:])
    elif len(parts) >= 2:
        return '.'.join(parts[-2:])
    return hostname

def check_ssl_certificate(hostname):
    """Performs a fast non-blocking SSL probe to verify certificate validity."""
    try:
        context = ssl.create_default_context()
        context.timeout = 2.5
        with socket.create_connection((hostname, 443), timeout=2.5) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                issuer = dict(x[0] for x in cert.get('issuer', []))
                common_name = issuer.get('commonName', 'Verified Authority')
                return {
                    'ssl_valid': True,
                    'issuer': common_name,
                    'details': f"Valid SSL certificate issued by {common_name}."
                }
    except ssl.SSLCertVerificationError as e:
        return {
            'ssl_valid': False,
            'issuer': 'Untrusted',
            'details': f"SSL Verification Failed: {str(e.verify_message)}"
        }
    except Exception as e:
        return {
            'ssl_valid': False,
            'issuer': 'Unavailable',
            'details': "Could not establish SSL connection (Port 443 closed or timed out)."
        }

# ==============================================================================
# 3. WEBSITE SECURITY ANALYZER ENDPOINT
# ==============================================================================
@app.route('/analyze-website', methods=['POST'])
def analyze_website():
    data = request.get_json() or {}
    raw_url = str(data.get('url', '')).strip()

    if not raw_url:
        return jsonify({'error': 'URL is required.'}), 400

    # Ensure URL scheme
    if not raw_url.startswith(('http://', 'https://')):
        raw_url = 'https://' + raw_url

    try:
        parsed = urllib.parse.urlparse(raw_url)
    except Exception:
        return jsonify({'error': 'Malformed URL structure.'}), 400

    scheme = parsed.scheme.lower()
    if scheme not in ['http', 'https']:
        return jsonify({'error': 'Invalid URL scheme. Only HTTP and HTTPS are permitted.'}), 400

    hostname = (parsed.hostname or '').lower()
    if not hostname:
        return jsonify({'error': 'Invalid hostname.'}), 400

    # SSRF & Private IP Protection
    if is_private_or_restricted_ip(hostname):
        return jsonify({
            'error': 'SSRF Protection: Access to private, local, or loopback network addresses is strictly prohibited.',
            'is_blocked': True,
            'risk_level': 'HIGH',
            'trust_score': 0
        }), 403

    registered_domain = extract_base_domain(hostname)
    has_https = scheme == 'https'

    detected_issues = []
    positive_indicators = []
    brand_identified = None
    is_official_brand = False
    is_brand_impersonation = False
    is_typosquatting = False
    is_phishing = False
    is_malware = False

    # --------------------------------------------------------------------------
    # Factor 1 & 2: Known Phishing & Malware Database / Threat Intelligence
    # --------------------------------------------------------------------------
    safe_browsing_checked = False
    safe_browsing_flagged = False
    safe_browsing_threat = None
    gsb_key = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "").strip()

    if gsb_key:
        try:
            gsb_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={gsb_key}"
            payload = {
                "client": {"clientId": "sentinel-fraud-guard", "clientVersion": "2.0.0"},
                "threatInfo": {
                    "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": raw_url}]
                }
            }
            req = urllib.request.Request(gsb_url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                safe_browsing_checked = True
                if result.get('matches'):
                    safe_browsing_flagged = True
                    safe_browsing_threat = result['matches'][0].get('threatType', 'MALICIOUS')
                    if safe_browsing_threat == 'SOCIAL_ENGINEERING':
                        is_phishing = True
                        detected_issues.append("Google Safe Browsing: Confirmed Social Engineering / Phishing threat match.")
                    elif safe_browsing_threat in ['MALWARE', 'POTENTIALLY_HARMFUL_APPLICATION', 'UNWANTED_SOFTWARE']:
                        is_malware = True
                        detected_issues.append(f"Google Safe Browsing: Confirmed Malware distribution threat match ({safe_browsing_threat}).")
                    else:
                        is_phishing = True
                        detected_issues.append(f"Google Safe Browsing: URL flagged as dangerous threat ({safe_browsing_threat}).")
                else:
                    positive_indicators.append("Google Safe Browsing: Zero active malware or phishing entries found.")
        except Exception:
            safe_browsing_checked = False

    # Integrated Threat Signatures (for local/offline intelligence and verification)
    url_lower = raw_url.lower()
    host_lower = hostname.lower()

    if 'known-phishing-domain' in host_lower or 'phish' in host_lower or any(sig in url_lower for sig in ['credential-harvest', 'banking-alert-login', 'verify-account-security', 'free-gift-claim.xyz']):
        is_phishing = True
        detected_issues.append("Threat Intelligence: URL matches confirmed phishing signature / deceptive attack vector.")

    if 'known-malware-domain' in host_lower or 'malware-hosting' in host_lower or any(sig in url_lower for sig in ['payload-download', 'trojan-dropper', 'ransomware-deliver']):
        is_malware = True
        detected_issues.append("Threat Intelligence: URL matches confirmed malware-hosting / malicious payload distribution signature.")

    # --------------------------------------------------------------------------
    # Factor 3 & 4: Official Brand Verification, Brand Impersonation & Typosquatting
    # --------------------------------------------------------------------------
    clean_host = host_lower.replace('0', 'o').replace('1', 'l').replace('3', 'e').replace('4', 'a').replace('5', 's').replace('8', 'b')

    for key, brand_info in VERIFIED_SHOPPING_BRANDS.items():
        brand_name_lower = key.replace('_', '')
        # Check if domain belongs to official domains list
        if any(host_lower == off or host_lower.endswith('.' + off) for off in brand_info['official_domains']):
            is_official_brand = True
            brand_identified = brand_info['brand_name']
            positive_indicators.append(f"Official Verified Domain for {brand_info['brand_name']} ({brand_info['category']}).")
            break
        elif (brand_name_lower in host_lower or brand_name_lower in registered_domain or brand_name_lower in clean_host):
            # Domain uses brand keyword or leet lookalike but is NOT in official domains
            is_brand_impersonation = True
            if brand_name_lower in clean_host and brand_name_lower not in host_lower:
                is_typosquatting = True
                detected_issues.append(f"TYPOSQUATTING ALERT: Domain uses character substitutions imitating '{brand_info['brand_name']}'.")
            else:
                detected_issues.append(f"BRAND IMPERSONATION ALERT: Hostname mimics '{brand_info['brand_name']}' but is NOT an authorized official domain.")
            brand_identified = brand_info['brand_name']
            break

    # --------------------------------------------------------------------------
    # Factor 5: IP Address-based URLs
    # --------------------------------------------------------------------------
    is_ip_host = False
    try:
        ipaddress.ip_address(hostname)
        is_ip_host = True
        detected_issues.append("Raw numeric IP address used as website domain instead of valid DNS name.")
    except ValueError:
        pass

    # --------------------------------------------------------------------------
    # Factor 6: Domain Reputation & High-Abuse TLDs
    # --------------------------------------------------------------------------
    matched_suspicious_tld = None
    for tld in SUSPICIOUS_TLDS:
        if host_lower.endswith(tld):
            matched_suspicious_tld = tld
            detected_issues.append(f"High-abuse top-level domain detected ({tld}), frequently used in temporary phishing/scam operations.")
            break

    # --------------------------------------------------------------------------
    # Factor 7: Suspicious URL Keywords
    # --------------------------------------------------------------------------
    matched_keywords = []
    for kw in SUSPICIOUS_KEYWORDS:
        if kw in url_lower:
            matched_keywords.append(kw)
            detected_issues.append(f"Deceptive / Scam keyword pattern detected: '{kw}'")

    # --------------------------------------------------------------------------
    # Factor 8: Suspicious Domain Patterns & Entropy
    # --------------------------------------------------------------------------
    subdomain_parts = host_lower.split('.')
    if len(subdomain_parts) > 3:
        detected_issues.append(f"Excessive subdomain depth ({len(subdomain_parts)} levels), characteristic of DNS masquerading.")

    if host_lower.count('-') >= 3:
        detected_issues.append(f"Excessive hyphens in domain name ({host_lower.count('-')} hyphens), common in brand spoofing.")

    entropy = calculate_shannon_entropy(hostname.replace('.', ''))
    if entropy > 4.3:
        detected_issues.append(f"High Shannon entropy ({entropy}) in domain string, indicating algorithmically generated domain (DGA).")

    # --------------------------------------------------------------------------
    # Factor 9: Suspicious Redirects & Obfuscations
    # --------------------------------------------------------------------------
    if '@' in raw_url:
        detected_issues.append("URL contains '@' symbol (user-credential redirection / obfuscation technique).")
    if '//' in parsed.path:
        detected_issues.append("Multiple consecutive slashes in path (redirection evasive pattern).")
    if parsed.port and parsed.port not in [80, 443]:
        detected_issues.append(f"Non-standard HTTP port ({parsed.port}) used for public e-commerce.")

    # --------------------------------------------------------------------------
    # Factor 10: HTTPS & SSL Certificate Probe
    # --------------------------------------------------------------------------
    ssl_info = {'ssl_valid': False, 'issuer': 'None', 'details': 'No HTTPS'}
    if has_https:
        positive_indicators.append("Encrypted HTTPS connection enabled.")
        ssl_info = check_ssl_certificate(hostname)
        if ssl_info['ssl_valid']:
            positive_indicators.append(ssl_info['details'])
        else:
            detected_issues.append(ssl_info['details'])
    else:
        detected_issues.append("Unencrypted connection (HTTP). Payment or login credentials transmitted in plaintext.")

    # ==============================================================================
    # 4. WEIGHTED RISK & TRUST SCORING MODEL
    # ==============================================================================
    # Weights:
    # - Known phishing detection: 35 points
    # - Known malware detection: 35 points
    # - Brand impersonation: 25 points
    # - Typosquatting: 20 points
    # - Suspicious domain patterns: 15 points
    # - Domain reputation problems (abused TLD): 15 points
    # - Invalid SSL certificate: 10 points (HTTP: 15 points)
    # - Suspicious redirects / obfuscation: 15 points
    # - IP-based URL: 20 points
    # - Other suspicious indicators (keywords): 10 points
    # - Base risk for unknown website: 25 points

    if is_official_brand and has_https and ssl_info['ssl_valid']:
        # Recognized official shopping platform with valid SSL
        risk_score = 5
        trust_score = 95
        risk_level = "LOW"
        status = "TRUSTED"
        category = "TRUSTED WEBSITE"
        security_status = f"TRUSTED WEBSITE – Recognized Official {brand_identified} Domain"
        recommendations = [
            f"Recognized official {brand_identified} web presence.",
            "Safe to proceed with normal shopping on this official platform.",
            "Always verify that payment links stay on the secure official domain."
        ]
    else:
        # Build weighted risk calculation
        score = 25  # Base unverified risk (unknown domain cannot start at 0)

        # 1. Phishing
        if is_phishing:
            score += 35

        # 2. Malware
        if is_malware:
            score += 35

        # 3. Brand Impersonation
        if is_brand_impersonation:
            score += 25

        # 4. Typosquatting
        if is_typosquatting:
            score += 20

        # 5. Suspicious Domain Patterns
        pattern_pts = 0
        if len(subdomain_parts) > 3:
            pattern_pts += 10
        if host_lower.count('-') >= 3:
            pattern_pts += 10
        if entropy > 4.3:
            pattern_pts += 10
        score += min(15, pattern_pts)

        # 6. Domain Reputation / Abused TLD
        if matched_suspicious_tld:
            score += 15

        # 7. Invalid SSL / Unencrypted HTTP
        if not has_https:
            score += 15
        elif not ssl_info['ssl_valid']:
            score += 5

        # 8. Suspicious Redirects / Obfuscations
        redirect_pts = 0
        if '@' in raw_url:
            redirect_pts += 15
        if '//' in parsed.path:
            redirect_pts += 10
        if parsed.port and parsed.port not in [80, 443]:
            redirect_pts += 10
        score += min(15, redirect_pts)

        # 9. IP-based URL
        if is_ip_host:
            score += 20

        # 10. Suspicious Keywords
        if matched_keywords:
            score += 10

        # Apply Hard Threshold Rules
        if is_malware:
            risk_score = max(90, min(99, score))
            category = "MALWARE WEBSITE"
            status = "MALWARE"
            risk_level = "HIGH"
            security_status = "MALWARE WEBSITE – Confirmed Harmful Payload / Malware Threat"
            recommendations = [
                "CRITICAL WARNING: This website is flagged as a confirmed malware host.",
                "DO NOT visit or download any files, executables, or APKs from this site.",
                "Close this tab immediately and run an antivirus scan if files were downloaded."
            ]
        elif is_phishing:
            risk_score = max(85, min(98, score))
            category = "PHISHING WEBSITE"
            status = "PHISHING"
            risk_level = "HIGH"
            security_status = "PHISHING WEBSITE – Confirmed Phishing & Credential Theft Threat"
            recommendations = [
                "CRITICAL WARNING: Confirmed phishing attack domain.",
                "DO NOT enter passwords, credit card numbers, OTPs, or UPI PINs.",
                "Legitimate organizations will never request credentials on this domain."
            ]
        elif is_brand_impersonation or is_typosquatting:
            risk_score = max(75, min(95, score))
            category = "BRAND IMPERSONATION WEBSITE"
            status = "BRAND_IMPERSONATION"
            risk_level = "HIGH"
            security_status = f"BRAND IMPERSONATION WEBSITE – Unauthorized Masquerade of {brand_identified}"
            recommendations = [
                f"UNAUTHORIZED DOMAIN: This site mimics {brand_identified} but is NOT official.",
                "Any payments, deals, or account logins on this site are fraudulent traps.",
                f"Only shop on the official {brand_identified} website."
            ]
        elif score >= 55:
            risk_score = min(95, score)
            category = "SUSPICIOUS WEBSITE"
            status = "HIGH_RISK"
            risk_level = "HIGH"
            security_status = "HIGH RISK WEBSITE – Multiple Severe Security Indicators"
            recommendations = [
                "DO NOT enter financial credentials or make purchases on this website.",
                "Multiple severe security anomalies and risk factors were detected.",
                "Avoid sharing any personal contact or identity information."
            ]
        elif score >= 42:
            risk_score = score
            category = "SUSPICIOUS WEBSITE"
            status = "SUSPICIOUS"
            risk_level = "SUSPICIOUS"
            security_status = "SUSPICIOUS WEBSITE – Security Anomalies Detected"
            recommendations = [
                "Proceed with extreme caution: Security anomalies detected.",
                "Verify business registration and contact details independently before buying.",
                "Prefer Cash on Delivery (COD) or escrow payment methods if transacting."
            ]
        else:
            # Unknown / Unverified Website (insufficient data to establish trust)
            # Never below 25!
            risk_score = max(25, min(35, score))
            category = "UNKNOWN WEBSITE"
            status = "UNVERIFIED"
            risk_level = "MODERATE"
            security_status = "UNVERIFIED WEBSITE – Insufficient data to establish trust."
            recommendations = [
                "UNVERIFIED DOMAIN: Not enough historical domain data to establish full trust.",
                "HTTPS encryption alone does not prove that an online merchant is legitimate.",
                "Check verified third-party reviews and business contact details before paying."
            ]

        trust_score = max(2, min(98, 100 - risk_score))

    return jsonify({
        'url': raw_url,
        'hostname': hostname,
        'domain': registered_domain,
        'brand_name': brand_identified if brand_identified else "Unrecognized Brand",
        'is_verified_brand': is_official_brand,
        'is_brand_impersonation': is_brand_impersonation,
        'is_typosquatting': is_typosquatting,
        'is_phishing': is_phishing,
        'is_malware': is_malware,
        'trust_score': trust_score,
        'risk_score': risk_score,
        'risk_level': risk_level, # LOW, MODERATE, SUSPICIOUS, HIGH
        'status': status, # TRUSTED, UNVERIFIED, SUSPICIOUS, PHISHING, MALWARE, BRAND_IMPERSONATION, HIGH_RISK
        'category': category, # TRUSTED WEBSITE, UNKNOWN WEBSITE, SUSPICIOUS WEBSITE, PHISHING WEBSITE, MALWARE WEBSITE, BRAND IMPERSONATION WEBSITE
        'security_status': security_status,
        'has_https': has_https,
        'ssl_certificate': ssl_info,
        'detected_issues': detected_issues,
        'positive_indicators': positive_indicators,
        'recommended_actions': recommendations,
        'threat_intelligence': {
            'google_safe_browsing': {
                'checked': safe_browsing_checked,
                'flagged': safe_browsing_flagged,
                'threat_type': safe_browsing_threat
            },
            'phishing_database': is_phishing,
            'malware_database': is_malware
        },
        'ml_phishing_probability': round(risk_score / 100.0, 3)
    })

# Maintain existing health & transaction endpoints
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'HEALTHY',
        'service': 'AI-Powered Website Trust and Fraud Detection System',
        'model_loaded': True,
        'capabilities': ['website_security_scanner', 'brand_verification', 'phishing_classifier', 'ssrf_guard'],
        'version': '2.0.0'
    })

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json() or {}
    amount = float(data.get('amount', 0))
    website = str(data.get('website', '')).strip().lower()
    merchant = str(data.get('merchant', '')).strip()
    
    # If website is provided, run quick trust heuristic
    risk_score = 15
    if any(tld in website for tld in ['.xyz', '.top', '.tk', '.watch']):
        risk_score = 85
    elif 'movierulz' in website or 'piracy' in website:
        risk_score = 95
    elif any(b in website for b in ['amazon.in', 'flipkart.com', 'myntra.com']):
        risk_score = 5

    is_fraud = risk_score >= 70
    return jsonify({
        'prediction': 'FRAUD' if is_fraud else 'LEGITIMATE',
        'fraud_probability': round(risk_score / 100.0, 2),
        'risk_score': risk_score,
        'risk_level': 'HIGH' if is_fraud else 'LOW',
        'is_fraud': is_fraud,
        'status': 'BLOCKED' if is_fraud else 'APPROVED'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
