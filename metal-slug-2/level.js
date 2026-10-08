/** Authored route for the original-art Mission 2 remake. World Y decreases on ascent. */
export const TOWER_START = 3480;
export const BOSS_ENTRY = 5480;
export const TOWER_PLATFORMS = Object.freeze([
  {x:3530,y:365,w:255,h:15},{x:3710,y:280,w:250,h:15},
  {x:3890,y:195,w:245,h:15},{x:4070,y:110,w:250,h:15},
  {x:4250,y:25,w:245,h:15},{x:4430,y:-60,w:250,h:15},
  {x:4610,y:-145,w:245,h:15},{x:4790,y:-230,w:250,h:15},
  {x:4970,y:-315,w:255,h:15},{x:5150,y:-400,w:250,h:15},
  {x:5330,y:-485,w:255,h:15},{x:5420,y:-570,w:1120,h:18}
]);
/** A gate is crossed only after the player reaches the top of that tier. */
export const TOWER_GATES = Object.freeze([
  {x:3790,top:280},{x:3970,top:195},{x:4150,top:110},
  {x:4330,top:25},{x:4510,top:-60},{x:4690,top:-145},
  {x:4870,top:-230},{x:5050,top:-315},{x:5230,top:-400},
  {x:5410,top:-485},{x:5480,top:-570}
]);
export const SCENES = Object.freeze([
  {id:'desert',title:'DUNES AT DUSK',x0:0,x1:1650,gate:'danger-barrel'},
  {id:'descent',title:'BENEATH THE STONE',x0:1650,x1:2800,gate:null},
  {id:'tomb',title:'CURSE OF THE PHARAOHS',x0:2800,x1:3480,gate:null},
  {id:'ascent',title:'THE RISING TOMB',x0:3480,x1:4950,gate:'vertical-platforms'},
  {id:'slugnoid',title:'IRON WALKER ASCENT',x0:4950,x1:5480,gate:'climb-to-roof'},
  {id:'boss',title:'AESHI NERO',x0:5480,x1:6640,gate:'defeat-boss'}
]);
export function sceneAt(x) { return SCENES.findLast(s=>x>=s.x0) || SCENES[0]; }
export function towerSurfaceAt(x) {
  if(x < TOWER_START) return 456;
  const matches = TOWER_PLATFORMS.filter(p=>x>=p.x+4 && x<=p.x+p.w-4);
  return matches.length ? Math.min(...matches.map(p=>p.y)) : 456;
}
export function routeGate(prevX,newX,playerBottom,gateOpen) {
  const right=prevX+26,nextRight=newX+26;
  if(!gateOpen && right<=1650 && nextRight>1650)return 1650-26;
  for(const g of TOWER_GATES) {
    if(right<=g.x && nextRight>g.x && playerBottom>g.top+7) return g.x-26;
  }
  return newX;
}
