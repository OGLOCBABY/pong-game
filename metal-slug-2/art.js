/* Entirely original, dependency-free procedural illustration for RUINS OF THE SECOND SUN. */
import {WIDTH,HEIGHT,FLOOR,BOSS_START,WORLD_END,actAt} from './engine.js';
const TAU=Math.PI*2;
const rnd=n=>{let v=Math.sin(n*127.1+48.31)*43758.5453;return v-Math.floor(v);};
const mix=(a,b,t)=>a+(b-a)*t;
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
function poly(c,pts,fill,stroke=null,w=1){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function ellipse(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fill();}
function line(c,x,y,xx,yy,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
function glow(c,x,y,r,col){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function label(c,text,x,y,size=13,color='#d9b17c',align='left'){c.font=`900 ${size}px system-ui`;c.fillStyle=color;c.textAlign=align;c.fillText(text,x,y);c.textAlign='left';}
function brickPattern(c,left,right,y,seed=0,bright=false){const from=Math.floor(left/54)-1,to=Math.ceil(right/54)+1;
  for(let i=from;i<=to;i++){let x=i*54+((Math.floor(y/28)%2)*27);rect(c,x,y,52,25,bright?'#8d6750':'#4c383b');rect(c,x+1,y+1,50,2,bright?'#ad8567':'#725356');rect(c,x+1,y+23,48,2,'#251e2a');if(rnd(i*17+seed)>.62)rect(c,x+10+rnd(i+seed)*18,y+9,8+rnd(i*2)*13,2,bright?'#634537':'#33262d');}
}
function wallTorch(c,x,y,time,theme='orange'){const flame=theme==='green'?'#9be5aa':'#ffcc75',fire=theme==='green'?'#6bd4a6':'#f19651';
  glow(c,x,y-12,74,theme==='green'?'#78cfa927':'#ffae6733');poly(c,[[x-12,y-11],[x+12,y-11],[x+8,y+1],[x-8,y+1]],'#4e3836','#bd9363',2);rect(c,x-4,y,8,17,'#986a47');let wiggle=Math.sin(time*9+x)*4;
  poly(c,[[x,y-43],[x+9+wiggle,y-23],[x+6,y-13],[x,y-9],[x-7,y-13],[x-10+wiggle,y-23]],fire);
  poly(c,[[x,y-33],[x+4+wiggle/2,y-19],[x,y-12],[x-5,y-18]],flame);
}
function hiero(c,x,y,s=1,color='#9b8e67'){c.save();c.translate(x,y);c.scale(s,s);c.strokeStyle=color;c.lineWidth=2;
  c.beginPath();c.arc(0,0,12,Math.PI,0);c.stroke();line(c,-12,0,12,0,color,2);ellipse(c,0,-3,3,3,color);line(c,21,-11,21,12,color,3);line(c,15,-2,29,-2,color,2);c.beginPath();c.arc(42,-2,7,0,TAU);c.stroke();line(c,42,5,42,13,color,2);c.restore();}
function sandstoneStatue(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);
  poly(c,[[-32,0],[-26,-72],[-10,-82],[11,-82],[27,-71],[32,0]],'#665348','#302b30',3);
  poly(c,[[-31,-74],[-20,-110],[-7,-105],[6,-129],[22,-108],[28,-71]],'#8b6e52','#c39a64',2);
  poly(c,[[-15,-101],[-9,-114],[8,-116],[13,-98],[8,-87],[-7,-86]],'#aa8760');ellipse(c,-7,-102,2,3,'#211b27');ellipse(c,8,-102,2,3,'#211b27');
  rect(c,-39,0,78,9,'#947554');rect(c,-43,10,85,11,'#6f5144');c.restore();}
function dunes(c,cam,time){let g=c.createLinearGradient(0,0,0,FLOOR);g.addColorStop(0,'#201a31');g.addColorStop(.44,'#604052');g.addColorStop(1,'#d68d59');rect(c,-10,0,WIDTH+20,FLOOR,g);
  const moonX=690-cam*.07;glow(c,moonX,135,235,'#e7a67417');ellipse(c,moonX,137,66,66,'#ffd7a4');ellipse(c,moonX-22,115,17,11,'#edbe9577');ellipse(c,moonX+23,146,12,10,'#eeb58c77');ellipse(c,moonX+8,105,7,6,'#eeb58c77');ellipse(c,moonX-8,172,19,8,'#ecc09666');
  for(let i=0;i<90;i++){let sx=(rnd(i*11)*2200-cam*.11)%1150;if(sx<0)sx+=1150;let sy=rnd(i*55+9)*290;ellipse(c,sx,sy,1+rnd(i)*1.4,1,'#eed7b5'+(rnd(i)>.6?'7c':'45'));}
  for(let z=0;z<2;z++){const ofs=cam*(z===0?.13:.31),yy=z===0?315:383,col=z===0?'#5e4350':'#815157';c.beginPath();c.moveTo(-20,FLOOR);for(let x=-30;x<=WIDTH+45;x+=22){let wave=Math.sin((x+ofs)*.008+z)*45+Math.sin((x+ofs)*.019+z)*20;c.lineTo(x,yy+wave);}c.lineTo(WIDTH+30,FLOOR);c.closePath();c.fillStyle=col;c.fill();}
  for(let i=0;i<8;i++){const x=i*650+320-cam*.42;if(x<-180||x>WIDTH+160)continue;let height=125+rnd(i)*90;poly(c,[[x-height*.8,380],[x,380-height],[x+height*.78,380]],i%2?'#866052':'#624a4c');line(c,x,380-height,x+height*.16,380,'#98705b',2);}
  for(let i=0;i<18;i++){const x=i*250+45-cam*.65;if(x<-50||x>WIDTH+50)continue;poly(c,[[x-27,444],[x-21,407],[x-9,399],[x+8,409],[x+23,444]],'#765052');}
}
function cave(c,cam,time,act){let g=c.createLinearGradient(0,0,0,HEIGHT);g.addColorStop(0,act===1?'#161728':'#101f26');g.addColorStop(.45,act===1?'#322937':'#1c3738');g.addColorStop(1,act===1?'#655046':'#436152');rect(c,0,0,WIDTH,HEIGHT,g);
  for(let z=0;z<3;z++){let ofs=cam*(.12+z*.12);for(let i=Math.floor(ofs/145)-2;i<Math.ceil((ofs+WIDTH)/145)+2;i++){const x=i*145-ofs+60,w=100+rnd(i*19+z)*75;const top=40+rnd(i*31+z)*75;
      poly(c,[[x-w/2,0],[x+w/2,0],[x+w*.34,top+48],[x+w*.06,top+95],[x-w*.18,top+52]],z===0?'#131d29':z===1?'#202d33':'#30343a');
      if(z===2){poly(c,[[x-32,440],[x-9,285-rnd(i)*40],[x+10,290],[x+37,440]],'#292f35');}}}
  for(let i=0;i<11;i++){let x=i*330-cam*.36+40;while(x<-100)x+=3800;if(x>WIDTH+120)continue;rect(c,x,180,74,260,act===1?'#2a2733':'#223338');rect(c,x+8,182,57,246,act===1?'#34313e':'#2d4648');rect(c,x-18,159,111,23,'#58504b');rect(c,x-10,144,95,13,'#71675b');
    for(let yy=205;yy<403;yy+=35)hiero(c,x+13,yy,.65,act===1?'#645757':'#5e7970');}
  for(let j=0;j<7;j++){let x=50+j*435-cam*.55;if(x<-100||x>WIDTH+120)continue;glow(c,x,260,150,act===1?'#edaa3018':'#75c7ad17');line(c,x,0,x-100,450,act===1?'#f4bb5012':'#b7eab10e',65);}
  for(let j=0;j<30;j++){const sx=rnd(j*39)*1300-cam*.12;const x=((sx%1200)+1200)%1200,y=150+rnd(j*10)*260;ellipse(c,x,y,2+rnd(j)*2,2,'#aac6a32c');}
}
function sphinx(c,x,y){c.save();c.translate(x,y);poly(c,[[0,0],[200,0],[181,-40],[158,-54],[151,-108],[122,-132],[90,-129],[67,-103],[56,-56],[15,-42]],'#a27955','#65413d',3);
  poly(c,[[60,-51],[57,-125],[83,-160],[131,-160],[150,-128],[147,-58]],'#bd9464','#d3a56f',2);
  poly(c,[[83,-151],[94,-167],[122,-167],[136,-151],[128,-136],[92,-138]],'#e8b67b');ellipse(c,98,-148,5,3,'#281c24');ellipse(c,123,-148,5,3,'#281c24');poly(c,[[111,-143],[107,-124],[119,-122]],'#67433d');line(c,96,-115,127,-114,'#523139',3);
  for(let k=0;k<6;k++){line(c,63+k*2,-116,55+k*2,-70,'#d2ad7d',2);line(c,137+k,-116,143+k,-69,'#d2ad7d',2);}rect(c,-6,0,219,17,'#785443');c.restore();}
function desertObjects(c,cam,time){sphinx(c,250-cam,429);for(let i=0;i<13;i++){const x=190+i*127-cam;if(x<-90||x>WIDTH+100)continue;
    if(i%3===0){rect(c,x,330,26,110,'#aa7955');rect(c,x-9,316,46,19,'#d19c68');rect(c,x-13,306,53,10,'#714a3c');hiero(c,x+8,354,.4,'#57433c');}
    else{poly(c,[[x-25,450],[x-5,431],[x+23,447],[x+12,460]],'#80594b');}}
  const gate=1650-cam;if(gate>-240&&gate<WIDTH+200){rect(c,gate-110,242,224,231,'#695147');rect(c,gate-103,239,210,24,'#ba855d');rect(c,gate-88,205,183,36,'#886045');rect(c,gate-88,196,183,12,'#d4a26c');poly(c,[[gate-40,450],[gate-36,331],[gate,294],[gate+42,331],[gate+48,450]],'#1d1a29','#b98c65',5);hiero(c,gate-43,279,1.2,'#d9b47e');wallTorch(c,gate-71,327,time);wallTorch(c,gate+74,327,time);}
}
function ruinsObjects(c,cam,time,act){const start=act===1?1740:3500,end=act===1?3500:BOSS_START;
  for(let x=start;x<end;x+=210){const sx=x-cam;if(sx<-180||sx>WIDTH+190)continue;const rand=rnd(x);
    if(x%420<220){rect(c,sx,290-rand*80,50,175+rand*70,'#65564d');rect(c,sx-11,278-rand*80,74,21,'#96816a');rect(c,sx-8,285-rand*80,65,6,'#b6a17a');hiero(c,sx+17,320-rand*60,.6,'#b4a27d');}
    else{rect(c,sx-35,420,103,33,'#62514a');poly(c,[[sx-35,421],[sx-50,394],[sx+9,368],[sx+71,416]],'#716154');}
    if(Math.floor(x/210)%3===0)wallTorch(c,sx+90,320+rand*35,time,act===2?'green':'orange');
    if(Math.floor(x/210)%4===1)sandstoneStatue(c,sx+72,437,.45+rand*.23);
  }
  for(let j=0;j<6;j++){const x=2200+j*515-cam;if(x<-120||x>WIDTH+130)continue;poly(c,[[x-30,456],[x-25,366],[x-20,355],[x+8,371],[x+25,456]],'#635647','#c1a276',2);}
}
function bossChamber(c,cam,time){const sx=BOSS_START-cam;if(sx>WIDTH||sx+1180<0)return;rect(c,sx,-40,1400,FLOOR+40,'#1b2b32');
  for(let x=BOSS_START;x<WORLD_END;x+=140){const p=x-cam;rect(c,p,145,127,300,'#26373a');rect(c,p+4,145,119,14,'#546356');hiero(c,p+32,195,.8,'#516b5f');hiero(c,p+38,269,.8,'#516b5f');}
  for(let y=180;y<490;y+=70){line(c,sx, y,sx+1200,y,'#131f29',9);}
  glow(c,6100-cam,300,380,'#efab7831');for(let i=0;i<12;i++){const x=BOSS_START+50+i*95-cam,y=155+Math.sin(i)*70;rect(c,x,y,7,180,'#395055');}
  sandstoneStatue(c,BOSS_START+110-cam,FLOOR,.8);
}
function ground(c,cam,time){const from=Math.floor(cam/64)-1,to=Math.ceil((cam+WIDTH)/64)+2;
  for(let i=from;i<=to;i++){let x=i*64-cam,world=i*64,a=actAt(world);const top=a===0?'#e7ad6f':a===1?'#b2a177':a===2?'#899678':'#819d8b';const base=a===0?'#8b5546':a===1?'#574649':a===2?'#3d5751':'#344c4e';
    rect(c,x,FLOOR-1,63,85,base);rect(c,x,FLOOR-1,63,7,top);rect(c,x,FLOOR+8,62,2,'#24202a');rect(c,x+2,FLOOR+11,61,36,a===0?'#ae7755':'#5b5954');rect(c,x+1,FLOOR+48,61,2,'#27252b');
    for(let j=0;j<3;j++){const px=x+rnd(i*43+j*8)*56,py=FLOOR+14+j*12;rect(c,px,py,5+rnd(i*j+2)*9,2,'#241e299a');}
    if(a===0){poly(c,[[x+7,FLOOR-1],[x+16,FLOOR-7],[x+26,FLOOR-1]],'#d38f62');}
  }
  line(c,-5,FLOOR,WIDTH+10,FLOOR,'#231e27',2);
}
function platform(c,x,y,w,theme=1){rect(c,x,y,w,16,theme===2?'#647763':'#8d765d');rect(c,x,y,w,4,theme===2?'#c3ba7b':'#dcc191');rect(c,x+3,y+6,w-6,7,theme===2?'#475d57':'#4b4445');for(let q=11;q<w;q+=34){rect(c,x+q,y+2,2,11,'#28242b');rect(c,x+q+7,y+8,8,2,'#b08f6a');}}
function environment(c,cam,t){c.save();c.beginPath();c.rect(0,0,WIDTH,HEIGHT);c.clip();const segments=[[0,1650,0],[1650,3480,1],[3480,BOSS_START,2],[BOSS_START,WORLD_END,3]];
  for(const [a,b,stage] of segments){let from=a-cam,to=b-cam;if(to<0||from>WIDTH)continue;c.save();c.beginPath();c.rect(from,-1,to-from+1,HEIGHT+2);c.clip();if(stage===0){dunes(c,cam,t);desertObjects(c,cam,t);}else if(stage===3){cave(c,cam,t,2);bossChamber(c,cam,t);}else{cave(c,cam,t,stage);ruinsObjects(c,cam,t,stage);}c.restore();}
  for(let i=0;i<30;i++){let x=i*290-cam*.9;if(x<-30||x>WIDTH+30)continue;ellipse(c,x,420+rnd(i)*33,50+rnd(i*8)*50,8,'#201e2647');}
  ground(c,cam,t);c.restore();}

function hero(c,p,x,y,t,game){const slug=p.weapon==='slug';const cursed=p.curse>0,run=Math.sin(p.anim*1.6),facing=p.dir;const lift=p.grounded?Math.abs(run)*2:0;
  c.save();c.translate(Math.round(x+p.w/2),Math.round(y+p.h));c.scale(facing,1);
  if(p.invuln>0&&Math.floor(t*11)%2===0)c.globalAlpha=.52;
  ellipse(c,0,1,19,5,'#0c111d77');
  if(slug){rect(c,-24,-22,47,22,'#404e4f');rect(c,-18,-30,40,16,'#8d947b');rect(c,-19,-22,31,4,'#c9b985');ellipse(c,-15,-4,9,8,'#393e41');ellipse(c,16,-4,9,8,'#393e41');ellipse(c,-15,-4,4,4,'#a9ad90');ellipse(c,16,-4,4,4,'#a9ad90');}
  // Running boots, kneepads, sturdy silhouette.
  const legShift=p.grounded?run*8:3;
  poly(c,[[-12,-20],[-3,-19],[-5+legShift,0],[-16+legShift,1]],cursed?'#c7bca1':'#3e4b46','#302c2d',2);
  poly(c,[[3,-20],[13,-21],[12-legShift,0],[1-legShift,1]],cursed?'#998a78':'#414e46','#222d2c',2);
  rect(c,-17+legShift,-3,13,4,'#272933');rect(c,2-legShift,-3,14,4,'#252832');
  // Torso and bandolier.
  poly(c,[[-15,-38],[13,-39],[14,-18],[-13,-17]],cursed?'#b6a58b':'#677d54','#283a38',2);
  poly(c,[[-13,-34],[8,-17],[13,-20],[-7,-37]],cursed?'#d4c8a9':'#aa7e50');
  rect(c,-14,-20,26,5,'#423c36');rect(c,6,-19,8,6,'#d3a468');
  // Red scarf and bandana: strong player readability.
  poly(c,[[8,-36],[-9,-38],[-4,-42],[11,-40]],cursed?'#d8d1b1':'#d85d49');
  poly(c,[[-8,-36],[-20-run*3,-30],[-14,-37]],cursed?'#e9cda9':'#e07553');
  // Head with helmet and face.
  rect(c,-10,-54,20,17,cursed?'#d9ccad':'#e2b67b');rect(c,5,-49,7,7,'#d8a575');
  if(cursed){for(let j=0;j<4;j++)line(c,-12,-52+j*5,11,-54+j*5,'#958d78',3);rect(c,4,-49,3,3,'#73e88e');}
  else{poly(c,[[-15,-54],[-13,-60],[3,-63],[14,-58],[15,-52]],'#514f48','#1d242c',2);rect(c,4,-53,14,5,'#858367');rect(c,7,-46,3,3,'#252129');}
  // Rifle forward, glowing sight, arms.
  if(game.input.up){rect(c,7,-58,7,30,'#302e33');rect(c,9,-76,4,23,'#a9a69b');rect(c,9,-76,4,3,'#ffdf9e');rect(c,3,-39,9,6,cursed?'#d6bba2':'#d69b68');}
  else {poly(c,[[4,-36],[18,-32],[16,-25],[4,-29]],cursed?'#d6c7a8':'#e9ba80');rect(c,10,-36,25,10,slug?'#b1ad81':'#3d3c3a');rect(c,18,-35,20,5,'#a29b82');rect(c,31,-35,12,4,'#292e33');rect(c,38,-34,8,2,'#d7b578');rect(c,14,-28,6,9,'#51453e');}
  c.restore();}
function rifleman(c,e,x,y){let run=Math.sin(e.t*9)*3;c.save();c.translate(x+e.w/2,y+e.h);c.scale(e.dir,1);ellipse(c,0,0,16,4,'#101a2388');rect(c,-12+run,-9,9,9,'#302e30');rect(c,2-run,-9,11,9,'#292d2c');poly(c,[[-14,-35],[10,-35],[15,-13],[-11,-13]],'#897853','#4b473c',2);rect(c,-4,-31,6,18,'#bda26b');rect(c,-10,-48,20,16,'#c28e68');poly(c,[[-15,-48],[-10,-57],[11,-58],[16,-49]],'#a1905c','#65533c',2);rect(c,8,-41,6,4,'#2f2926');rect(c,4,-29,24,8,'#323838');rect(c,25,-31,10,4,'#d1af87');c.restore();}
function mummy(c,e,x,y,t){c.save();c.translate(x+e.w/2,y+e.h);c.scale(e.dir,1);let sway=Math.sin(e.t*4)*3;
  ellipse(c,0,0,15,5,'#0c1c1e88');poly(c,[[-9,-22],[-16+sway,-1],[-4,-1],[0,-19]],'#938578');poly(c,[[4,-22],[0-sway,-1],[12,-1],[12,-21]],'#b5ac8e');
  poly(c,[[-14,-39],[12,-41],[15+sway,-19],[-9,-18]],'#a19881','#6f7167',2);poly(c,[[-15,-49],[-8,-58],[9,-56],[15,-45],[11,-35],[-11,-35]],'#c9b59a','#6b6761',2);
  for(let j=0;j<6;j++){line(c,-13+(j%2)*2,-51+j*5,12-(j%2)*3,-48+j*5,j%2?'#877d72':'#eee0b4',2);}
  rect(c,-9,-46,5,3,'#7bf5a9');rect(c,5,-46,5,3,'#7bf5a9');
  poly(c,[[10,-32],[28+sway,-26],[27,-19],[9,-25]],'#b7a287','#6e7164',2);poly(c,[[-13,-31],[-20,-21],[-17,-16],[-6,-22]],'#c2ab95');c.restore();}
function bat(c,e,x,y,t){c.save();c.translate(x+13,y+10);let flap=Math.sin(t*17+e.t*4);poly(c,[[-2,1],[-11,-9-12*flap],[-30,-13-14*flap],[-24,4],[-15,11]],'#4e5957','#263438',1);poly(c,[[3,1],[13,-9-12*flap],[31,-13-14*flap],[25,4],[14,11]],'#536b63','#283137',1);ellipse(c,0,0,9,11,'#7b705c');ellipse(c,-4,-2,2,2,'#d7f2a9');ellipse(c,4,-2,2,2,'#d7f2a9');c.restore();}
function turret(c,e,x,y){rect(c,x-5,y+19,43,17,'#454246');rect(c,x+1,y+14,33,10,'#927354');ellipse(c,x+15,y+10,19,17,'#6d7465');ellipse(c,x+15,y+10,12,10,'#3c4c4a');rect(c,x-20,y+6,36,8,'#a18e71');rect(c,x-21,y+5,6,9,'#332d32');rect(c,x+11,y+6,9,9,e.hit>0?'#fcd3a2':'#cf875b');}
function sarcophagus(c,e,x,y,t){glow(c,x+25,y+16,60,'#68bfa42b');rect(c,x-4,y-6,58,64,'#a18965');rect(c,x,y-17,52,15,'#c5a571');poly(c,[[x+3,y+1],[x+47,y+1],[x+39,y+42],[x+12,y+42]],'#53544d','#dbad78',3);poly(c,[[x+15,y+2],[x+36,y+2],[x+32,y+17],[x+18,y+17]],'#c7a575');rect(c,x+18,y+10,5,3,'#82e6aa');rect(c,x+29,y+10,5,3,'#82e6aa');hiero(c,x+16,y+29,.42,'#e3bd83');}
function enemySprite(c,e,cam,t){let x=e.x-cam,y=e.y;if(x<-110||x>WIDTH+110)return;c.save();if(e.hit>0)c.filter='brightness(2.2)';switch(e.type){case 'barrel':dangerBarrel(c,x,y);break;case 'rifle':rifleman(c,e,x,y);break;case 'mummy':mummy(c,e,x,y,t);break;case 'bat':bat(c,e,x,y,t);break;case 'turret':turret(c,e,x,y);break;case 'spawner':sarcophagus(c,e,x,y,t);break;}c.restore();if(e.type==='spawner'&&e.hp<e.maxHp)rect(c,x,y-23,50*(e.hp/e.maxHp),3,'#91f0af');}
function chest(c,x,y,t,type){let bob=Math.sin(t*4+x)*2;const colors={slug:'#d3e99e',coin:'#ffdb74',grenade:'#eec286',heavy:'#f2bb67',spread:'#d8b7ff',health:'#e0a6a0',antidote:'#94e5b8',pow:'#ffe3a3',gem:'#84ecf4'};const col=colors[type]||'#eec286';
  glow(c,x,y-4,38,col+'2f');if(type==='pow'){c.save();c.translate(x,y);rect(c,-7,-9,15,20,'#eee1cf');rect(c,-7,-15,15,12,'#e6c194');rect(c,-8,-20,18,6,'#f5e0cc');rect(c,-5,-9,12,6,'#8c6e50');rect(c,-8,12,8,7,'#65554a');rect(c,3,12,8,7,'#65554a');c.restore();return;}
  if(type==='coin'){ellipse(c,x,y+bob,12,12,'#eabf54');ellipse(c,x,y+bob,8,8,'#fff1a9');label(c,'✦',x,y+5+bob,14,'#8f622e','center');return;}
  if(type==='slug'){rect(c,x-23,y-9+bob,46,23,'#586666');rect(c,x-12,y-19+bob,25,12,'#c9be8b');rect(c,x+7,y-16+bob,26,5,'#9aab8b');ellipse(c,x-16,y+15+bob,9,7,'#292d35');ellipse(c,x+15,y+15+bob,9,7,'#292d35');return;}
  if(type==='gem'){poly(c,[[x,y-18+bob],[x+13,y-6+bob],[x+6,y+13+bob],[x-5,y+13+bob],[x-15,y-5+bob]],'#56d8e2','#a8f9e8',2);poly(c,[[x,y-18+bob],[x+2,y-1+bob],[x-5,y+13+bob]],'#b2f7f0');return;}
  if(type==='antidote'||type==='health'){rect(c,x-10,y-10+bob,20,24,'#ece5be');rect(c,x-7,y-4+bob,14,15,type==='health'?'#e88b8d':'#75d4a4');rect(c,x-4,y-15+bob,8,6,'#d1c09a');if(type==='health'){rect(c,x-2,y+1+bob,5,11,'#fff9e4');rect(c,x-6,y+5+bob,13,4,'#fff9e4');}else{ellipse(c,x,y+4+bob,3,3,'#daf8b2');}return;}
  rect(c,x-17,y-14+bob,34,27,'#e8dcc5');rect(c,x-14,y-11+bob,28,21,'#555461');rect(c,x-12,y-9+bob,24,17,'#b69b7c');rect(c,x-16,y-15+bob,32,5,'#f5d5a2');let symbol=type==='heavy'?'H':type==='spread'?'S':'B';label(c,symbol,x,y+5+bob,19,'#29262a','center');}
function drops(c,g,cam,t){for(const item of g.pickups){if(item.taken)continue;const x=item.x-cam;if(x<-60||x>WIDTH+60)continue;chest(c,x,item.y,t,item.type);}}
function bigBoss(c,b,cam,t){if(!b.active||b.dead)return;const x=b.x-cam,y=b.y;glow(c,x-28,y,235,b.telegraph>0?'#ffa87166':'#eb99652f');
  // Rear hydraulic vertebrae, linked into the cavern roof.
  for(let i=9;i>=0;i--){let xx=x+145+i*18,yy=y-125+Math.sin(t*1.6+i*.5)*10-i*16;ellipse(c,xx,yy,58-i*.9,50-i*1.4,'#393c41');ellipse(c,xx-4,yy-6,46-i*.6,36-i*.5,'#a17b5b');poly(c,[[xx-29,yy-23],[xx+28,yy-27],[xx+37,yy+8],[xx-25,yy+19]],i%2?'#8e6351':'#b68b60','#312e35',4);rect(c,xx-10,yy-27,23,8,'#d9ad6d');}
  // Armored jaw assembly and glowing eye.
  c.save();c.translate(x-20,y);c.rotate(Math.sin(t*1.9)*.055);
  poly(c,[[90,-59],[30,-95],[-58,-78],[-120,-29],[-103,49],[-40,74],[44,53],[107,15]],'#785b52','#312b36',6);
  poly(c,[[70,-52],[15,-81],[-55,-58],[-108,-17],[-90,12],[-3,-2],[54,18]],'#b18a68','#efd0a0',3);
  for(let j=0;j<5;j++){const xx=-87+j*27;poly(c,[[xx,11],[xx+12,14],[xx+2,28]],'#ebd3a3','#53464a',1);}
  poly(c,[[70,24],[31,61],[-62,54],[-93,29],[-50,80],[46,83],[103,36]],'#9b7257','#28252b',4);
  ellipse(c,-50,-42,27,24,'#292a34');glow(c,-50,-42,46,b.telegraph>0?'#ff503a99':'#f7bd6682');ellipse(c,-50,-42,15,13,b.telegraph>0?'#ff403b':'#ffd47b');ellipse(c,-49,-42,5,5,'#fff5cf');
  for(let j=0;j<7;j++)line(c,-64+j*21,47,-56+j*21,62,'#e6bf8b',2);
  if(b.telegraph>0){line(c,-113,0,-240,2,'#ff84715c',9);ellipse(c,-117,0,15,15,'#ff7f51');}
  c.restore();
  // Machinery rivets and laser exhaust.
  for(let j=0;j<6;j++){const rx=x+j*28,ry=y-73+Math.sin(t+j)*6;ellipse(c,rx,ry,4,4,'#f9c17c');}
}
function effects(c,g,cam){for(const grenade of g.grenades){const x=grenade.x-cam,y=grenade.y;glow(c,x,y,18,'#ffc87533');ellipse(c,x,y,7,8,'#4a5c4e');ellipse(c,x-1,y-2,3,3,'#eab575');}
  for(const b of g.bullets){const x=b.x-cam,y=b.y;if(x<-60||x>WIDTH+60)continue;if(b.owner==='player'){line(c,b.px-cam,b.py,x,y,b.color,4);glow(c,x,y,12,'#ffcf7951');ellipse(c,x,y,b.r,b.r,b.color);}else{glow(c,x,y,b.kind==='curse'?25:14,b.kind==='curse'?'#6edab077':'#eb8f5f44');ellipse(c,x,y,b.r,b.r,b.color);if(b.kind==='curse'){ellipse(c,x+Math.sin(g.time*8)*5,y+4,4,4,'#c7f9a7aa');}}}
  for(const p of g.particles){const a=Math.max(0,Math.min(1,p.life/p.max));c.globalAlpha=a;rect(c,p.x-cam,p.y,p.size,p.size,p.color);}c.globalAlpha=1;
  for(const t of g.floating){c.globalAlpha=Math.min(1,t.life*2);c.shadowColor='#000';c.shadowBlur=5;label(c,t.text,t.x-cam,t.y,14,t.color,'center');c.shadowBlur=0;}c.globalAlpha=1;}

/** Original vertically tiling ruins; world coordinates move only the camera. */
function towerBackdrop(c,cx,cy,t,g){
  const b=g.boss.active,grad=c.createLinearGradient(0,0,0,HEIGHT);
  grad.addColorStop(0,b?'#111a28':'#101d26');grad.addColorStop(.6,b?'#35303a':'#263e40');grad.addColorStop(1,b?'#503239':'#56614a');rect(c,0,0,WIDTH,HEIGHT,grad);
  for(let depth=0;depth<3;depth++){
    const ofsX=cx*(.08+depth*.11),ofsY=cy*(.17+depth*.08),wide=depth===2?90:144,high=depth===2?56:107;
    for(let row=Math.floor(ofsY/high)-2;row<Math.ceil((ofsY+HEIGHT)/high)+2;row++){
      const y=row*high-ofsY;
      for(let col=-2;col<13;col++){
        const x=col*wide-(ofsX%wide)+(row%2)*wide*.5;
        rect(c,x,y,wide-2,high-2,depth===0?'#182631':depth===1?'#26343a':'#364840');
        line(c,x+2,y+2,x+wide-6,y+2,depth===2?'#627964':'#455459',2);
        if(depth===2&&rnd(col*11+row*47)>.79)hiero(c,x+22,y+27,.38,'#6d8067');
      }
    }
  }
  for(let col=-1;col<7;col++){
    const x=col*205+105-(cx*.2%205);
    rect(c,x-21,0,39,HEIGHT,'#182c32a5');rect(c,x-26,0,8,HEIGHT,'#a7ae8059');
    for(let q=0;q<7;q++){
      const y=((q*105-cy*.40)%725+725)%725-70;
      rect(c,x-31,y,63,15,'#647561');rect(c,x-24,y+2,49,3,'#c5a87a');
    }
  }
  for(let i=0;i<10;i++){
    const x=3510+i*265-cx*.59;if(x<-120||x>WIDTH+120)continue;
    const y=((i*190-cy*.36)%660+660)%660-120;
    glow(c,x,y,120,b?'#f67e4f23':'#7acc9b1f');
    wallTorch(c,x,y+40,t,i%3?'green':'orange');
  }
  rect(c,475-cx*.08,0,112,HEIGHT,'#0a1b2388');
  if(b)glow(c,560,380,325,'#e06d4d35');
}
function drawSlugnoid(c,p,x,y,t,v){
  c.save();c.translate(x+13,y+48);c.scale(p.dir,1);
  for(const d of [-1,1]){
    rect(c,d*17-6,-12,13,25,'#4b5250');rect(c,d*18-12,8,31,12,'#6c6a5e');
    ellipse(c,d*19,-17,8,9,'#c8af7c');
  }
  poly(c,[[-30,-37],[-19,-55],[18,-55],[30,-33],[36,-17],[-36,-17]],'#717c74','#293337',3);
  rect(c,-26,-43,52,9,'#c8b58c');rect(c,-15,-53,33,6,'#ecdcaf');
  ellipse(c,0,-57,14,13,'#dcb885');rect(c,-15,-66,30,10,'#778f83');
  for(const d of [-1,1]){
    if(d===-1&&v.gunsLeft<1||d===1&&v.gunsLeft<2)continue;
    rect(c,d*18-4,-41,31,9,'#4a5255');rect(c,d*30,-44,30,4,'#c9b58e');rect(c,d*30,-37,30,3,'#716c5d');
  }
  if(!p.grounded){glow(c,0,12,40,'#ffb76a50');poly(c,[[-9,18],[0,39+Math.sin(t*20)*7],[9,18]],'#ffaf62');}
  c.restore();
}
function renderHazards(c,g,cx){
  if(g.boss.active&&!g.boss.dead&&g.boss.entry>=1&&g.boss.telegraph>0){
    const x=g.boss.mode==='laser'?g.boss.targetX-cx:g.boss.x-cx;
    c.save();
    const pulse=.22+.20*(.5+.5*Math.sin(g.time*28));
    c.globalAlpha=pulse;
    if(g.boss.mode==='laser'){
      rect(c,x-52,g.boss.y-720,104,730,'#f65c91');
      line(c,x,g.boss.y-720,x,g.boss.y+10,'#fff1d7',3);
      for(let k=0;k<4;k++)line(c,x-50+k*33,g.boss.y-720,x-50+k*33,g.boss.y+10,'#ffa8ba',2);
    }else if(g.boss.mode==='lunge'){
      rect(c,x-95,g.boss.y-340,190,340,'#f47e4e');
      line(c,x-95,g.boss.y-340,x+95,g.boss.y,'#ffd2ab',4);
    }else glow(c,x,g.boss.y-55,110,'#ffae6388');
    c.restore();
  }
  for(const h of g.hazards||[]){
    c.save();c.globalAlpha=Math.min(1,h.life*2.3);
    const x=h.x-cx;
    if(h.kind==='laser'){
      glow(c,x,h.y+h.h/2,180,'#f89bdb84');
      rect(c,x-h.w/2,h.y,h.w,h.h,'#dc71bc82');rect(c,x-18,h.y,36,h.h,'#ffe1f4e8');
      for(let n=-2;n<=2;n++)line(c,x+n*15,h.y,x+n*16+Math.sin(g.time*18+n)*23,h.y+h.h,'#ffc1e4aa',4);
    }else {glow(c,x,h.y+h.h/2,160,'#ffb05e77');rect(c,x,h.y,h.w,h.h,'#ff9d5d38');}
    c.restore();
  }
}
function dangerBarrel(c,x,y){
  rect(c,x,y+4,49,39,'#8d4037');rect(c,x+3,y+7,43,29,'#cc6751');
  rect(c,x-3,y,55,7,'#423d42');rect(c,x-3,y+36,55,7,'#3d393b');
  line(c,x+12,y+10,x+36,y+33,'#f3d58a',4);
  line(c,x+35,y+10,x+12,y+33,'#f3d58a',4);
  label(c,'!',x+24,y+28,18,'#fff2ca','center');
}

function overhead(c,game,t){const cam=game.camera.x;
  // Tiny drifting desert sand / cavern dust to bind foreground to background.
  for(let i=0;i<30;i++){const xx=((rnd(i*13)*1000+Math.sin(t*.3+i*4)*25)%1040+1040)%1040-20,yy=100+rnd(i*19)*330;rect(c,xx,yy,2,2,actAt(cam+xx)===0?'#e4b98a6b':'#c5dbb641');}
  if(game.player.curse>0){const x=game.player.x-cam,y=game.player.y-game.camera.y;glow(c,x+13,y+25,67,'#83f1b327');}
  if(game.phase==='playing'&&game.player.health<=1){c.fillStyle=`rgba(125,29,40,${.12+.065*Math.sin(t*6)})`;c.fillRect(0,0,WIDTH,HEIGHT);}
  const grd=c.createLinearGradient(0,0,0,HEIGHT);grd.addColorStop(0,'#00000015');grd.addColorStop(.48,'#00000000');grd.addColorStop(1,'#0f0b21bb');c.fillStyle=grd;c.fillRect(0,0,WIDTH,HEIGHT);
  if(game.phase==='playing'&&game.boss.active&&!game.boss.dead){const alpha=.06+.04*Math.sin(t*2);rect(c,0,0,WIDTH,HEIGHT,`rgba(246,132,76,${alpha})`);}
}
export class ArtDirector {
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.t=0;this.shake=0;this.flash=0;this.quality=1;this.resize();}
 resize(){const dpi=Math.min(window.devicePixelRatio||1,2);const bounds=this.canvas.getBoundingClientRect();const area=bounds.width>0?bounds.width:960;this.quality=area>1400?Math.min(2,dpi):dpi;this.canvas.width=Math.round(WIDTH*this.quality);this.canvas.height=Math.round(HEIGHT*this.quality);this.c.imageSmoothingEnabled=false;}
 react(events){for(const e of events){if(e.type==='explosion'){this.shake=Math.max(this.shake,14);this.flash=.12;}if(e.type==='hurt')this.shake=Math.max(this.shake,7);if(e.type==='kill')this.shake=Math.max(this.shake,3);if(e.type==='won'){this.shake=17;this.flash=.6;}if(e.type==='boss')this.shake=14;}}
 render(g,dt=0){
    this.t+=Math.max(0,dt);this.shake*=.86;this.flash=Math.max(0,this.flash-dt);
    const c=this.c,t=this.t,cam=g.camera,cx=cam.x;
    c.setTransform(this.quality,0,0,this.quality,0,0);
    c.clearRect(0,0,WIDTH,HEIGHT);c.save();
    const offsetX=this.shake?(rnd(t*340)*2-1)*this.shake:0;
    const offsetY=this.shake?(rnd(t*570)*2-1)*this.shake*.5:0;
    c.translate(offsetX,offsetY);
    if(g.player.x>=3480||cx>=3450)towerBackdrop(c,cx,cam.y,t,g);
    else environment(c,cx,t);
    c.save();c.translate(0,-cam.y);
    for(const p of g.platforms){
      const x=p.x-cx;if(x>WIDTH+30||x+p.w<-30)continue;
      platform(c,x,p.y,p.w,actAt(p.x));
    }
    drops(c,g,cx,t);
    for(const secret of g.secrets){
      if(secret.triggered)continue;const sx=secret.x-cx;
      if(sx>-20&&sx<WIDTH+20){
        if(secret.kind==='lamp'){
          glow(c,sx,secret.y,23,'#ffc87925');ellipse(c,sx,secret.y+6,10,5,'#dcad63');
          rect(c,sx-5,secret.y-4,11,9,'#efc987');rect(c,sx+6,secret.y-1,9,3,'#e6b16f');
        }else ellipse(c,sx,secret.y,4,3,'#e3d89b');
      }
    }
    for(const e of g.enemies)enemySprite(c,e,cx,t);
    bigBoss(c,g.boss,cx,t);renderHazards(c,g,cx);
    if(g.vehicle?.mounted){
      drawSlugnoid(c,g.player,g.player.x-cx,g.player.y,t,g.vehicle);
      hero(c,{...g.player,weapon:'pistol'},g.player.x-cx,g.player.y-31,t,g);
    }else hero(c,g.player,g.player.x-cx,g.player.y,t,g);
    effects(c,g,cx);c.restore();
    overhead(c,g,t);c.restore();
    if(this.flash>0)rect(c,0,0,WIDTH,HEIGHT,'rgba(255,225,175,'+Math.min(.4,this.flash*.7)+')');
  }
}
