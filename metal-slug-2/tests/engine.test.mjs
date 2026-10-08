import test from 'node:test';
import assert from 'node:assert/strict';
import {RuinsGame,FIXED_DT,FLOOR,BOSS_START,WIDTH,HEIGHT,WORLD_END,actAt,phaseTitle} from '../engine.js';
const make=()=>new RuinsGame({seed:1234});
const tick=(g,n=1)=>{for(let i=0;i<n&&g.phase==='playing';i++)g.step(FIXED_DT);};

test('logical coordinate and act gates are stable',()=>{
  assert.equal(WIDTH,960);assert.equal(HEIGHT,540);assert.ok(WORLD_END>BOSS_START);
  assert.deepEqual([0,1700,3500,5500].map(actAt),[0,1,2,3]);assert.equal(phaseTitle(0),'DUNES AT DUSK');
});
test('ready is motionless until explicit start',()=>{
  const g=make();const before=g.snapshot();g.setInput({right:true,fire:true});g.step(1);assert.equal(g.phase,'ready');assert.deepEqual(g.snapshot(),before);
  g.start();tick(g,10);assert.ok(g.player.x>before.player.x);assert.ok(g.shots>=1);
});
test('reset reinstates score, health, ammo and enemies',()=>{
  const g=make();g.start();g.addScore(300,0,0);g.player.health=1;g.player.ammo=2;g.reset();assert.equal(g.phase,'ready');assert.equal(g.score,0);assert.equal(g.player.health,3);assert.equal(g.player.lives,3);assert.equal(g.player.ammo,Infinity);assert.equal(g.enemies.length,0);
});
test('seeded simulation produces identical results',()=>{
  const a=make(),b=make();a.start();b.start();a.setInput({fire:true,right:true});b.setInput({fire:true,right:true});tick(a,350);tick(b,350);assert.deepEqual(a.snapshot(),b.snapshot());
});
test('walking respects world bounds',()=>{
  const g=make();g.start();g.setInput({left:true});tick(g,200);assert.equal(g.player.x,25);g.player.x=WORLD_END-30;g.setInput({left:false,right:true});tick(g,10);assert.ok(g.player.x<=WORLD_END-g.player.w-10);
});
test('jump rises and lands on the floor without sinking',()=>{
  const g=make();g.start();g.setInput({jump:true});tick(g,15);assert.ok(g.player.y<FLOOR-g.player.h-5);g.setInput({jump:false});tick(g,130);assert.equal(g.player.y,FLOOR-g.player.h);assert.ok(g.player.grounded);
});
test('raised platforms are landable when descending',()=>{
  const g=make();g.start();const q=g.platforms[0];g.player.x=q.x+30;g.player.y=q.y-120;g.player.vy=40;g.player.grounded=false;tick(g,70);assert.equal(g.player.y+g.player.h,q.y);assert.ok(g.player.grounded);
});
test('pause freezes time player movement and every projectile',()=>{
  const g=make();g.start();g.setInput({right:true,fire:true});tick(g,45);g.togglePause();const before=g.snapshot();tick(g,200);assert.deepEqual(g.snapshot(),before);g.togglePause();tick(g,20);assert.ok(g.time>before.time);
});
test('pistol and special weapons have bounded cooldown/ammo',()=>{
  const g=make();g.start();g.setInput({fire:true});tick(g,2);assert.equal(g.player.shots,1);tick(g,3);assert.equal(g.player.shots,1);g.collect({type:'heavy',x:100,y:420,taken:false});assert.equal(g.player.weapon,'heavy');assert.equal(g.player.ammo,175);tick(g,100);assert.ok(g.player.shots>5);
});
test('grenades consume stock and cause radial damage',()=>{
  const g=make();g.start();g.spawn('mummy',140);const target=g.enemies[0];const life=target.hp;g.player.grenades=1;g.setInput({grenade:true});tick(g,2);assert.equal(g.player.grenades,0);assert.equal(g.grenades.length,1);g.grenades[0].x=target.x;g.grenades[0].y=target.y;g.grenades[0].fuse=0;tick(g,1);assert.ok(target.hp<life||target.dead);assert.equal(g.grenades.length,0);
});
test('mummies curse the player and antidote removes curse',()=>{
  const g=make();g.start();assert.equal(g.damagePlayer(1,'curse'),true);assert.ok(g.player.curse>0);assert.equal(g.player.health,3);g.collect({type:'antidote',x:150,y:420,taken:false});assert.equal(g.player.curse,0);
});
test('invulnerability prevents rapid double hits',()=>{
  const g=make();g.start();g.spawns=[];g.damagePlayer(1);assert.equal(g.player.health,2);assert.equal(g.damagePlayer(1),false);tick(g,240);assert.equal(g.damagePlayer(1),true);assert.equal(g.player.health,1);
});
test('dying uses checkpoint and eventually fails',()=>{
  const g=make();g.start();g.player.checkpoint=3500;g.player.health=1;g.damagePlayer(1);assert.equal(g.player.lives,2);assert.equal(g.player.x,3500);assert.equal(g.player.health,3);tick(g,400);g.player.health=1;g.player.invuln=0;g.damagePlayer(1);assert.equal(g.player.lives,1);g.player.health=1;g.player.invuln=0;g.damagePlayer(1);assert.equal(g.phase,'lost');
});
test('rescuing POW increases rescue count, gems add score',()=>{
  const g=make();g.start();const pow={type:'pow',x:55,y:55,taken:false};g.collect(pow);g.collect(pow);assert.equal(g.rescues,1);assert.equal(g.score,1000);g.collect({type:'gem',x:55,y:55,taken:false});assert.equal(g.score,3000);
});
test('enemy projectile damages player when invulnerability ends',()=>{
  const g=make();g.start();const p=g.player;g.enemyShot(p.x-65,p.y+20,400,0,'bullet');tick(g,25);assert.equal(p.health,2);
});
test('bullet kills an enemy via world-space collision',()=>{
  const g=make();g.start();g.spawn('rifle',g.player.x+90);g.setInput({fire:true});tick(g,130);assert.ok(g.kills>=1);
});
test('boss remains dormant before gate and attacks afterwards',()=>{
  const g=make();g.start();tick(g,10);assert.equal(g.boss.active,false);g.player.x=BOSS_START+2;tick(g,1);assert.equal(g.boss.active,true);assert.equal(g.bossGate,true);tick(g,500);assert.ok(g.boss.t>0);
});
test('boss arena prevents walking past head and abandoning fight',()=>{
  const g=make();g.start();g.player.x=BOSS_START+5;tick(g,1);g.setInput({right:true});tick(g,500);assert.ok(g.player.x<=5850);
});
test('boss has 3 phases and produces a genuine win only on defeat',()=>{
  const g=make();g.start();g.player.x=BOSS_START+4;tick(g,2);assert.equal(g.phase,'playing');g.damageBoss(23,6100,350);assert.equal(g.boss.phase,1);g.damageBoss(25,6100,350);assert.equal(g.boss.phase,2);g.damageBoss(100,6100,350);assert.equal(g.phase,'won');assert.equal(g.boss.hp,0);assert.equal(g.boss.dead,true);assert.ok(g.score>=15000);
});
test('complete stage is winnable by a reproducible input-only bot',()=>{
  const g=make();g.start();let i=0;while(g.phase==='playing'&&i<120*100){g.setInput({right:true,fire:true,grenade:i%330<2,jump:i%370<15});g.step(FIXED_DT);i++;}
  assert.equal(g.phase,'won');assert.ok(g.player.lives>=1);assert.equal(g.boss.hp,0);assert.ok(g.kills>=20);assert.ok(g.score>=25000);assert.ok(g.time>20&&g.time<100);
});

test('hidden Sphinx eye rewards accurate aim without modifying world geometry',()=>{
 const g=make();g.start();g.bullets.push({x:366,y:281,px:366,py:281,vx:0,vy:0,r:3,ttl:1,owner:'player',damage:1});tick(g,1);
 assert.equal(g.secrets[0].triggered,true);assert.ok(g.score>=10000);
});
test('hidden golden lamp reveals an array of discoverable treasures',()=>{
 const g=make();g.start();g.camera=3800;const before=g.pickups.length;g.bullets.push({x:4195,y:245,px:4195,py:245,vx:0,vy:0,r:3,ttl:1,owner:'player',damage:1});tick(g,1);
 assert.equal(g.secrets[1].triggered,true);assert.equal(g.pickups.length,before+12);
});
test('Slug walker power-up grants ammo and survives complete run without cheating',()=>{
 const g=make();g.start();g.player.health=1;g.collect({type:'slug',x:200,y:400,taken:false});assert.equal(g.player.weapon,'slug');assert.equal(g.player.ammo,240);assert.equal(g.player.health,3);
 g.setInput({fire:true});tick(g,40);assert.ok(g.player.ammo<240);
});
