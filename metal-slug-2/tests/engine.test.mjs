import test from 'node:test';
import assert from 'node:assert/strict';
import {RuinsGame, FIXED_DT, FLOOR, WIDTH, HEIGHT, WORLD_END, BOSS_START, sweptHit, actAt} from '../engine.js';
import {SCENES,TOWER_PLATFORMS,TOWER_GATES,routeGate,sceneAt} from '../level.js';

const create=(mode='faithful',seed=1234)=>new RuinsGame({seed,mode});
const tick=(g,n=1)=>{for(let i=0;i<n&&g.phase==='playing';i++)g.step(FIXED_DT);};
const input=(g,actions,n)=>{g.setInput(actions);tick(g,n);};

test('six authored scene definitions and actual climb height are stable',()=>{
  assert.equal(WIDTH,960);assert.equal(HEIGHT,540);assert.equal(FLOOR,456);
  assert.equal(SCENES.length,6);assert.equal(sceneAt(0).id,'desert');
  assert.equal(sceneAt(BOSS_START+1).id,'boss');
  assert.equal(TOWER_PLATFORMS.at(-1).y,-570);
  assert.ok(TOWER_GATES.length>=10);assert.equal(actAt(1700),1);
});
test('initial state and explicit start gate',()=>{
  const g=create(),baseline=g.snapshot();
  g.setInput({right:true,fire:true});g.step(.5);
  assert.deepEqual(g.snapshot(),baseline);assert.equal(g.phase,'ready');
  g.start();tick(g,10);assert.ok(g.player.x>100);assert.ok(g.player.shots>=1);
});
test('Arcade is genuinely one-hit, Practice is explicitly more forgiving',()=>{
  const a=create(),p=create('practice');a.start();p.start();a.spawns=[];p.spawns=[];
  assert.equal(a.player.health,1);assert.equal(a.player.lives,3);
  assert.equal(p.player.health,5);assert.equal(p.player.lives,5);
  a.damagePlayer(1);p.damagePlayer(1);
  assert.equal(a.player.lives,2);assert.equal(a.player.health,1);
  assert.equal(p.player.lives,5);assert.equal(p.player.health,4);
});
test('seeded simulations have deterministic game state and camera',()=>{
  const a=create('practice',777),b=create('practice',777);a.start();b.start();
  for(let i=0;i<2200;i++){
    const actions={right:true,fire:true,jump:i%390>180,grenade:i%470===0};
    a.setInput(actions);b.setInput(actions);a.step(FIXED_DT);b.step(FIXED_DT);
  }
  assert.deepEqual(a.snapshot(),b.snapshot());
});
test('continuous bullet intersection cannot tunnel through thin targets',()=>{
  assert(sweptHit({px:0,py:18,x:520,y:18,r:2},{x:210,y:4,w:2,h:28}));
  assert(!sweptHit({px:0,py:95,x:520,y:95,r:2},{x:210,y:4,w:2,h:28}));
  assert(sweptHit({x:30,y:40,r:3},{x:27,y:36,w:8,h:10}));
});
test('Danger barrel physically gates descent and is destructible',()=>{
  const g=create('practice');g.start();g.player.x=1600;g.spawns=[];g.spawn('barrel',1570);
  input(g,{right:true},100);
  assert.ok(g.player.x<=1650-g.player.w);
  assert.equal(g.gateOpen,false);
  const barrel=g.enemies.find(e=>e.type==='barrel');
  g.damageEnemy(barrel,99,barrel.x,barrel.y);
  assert.equal(g.gateOpen,true);
  input(g,{right:true},50);
  assert.ok(g.player.x>=1650);
});
test('climbing gates are position AND altitude constrained',()=>{
  assert.equal(routeGate(3750,3800,456,true),3790-26);
  assert.equal(routeGate(3750,3800,275,true),3800);
  assert.equal(routeGate(1600,1650,456,false),1650-26);
  assert.equal(routeGate(1600,1650,456,true),1650);
});
test('jump is physically ballistic, platform landing does not tunnel',()=>{
  const g=create('practice');g.start();g.spawns=[];
  g.setInput({jump:true});tick(g,17);assert.ok(g.player.y<FLOOR-g.player.h);
  g.setInput({jump:false});tick(g,150);assert.equal(g.player.y,FLOOR-g.player.h);
  const platform=g.platforms[0];
  g.player.x=platform.x+25;g.player.y=platform.y-140;g.player.vy=50;g.player.grounded=false;
  tick(g,80);assert.equal(g.player.y+g.player.h,platform.y);
});
test('pause blocks all simulation activity and resumes',()=>{
  const g=create('practice');g.start();g.setInput({right:true,fire:true});tick(g,40);
  g.togglePause();const before=g.snapshot();tick(g,300);g.step(1);
  assert.deepEqual(g.snapshot(),before);g.togglePause();tick(g,20);
  assert.ok(g.time>before.time);
});
test('ordinary pistol cooldown, Heavy ammo and spread have bounded rates',()=>{
  const g=create('practice');g.start();g.setInput({fire:true});tick(g,2);
  const n=g.shots;tick(g,3);assert.equal(g.shots,n);
  g.collect({type:'heavy',x:100,y:420,taken:false});
  tick(g,80);assert.equal(g.player.weapon,'heavy');assert.ok(g.shots>=8);
  assert.ok(g.player.ammo<175);
  g.collect({type:'spread',x:100,y:420,taken:false});
  assert.equal(g.player.weapon,'spread');
});
test('crouch, up and air down shots have the correct weapon vector',()=>{
  const g=create('practice');g.start();g.spawns=[];
  g.setInput({up:true,fire:true});tick(g,1);
  assert.ok(g.bullets.some(b=>b.owner==='player'&&b.vy<0));
  g.player.fireCooldown=0;g.setInput({up:false,down:true,jump:true,fire:true});tick(g,5);
  g.player.fireCooldown=0;tick(g,1);
  assert.ok(g.bullets.some(b=>b.owner==='player'&&b.vy>0));
});
test('grenades are finite and their explosion hurts enemies',()=>{
  const g=create('practice');g.start();g.spawn('mummy',140);const mummy=g.enemies[0];
  g.player.grenades=1;g.setInput({grenade:true});tick(g,2);
  assert.equal(g.player.grenades,0);assert.equal(g.grenades.length,1);
  g.grenades[0].x=mummy.x;g.grenades[0].y=mummy.y;g.grenades[0].t=2;
  tick(g,1);assert.ok(mummy.hp<mummy.maxHp||mummy.dead);
});
test('first purple attack mummifies; second kills in Arcade',()=>{
  const g=create();g.start();g.spawns=[];g.damagePlayer(1,'curse');
  assert.ok(g.player.curse>0);assert.equal(g.player.weapon,'pistol');
  g.player.invuln=0;g.damagePlayer(1,'curse');
  assert.equal(g.player.lives,2);assert.equal(g.player.curse,0);
});
test('Practice second purple hit is survivable and never permanently soft-locks',()=>{
  const g=create('practice');g.start();g.damagePlayer(1,'curse');
  g.player.invuln=0;g.damagePlayer(1,'curse');
  assert.equal(g.player.curse,0);assert.equal(g.player.health,4);
});
test('antidote explicitly reverses persistent mummy transformation',()=>{
  const g=create();g.start();g.spawns=[];g.enemies=[];g.damagePlayer(1,'curse');tick(g,1200);
  assert.ok(g.player.curse>0,'curse must not expire on a timer');
  g.collect({type:'antidote',x:1800,y:410,taken:false});
  assert.equal(g.player.curse,0);
});
test('invulnerable after ordinary damage, then vulnerable again',()=>{
  const g=create('practice');g.start();g.spawns=[];g.damagePlayer(1);
  assert.equal(g.player.health,4);assert.equal(g.damagePlayer(1),false);
  tick(g,400);assert.equal(g.damagePlayer(1),true);assert.equal(g.player.health,3);
});
test('Slugnoid is a genuine mounted entity with damageable twin guns',()=>{
  const g=create('practice');g.start();
  g.collect({type:'slug',x:5000,y:-320,taken:false});
  assert.equal(g.vehicle.mounted,true);assert.equal(g.vehicle.gunsLeft,2);
  g.setInput({fire:true});tick(g,1);assert.ok(g.bullets.filter(b=>b.kind==='vulcan').length>=2);
  g.player.invuln=0;g.damagePlayer(1);
  assert.equal(g.vehicle.hp,2);assert.equal(g.vehicle.gunsLeft,1);
  assert.equal(g.player.lives,5);
});
test('Slugnoid can exit, re-enter and fire a downward main cannon',()=>{
  const g=create('practice');g.start();g.collect({type:'slug',x:100,y:400,taken:false});
  g.setInput({interact:true});tick(g,1);assert.equal(g.vehicle.mounted,false);
  g.setInput({interact:false});tick(g,1);
  g.setInput({interact:true});tick(g,1);assert.equal(g.vehicle.mounted,true);
  g.setInput({interact:false,grenade:true});tick(g,1);
  assert.ok(g.bullets.some(b=>b.kind==='cannon'&&b.vy>0));
});
test('vehicle explodes on armor depletion rather than killing player instantly',()=>{
  const g=create('practice');g.start();g.collect({type:'slug',x:100,y:400,taken:false});
  for(let n=0;n<3;n++){g.player.invuln=0;g.damagePlayer(1);}
  assert.equal(g.vehicle.mounted,false);assert.equal(g.vehicle.hp,0);assert.equal(g.player.lives,5);
});
test('POWs and gems score once; secret Sphinx eye is discoverable',()=>{
  const g=create('practice');g.start();const item={type:'pow',x:100,y:410,taken:false};
  g.collect(item);g.collect(item);assert.equal(g.rescues,1);
  const base=g.score;g.collect({type:'gem',x:100,y:410,taken:false});assert.equal(g.score,base+2000);
  g.bullets.push({x:366,y:281,px:366,py:281,r:3,ttl:1,owner:'player',damage:1,vx:0,vy:0});
  tick(g,1);assert(g.secrets[0].triggered);
});
test('boss cannot start without actually reaching upper roof',()=>{
  const g=create('practice');g.start();g.spawns=[];
  g.player.x=BOSS_START+3;g.player.y=408;tick(g,3);assert.equal(g.boss.active,false);
});
test('boss starts from below, telegraphs multiple attacks and can genuinely be defeated',()=>{
  const g=create('practice');g.start();g.spawns=[];g.player.x=BOSS_START+5;
  g.player.y=-618;g.player.grounded=true;tick(g,2);
  assert.equal(g.boss.active,true);assert.ok(g.boss.entry<1);
  tick(g,250);assert.equal(g.boss.entry,1);
  const hp=g.boss.hp;g.damageBoss(25,g.boss.x,g.boss.y);
  assert.ok(g.boss.hp<hp);
  g.damageBoss(g.boss.hp,g.boss.x,g.boss.y);
  assert.equal(g.phase,'won');assert.equal(g.boss.dead,true);
});
test('boss advertises electric attacks when mounted, missiles on foot, and safe laser/lunge telegraphs',()=>{
  const seen=new Set();
  for(const mounted of [false,true]){
    const g=create('practice');g.start();g.spawns=[];
    g.player.x=BOSS_START+6;g.player.y=-618;g.player.grounded=true;g.player.invuln=1000;
    if(mounted)g.collect({type:'slug',x:g.player.x,y:g.player.y,taken:false});
    tick(g,2);
    assert.equal(g.boss.active,true);
    const thisMode=new Set();
    for(let i=0;i<120*22&&thisMode.size<3;i++){
      for(const event of g.step(FIXED_DT))
        if(event.type==='warning'){seen.add(event.mode);thisMode.add(event.mode);}
    }
    assert.equal(g.phase,'playing','time and enemy patterns cannot auto-complete mission');
    assert.equal(g.boss.hp,g.boss.maxHp);
    assert(thisMode.has(mounted?'electric':'missile'),'mode-specific projectile was not telegraphed');
  }
  for(const mode of ['electric','laser','lunge','missile'])assert(seen.has(mode),'missing '+mode+' telegraph');
});
test('checkpoints respawn without world clipping',()=>{
  const g=create();g.start();g.spawns=[];
  g.player.checkpoint=5450;g.player.checkpointY=-618;
  g.damagePlayer(1);assert.equal(g.player.x,5450);assert.equal(g.player.y,-618);
  assert.equal(g.player.health,1);
});
test('real route cannot be completed by holding right and fire without jumping',()=>{
  const g=create('practice');g.start();
  for(let n=0;n<120*55&&g.phase==='playing';n++){g.setInput({right:true,fire:true});g.step(FIXED_DT);}
  assert.notEqual(g.phase,'won');assert.equal(g.boss.active,false);
  assert.ok(g.player.x<=3790,'player must not walk through the vertical maze');
});
test('complete practice playthrough must use inputs, climb and defeat real boss',()=>{
  const g=create('practice');g.start();const visited=new Set();let i=0;
  while(g.phase==='playing'&&i<120*120){
    const p=g.player,b=g.boss;
    g.setInput({right:!b.active||p.x<b.x-60,
      left:b.active&&p.x>b.x-20,
      jump:p.x>3440||b.active,
      fire:true,down:b.active,
      grenade:i%330===0});
    g.step(FIXED_DT);visited.add(g.sceneId);i++;
  }
  assert.equal(g.phase,'won',JSON.stringify({scene:g.sceneId,x:g.player.x,y:g.player.y,health:g.player.health,lives:g.player.lives}));
  assert.equal(g.boss.hp,0);assert.ok(g.time>20&&g.time<120);
  assert.ok(g.camera.y<-400,'real vertical camera required');
  assert.ok(g.maxHeight<-600,'must physically ascend multiple screen-heights');
  for(const scene of SCENES)assert.ok(visited.has(scene.id),'missing scene '+scene.id);
  assert.ok(g.vehicle.serial>=1,'must encounter mounted Slugnoid');
  assert.ok(g.kills>=15);assert.ok(g.score>=20000);
});
test('restart clears all transient combat events, curse and vehicle state',()=>{
  const g=create('practice');g.start();g.collect({type:'slug',x:100,y:420,taken:false});
  g.player.curse=100;g.addScore(300,0,0);g.reset();
  assert.equal(g.phase,'ready');assert.equal(g.score,0);
  assert.equal(g.camera.y,0);assert.equal(g.vehicle.mounted,false);assert.equal(g.player.curse,0);
  assert.equal(g.gateOpen,false);assert.equal(g.boss.active,false);
});
