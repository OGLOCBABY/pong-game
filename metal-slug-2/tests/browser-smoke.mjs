/** HTTP/ES-module Chromium playthrough, real keyboard/touch. No engine mutations or cheat hooks. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {chromium,firefox,webkit} from 'playwright';
const require=createRequire(import.meta.url);
const axePath=require.resolve('axe-core/axe.min.js');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const out=resolve(root,'metal-slug-2/test-results');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    const loc=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname);
    const path=resolve(root,'.'+loc);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const data=await readFile(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
  }catch(err){res.writeHead(404).end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port;
const url='http://127.0.0.1:'+port+'/metal-slug-2/';
const errors=[],external=[];
let browser;
const snap=p=>p.evaluate(()=>window.__ruins.snapshot());
function observe(p,label){
  p.on('pageerror',e=>errors.push(label+': '+e.message));
  p.on('console',e=>{if(e.type()==='error')errors.push(label+': '+e.text());});
  p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(url).origin)external.push(label+': '+r.url());});
}
const boot=p=>p.waitForFunction(()=>typeof window.__ruins?.snapshot==='function',null,{timeout:15000});
async function audit(p,label){
  await p.addScriptTag({path:axePath});
  const violations=await p.evaluate(async()=>{
    const v=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});
    return v.violations.map(x=>({id:x.id,impact:x.impact,target:x.nodes.map(z=>z.target.join(' ')).slice(0,6)}));
  });
  assert.deepEqual(violations,[],label+' accessibility: '+JSON.stringify(violations));
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const held=new Set();
async function hold(page,key,on){
  if(on&&!held.has(key)){await page.keyboard.down(key);held.add(key);}
  if(!on&&held.has(key)){await page.keyboard.up(key);held.delete(key);}
}
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:980},deviceScaleFactor:1});
  observe(page,'desktop');
  let response=await page.goto(url,{waitUntil:'networkidle'});
  assert.equal(response.status(),200);
  await boot(page);
  assert.equal((await snap(page)).phase,'ready');
  assert.equal((await snap(page)).mode,'faithful');
  await page.screenshot({path:resolve(out,'01-intro.png'),fullPage:true});
  await audit(page,'desktop');
  await page.locator('#mode').click();
  assert.equal((await snap(page)).mode,'practice');
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.__ruins.snapshot().phase==='playing');
  await hold(page,'d',true);await wait(170);await hold(page,'d',false);
  assert((await snap(page)).player.x>115,'keyboard moves soldier in actual browser');
  await hold(page,'j',true);await wait(260);
  assert((await snap(page)).player.shots>=1,'real firing from held key');
  await hold(page,'Space',true);await wait(155);await hold(page,'Space',false);
  assert((await snap(page)).player.y<403,'jump moved soldier upwards');
  await page.keyboard.press('p');
  const frozen=await snap(page);assert.equal(frozen.phase,'paused');
  await wait(300);
  assert.equal((await snap(page)).time,frozen.time,'paused simulation must freeze');
  await page.keyboard.press('p');
  assert.equal((await snap(page)).phase,'playing');
  console.log('PASS real ES-module page, controls, jump, fire, pause/resume, accessibility');

  // Normal game controls only: cannot call start(), setInput() or manipulate player/boss directly.
  const visited=new Set();
  const captured=new Set();
  const t0=Date.now();
  await hold(page,'j',true);
  let last=await snap(page),loops=0,nextGrenade=Date.now()+400;
  while(last.phase==='playing'&&Date.now()-t0<115000){
    const p=last.player,b=last.boss;
    await hold(page,'d',!b.active||p.x<b.x-60);
    await hold(page,'a',b.active&&p.x>b.x-20);
    await hold(page,'Space',p.x>3440||b.active);
    await hold(page,'s',b.active);
    if(Date.now()>=nextGrenade){await hold(page,'k',true);nextGrenade=Date.now()+2600;}
    else if(held.has('k'))await hold(page,'k',false);
    await wait(120);
    last=await snap(page);
    visited.add(last.sceneId);loops++;
    if(!captured.has(last.sceneId)){
      captured.add(last.sceneId);
      await page.screenshot({path:resolve(out,'scene-'+last.sceneId+'.png')});
      console.log('SCENE '+last.sceneId+' x='+Math.round(last.player.x)+' y='+Math.round(last.player.y)+' cameraY='+Math.round(last.camera.y));
    }
    if(loops%50===0)console.log('PLAY '+JSON.stringify({elapsed:last.time,scene:last.sceneId,x:Math.round(last.player.x),y:Math.round(last.player.y),lives:last.player.lives,bosshp:last.boss.hp,phase:last.phase}));
  }
  for(const key of [...held])await hold(page,key,false);
  if(last.phase!=='won')await page.screenshot({path:resolve(out,'FAILED-bot.png')});
  assert.equal(last.phase,'won','full keyboard playthrough failure: '+JSON.stringify(last));
  assert.equal(last.boss.hp,0);assert.ok(last.vehicle.serial>=1);
  assert.ok(last.camera.y<-400&&last.maxHeight<-600,'actual vertical scrolling required');
  for(const id of ['desert','descent','tomb','ascent','slugnoid','boss'])assert(visited.has(id),'missing scene '+id);
  await page.screenshot({path:resolve(out,'99-victory.png'),fullPage:true});
  await audit(page,'victory');
  console.log('PASS COMPLETE REAL-BROWSER MISSION '+JSON.stringify({seconds:last.time,kills:last.kills,score:last.score,scenes:[...visited],boss:last.boss.hp,performance:await page.evaluate(()=>window.__ruins.performance())}));
  await page.locator('#play').click();assert.equal((await snap(page)).phase,'playing');
  await page.locator('#restart').click();assert.equal((await snap(page)).phase,'playing');
  assert.equal((await snap(page)).score,0);
  console.log('PASS rematch/restart, no stale boss or score');

  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  observe(mobile,'mobile');await mobile.goto(url);await boot(mobile);
  assert.equal(await mobile.locator('[data-control="down"]').count(),1,'touch down-aim button exists');
  const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert(overflow<4,'mobile horizontal overflow '+overflow);
  await mobile.screenshot({path:resolve(out,'mobile-intro.png'),fullPage:true});
  await mobile.locator('#play').click();
  await mobile.waitForFunction(()=>window.__ruins.snapshot().phase==='playing');
  assert(await mobile.locator('[data-control="down"]').isVisible(),'down aim becomes visible after start');
  assert(await mobile.locator('[data-control="interact"]').isVisible(),'vehicle control becomes visible after start');
  await mobile.locator('[data-control="fire"]').tap();
  assert.equal((await snap(mobile)).phase,'playing');
  await mobile.screenshot({path:resolve(out,'mobile-controls.png')});
  await audit(mobile,'mobile');
  console.log('PASS mobile touch controls, 390px layout, axe audit');

  const tiny=await browser.newPage({viewport:{width:320,height:700},isMobile:true,hasTouch:true});
  observe(tiny,'320px');await tiny.goto(url);await boot(tiny);
  assert((await tiny.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))<4);
  await tiny.screenshot({path:resolve(out,'mobile-320.png'),fullPage:true});

  for(const [name,engine] of [['Firefox',firefox],['WebKit',webkit]]){
    let b=await engine.launch({headless:true});
    try{
      const p=await b.newPage({viewport:{width:1280,height:800}});
      observe(p,name);await p.goto(url);await boot(p);
      await p.locator('#play').click();
      await p.keyboard.down('d');await wait(180);await p.keyboard.up('d');
      assert((await snap(p)).player.x>115,name+' directional input');
      await p.screenshot({path:resolve(out,'browser-'+name.toLowerCase()+'.png')});
      console.log('PASS '+name+' startup and real movement');
    }finally{await b.close();}
  }
  assert.deepEqual(errors,[],'runtime page/console errors');
  assert.deepEqual(external,[],'unexpected external asset/network fetches');
  console.log('SMOKE RESULT: ALL CHECKS PASSED');
}catch(err){
  console.error('SMOKE FAIL',err.stack||err);
  throw err;
}finally{
  if(browser)await browser.close();
  await new Promise(done=>server.close(done));
}
