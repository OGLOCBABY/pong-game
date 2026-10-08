import {TOWER_PLATFORMS,TOWER_GATES,SCENES,sceneAt,towerSurfaceAt,routeGate} from './level.js';
/** RUINS OF THE SECOND SUN — original, deterministic arcade simulation.
 * This module does not touch the DOM, clock, storage, audio or network.
 */
export const WIDTH = 960;
export const HEIGHT = 540;
export const FLOOR = 456;
export const WORLD_END = 6640;
export const BOSS_START = 5480;
export const FIXED_DT = 1 / 120;
const G = 1080;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const ENEMY_LAYOUT = [
  [430,'rifle'],[675,'rifle'],[790,'rifle'],[1130,'rifle'],[1330,'rifle'],[1480,'rifle'],
  [1570,'barrel'],[1760,'mummy'],[1950,'mummy'],[2170,'bat'],[2380,'mummy'],[2590,'mummy'],[2780,'spawner'],
  [3050,'mummy'],[3290,'turret'],[3410,'mummy'],[3650,'bat'],[3850,'mummy'],[3990,'mummy'],
  [4230,'spawner'],[4490,'bat'],[4650,'mummy'],[4870,'rifle'],[5100,'turret'],[5240,'rifle']
];
const PICKUP_LAYOUT = [
  [630,'grenade'],[1240,'heavy'],[1520,'gem'],[1880,'antidote'],[2150,'pow'],[2390,'spread'],
  [2870,'antidote'],[3110,'grenade'],[3430,'pow'],[3730,'gem'],[4140,'antidote'],
  [4420,'heavy'],[4720,'pow'],[4990,'slug'],[5200,'health'],[5530,'grenade']
];
const PLATFORMS = [
  {x:1035,y:380,w:210},{x:2040,y:375,w:185},{x:2290,y:320,w:190},{x:2900,y:365,w:190},
  ...TOWER_PLATFORMS
];
const PICKUP_HEIGHTS = {2150:330,2390:278,3430:408,3730:286,4420:292,4720:413};
const PHASES = ['DUNES AT DUSK','BENEATH THE STONE','THE RISING TOMB','IRON COLOSSUS'];
export function actAt(x) {return x < 1650 ? 0 : x < 3480 ? 1 : x < BOSS_START ? 2 : 3;}
export function phaseTitle(x) {return PHASES[actAt(x)];}
export function sweptHit(a, b, radius=0) {
  const cx = clamp(a.x, b.x-radius, b.x+b.w+radius);
  const cy = clamp(a.y, b.y-radius, b.y+b.h+radius);
  return (a.x-cx)**2+(a.y-cy)**2 < (a.r+radius)**2;
}

