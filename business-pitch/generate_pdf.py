from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8081/index.html')
    page.wait_for_timeout(2000)
    page.pdf(
        path='Macau_Mystery_Business_Plan.pdf',
        format='A4',
        landscape=True,
        print_background=True,
        margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'}
    )
    browser.close()
print('PDF generated:', os.path.abspath('Macau_Mystery_Business_Plan.pdf'))
