#!/usr/bin/env python3
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

# Setup Chrome options
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--window-size=1920,1080')

# Enable browser logging
chrome_options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

try:
    # Create driver
    driver = webdriver.Chrome(options=chrome_options)
    
    print("Testing: http://localhost:3000/dashboard")
    driver.get('http://localhost:3000/dashboard')
    
    # Wait for page to load
    time.sleep(5)
    
    # Get browser console logs
    logs = driver.get_log('browser')
    
    print("\n" + "="*60)
    print("BROWSER CONSOLE OUTPUT:")
    print("="*60)
    
    errors = []
    warnings = []
    
    for log in logs:
        level = log['level']
        message = log['message']
        
        if 'SEVERE' in level or 'ERROR' in level:
            errors.append(message)
            print(f"ERROR: {message}")
        elif 'WARNING' in level:
            warnings.append(message)
            print(f"WARNING: {message}")
    
    print("\n" + "="*60)
    print(f"SUMMARY:")
    print(f"  Errors: {len(errors)}")
    print(f"  Warnings: {len(warnings)}")
    print("="*60)
    
    # Check for specific syntax errors
    syntax_errors = [e for e in errors if 'SyntaxError' in e or 'Unexpected token' in e]
    if syntax_errors:
        print("\nSYNTAX ERRORS FOUND:")
        for err in syntax_errors:
            print(f"  - {err}")
    else:
        print("\nNO SYNTAX ERRORS FOUND!")
    
    # Take screenshot
    driver.save_screenshot('/var/www/homeopathy-business-platform/logs/dashboard-screenshot.png')
    print("\nScreenshot saved to: logs/dashboard-screenshot.png")
    
    driver.quit()
    
except Exception as e:
    print(f"Error running test: {e}")
    import traceback
    traceback.print_exc()
