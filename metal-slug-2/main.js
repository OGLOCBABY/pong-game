import {RuinsGame,FIXED_DT,actAt,phaseTitle} from './engine.js';
import {ArtDirector} from './art.js';
import {SoundDeck} from './audio.js';

const $=id=>document.getElementById(id);
const canvas=$('game'),screen=$('screen'),overlay=$('overlay');
const game=new RuinsGame();const art=new ArtDirector(canvas);const sound=new SoundDeck();
const heldKeys=new Set(),heldTouch=new Map();let accumulator=0,lastTime=null,announcedAt=0,helpShowing=false,bannerUntil=0,uiAt=0;
const performanceFrames=[];
const actions={left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],up:['KeyW','ArrowUp'],down:['KeyS','ArrowDown'],jump:['Space'],fire:['KeyJ','KeyZ','ControlLeft'],grenade:['KeyK','KeyX'],interact:['KeyE']};
const announce=message=>{$('announcement').textContent=message;};
function controls(){let input={};for(const [name,bindings] of Object.entries(actions)){input[name]=bindings.some(k=>heldKeys.has(k))||[...heldTouch.values()].some(v=>v===name);}const pad=navigator.getGamepads?.()?.find(p=>p&&p.connected);if(pad){let ax=pad.axes[0]||0;input.left||=ax<-.25||pad.buttons[14]?.pressed;input.right||=ax>.25||pad.buttons[15]?.pressed;input.up||=(pad.axes[1]||0)<-.6||pad.buttons[12]?.pressed;input.down||=(pad.axes[1]||0)>.6||pad.buttons[13]?.pressed;input.jump||=pad.buttons[0]?.pressed;input.fire||=pad.buttons[2]?.pressed||pad.buttons[5]?.pressed;input.grenade||=pad.buttons[1]?.pressed;}game.setInput(input);}
function stateLabel(){return {ready:'STANDING BY',playing:'MISSION IN PROGRESS',paused:'SYSTEM PAUSED',won:'MISSION COMPLETE',lost:'MISSION FAILED'}[game.phase];}
function resetAll(){game.reset();showOverlay('ready');announcedAt=0;accumulator=0;updateHUD(true);}
function begin(){if(helpShowing){helpShowing=false;}sound.unlock();game.start();overlay.classList.add('hidden');canvas.focus({preventScroll:true});announce('Mission started. Move with A and D; shoot with J; jump with Space.');}
function showOverlay(phase){overlay.classList.remove('hidden');helpShowing=false;const title=$('overlay-title'),copy=$('overlay-copy'),eyebrow=$('overlay-eyebrow'),playLabel=$('play-label');
  if(phase==='won'){eyebrow.textContent='✳ THE ANCIENT MACHINE HAS FALLEN';title.innerHTML='MISSION <em>COMPLETE</em>';copy.innerHTML=`THE RUINS ARE SILENT AGAIN.<br>FINAL SCORE ${game.score.toLocaleString('en-US')} · ${game.kills} FOES DEFEATED · ${game.rescues} RESCUED.`;playLabel.textContent='PLAY AGAIN';}
  else if(phase==='lost'){eyebrow.textContent='✳ THE DESERT CLAIMS ANOTHER';title.innerHTML='MISSION <em>FAILED</em>';copy.innerHTML=`YOU FOUGHT TO ACT ${actAt(game.player.x)+1}.<br>SCORE ${game.score.toLocaleString('en-US')} · RESPAWN, RELOAD, RETRY.`;playLabel.textContent='TRY AGAIN';}
  else if(phase==='paused'){eyebrow.textContent='✳ OPERATIONS TEMPORARILY SUSPENDED';title.innerHTML='MISSION <em>PAUSED</em>';copy.innerHTML='THE RUINS CAN WAIT.<br>TAKE YOUR TIME. THE ENEMY WILL NOT.';playLabel.textContent='RESUME MISSION';}
  else{eyebrow.innerHTML='<span>✳</span> THE ARCHIVES / VOL. II';title.innerHTML='RUINS <span>OF THE</span><br>SECOND <em>SUN</em>';copy.innerHTML='Beneath the sand, something ancient is waking.<br>One soldier. Four acts. No turning back.';playLabel.textContent='START MISSION';}
  $('help').textContent='HOW TO PLAY   ?';}
