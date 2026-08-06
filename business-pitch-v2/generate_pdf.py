from playwright.sync_api import sync_playwright
import os

html_path = os.path.abspath('index.html')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f'file:///{html_path}')
    page.wait_for_timeout(2000)
    page.pdf(
        path='澳秘_Macau_Mystery_商业计划书.pdf',
        format='A4',
        landscape=True,
        print_background=True,
        margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'}
    )
    browser.close()
print('PDF generated:', os.path.abspath('澳秘_Macau_Mystery_商业计划书.pdf'))