export class RuinsGame {
  constructor({seed=7098,mode='faithful'}={}) {this.initialSeed=seed >>> 0 || 1;this.mode=mode==='practice'?'practice':'faithful';this.reset();}
  random() {let x=this.seed; x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
  reset() {
    this.seed=this.initialSeed;this.phase='ready';this.time=0;this.score=0;this.camera={x:0,y:0};
    this.player={x:100,y:FLOOR-48,w:26,h:48,vx:0,vy:0,grounded:true,dir:1,health:this.mode==='faithful'?1:3,lives:3,invuln:0,curse:0,weapon:'pistol',ammo:Infinity,grenades:8,fireCooldown:0,throwCooldown:0,anim:0,checkpoint:100,checkpointY:FLOOR-48,shots:0,kills:0,crouch:false};
    this.bullets=[];this.grenades=[];this.enemies=[];this.pickups=PICKUP_LAYOUT.map(([x,type],id)=>({id,x,y:PICKUP_HEIGHTS[x]??(towerSurfaceAt(x)-38),type,taken:false,phase:this.random()*6}));
    this.spawns=ENEMY_LAYOUT.map(([x,type],id)=>({x,type,id,activated:false}));
    this.platforms=PLATFORMS.map(p=>({...p,h:14}));
    this.secrets=[{x:366,y:281,w:22,h:25,kind:'sphinx',triggered:false},{x:4220,y:-10,w:30,h:26,kind:'lamp',triggered:false}];
    this.particles=[];this.floating=[];this.events=[];this.input={left:false,right:false,up:false,down:false,jump:false,fire:false,grenade:false,interact:false};
    this.vehicle={mounted:false,hp:0,maxHp:3,gunsLeft:0,serial:0};this.hazards=[];this.gateOpen=false;this.sceneId='desert';this.scenes=SCENES;this.maxHeight=0;
    this.boss={x:6100,y:405,hp:58,maxHp:58,active:false,dead:false,t:0,attackT:1.5,phase:0,telegraph:0,entry:0,mode:'missile',counter:0,charges:0};
    this.act=0;this.bossGate=false;this.kills=0;this.shots=0;this.hits=0;this.rescues=0;this.combo=0;this.comboTimer=0;
    return this;
  }
  start() {if (this.phase==='ready') {this.phase='playing';this.events.push({type:'start'});} else if(this.phase==='won'||this.phase==='lost') {this.reset();this.phase='playing';this.events.push({type:'start'});} }
  togglePause(){if(this.phase==='playing'){this.phase='paused';this.events.push({type:'pause'});}else if(this.phase==='paused'){this.phase='playing';this.events.push({type:'resume'});} }
  setInput(partial){for(const key of Object.keys(this.input))if(Object.hasOwn(partial,key))this.input[key]=!!partial[key];}
  emit(type,x=this.player.x,y=this.player.y,extra={}){this.events.push({type,x,y,...extra});}
  burst(x,y,color,n=12,power=150){for(let i=0;i<n;i++){let a=this.random()*Math.PI*2,s=(.3+this.random()*.7)*power;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-45,life:.25+this.random()*.45,max:.7,size:2+this.random()*4,color});} if(this.particles.length>300)this.particles.splice(0,this.particles.length-300);}
  float(x,y,text,color='#ffe19a'){this.floating.push({x,y,text,color,life:1.15});}
  addScore(score,x,y){this.score+=score;this.float(x,y,`+${score.toLocaleString('en-US')}`);}
  spawn(type,x,y=towerSurfaceAt(x)){const hp={rifle:2,mummy:3,bat:2,turret:5,spawner:9,barrel:4}[type]||2;const h={rifle:43,mummy:47,bat:20,turret:34,spawner:53,barrel:42}[type]||40;this.enemies.push({id:this.enemies.length+this.kills*1000,type,x,y:y-h,w:type==='spawner'?50:type==='barrel'?50:29,h,vx:0,vy:0,hp,maxHp:hp,hit:0,t:0,shoot:.5+this.random()*1.3,spawn:.9+this.random(),dir:-1,dead:false,active:true,attack:0,grounded:true});}
  firePlayer(){const p=this.player;if(p.fireCooldown>0||p.curse>0&&p.fireCooldown>0)return;
    const isSlug=p.weapon==='slug'&&p.ammo>0, isHeavy=(p.weapon==='heavy'||isSlug)&&p.ammo>0, isSpread=p.weapon==='spread'&&p.ammo>0;
    const rate=p.curse>0?.29:isSlug?.095:isHeavy?.075:isSpread?.27:.16;p.fireCooldown=rate;
    let dx=p.dir,dy=0;
    if(this.input.up){dx=0;dy=-1;}else if(this.input.down&&!p.grounded){dx=p.dir*.75;dy=.66;}
    const origin={x:p.x+p.w/2+dx*18,y:p.y+(p.curse>0?30:21)+(dy<0?-16:0)};
    const angles=isSpread?[-.22,0,.22]:isSlug?[-.12,.12]:[0];
    for(const a of angles){const vx=dx*Math.cos(a)-dy*Math.sin(a),vy=dx*Math.sin(a)+dy*Math.cos(a);this.bullets.push({x:origin.x,y:origin.y,px:origin.x,py:origin.y,vx:vx*(isHeavy?1300:970),vy:vy*(isHeavy?1300:970),r:isHeavy?4:3,ttl:.95,owner:'player',damage:isHeavy?1.1:1,color:isHeavy?'#ffe8aa':'#fff4bc'});}
    if(p.ammo!==Infinity) {p.ammo--;if(p.ammo<=0){p.weapon='pistol';p.ammo=Infinity;this.emit('empty');}}
    p.shots++;this.shots++;this.emit('shoot',origin.x,origin.y,{heavy:isHeavy,spread:isSpread,slug:isSlug});
    this.burst(origin.x+dx*4,origin.y+dy*4,'#fff0ab',3,62);
  }
  toss(){const p=this.player;if(p.grenades<=0||p.throwCooldown>0||p.curse>0)return; p.grenades--;p.throwCooldown=.43;this.grenades.push({x:p.x+p.w/2,y:p.y+8,vx:p.dir*335+p.vx*.3,vy:-490,t:0,fuse:1.25});this.emit('throw');}
  damagePlayer(amount=1,kind='bullet') {
    const p=this.player;
    if(this.phase!=='playing'||p.invuln>0)return false;
    if(this.vehicle.mounted){
      this.vehicle.hp=Math.max(0,this.vehicle.hp-1);
      this.vehicle.gunsLeft=Math.max(0,this.vehicle.gunsLeft-1);
      p.invuln=1.25;this.emit('vehiclehit',p.x,p.y,{hp:this.vehicle.hp,guns:this.vehicle.gunsLeft});
      this.burst(p.x,p.y,'#ffcc79',20,190);
      if(!this.vehicle.hp){this.vehicle.mounted=false;p.weapon='pistol';p.ammo=Infinity;p.invuln=2;this.emit('vehiclelost');}
      return true;
    }
    if(kind==='curse'){
      if(p.curse>0){p.health=0;p.lives--;this.emit('mummydeath');if(p.lives<=0){this.phase='lost';this.emit('lost');}else this.respawn();return true;}
      p.curse=9999;p.weapon='pistol';p.ammo=Infinity;p.invuln=.65;
      this.burst(p.x+12,p.y+20,'#a7e681',28,190);this.emit('curse');return true;
    }
    p.health=Math.max(0,p.health-amount);p.invuln=1.6;
    this.burst(p.x+12,p.y+17,'#ff8c60',20,165);this.emit('hurt');
    if(p.health<=0){p.lives--;if(p.lives<=0){this.phase='lost';this.emit('lost');}else this.respawn();}
    return true;
  }
  respawn(){const p=this.player;p.x=p.checkpoint;p.y=p.checkpointY;p.vx=0;p.vy=0;p.grounded=true;p.health=this.mode==='faithful'?1:3;p.invuln=2.8;p.curse=0;p.weapon='pistol';p.ammo=Infinity;p.grenades=Math.max(4,p.grenades);this.vehicle={mounted:false,hp:0,maxHp:3,gunsLeft:0,serial:this.vehicle.serial};this.hazards=[];this.bullets=this.bullets.filter(b=>b.owner==='player');this.enemies=this.enemies.filter(e=>e.x<p.x-300||e.x>p.x+380);this.emit('respawn');}
  collect(item){if(item.taken)return;item.taken=true;const p=this.player;let pts=100;
    switch(item.type){case 'heavy':p.weapon='heavy';p.ammo=175;pts=300;break;
      case 'spread':p.weapon='spread';p.ammo=65;pts=300;break;
      case 'slug':p.weapon='slug';p.ammo=240;this.vehicle={mounted:true,hp:3,maxHp:3,gunsLeft:2,serial:this.vehicle.serial+1};p.health=this.mode==='faithful'?1:3;p.invuln=Math.max(p.invuln,.8);this.emit('mount');pts=1500;break;
      case 'coin':pts=500;break;
      case 'grenade':p.grenades=Math.min(20,p.grenades+5);pts=200;break;
      case 'health':p.health=Math.min(3,p.health+2);pts=200;break;
      case 'antidote':p.curse=0;p.health=Math.min(3,p.health+1);pts=250;break;
      case 'pow':this.rescues++;pts=1000;break;
      case 'gem':pts=2000;break;}
    this.addScore(pts,item.x,item.y-12);this.burst(item.x,item.y,item.type==='antidote'?'#84ffc7':'#ffe8a4',20,170);this.emit('pickup',item.x,item.y,{item:item.type});}
  damageEnemy(e,value,x,y){if(e.dead)return;e.hp-=value;e.hit=.13;this.burst(x,y,'#ffc26f',6,90);this.emit('hit',x,y);
    if(e.hp<=0){e.dead=true;this.kills++;this.combo++;this.comboTimer=4;const pts=e.type==='spawner'?800: e.type==='turret'?500:200;this.addScore(pts+Math.min(10,this.combo)*30,e.x,e.y);this.burst(e.x+e.w/2,e.y+e.h/2,e.type==='spawner'?'#b9eece':'#ffc27b',21,215);this.emit('kill',e.x,e.y,{enemy:e.type});if(e.type==='spawner')this.pickups.push({id:1000+this.pickups.length,x:e.x+25,y:e.y+e.h-40,type:'antidote',taken:false,phase:0});if(e.type==='barrel'){this.gateOpen=true;this.emit('gateopen',e.x,e.y);}}}
  damageBoss(value,x,y){const b=this.boss;if(!b.active||b.dead)return;b.hp=Math.max(0,b.hp-value);b.phase=b.hp<b.maxHp*.35?2:b.hp<b.maxHp*.7?1:0;this.burst(x,y,'#f7e49b',8,180);this.emit('bosshit',x,y);
    if(b.hp===0){b.dead=true;this.bossGate=false;this.bullets=this.bullets.filter(v=>v.owner==='player');this.addScore(15000,b.x,b.y);this.burst(b.x-25,b.y,'#ffe9a0',100,350);this.phase='won';this.emit('won');}}
  explode(g){this.burst(g.x,g.y,'#ffb460',45,260);this.emit('explosion',g.x,g.y);const rad=107;
    for(const e of this.enemies){if(e.dead)continue;const dx=e.x+e.w/2-g.x,dy=e.y+e.h/2-g.y;if(dx*dx+dy*dy<rad*rad)this.damageEnemy(e,5,g.x,g.y);}
    const b=this.boss;if(b.active&&!b.dead&&Math.hypot(b.x-35-g.x,b.y-g.y)<rad+75)this.damageBoss(6,g.x,g.y);
  }
  updatePlayer(dt){const p=this.player,I=this.input;const slow=p.curse>0?.56:1;const speed=238*slow;
    const d=(I.right?1:0)-(I.left?1:0);p.vx=d*speed;if(d)p.dir=d;
    if(I.jump&&p.grounded){p.vy=p.curse>0?-350:-490;p.grounded=false;this.emit('jump');}
    if(I.fire)this.firePlayer();if(I.grenade)this.toss();
    const prevBottom=p.y+p.h;
    p.vy=clamp(p.vy+G*dt,-750,780);p.x=clamp(p.x+p.vx*dt,25,WORLD_END-p.w-10);
    if(this.bossGate)p.x=clamp(p.x,BOSS_START+10,5850);
    p.y+=p.vy*dt;p.grounded=false;
    if(p.vy>=0){let landing=FLOOR;
      for(const platform of this.platforms){if(prevBottom<=platform.y+8&&p.y+p.h>=platform.y&&p.x+p.w>platform.x+6&&p.x<platform.x+platform.w-6&&platform.y<landing)landing=platform.y;}
      if(p.y+p.h>=landing){p.y=landing-p.h;p.vy=0;p.grounded=true;}
    }
    if(p.y+p.h>FLOOR){p.y=FLOOR-p.h;p.vy=0;p.grounded=true;}
    p.invuln=Math.max(0,p.invuln-dt);p.curse=Math.max(0,p.curse-dt);p.fireCooldown=Math.max(0,p.fireCooldown-dt);p.throwCooldown=Math.max(0,p.throwCooldown-dt);p.anim+=dt*(d?12:4);
    if(p.x>=1640&&p.checkpoint<1650){p.checkpoint=1680;this.emit('checkpoint',p.x,p.y);}
    if(p.x>=3500&&p.checkpoint<3500){p.checkpoint=3520;this.emit('checkpoint',p.x,p.y);}
    if(p.x>=5350&&p.checkpoint<5350){p.checkpoint=5390;this.emit('checkpoint',p.x,p.y);}
    const nextAct=actAt(p.x);if(nextAct!==this.act){this.act=nextAct;this.emit('act',p.x,p.y,{act:nextAct,title:PHASES[nextAct]});}
    if(!this.boss.active&&p.x>=BOSS_START){this.boss.active=true;this.bossGate=true;this.emit('boss',p.x,p.y);}
  }
  updateEnemy(e,dt){const p=this.player;e.t+=dt;e.hit=Math.max(0,e.hit-dt);e.shoot-=dt;
    const dx=p.x-e.x;const near=Math.abs(dx)<660;e.dir=dx>=0?1:-1;
    if(e.type==='rifle'){if(near&&Math.abs(dx)>125)e.x+=e.dir*30*dt;
      if(near&&e.shoot<=0){e.shoot=1.65+this.random()*.9;this.enemyShot(e.x+e.w/2,e.y+18,e.dir*400,0,'bullet');}}
    if(e.type==='mummy'){if(near&&Math.abs(dx)>42)e.x+=e.dir*(e.attack>0?6:36)*dt;
      if(near&&e.shoot<=0){e.shoot=2.25+this.random()*1.1;e.attack=.48;this.enemyShot(e.x+e.w/2,e.y+18,e.dir*145,-40,'curse');}
      e.attack=Math.max(0,e.attack-dt);}
    if(e.type==='bat'){e.x+=Math.sign(dx)*Math.min(Math.abs(dx),115*dt);e.y=clamp(e.y+Math.sin(e.t*5)*.9+(p.y-110-e.y)*dt*.6,200,415);
      if(Math.abs(dx)<60&&e.shoot<=0){e.shoot=1.5;this.enemyShot(e.x,e.y+10,e.dir*110,135,'bullet');}}
    if(e.type==='turret'&&near&&e.shoot<=0){e.shoot=1.9+this.random()*.5;this.enemyShot(e.x+12,e.y+8,e.dir*330,-90,'bullet');this.enemyShot(e.x+12,e.y+8,e.dir*350,-10,'bullet');}
    if(e.type==='spawner'&&near){e.spawn-=dt;if(e.spawn<=0){e.spawn=3.6;const local=this.enemies.filter(m=>!m.dead&&m.type==='mummy'&&Math.abs(m.x-e.x)<220).length;if(local<3)this.spawn('mummy',e.x-35*e.dir);this.emit('spawn',e.x,e.y);}}
    if(e.type!=='bat'&&Math.abs(dx)<25&&Math.abs((p.y+p.h/2)-(e.y+e.h/2))<37&&e.t>.3)this.damagePlayer(1,e.type==='mummy'?'curse':'bullet');
    if(e.type==='bat'&&overlap(e,p))this.damagePlayer(1);
  }
  enemyShot(x,y,vx,vy,kind){const offX=vx>0?16:-16;this.bullets.push({x:x+offX,y,px:x,py:y,vx,vy,r:kind==='curse'?9:5,ttl:kind==='curse'?4:2.5,owner:'enemy',damage:1,color:kind==='curse'?'#90faab':'#ff8e61',kind});this.emit('enemyshoot',x,y);}
  updateBoss(dt){const b=this.boss;if(!b.active||b.dead)return;
    b.t+=dt;b.entry=clamp(b.entry+dt*.6,0,1);b.y=335+Math.sin(b.t*1.5)*27;
    b.attackT-=dt;
    if(b.telegraph>0){b.telegraph-=dt;if(b.telegraph<=0){const player=this.player;
      if(b.phase===2){for(let i=-2;i<=2;i++)this.enemyShot(b.x-100,b.y+17,-300,i*90,'bullet');}
      else{const vx=(player.x-(b.x-105)),vy=player.y+20-(b.y+10),l=Math.max(1,Math.hypot(vx,vy));this.enemyShot(b.x-108,b.y+12,vx/l*340,vy/l*340,'bullet');if(b.phase>0)this.enemyShot(b.x-110,b.y+25,-300,90,'bullet');}
      this.emit('bossattack',b.x-100,b.y);}}
    if(b.attackT<=0){b.attackT=[2.55,2.0,1.6][b.phase];b.telegraph=.52;this.emit('warning',b.x-80,b.y);}
    if(this.player.x>b.x-145&&Math.abs(this.player.y+this.player.h/2-b.y)<95)this.damagePlayer(1);
  }
  updateBullets(dt){const p=this.player;for(const b of this.bullets){b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;
    if(b.ttl<=0||b.y<-40||b.y>FLOOR+30){b.ttl=0;continue;}
    if(b.owner==='player'){
      for(const secret of this.secrets){if(!secret.triggered&&sweptHit(b,secret)){secret.triggered=true;b.ttl=0;this.burst(secret.x,secret.y,'#ffe59b',45,190);this.emit('secret',secret.x,secret.y,{secret:secret.kind});if(secret.kind==='sphinx'){this.addScore(10000,secret.x,secret.y);}else{for(let q=0;q<12;q++)this.pickups.push({id:2000+this.pickups.length,x:4190+(q%6)*24,y:260-Math.floor(q/6)*30,type:'coin',taken:false,phase:this.random()*4});}break;}}
      if(b.ttl<=0)continue;
      for(const e of this.enemies){if(e.dead)continue;if(sweptHit(b,e)){this.damageEnemy(e,b.damage,b.x,b.y);b.ttl=0;break;}}
      if(b.ttl>0&&this.boss.active&&!this.boss.dead){const box={x:this.boss.x-120,y:this.boss.y-85,w:160,h:180};if(sweptHit(b,box)) {this.damageBoss(b.damage,b.x,b.y);b.ttl=0;}}
    }else if(p.invuln<=0&&sweptHit(b,p,1)){this.damagePlayer(1,b.kind==='curse'?'curse':'bullet');b.ttl=0;}
  }
    this.bullets=this.bullets.filter(b=>b.ttl>0&&b.x>=this.camera-80&&b.x<this.camera+WIDTH+250);
  }
  updateGrenades(dt){for(const g of this.grenades){g.t+=dt;g.vy+=G*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;if(g.y>=FLOOR-9){g.y=FLOOR-9;g.vy=-Math.abs(g.vy)*.45;g.vx*=.78;}if(g.t>=g.fuse){g.dead=true;this.explode(g);}}this.grenades=this.grenades.filter(g=>!g.dead);}
  step(dt=FIXED_DT){this.events=[];if(this.phase!=='playing')return this.events;dt=clamp(dt,0,1/30);this.time+=dt;
    this.updatePlayer(dt);
    for(const spawn of this.spawns){if(!spawn.activated&&this.player.x>spawn.x-630){spawn.activated=true;this.spawn(spawn.type,spawn.x);}}
    for(const e of this.enemies)if(!e.dead&&e.x>this.player.x-850&&e.x<this.player.x+950)this.updateEnemy(e,dt);
    this.updateBoss(dt);this.updateBullets(dt);this.updateGrenades(dt);
    for(const item of this.pickups){if(item.taken)continue;item.phase+=dt*3;const rect={x:item.x-17,y:item.y-19,w:34,h:38};if(overlap(this.player,rect))this.collect(item);}
    for(const q of this.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=480*dt;q.life-=dt;}
    this.particles=this.particles.filter(q=>q.life>0);
    for(const q of this.floating){q.y-=28*dt;q.life-=dt;}this.floating=this.floating.filter(q=>q.life>0);
    this.enemies=this.enemies.filter(e=>!e.dead||e.hit>0);
    this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;
    this.camera=clamp(this.camera+(clamp(this.player.x-340,0,WORLD_END-WIDTH)-this.camera)*Math.min(1,dt*7),0,WORLD_END-WIDTH);
    return this.events;
  }
  snapshot(){return {phase:this.phase,time:this.time,score:this.score,act:this.act,player:{...this.player},boss:{...this.boss},enemies:this.enemies.length,bullets:this.bullets.length,kills:this.kills,rescues:this.rescues};}
}