function primary(){if(game.phase==='paused'){game.togglePause();overlay.classList.add('hidden');canvas.focus({preventScroll:true});}else if(game.phase==='won'||game.phase==='lost'){game.start();overlay.classList.add('hidden');canvas.focus({preventScroll:true});}else begin();}
function pause(){if(game.phase==='playing'||game.phase==='paused'){game.togglePause();if(game.phase==='paused'){showOverlay('paused');announce('Game paused.');}else{overlay.classList.add('hidden');announce('Game resumed.');}}}
function message(text,seconds=2.5){const e=$('event-banner');e.textContent=text;e.classList.add('visible');bannerUntil=game.time+seconds;}
function processEvents(events){art.react(events);for(const event of events){sound.play(event);switch(event.type){case 'act':message(`ACT ${['I','II','III','IV'][event.act]} — ${event.title}`,1.1);announce(`Now entering ${event.title}`);break;
    case 'boss':message('WARNING · AESHI NERO',1.6);announce('Aeshi Nero is rising below. Shoot downward, dodge the warning beams.');break;
    case 'scene':announce('Entering '+game.sceneId+'.');break;
    case 'gateopen':message('ENTRANCE OPEN · GO!',2.2);announce('The danger barrel is destroyed. The tomb is open.');break;
    case 'mount':message('SLUGNOID ONLINE',1);announce('Slugnoid mounted. Use K for downward cannon, E to exit.');break;
    case 'dismount':message('DISMOUNTED',1.3);break;
    case 'vehiclehit':message('SLUG ARMOR '+event.hp,1);announce('Walker damaged, '+event.hp+' armor remaining.');break;
    case 'vehiclelost':message('SLUGNOID DESTROYED',2.0);announce('Your walker has been destroyed. Continue on foot.');break;
    case 'laser':message('ENERGY BEAM · EVADE!',.7);break;
    case 'mummydeath':message('THE CURSE CONSUMES YOU',2);break;
    case 'checkpoint':message('CHECKPOINT',.75);break;
    case 'secret':message(event.secret==='sphinx'?'SPHINX SECRET! +10,000':'THE GOLDEN LAMP AWAKES!',1.3);break;
    case 'curse':message('CURSED! FIND AN ANTIDOTE',1.3);announce('Mummy curse! Movement reduced. Find a green antidote.');break;
    case 'pickup':if(event.item==='pow')announce('Explorer rescued!');else if(event.item==='heavy'||event.item==='spread')announce(`${event.item.toUpperCase()} weapon collected.`);break;
    case 'respawn':message('CONTINUE!',1.4);announce(`You have ${game.player.lives} lives left.`);break;
    case 'won':showOverlay('won');announce('Mission complete! You destroyed the Iron Colossus.');break;
    case 'lost':showOverlay('lost');announce('Mission failed. Select try again to restart.');break;}}}
function updateHUD(force=false){if(!force&&performance.now()-uiAt<78)return;uiAt=performance.now();const p=game.player,b=game.boss;
  $('score').textContent=String(game.score).padStart(7,'0');$('lives').textContent='♥ '.repeat(p.lives).trim()||'00';$('weapon').innerHTML=(p.ammo===Infinity?'∞':String(p.ammo).padStart(3,'0'))+` <span>${p.curse>0?'CURSED':game.vehicle.mounted?'SLUGNOID '+game.vehicle.gunsLeft+'G':p.weapon.toUpperCase()}</span>`;
  $('bombs').textContent=String(p.grenades).padStart(2,'0');$('timer').textContent=`${String(Math.floor(game.time/60)).padStart(2,'0')}:${String(Math.floor(game.time%60)).padStart(2,'0')}`;
  $('act-num').textContent=`ACT ${['I','II','III','IV'][game.act]}`;$('act-name').textContent=game.scenes.find(scene=>scene.id===game.sceneId)?.title||phaseTitle(p.x);$('game-state').textContent=stateLabel();
  $('boss-hud').hidden=!b.active||b.dead;$('boss-meter-fill').style.width=`${Math.max(0,b.hp/b.maxHp*100)}%`;$('boss-hp').textContent=`${Math.ceil(b.hp/b.maxHp*100)}%`;
  $('pause-label').textContent=game.phase==='paused'?'RESUME':'PAUSE';}
