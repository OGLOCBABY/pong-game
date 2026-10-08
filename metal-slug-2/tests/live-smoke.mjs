/** Post-Pages production smoke: exercises actual public URL in Chromium. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=process.env.LIVE_BASE;
assert(/^https:\/\//.test(base||''),'LIVE_BASE must be a GitHub Pages HTTPS URL');
const root=base.replace(/\/+$/,'')+'/';
const mission=root+'metal-slug-2/';
const out=resolve(fileURLToPath(new URL('../test-results/',import.meta.url)));
await mkdir(out,{recursive:true});
const errors=[],requests=[];
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('requestfailed',r=>requests.push(r.url()+' '+r.failure()?.errorText));
  let loaded=false;
  for(let i=0;i<8;i++){
    try{
      const response=await page.goto(mission,{waitUntil:'networkidle',timeout:15000});
      if(response?.status()===200){
        await page.waitForFunction(()=>typeof window.__ruins?.snapshot==='function',null,{timeout:12000});
        loaded=true;break;
      }
      console.log('Public Pages response '+response?.status()+' attempt '+(i+1));
    }catch(e){console.log('Public Pages boot retry '+(i+1)+': '+e.message);}
    await page.waitForTimeout(4500);
  }
  assert(loaded,'Production mission failed to return HTTP 200 + real ES module boot: '+mission);
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.__ruins.snapshot().phase==='playing');
  const x0=(await page.evaluate(()=>window.__ruins.snapshot())).player.x;
  await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');
  const moved=await page.evaluate(()=>window.__ruins.snapshot());
  assert(moved.player.x>x0+20,'Production move control did not move');
  await page.keyboard.down('j');await page.waitForTimeout(300);await page.keyboard.up('j');
  assert((await page.evaluate(()=>window.__ruins.snapshot())).player.shots>=1,'Production weapon did not fire');
  await page.keyboard.press('p');
  assert.equal((await page.evaluate(()=>window.__ruins.snapshot())).phase,'paused');
  await page.screenshot({path:resolve(out,'public-live-mission2.png'),fullPage:true});
  console.log('PASS PUBLIC MISSION2 playable '+JSON.stringify({url:mission,moveStart:x0,moveEnd:moved.player.x,shots:(await page.evaluate(()=>window.__ruins.snapshot())).player.shots}));
  const rootResponse=await page.goto(root,{waitUntil:'networkidle',timeout:15000});
  assert.equal(rootResponse.status(),200,'Pong root site must survive release');
  await page.waitForFunction(()=>typeof window.__STRIKELINE_DIAGNOSTICS__?.snapshot==='function',null,{timeout:12000});
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.__STRIKELINE_DIAGNOSTICS__?.snapshot().phase==='playing',null,{timeout:12000});
  await page.screenshot({path:resolve(out,'public-live-pong.png'),fullPage:true});
  assert.deepEqual(errors,[],'public site page errors');
  assert.deepEqual(requests,[],'public CDN resource request failures');
  console.log('PASS PUBLIC PONG untouched '+root);
}catch(e){console.error('FAIL PUBLIC PAGES',e);throw e;}finally{await browser.close();}
