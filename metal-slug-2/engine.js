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
  [2870,'antidote'],[3110,'grenade'],[3430,'pow'],[3480,'antidote'],[3730,'gem'],[4140,'antidote'],
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
/** Continuous point/segment against radius-expanded target AABB. */
export function sweptHit(shot,box,extraRadius=0) {
  const r=(shot.r||0)+extraRadius,x0=shot.px??shot.x,y0=shot.py??shot.y;
  const dx=shot.x-x0,dy=shot.y-y0;
  const minX=box.x-r,maxX=box.x+box.w+r,minY=box.y-r,maxY=box.y+box.h+r;
  let entry=0,exit=1;
  for(const [p,d,lo,hi] of [[x0,dx,minX,maxX],[y0,dy,minY,maxY]]){
    if(Math.abs(d)<1e-10){if(p<lo||p>hi)return false;continue;}
    const a=(lo-p)/d,b=(hi-p)/d;
    entry=Math.max(entry,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));
    if(entry>exit)return false;
  }
  return exit>=0&&entry<=1;
}

export class RuinsGame {
  constructor({seed=7098,mode='faithful'}={}) {this.initialSeed=seed >>> 0 || 1;this.mode=mode==='practice'?'practice':'faithful';this.reset();}
  random() {let x=this.seed; x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
  reset() {
    this.seed=this.initialSeed;this.phase='ready';this.time=0;this.score=0;this.camera={x:0,y:0};
    this.player={x:100,y:FLOOR-48,w:26,h:48,vx:0,vy:0,grounded:true,dir:1,health:this.mode==='faithful'?1:3,lives:3,invuln:0,curse:0,weapon:'pistol',ammo:Infinity,grenades:8,fireCooldown:0,throwCooldown:0,anim:0,checkpoint:100,checkpointY:FLOOR-48,shots:0,kills:0,crouch:false,interactLatch:false};
    this.bullets=[];this.grenades=[];this.enemies=[];this.pickups=PICKUP_LAYOUT.map(([x,type],id)=>({id,x,y:PICKUP_HEIGHTS[x]??(towerSurfaceAt(x)-38),type,taken:false,phase:this.random()*6}));
    this.spawns=ENEMY_LAYOUT.map(([x,type],id)=>({x,type,id,activated:false}));
    this.platforms=PLATFORMS.map(p=>({...p,h:14}));
    this.secrets=[{x:366,y:281,w:22,h:25,kind:'sphinx',triggered:false},{x:4220,y:-10,w:30,h:26,kind:'lamp',triggered:false}];
    this.particles=[];this.floating=[];this.events=[];this.input={left:false,right:false,up:false,down:false,jump:false,fire:false,grenade:false,interact:false};
    this.vehicle={mounted:false,hp:0,maxHp:3,gunsLeft:0,serial:0,x:null,y:null};this.hazards=[];this.gateOpen=false;this.sceneId='desert';this.scenes=SCENES;this.maxHeight=0;
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
  firePlayer(){
    const p=this.player,I=this.input,mounted=this.vehicle.mounted;
    if(p.fireCooldown>0)return;
    const heavy=p.weapon==='heavy'&&p.ammo>0;
    const spread=p.weapon==='spread'&&p.ammo>0;
    p.fireCooldown=p.curse>0?.32:mounted?.105:heavy?.075:spread?.27:.16;
    let dx=p.dir,dy=0;
    if(I.up){dx=0;dy=-1;}
    else if(I.down){if(!p.grounded||mounted){dx=0;dy=1;}else p.crouch=true;}
    const originX=p.x+p.w/2+dx*20,originY=p.y+(p.crouch?34:20)+(dy>0?15:dy<0?-15:0);
    const push=(vx,vy,yOffset=0,damage=1,kind='player')=>{
      const length=Math.max(.001,Math.hypot(vx,vy)),speed=mounted?1120:heavy?1300:970;
      const x=originX,y=originY+yOffset;
      this.bullets.push({x,y,px:x,py:y,vx:vx/length*speed,vy:vy/length*speed,r:heavy?4:3,ttl:1,owner:'player',damage,kind,color:mounted?'#fff0a2':heavy?'#ffe8aa':'#fff4bc'});
    };
    if(mounted){
      if(dy>0){push(0,1,5,1.6,'vulcan');if(this.vehicle.gunsLeft>1)push(.08,1,-4,1.6,'vulcan');}
      else {push(dx||p.dir,dy,-5,1.25,'vulcan');if(this.vehicle.gunsLeft>1)push(dx||p.dir,dy,9,1.25,'vulcan');}
    }else if(spread){for(const a of [-.23,0,.23])push(dx*Math.cos(a)-dy*Math.sin(a),dx*Math.sin(a)+dy*Math.cos(a));}
    else push(dx,dy,0,heavy?1.2:1);
    if(p.ammo!==Infinity){p.ammo--;if(p.ammo<=0){p.weapon='pistol';p.ammo=Infinity;this.emit('empty');}}
    p.shots++;this.shots++;this.emit('shoot',originX,originY,{heavy,spread,slug:mounted});
    this.burst(originX,originY,'#fff0ab',3,62);
  }
  toss(){
    const p=this.player;if(p.throwCooldown>0||p.curse>0)return;
    if(this.vehicle.mounted){
      p.throwCooldown=.38;
      const x=p.x+p.w/2,y=p.y+p.h+4;
      this.bullets.push({x,y,px:x,py:y,vx:0,vy:690,r:8,ttl:1,owner:'player',damage:4.5,kind:'cannon',color:'#ffac54'});
      this.emit('cannon',x,y);return;
    }
    if(p.grenades<=0)return;
    p.grenades--;p.throwCooldown=.43;
    this.grenades.push({x:p.x+p.w/2,y:p.y+8,vx:p.dir*335+p.vx*.3,vy:-490,t:0,fuse:1.25});
    this.emit('throw');
  }
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
  respawn(){const p=this.player;p.x=p.checkpoint;p.y=p.checkpointY;p.vx=0;p.vy=0;p.grounded=true;p.health=this.mode==='faithful'?1:3;p.invuln=2.8;p.curse=0;p.weapon='pistol';p.ammo=Infinity;p.grenades=Math.max(4,p.grenades);this.vehicle={mounted:false,hp:0,maxHp:3,gunsLeft:0,serial:this.vehicle.serial,x:null,y:null};this.hazards=[];this.bullets=this.bullets.filter(b=>b.owner==='player');this.enemies=this.enemies.filter(e=>e.x<p.x-300||e.x>p.x+380);this.emit('respawn');}
  collect(item){if(item.taken)return;item.taken=true;const p=this.player;let pts=100;
    switch(item.type){case 'heavy':p.weapon='heavy';p.ammo=175;pts=300;break;
      case 'spread':p.weapon='spread';p.ammo=65;pts=300;break;
      case 'slug':p.weapon='slug';p.ammo=240;this.vehicle={mounted:true,hp:3,maxHp:3,gunsLeft:2,serial:this.vehicle.serial+1,x:p.x,y:p.y};p.health=this.mode==='faithful'?1:3;p.invuln=Math.max(p.invuln,.8);this.emit('mount');pts=1500;break;
      case 'coin':pts=500;break;
      case 'grenade':p.grenades=Math.min(20,p.grenades+5);pts=200;break;
      case 'health':p.health=Math.min(3,p.health+2);pts=200;break;
      case 'antidote':p.curse=0;p.health=Math.min(3,p.health+1);pts=250;break;
      case 'pow':this.rescues++;pts=1000;break;
      case 'gem':pts=2000;break;}
    this.addScore(pts,item.x,item.y-12);this.burst(item.x,item.y,item.type==='antidote'?'#84ffc7':'#ffe8a4',20,170);this.emit('pickup',item.x,item.y,{item:item.type});}
  damageEnemy(e,value,x,y){if(e.dead)return;e.hp-=value;e.hit=.13;this.burst(x,y,'#ffc26f',6,90);this.emit('hit',x,y);
    if(e.hp<=0){e.dead=true;this.kills++;this.combo++;this.comboTimer=4;const pts=e.type==='spawner'?800: e.type==='turret'?500:200;this.addScore(pts+Math.min(10,this.combo)*30,e.x,e.y);this.burst(e.x+e.w/2,e.y+e.h/2,e.type==='spawner'?'#b9eece':'#ffc27b',21,215);this.emit('kill',e.x,e.y,{enemy:e.type});if(e.type==='spawner')this.pickups.push({id:1000+this.pickups.length,x:e.x+25,y:e.y+e.h-40,type:'antidote',taken:false,phase:0});if(e.type==='barrel'){this.gateOpen=true;this.emit('gateopen',e.x,e.y);}}}
  damageBoss(value,x,y){const b=this.boss;if(!b.active||b.dead||b.entry<.85)return;b.hp=Math.max(0,b.hp-value);b.phase=b.hp<b.maxHp*.35?2:b.hp<b.maxHp*.7?1:0;this.burst(x,y,'#f7e49b',8,180);this.emit('bosshit',x,y);
    if(b.hp===0){b.dead=true;this.bossGate=false;this.bullets=this.bullets.filter(v=>v.owner==='player');this.addScore(15000,b.x,b.y);this.burst(b.x-25,b.y,'#ffe9a0',100,350);this.phase='won';this.emit('won');}}
  explode(g){this.burst(g.x,g.y,'#ffb460',45,260);this.emit('explosion',g.x,g.y);const rad=107;
    for(const e of this.enemies){if(e.dead)continue;const dx=e.x+e.w/2-g.x,dy=e.y+e.h/2-g.y;if(dx*dx+dy*dy<rad*rad)this.damageEnemy(e,5,g.x,g.y);}
    const b=this.boss;if(b.active&&!b.dead&&Math.hypot(b.x-35-g.x,b.y-g.y)<rad+75)this.damageBoss(6,g.x,g.y);
  }
  updatePlayer(dt){
    const p=this.player,I=this.input;
    const slow=p.curse>0?.56:1,speed=(this.vehicle.mounted?228:238)*slow;
    const d=(I.right?1:0)-(I.left?1:0),prevX=p.x;
    if(I.interact&&!p.interactLatch){
      if(this.vehicle.mounted){
        this.vehicle.mounted=false;this.vehicle.x=p.x;this.vehicle.y=p.y;
        p.weapon='pistol';p.ammo=Infinity;this.emit('dismount',p.x,p.y);
      }else if(this.vehicle.hp>0&&this.vehicle.x!==null&&Math.abs(p.x-this.vehicle.x)<70&&Math.abs(p.y-this.vehicle.y)<75){
        this.vehicle.mounted=true;p.weapon='slug';p.ammo=Math.max(60,p.ammo===Infinity?100:p.ammo);
        this.emit('mount',p.x,p.y);
      }
    }
    p.interactLatch=I.interact;
    if(this.vehicle.mounted){this.vehicle.x=p.x;this.vehicle.y=p.y;}
    p.crouch=I.down&&!I.up&&p.grounded&&!this.vehicle.mounted;
    p.vx=d*speed*(p.crouch?.52:1);if(d)p.dir=d;
    if(I.jump&&p.grounded){p.vy=this.vehicle.mounted?-610:p.curse>0?-345:-490;p.grounded=false;this.emit('jump');}
    if(I.fire)this.firePlayer();if(I.grenade)this.toss();
    const prevBottom=p.y+p.h;
    p.vy=clamp(p.vy+G*dt,-750,780);
    p.x=clamp(p.x+p.vx*dt,25,WORLD_END-p.w-10);
    p.y+=p.vy*dt;p.grounded=false;
    if(p.vy>=0){let landing=FLOOR;
      for(const platform of this.platforms){
        if(prevBottom<=platform.y+7&&p.y+p.h>=platform.y&&p.x+p.w>platform.x+6&&p.x<platform.x+platform.w-6&&platform.y<landing)
          landing=platform.y;
      }
      if(p.y+p.h>=landing){p.y=landing-p.h;p.vy=0;p.grounded=true;}
    }
    if(p.y+p.h>FLOOR){p.y=FLOOR-p.h;p.vy=0;p.grounded=true;}
    p.x=routeGate(prevX,p.x,p.y+p.h,this.gateOpen);
    if(this.bossGate)p.x=clamp(p.x,BOSS_START+6,6320);
    p.invuln=Math.max(0,p.invuln-dt);p.fireCooldown=Math.max(0,p.fireCooldown-dt);
    p.throwCooldown=Math.max(0,p.throwCooldown-dt);p.anim+=dt*(d?12:4);
    if(p.x>=1640&&this.gateOpen&&p.checkpoint<1650){p.checkpoint=1680;p.checkpointY=FLOOR-p.h;this.emit('checkpoint');}
    if(p.x>=3500&&p.checkpoint<3500){p.checkpoint=3530;p.checkpointY=FLOOR-p.h;this.emit('checkpoint');}
    if(p.x>=4520&&p.y< -60&&p.checkpoint<4450){p.checkpoint=4470;p.checkpointY=-60-p.h;this.emit('checkpoint');}
    if(p.x>=5450&&p.y<-490&&p.checkpoint<5450){p.checkpoint=5450;p.checkpointY=-570-p.h;this.emit('checkpoint');}
    const nextAct=actAt(p.x),nextScene=sceneAt(p.x).id;
    if(nextAct!==this.act){this.act=nextAct;this.emit('act',p.x,p.y,{act:nextAct,title:PHASES[nextAct]});}
    if(nextScene!==this.sceneId){this.sceneId=nextScene;this.emit('scene',p.x,p.y,{sceneId:nextScene});}
    this.maxHeight=Math.min(this.maxHeight,p.y);
    if(!this.boss.active&&p.x>=BOSS_START&&p.y+p.h<=-555){this.boss.active=true;this.bossGate=true;this.emit('boss',p.x,p.y);}
  }
  updateEnemy(e,dt){const p=this.player;e.t+=dt;e.hit=Math.max(0,e.hit-dt);e.shoot-=dt;
    const dx=p.x-e.x;const near=Math.abs(dx)<660;e.dir=dx>=0?1:-1;
    if(e.type==='barrel')return;
    if(e.type==='rifle'){if(near&&Math.abs(dx)>125)e.x+=e.dir*30*dt;
      if(near&&e.shoot<=0){e.shoot=1.65+this.random()*.9;this.enemyShot(e.x+e.w/2,e.y+18,e.dir*400,0,'bullet');}}
    if(e.type==='mummy'){if(near&&Math.abs(dx)>42)e.x+=e.dir*(e.attack>0?6:36)*dt;
      if(near&&e.shoot<=0){e.shoot=2.25+this.random()*1.1;e.attack=.48;this.enemyShot(e.x+e.w/2,e.y+18,e.dir*145,-40,'curse');}
      e.attack=Math.max(0,e.attack-dt);}
    if(e.type==='bat'){e.x+=Math.sign(dx)*Math.min(Math.abs(dx),115*dt);e.y=clamp(e.y+Math.sin(e.t*5)*.9+(p.y-110-e.y)*dt*.6,200,415);
      if(Math.abs(dx)<60&&e.shoot<=0){e.shoot=1.5;this.enemyShot(e.x,e.y+10,e.dir*110,135,'bullet');}}
    if(e.type==='turret'&&near&&e.shoot<=0){e.shoot=1.9+this.random()*.5;this.enemyShot(e.x+12,e.y+8,e.dir*330,-90,'bullet');this.enemyShot(e.x+12,e.y+8,e.dir*350,-10,'bullet');}
    if(e.type==='spawner'&&near){e.spawn-=dt;if(e.spawn<=0){e.spawn=3.6;const local=this.enemies.filter(m=>!m.dead&&m.type==='mummy'&&Math.abs(m.x-e.x)<220).length;if(local<3)this.spawn('mummy',e.x-35*e.dir);this.emit('spawn',e.x,e.y);}}
    if(e.type!=='bat'&&e.type!=='barrel'&&Math.abs(dx)<25&&Math.abs((p.y+p.h/2)-(e.y+e.h/2))<37&&e.t>.3)this.damagePlayer(1,e.type==='mummy'?'curse':'bullet');
    if(e.type==='bat'&&overlap(e,p))this.damagePlayer(1);
  }
  enemyShot(x,y,vx,vy,kind){const offX=vx>0?16:-16;this.bullets.push({x:x+offX,y,px:x,py:y,vx,vy,r:kind==='curse'?9:kind==='electric'?12:kind==='missile'?8:5,ttl:kind==='curse'?4:3.5,owner:'enemy',damage:1,color:kind==='curse'?'#90faab':kind==='electric'?'#a2deff':kind==='missile'?'#ffce74':'#ff8e61',kind});this.emit('enemyshoot',x,y);}
  updateBoss(dt){
    const b=this.boss;if(!b.active||b.dead)return;
    b.t+=dt;b.entry=clamp(b.entry+dt/1.6,0,1);
    b.x=clamp(b.x+clamp((this.player.x+85-b.x)*dt*.68,-135*dt,135*dt),5800,6250);
    b.y=405-760*b.entry+Math.sin(b.t*1.8)*10;
    if(b.entry<1)return;
    b.attackT-=dt;
    if(b.telegraph>0){
      b.telegraph-=dt;
      if(b.telegraph<=0){
        const p=this.player,mode=b.mode;
        if(mode==='laser'){
          const beamX=clamp(p.x+p.w/2,5820,6220);
          this.hazards.push({kind:'laser',x:beamX,y:b.y-720,w:102,h:730,life:.55});
          b.charges++;this.emit('laser',beamX,b.y-150);
        }else if(mode==='electric'){
          for(const d of [-1,1])this.enemyShot(b.x+d*150,b.y-65,-d*140,-330,'electric');
          this.emit('bossattack',b.x,b.y,{mode});
        }else if(mode==='lunge'){
          this.hazards.push({kind:'lunge',x:b.x-90,y:b.y-340,w:170,h:340,life:.35});
          this.emit('bossattack',b.x,b.y,{mode});
        }else{
          for(let k=0;k<3;k++){
            const sx=b.x-65+(k-1)*53,sy=b.y-48;
            const dx=p.x-sx,dy=p.y-sy,l=Math.max(1,Math.hypot(dx,dy));
            this.enemyShot(sx,sy,dx/l*(205+k*32),dy/l*(205+k*32),'missile');
          }
          this.emit('bossattack',b.x,b.y,{mode:'missile'});
        }
      }
    }
    if(b.attackT<=0&&b.telegraph<=0){
      b.counter++;
      const sequence=this.vehicle.mounted?['electric','laser','lunge','electric','laser']:['missile','laser','lunge','missile','laser'];
      b.mode=sequence[(b.counter-1)%sequence.length];
      b.telegraph=b.mode==='laser'?.88:b.mode==='lunge'?.55:.52;
      b.attackT=[3.1,2.6,2.3][b.phase]+b.telegraph;
      this.emit('warning',b.x-80,b.y,{mode:b.mode});
    }
    for(const h of this.hazards){
      if(h.life<=0)continue;
      if(h.kind==='laser'&&Math.abs(this.player.x+this.player.w/2-h.x)<h.w/2&&this.player.y+this.player.h>h.y)
        this.damagePlayer(1);
      if(h.kind==='lunge'&&overlap(this.player,{x:h.x,y:h.y,w:h.w,h:h.h}))this.damagePlayer(1);
    }
    if(this.player.x>b.x-95&&this.player.x<b.x+80&&this.player.y+this.player.h>b.y-70)this.damagePlayer(1);
  }
  updateBullets(dt){const p=this.player;for(const b of this.bullets){b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;
    if(b.ttl<=0||b.y<this.camera.y-180||b.y>this.camera.y+HEIGHT+180){b.ttl=0;continue;}
    if(b.owner==='player'){
      for(const secret of this.secrets){if(!secret.triggered&&sweptHit(b,secret)){secret.triggered=true;b.ttl=0;this.burst(secret.x,secret.y,'#ffe59b',45,190);this.emit('secret',secret.x,secret.y,{secret:secret.kind});if(secret.kind==='sphinx'){this.addScore(10000,secret.x,secret.y);}else{for(let q=0;q<12;q++)this.pickups.push({id:2000+this.pickups.length,x:4190+(q%6)*24,y:260-Math.floor(q/6)*30,type:'coin',taken:false,phase:this.random()*4});}break;}}
      if(b.ttl<=0)continue;
      for(const e of this.enemies){if(e.dead)continue;if(sweptHit(b,e)){this.damageEnemy(e,b.damage,b.x,b.y);b.ttl=0;break;}}
      if(b.ttl>0&&this.boss.active&&!this.boss.dead){const box={x:this.boss.x-120,y:this.boss.y-85,w:160,h:180};if(sweptHit(b,box)) {this.damageBoss(b.damage,b.x,b.y);b.ttl=0;}}
    }else if(p.invuln<=0&&sweptHit(b,p,1)){this.damagePlayer(1,b.kind==='curse'?'curse':'bullet');b.ttl=0;}
  }
    for(const shot of this.bullets){
      if(shot.owner!=='player'||shot.ttl<=0)continue;
      for(const missile of this.bullets){
        if(missile.kind!=='missile'||missile.ttl<=0)continue;
        if(Math.hypot(shot.x-missile.x,shot.y-missile.y)<(shot.r+missile.r+14)){
          shot.ttl=0;missile.ttl=0;this.burst(missile.x,missile.y,'#ffc66c',14,140);this.emit('intercept',missile.x,missile.y);break;
        }
      }
    }
    this.bullets=this.bullets.filter(b=>b.ttl>0&&b.x>=this.camera.x-80&&b.x<this.camera.x+WIDTH+250);
  }
  updateGrenades(dt){for(const g of this.grenades){g.t+=dt;g.vy+=G*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;if(g.y>=FLOOR-9){g.y=FLOOR-9;g.vy=-Math.abs(g.vy)*.45;g.vx*=.78;}if(g.t>=g.fuse){g.dead=true;this.explode(g);}}this.grenades=this.grenades.filter(g=>!g.dead);}
  step(dt=FIXED_DT){this.events=[];if(this.phase!=='playing')return this.events;dt=clamp(dt,0,1/30);this.time+=dt;
    this.updatePlayer(dt);
    for(const spawn of this.spawns){if(!spawn.activated&&this.player.x>spawn.x-630){spawn.activated=true;this.spawn(spawn.type,spawn.x);}}
    for(const e of this.enemies)if(!e.dead&&e.x>this.player.x-850&&e.x<this.player.x+950)this.updateEnemy(e,dt);
    this.updateBoss(dt);this.updateBullets(dt);this.updateGrenades(dt);
    for(const h of this.hazards)h.life-=dt;this.hazards=this.hazards.filter(h=>h.life>0);
    for(const item of this.pickups){if(item.taken)continue;item.phase+=dt*3;const rect={x:item.x-17,y:item.y-19,w:34,h:38};if(overlap(this.player,rect))this.collect(item);}
    for(const q of this.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=480*dt;q.life-=dt;}
    this.particles=this.particles.filter(q=>q.life>0);
    for(const q of this.floating){q.y-=28*dt;q.life-=dt;}this.floating=this.floating.filter(q=>q.life>0);
    this.enemies=this.enemies.filter(e=>!e.dead||e.hit>0);
    this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0;
    const cameraX=clamp(this.player.x-340,0,WORLD_END-WIDTH),cameraY=Math.min(0,this.player.y-210);
    this.camera.x+=((cameraX)-this.camera.x)*Math.min(1,dt*7);
    this.camera.y+=(Math.max(-1050,cameraY)-this.camera.y)*Math.min(1,dt*6);
    return this.events;
  }
  snapshot(){return {phase:this.phase,mode:this.mode,time:this.time,score:this.score,act:this.act,sceneId:this.sceneId,gateOpen:this.gateOpen,camera:{...this.camera},maxHeight:this.maxHeight,player:{...this.player},vehicle:{...this.vehicle},boss:{...this.boss},hazards:this.hazards.length,enemies:this.enemies.length,bullets:this.bullets.length,kills:this.kills,rescues:this.rescues};}
}