function loop(time){if(lastTime===null)lastTime=time;const dt=Math.min(.06,(time-lastTime)/1000);lastTime=time;if(dt>0){performanceFrames.push(dt*1000);if(performanceFrames.length>3600)performanceFrames.shift();}controls();if(game.phase==='playing'){accumulator+=dt;let steps=0;while(accumulator>=FIXED_DT&&steps++<10){const events=game.step(FIXED_DT);if(events.length)processEvents(events);accumulator-=FIXED_DT;}if(steps>=10)accumulator=0;}
  if($('event-banner').classList.contains('visible')&&game.time>=bannerUntil&&game.phase==='playing')$('event-banner').classList.remove('visible');art.render(game,dt);updateHUD();requestAnimationFrame(loop);}
$('play').addEventListener('click',primary);
$('help').addEventListener('click',()=>{if(!helpShowing){helpShowing=true;$('overlay-eyebrow').textContent='✳ FIELD MANUAL · QUICK REFERENCE';$('overlay-title').innerHTML='FIGHT. <em>MOVE.</em><br>SURVIVE.';$('overlay-copy').innerHTML='A / D TO MOVE · W TO AIM UP · SPACE TO JUMP<br>HOLD J TO FIRE · K TO THROW A GRENADE<br>RECOVER THE GREEN ANTIDOTE IF YOU ARE CURSED.';$('help').textContent='BACK';}else{helpShowing=false;showOverlay(game.phase);}});
$('restart').addEventListener('click',()=>{resetAll();begin();});$('pause').addEventListener('click',pause);
$('mute').addEventListener('click',()=>{sound.setEnabled(!sound.enabled);$('mute-value').textContent=sound.enabled?'ON':'OFF';$('mute').setAttribute('aria-pressed',String(!sound.enabled));});
window.addEventListener('keydown',e=>{if(actions.left.includes(e.code)||actions.right.includes(e.code)||actions.up.includes(e.code)||actions.down.includes(e.code)||actions.jump.includes(e.code)||actions.fire.includes(e.code)||actions.grenade.includes(e.code)||['Enter','KeyP','Escape','KeyM','KeyR'].includes(e.code))e.preventDefault();
  if(e.code==='Enter'&&!e.repeat){primary();return;}if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat){pause();return;}if(e.code==='KeyM'&&!e.repeat){$('mute').click();return;}if(e.code==='KeyR'&&!e.repeat){resetAll();begin();return;}heldKeys.add(e.code);},{passive:false});
window.addEventListener('keyup',e=>heldKeys.delete(e.code));window.addEventListener('blur',()=>{heldKeys.clear();heldTouch.clear();document.querySelectorAll('[data-control].pressed').forEach(b=>b.classList.remove('pressed'));if(game.phase==='playing')pause();});
for(const button of document.querySelectorAll('[data-control]')){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);heldTouch.set(e.pointerId,button.dataset.control);button.classList.add('pressed');if(game.phase==='ready')begin();});for(const eventName of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventName,e=>{heldTouch.delete(e.pointerId);button.classList.remove('pressed');});}
function adapt(){screen.classList.toggle('mobile-controls',window.matchMedia('(pointer: coarse)').matches||window.innerWidth<=800);art.resize();}
$('mode').addEventListener('click',()=>{
  game.mode=game.mode==='faithful'?'practice':'faithful';
  $('mode').textContent=game.mode==='faithful'?'MODE · ARCADE':'MODE · PRACTICE';
  $('mode').setAttribute('aria-pressed',String(game.mode==='practice'));
  heldKeys.clear();heldTouch.clear();resetAll();
  announce(game.mode==='faithful'?'Arcade one-hit mode selected.':'Practice mode selected: three-hit life and checkpoints.');
});
window.addEventListener('resize',adapt);document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='playing')pause();});
/** Read-only observability; test automation must use real keyboard/touch inputs. */
window.__ruins=Object.freeze({
  snapshot:()=>game.snapshot(),version:'2.0.0',
  performance:()=>{
    const values=[...performanceFrames].sort((a,b)=>a-b);
    return {samples:values.length,p95:values[Math.floor(values.length*.95)]||0};
  }
});
adapt();showOverlay('ready');updateHUD(true);requestAnimationFrame(loop);
