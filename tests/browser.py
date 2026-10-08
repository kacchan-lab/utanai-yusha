"""Run: python3 tests/browser.py (requires Playwright and Chromium, local server on 8000)."""
import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':320,'height':780})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.clock.install()
    page.goto('http://127.0.0.1:8000/')
    assert page.locator('#free-count').inner_text()=='0 日'
    for width in [320,390,768,1280]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow at {width}'
    page.locator('#belief').select_option('loss')
    assert '過去の負け' in page.locator('#brake-message').inner_text()
    page.locator('#start').click()
    assert page.locator('#timer').inner_text()=='10:00'
    page.reload()
    assert page.locator('#start').is_disabled()
    # Advance wall clock exactly ten minutes without changing application duration.
    page.clock.fast_forward(600000)
    assert page.locator('#after-form').is_visible()
    page.locator('#after').fill('3')
    page.locator('#finish').click()
    assert '5 → 3' in page.locator('#cooldown-result').inner_text()
    page.locator('#day-state').select_option('free')
    page.locator('#day-form button').click()
    assert page.locator('#free-count').inner_text()=='1 日'
    page.locator('#daily').fill('5000')
    page.locator('#monthly').fill('10000')
    page.locator('#actual').fill('2000')
    page.locator('#money-form button').click()
    assert page.locator('#estimated').inner_text()=='¥5,000'
    assert page.locator('#actual-total').inner_text()=='¥2,000'
    assert '¥600,000' in page.locator('#projections').inner_text()
    page.locator('#reason').fill('<img src=x onerror=alert(1)> 家族との時間')
    page.locator('#notes-form button').click()
    assert page.locator('#saved-notes img').count()==0
    page.reload()
    assert '家族との時間' in page.locator('#saved-notes').inner_text()
    with page.expect_download() as result:
        page.locator('#export').click()
    exported=json.load(open(result.value.path()))
    assert exported['money']['actual']==2000
    page.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{broken'})
    page.wait_for_function("document.getElementById('status').textContent.includes('読み込めません')")
    assert page.locator('#actual-total').inner_text()=='¥2,000'
    page.on('dialog',lambda dialog:dialog.accept())
    page.locator('#delete').click()
    assert page.locator('#free-count').inner_text()=='0 日'
    page.locator('#import').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(exported).encode()})
    page.wait_for_function("document.getElementById('actual-total').textContent==='¥2,000'")
    page.locator('#day-state').select_option('played')
    page.locator('#day-form button').click()
    assert page.locator('#free-count').inner_text()=='0 日'
    assert page.locator('#actual-total').inner_text()=='¥2,000'
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path='/tmp/utanai-yusha-mobile.png',full_page=True)
    assert not errors, errors
    print('PASS: 4 viewport widths; brake; timer/reload/expiration; calendar; money; safe notes; export/import; invalid JSON; deletion; no JS errors')
    browser.close()
