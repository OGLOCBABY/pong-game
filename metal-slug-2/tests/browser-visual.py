"""Local Chromium visual inspection helper (uses installed Python playwright)."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "test-results"
OUT.mkdir(exist_ok=True)
HTML=(ROOT/'index.html').read_text()
HTML=re.sub(r'<link rel="stylesheet"[^>]*>', '<style>'+ (ROOT/'style.css').read_text()+'</style>', HTML)
HTML=re.sub(r'<script type="module"[^>]*></script>', '',HTML)
BUNDLE='\n'.join(re.sub(r'^import .*?;\n','', re.sub(r'^export (class|const|function) ', r'\1 ', (ROOT/f).read_text(), flags=re.M), flags=re.M) for f in ['engine.js','art.js','audio.js','main.js'])

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files'])
    errors=[]
    page=browser.new_page(viewport={'width':1440,'height':1050},device_scale_factor=1)
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.set_content(HTML,wait_until='load')
    page.add_script_tag(content=BUNDLE,type="module")
    page.wait_for_function('!!window.__ruins')
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT/'01-intro.png'),full_page=True)
    page.locator('#play').click()
    page.keyboard.down('d')
    page.keyboard.down('j')
    page.wait_for_timeout(1250)
    page.keyboard.up('d')
    page.keyboard.up('j')
    print('Real-keyboard state:',page.evaluate('window.__ruins.snapshot()'))
    page.screenshot(path=str(OUT/'02-desert.png'))
    page.keyboard.press('p')
    a=page.evaluate('window.__ruins.game.time')
    page.wait_for_timeout(250)
    b=page.evaluate('window.__ruins.game.time')
    print('Paused frozen:', a,b)
    page.keyboard.press('p')
    for name,ticks in [('03-tomb',1400),('04-ascent',2050),('05-boss',2980),('06-victory',4500)]:
        page.evaluate('''ticks=>{let g=window.__ruins.game;g.reset();g.start();for(let i=0;i<ticks&&g.phase==='playing';i++){g.setInput({right:true,fire:true,grenade:i%330<2,jump:i%370<15});g.step(1/120)}; window.__ruins.art.render(g,0);}''',ticks)
        page.wait_for_timeout(50)
        snap=page.evaluate('window.__ruins.snapshot()')
        page.screenshot(path=str(OUT/(name+'.png')))
        print(name, {k:snap[k] for k in ('phase','score','act','time','boss','kills')})
    print('Desktop errors:',errors)
    mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
    mobile.on('pageerror',lambda e:errors.append('MOBILE: '+str(e)))
    mobile.set_content(HTML,wait_until='load')
    mobile.add_script_tag(content=BUNDLE,type="module")
    mobile.wait_for_function('!!window.__ruins')
    mobile.wait_for_timeout(300)
    mobile.screenshot(path=str(OUT/'07-mobile.png'),full_page=True)
    print('Touch present:',mobile.locator('[data-control="fire"]').is_visible())
    print('Horizontal overflow:',mobile.evaluate('document.documentElement.scrollWidth>window.innerWidth'))
    print('All errors:',errors)
    assert not errors,errors
    browser.close()
