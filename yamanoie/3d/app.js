import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

const $=id=>document.getElementById(id), host=$('canvas-host');
const vec=([x,y,z])=>new THREE.Vector3(x,z,-y);
const clamp=THREE.MathUtils.clamp;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const views={
 exterior:{label:'赤い屋根の外観',note:'写真を見比べて、屋根、雨戸、玄関の形を作り直しました。正面や入口に寄って、木の家を眺めてみてください。'},
 entry:{label:'入口と三角窓',p:[.45,1.15,1.61],t:[1.8,-2.8,2.0],note:'見上げると三角の窓。その下には山の写真と、たくさんの札。'},
 blue:{label:'青い椅子の奥',p:[1.2,-1.1,1.58],t:[5.525,.18,1.35],note:'青い椅子の向こうにも、窓とベンチのある空間が続きます。'},
 counter:{label:'カウンター',p:[.35,-2.1,1.65],t:[-1.55,1.4,1.8],note:'カウンターの上にも下にも、目をとめたくなるものがいろいろ。'},
 dining:{label:'窓側の机席',p:[-7.2,-1.31,1.56],t:[-3.6,-1.35,1.75],note:'窓のそばの机席。壁いっぱいの写真にも、少し寄り道してみましょう。'},
 tatami:{label:'畳の部屋',p:[-7.20,-.75,1.62],t:[-10,-1.60,.95],note:'一段上がった畳の奥へ。窓辺の座卓と、低い梁を見渡してみる。'},
 overview:{label:'室内の全体',note:'屋根を外して、部屋のつながりを眺めます。外観は「外観」のボタンへ。'}
};
const route=['exterior','entry','blue','counter','dining','tatami','overview'];
const spots=[
 {id:'triangle',view:'entry',title:'見上げる三角窓',target:[1.8,-2.72,3.25],photo:'entry',focus:[.59,.25,2.1],text:'入口の上に広がる三角窓。木の枠と屋根の形を、水彩のイラストでも見上げてみます。'},
 {id:'mountains',view:'entry',title:'入口に並ぶ山の写真',target:[1.65,-2.68,2.36],photo:'entry',focus:[.60,.43,3.5],text:'三角窓の下に並んだ額。その風景をもう少し近くで。飾られた写真も、山の風景のイラストとして描いています。'},
 {id:'blue-seat',view:'blue',title:'青い椅子とその向こう',target:[4.75,.45,1.1],photo:'entry',focus:[.25,.61,2.0],text:'青い椅子の背後に、窓とベンチが続いています。イラストでは入口の左側に見える場所です。'},
 {id:'forest-photos',view:'counter',title:'カウンター上の四つの額',target:[-2.61,.515,3.12],photo:'counter',focus:[.235,.46,3.1],text:'木の壁に四つ並んだ縦長の額。カウンターから少し上へ目を向けてみます。'},
 {id:'counter-life',view:'counter',title:'にぎやかなカウンター',target:[-1.2,.6,1.18],photo:'counter',focus:[.30,.74,2.0],text:'道具や掲示の並んだカウンター。木の色や小さな品物を、イラストでも眺めてみてください。'},
 {id:'photo-wall',view:'dining',title:'壁いっぱいの思い出',target:[-6.86,-.09,1.2],photo:'dining',focus:[.14,.50,2.6],text:'低い天井の区画に続く、たくさんの写真。離れて眺めたときと、近づいたときで見え方が変わります。'},
 {id:'window',view:'dining',title:'窓辺から外を眺める',target:[-6.55,-2.7,1.55],photo:'dining',focus:[.80,.55,1.8],text:'机のすぐ横の窓。窓辺の明るさと緑をイラストで描きました。窓外は実景を正確に再現したものではありません。'},
 {id:'tatami-table',view:'tatami',title:'畳と低い座卓',target:[-9.6,-2.36,.63],photo:'tatami',focus:[.22,.76,1.6],text:'窓からの光が入る畳の部屋。窓側に並ぶ二つの座卓まで、ゆっくり見てみてください。'}
];
const photos={entry:{src:'./illustrations/entry.webp',alt:'三角窓のある入口と、その左にある青い椅子の水彩イラスト'},counter:{src:'./illustrations/counter.webp',alt:'四つの額と厨房の開口があるカウンターの水彩イラスト'},dining:{src:'./illustrations/dining.webp',alt:'壁に並ぶ思い出と窓側の机席の水彩イラスト'},tatami:{src:'./illustrations/tatami.webp',alt:'窓側に二つの赤い座卓が並ぶ畳の部屋の水彩イラスト'}};
let key=views[location.hash.slice(1)]?location.hash.slice(1):'exterior';
let renderer,scene,camera,orbit,interiorLights,daylight,ready=false,started=false,dirty=true;
let yaw=0,pitch=0,fov=70,transition=null,requestVersion=0;
const models={},pending={},points=new Map(),pins=[],seen=new Set();
let pinchDistance=0,focused=null,beforeFocus=null;
const announce=t=>{$('announcement').textContent=t;};
const invalidate=()=>{dirty=true;};
const orbitView=()=>key==='overview'||key==='exterior';
const modelKind=()=>key==='exterior'?'exterior':'interior';
function look(){
 pitch=clamp(pitch,-1.25,1.25);camera.fov=fov;
 const d=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
 camera.lookAt(camera.position.clone().add(d));camera.updateProjectionMatrix();invalidate();
}
function renderPins(){
 pins.length=0;$('hotspots').replaceChildren();
 if(orbitView())return;
 for(const spot of spots.filter(s=>s.view===key)){
  const b=document.createElement('button');b.className='hotspot';b.type='button';b.setAttribute('aria-label',spot.title+'へ寄る');
  b.textContent='＋';const label=document.createElement('span');label.textContent=spot.title;b.append(label);
  b.addEventListener('click',()=>focusSpot(spot));$('hotspots').append(b);pins.push({spot,button:b,world:vec(spot.target)});
 }
}
function updatePins(){
 if(!ready||orbitView())return;
 camera.updateMatrixWorld();
 const occupied=[];
 for(const pin of pins){
  const p=pin.world.clone().project(camera), x=(p.x+1)*host.clientWidth/2,y=(1-p.y)*host.clientHeight/2;
  const visible=p.z>-1&&p.z<1&&x>28&&x<host.clientWidth-28&&y>68&&y<host.clientHeight-92&&!focused&&!transition;
  const overlaps=occupied.some(v=>Math.abs(v.x-x)<70&&Math.abs(v.y-y)<52);
  pin.button.hidden=!visible||overlaps;
  if(visible&&!overlaps){occupied.push({x,y});pin.button.style.left=x+'px';pin.button.style.top=y+'px';}
 }
}
function discoveries(){
 $('discovery-count').textContent=`見つけた ${seen.size} / ${spots.length}`;
 $('spot-list').replaceChildren();
 const local=spots.filter(s=>s.view===key);
 $('discovery-note').textContent=key==='exterior'?'外観は指で回して眺められます。入口から中へ入り、気になるものを探してみましょう。':key==='overview'?'部屋の場所がつかめたら、下のカードからもう一度みどころへ。':'印やカードを押すと近くへ寄れます。「イラストで見る」で、写真をもとに描いた風景を枠の中に。';
 if(key==='exterior'){
  for(const [title,p,t] of [['正面から眺める',[0,-27,4.2],[0,-1,3.6]],['案内看板と木のベンチ',[2.8,-13,2.4],[2.5,-4.7,1.4]],['入口のクマに会う',[5.5,-6.4,1.65],[4.82,-3.65,1.0]],['玄関と看板に寄る',[5.5,-4.8,1.65],[5.32,-3.6,2.9]],['斜め上から眺める',[-13,-22,15.9],[0,-1,3.2]]]){
   const b=document.createElement('button');b.className='spot-card';b.textContent=title+' ↗';
   b.onclick=async()=>{if(!started){started=true;await selectView('exterior');}if(!ready||key!=='exterior')return;const target=vec(t),offset=vec(p).sub(target).multiplyScalar(1/Math.min(camera.aspect,1.5));camera.position.copy(target).add(offset);orbit.target.copy(target);orbit.update();invalidate();document.querySelector('.viewer').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'center'});};$('spot-list').append(b);
  }
  const b=document.createElement('button');b.className='spot-card';b.textContent='入口から、中へどうぞ →';b.onclick=()=>{started=true;selectView('entry');};$('spot-list').append(b);return;
 }
 for(const spot of (key==='overview'?spots:local)){
  const b=document.createElement('button');b.className='spot-card';b.dataset.spot=spot.id;
  const number=document.createElement('span');number.className='spot-number';number.textContent=seen.has(spot.id)?'✓':String(spots.indexOf(spot)+1).padStart(2,'0');
  const label=document.createElement('span');label.textContent=spot.title;
  const arrow=document.createElement('span');arrow.textContent='↗';b.append(number,label,arrow);
  b.addEventListener('click',async()=>{if(key!==spot.view)await selectView(spot.view);if(ready&&key===spot.view)focusSpot(spot);});$('spot-list').append(b);
 }
 if(key==='entry'){
  const b=document.createElement('button');b.className='spot-card';b.id='entry-shelf-view';b.textContent='壁沿いの棚と机を見る ↗';
  b.onclick=()=>{if(!ready)return;focused=null;beforeFocus=null;$('focus-card').hidden=true;camera.position.copy(vec([.60,-1.88,1.65]));const d=vec([-2.52,-2.24,.62]).sub(camera.position).normalize();animateLook({yaw:Math.atan2(d.x,-d.z),pitch:Math.asin(d.y),fov:68});document.querySelector('.viewer').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'center'});};$('spot-list').append(b);
 }
 if(key==='counter'){
  const b=document.createElement('button');b.className='spot-card';b.id='counter-aisle-view';b.textContent='カウンター前の通路を見る ↗';
  b.onclick=()=>{if(!ready)return;focused=null;beforeFocus=null;$('focus-card').hidden=true;camera.position.copy(vec([.60,-.18,1.62]));const d=vec([-2.60,-.18,.62]).sub(camera.position).normalize();animateLook({yaw:Math.atan2(d.x,-d.z),pitch:Math.asin(d.y),fov:68});document.querySelector('.viewer').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'center'});};$('spot-list').append(b);
 }
}
function refreshUI(){
 const v=views[key],n=route.indexOf(key);
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));
 $('view-name').textContent=v.label;$('scene-note').textContent=v.note;
 $('gesture').textContent=orbitView()?'1本指で回転・2本指で移動と拡大':'指で見回す・＋の印で近くへ';
 $('route-position').textContent=`${n+1} / ${route.length}`;
 $('route-prev').disabled=n===0;$('route-next').disabled=n===route.length-1;
 $('route-prev').textContent=n>0?'← '+views[route[n-1]].label:'← 前の場所';
 $('route-next').textContent=n<route.length-1?(key==='exterior'?'入口から中へ →':views[route[n+1]].label+' →'):'ひとめぐりしました';
 discoveries();renderPins();
}
function resize(){
 if(!renderer)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);invalidate();
}
function showError(message){$('loading').hidden=true;$('error').hidden=false;$('error-detail').textContent=message;}
function optimizeExterior(root){
 // Merge static geometry by material; keep the saved source model untouched.
 root.updateMatrixWorld(true);const groups=new Map(),result=new THREE.Group();
 root.traverse(o=>{
  if(!o.isMesh)return;
  const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
  if(Array.isArray(o.material)){result.add(new THREE.Mesh(g,o.material));return;}
  const signature=o.material.uuid+'|'+Object.keys(g.attributes).sort().join(',')+'|'+Boolean(g.index);
  const group=groups.get(signature)||{material:o.material,geometries:[]};group.geometries.push(g);groups.set(signature,group);
 });
 for(const {material,geometries} of groups.values()){
  const geometry=mergeGeometries(geometries,false);
  if(!geometry)throw new Error('Exterior geometry merge failed');
  result.add(new THREE.Mesh(geometry,material));geometries.forEach(g=>g.dispose());
 }
 const originals=new Set();root.traverse(o=>{if(o.isMesh)originals.add(o.geometry);});originals.forEach(g=>g.dispose());
 return result;
}
async function loadModel(kind){
 if(models[kind])return models[kind];if(pending[kind])return pending[kind];
 pending[kind]=(async()=>{
  const gltf=await new GLTFLoader().loadAsync(kind==='exterior'?'./exterior.glb?v=20260925-bear':'./yamanoie-illustrated.glb?v=20260925-watercolor',e=>{if(kind===modelKind())$('progress').textContent=e.total?Math.round(e.loaded/e.total*100)+'%':'データを読み込み中';});
  const root=kind==='exterior'?optimizeExterior(gltf.scene):gltf.scene;
  const roof=[];root.traverse(o=>{
   if(o.isMesh){o.castShadow=kind==='exterior';o.receiveShadow=kind==='exterior';}
   if(o.userData.web_layer==='roof')roof.push(o);
   if(o.isMesh)for(const m of (Array.isArray(o.material)?o.material:[o.material])){
    m.side=THREE.DoubleSide;
    if(/glass/i.test(m.name)){m.transmission=0;m.color.set('#c4d1ca');m.roughness=.8;m.metalness=0;m.emissive.set('#68766f');m.emissiveIntensity=.12;}
    if(m.map)m.map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);m.needsUpdate=true;
   }
  });
  root.visible=false;scene.add(root);models[kind]={root,roof};return models[kind];
 })();
 try{return await pending[kind];}finally{delete pending[kind];}
}
function initialize(){
 if(renderer)return;
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);
 scene=new THREE.Scene();scene.background=new THREE.Color('#dfe5df');camera=new THREE.PerspectiveCamera(70,1,.035,240);
 const hemisphere=new THREE.HemisphereLight(0xf2f2e8,0x656050,1.9);scene.add(hemisphere);
 const sun=new THREE.DirectionalLight(0xffe8ca,1.3);sun.position.set(-10,18,8);scene.add(sun);
 sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:65});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;
 const fill=new THREE.DirectionalLight(0xcce5ff,.8);fill.position.set(6,4,-2);scene.add(fill);
 const entryFill=new THREE.PointLight(0xe6ebdf,10,4,2);entryFill.position.copy(vec([4.82,-4.72,1.7]));scene.add(entryFill);
 daylight={hemisphere,sun,fill,entryFill};
 interiorLights=new THREE.Group();scene.add(interiorLights);
 for(const p of [[-2.55,-.4,3.36],[.6,1.35,3.3],[3.65,.1,3.15],[-6.2,-1.2,2.11],[-9.6,-1.25,2.1]]){
  const l=new THREE.PointLight(0xffe7c1,14,9,2);l.position.copy(vec(p));interiorLights.add(l);
 }
 orbit=new OrbitControls(camera,renderer.domElement);orbit.enabled=false;orbit.enableDamping=false;orbit.rotateSpeed=.65;orbit.zoomSpeed=.75;orbit.addEventListener('change',invalidate);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;showError('3Dの表示が中断されました。もう一度開くとページを読み直します。');host.dataset.contextLost='true';});
 new ResizeObserver(resize).observe(host);bindGestures();resize();
 renderer.setAnimationLoop(time=>{
  if(document.hidden)return;
  if(transition){
   const u=clamp((time-transition.start)/transition.duration,0,1),t=u*u*(3-2*u);
   yaw=THREE.MathUtils.lerp(transition.from.yaw,transition.to.yaw,t);pitch=THREE.MathUtils.lerp(transition.from.pitch,transition.to.pitch,t);fov=THREE.MathUtils.lerp(transition.from.fov,transition.to.fov,t);look();if(u===1)transition=null;
  }
  if(dirty){renderer.render(scene,camera);updatePins();dirty=false;}
 });
}
async function selectView(next,updateHash=true){
 const version=++requestVersion;key=views[next]?next:'exterior';transition=null;points.clear();focused=null;beforeFocus=null;$('focus-card').hidden=true;
 if($('photo-dialog').open)$('photo-dialog').close();
 refreshUI();if(updateHash)history.replaceState(null,'','#'+key);
 if(!started)return;
 ready=false;if(orbit)orbit.enabled=false;$('error').hidden=true;$('welcome').hidden=true;$('loading').hidden=false;$('hotspots').hidden=true;
 try{
  initialize();const kind=modelKind(),data=await loadModel(kind);if(version!==requestVersion)return;
  for(const [k,m] of Object.entries(models))m.root.visible=k===kind;
  data.roof.forEach(o=>o.visible=key!=='overview');interiorLights.visible=kind==='interior';orbit.enabled=orbitView();
  daylight.hemisphere.intensity=kind==='exterior'?1.2:1.9;daylight.sun.intensity=kind==='exterior'?2.2:1.3;daylight.fill.intensity=kind==='exterior'?.4:.8;daylight.sun.castShadow=kind==='exterior';
  daylight.entryFill.visible=kind==='exterior';
  daylight.sun.position.set(...(kind==='exterior'?[-10,18,8]:[-2,7,5]));
  if(orbit.enabled){
   camera.fov=45;orbit.target.copy(vec(key==='exterior'?[0,-.5,3.4]:[-3,0,.5]));
   const radius=key==='exterior'?10.5:11;
   const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))/Math.min(camera.aspect,1.6)*1.08;
   camera.position.copy(orbit.target).add((key==='exterior'?new THREE.Vector3(-.52,.40,1):new THREE.Vector3(-.25,.94,1)).normalize().multiplyScalar(distance));
   orbit.minDistance=key==='exterior'?.8:5;orbit.maxDistance=110;orbit.minPolarAngle=.08;orbit.maxPolarAngle=key==='exterior'?Math.PI*.80:Math.PI*.46;orbit.enablePan=true;orbit.update();
  }else{
   const v=views[key];camera.position.copy(vec(v.p));const d=vec(v.t).sub(camera.position).normalize();yaw=Math.atan2(d.x,-d.z);pitch=Math.asin(d.y);fov=camera.aspect<1?76:68;look();
  }
  camera.updateProjectionMatrix();ready=true;$('loading').hidden=true;$('hotspots').hidden=false;
  host.dataset.loaded='true';host.dataset.activeView=key;host.dataset.model=kind;resize();announce(views[key].label+'を表示しています');
 }catch(e){if(version!==requestVersion)return;console.error('3D load failed',e);showError('読み込みに失敗しました。通信を確認して「もう一度開く」を押してください。');}
}
async function start(){started=true;await selectView(key,false);}
function animateLook(to){
 let dy=to.yaw-yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));to={...to,yaw:yaw+dy};
 if(reducedMotion.matches){({yaw,pitch,fov}=to);look();}else transition={from:{yaw,pitch,fov},to,start:performance.now(),duration:600};invalidate();
}
function focusSpot(spot){
 if(!ready||key!==spot.view)return;
 if(!beforeFocus)beforeFocus={yaw,pitch,fov};focused=spot;seen.add(spot.id);discoveries();
 const d=vec(spot.target).sub(camera.position).normalize();animateLook({yaw:Math.atan2(d.x,-d.z),pitch:Math.asin(d.y),fov:32});
 $('focus-title').textContent=spot.title;$('focus-card').hidden=false;announce(spot.title+'に寄りました。イラストでも見られます');
 document.querySelector('.viewer').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'center'});
}
function leaveFocus(){
 const back=beforeFocus;focused=null;beforeFocus=null;$('focus-card').hidden=true;if(back)animateLook(back);invalidate();
}
function zoom(delta){
 if(!ready)return;transition=null;
 if(orbitView()){
  const off=camera.position.clone().sub(orbit.target),r=clamp(off.length()*Math.exp(delta*.025),orbit.minDistance,orbit.maxDistance);camera.position.copy(orbit.target).add(off.setLength(r));orbit.update();invalidate();
 }else{fov=clamp(fov+delta,18,100);look();}
}
function bindGestures(){
 const canvas=renderer.domElement;
 canvas.addEventListener('pointerdown',e=>{
  if(!ready||orbitView())return;transition=null;canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(points.size===2){const[a,b]=[...points.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}
 });
 canvas.addEventListener('pointermove',e=>{
  if(!ready||orbitView()||!points.has(e.pointerId))return;
  const prev=points.get(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(points.size===1){yaw-=(e.clientX-prev.x)*.004*fov/70;pitch+=(e.clientY-prev.y)*.004*fov/70;look();}
  else if(points.size===2){const[a,b]=[...points.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance>0){fov=clamp(fov*pinchDistance/Math.max(d,1),18,100);look();}pinchDistance=d;}
 });
 const release=e=>{points.delete(e.pointerId);pinchDistance=0;};for(const n of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(n,release);
 canvas.addEventListener('wheel',e=>{if(!orbitView()&&ready){e.preventDefault();zoom(e.deltaY*.035);}},{passive:false});
 host.addEventListener('keydown',e=>{
  if(!ready||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home'].includes(e.key))return;e.preventDefault();transition=null;
  if(e.key==='Home'){selectView(key);return;}if(e.key==='+'||e.key==='='){zoom(-5);return;}if(e.key==='-'){zoom(5);return;}
  if(orbitView()){
   const s=new THREE.Spherical().setFromVector3(camera.position.clone().sub(orbit.target));s.theta+=e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0;s.phi=clamp(s.phi+(e.key==='ArrowUp'?-.08:e.key==='ArrowDown'?.08:0),orbit.minPolarAngle,orbit.maxPolarAngle);camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(s));orbit.update();invalidate();
  }else{yaw+=e.key==='ArrowLeft'?-.1:e.key==='ArrowRight'?.1:0;pitch+=e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0;look();}
 });
}

// Photo viewer: bounded pan and zoom; the 3D camera is preserved while open.
const frame=$('photo-frame'),photo=$('photo-image'),photoPoints=new Map();
let photoScale=1,photoX=0,photoY=0,photoPinch=0,photoSpot=null,photoToken=0;
function photoDimensions(){
 const ratio=photo.naturalWidth/photo.naturalHeight;if(!Number.isFinite(ratio))return {w:frame.clientWidth,h:frame.clientHeight};
 const w=Math.min(frame.clientWidth,frame.clientHeight*ratio);return {w,h:w/ratio};
}
function drawPhoto(){
 const {w,h}=photoDimensions();photoScale=clamp(photoScale,1,5);
 photoX=clamp(photoX,-Math.max(0,(w*photoScale-frame.clientWidth)/2),Math.max(0,(w*photoScale-frame.clientWidth)/2));
 photoY=clamp(photoY,-Math.max(0,(h*photoScale-frame.clientHeight)/2),Math.max(0,(h*photoScale-frame.clientHeight)/2));
 photo.style.width=w+'px';photo.style.height=h+'px';photo.style.transform=`translate(-50%,-50%) translate(${photoX}px,${photoY}px) scale(${photoScale})`;
 $('photo-scale').textContent=Math.round(photoScale*100)+'%';$('photo-out').disabled=photoScale<=1;$('photo-in').disabled=photoScale>=5;
}
function fitPhoto(){photoScale=1;photoX=photoY=0;drawPhoto();}
function detailPhoto(){if(!photoSpot)return;const[x,y,s]=photoSpot.focus,{w,h}=photoDimensions();photoScale=s;photoX=(.5-x)*w*s;photoY=(.5-y)*h*s;drawPhoto();}
function zoomPhoto(multiplier){const previous=photoScale;photoScale=clamp(photoScale*multiplier,1,5);photoX*=photoScale/previous;photoY*=photoScale/previous;drawPhoto();}
async function openPhoto(){
 if(!focused)return;transition=null;const version=++photoToken;photoSpot=focused;
 if(document.fullscreenElement)await document.exitFullscreen();
 $('photo-title').textContent=photoSpot.title;$('photo-caption').textContent=photoSpot.text;$('photo-error').hidden=true;
 photo.hidden=true;photo.alt=photos[photoSpot.photo].alt;photo.src=photos[photoSpot.photo].src;
 $('photo-dialog').showModal();
 try{await photo.decode();if(version!==photoToken||!$('photo-dialog').open)return;photo.hidden=false;detailPhoto();}catch{$('photo-error').hidden=false;}
}
photo.addEventListener('dragstart',e=>e.preventDefault());
frame.addEventListener('pointerdown',e=>{frame.setPointerCapture(e.pointerId);photoPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(photoPoints.size===2){const[a,b]=[...photoPoints.values()];photoPinch=Math.hypot(a.x-b.x,a.y-b.y);}});
frame.addEventListener('pointermove',e=>{
 if(!photoPoints.has(e.pointerId))return;const prev=photoPoints.get(e.pointerId);photoPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(photoPoints.size===1){photoX+=e.clientX-prev.x;photoY+=e.clientY-prev.y;drawPhoto();}
 else if(photoPoints.size===2){const[a,b]=[...photoPoints.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(photoPinch>0)zoomPhoto(distance/photoPinch);photoPinch=distance;}
});
for(const n of ['pointerup','pointercancel','lostpointercapture'])frame.addEventListener(n,e=>{photoPoints.delete(e.pointerId);photoPinch=0;});
frame.addEventListener('wheel',e=>{e.preventDefault();zoomPhoto(Math.exp(-e.deltaY*.001));},{passive:false});
frame.addEventListener('keydown',e=>{
 if(!['+','=','-','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
 if(e.key==='Home')fitPhoto();else if(e.key==='+'||e.key==='=')zoomPhoto(1.25);else if(e.key==='-')zoomPhoto(.8);
 else{photoX+=e.key==='ArrowLeft'?30:e.key==='ArrowRight'?-30:0;photoY+=e.key==='ArrowUp'?30:e.key==='ArrowDown'?-30:0;drawPhoto();}
});
new ResizeObserver(()=>{if($('photo-dialog').open)drawPhoto();}).observe(frame);
$('photo-dialog').addEventListener('close',()=>{photoToken++;photoPoints.clear();photoPinch=0;invalidate();$('photo-open').focus();});
for(const id of ['photo-close','photo-return'])$(id).addEventListener('click',()=>$('photo-dialog').close());
$('photo-in').onclick=()=>zoomPhoto(1.25);$('photo-out').onclick=()=>zoomPhoto(.8);$('photo-fit').onclick=fitPhoto;$('photo-detail').onclick=detailPhoto;
$('photo-open').onclick=openPhoto;$('focus-close').onclick=leaveFocus;
$('start').onclick=start;$('retry').onclick=()=>host.dataset.contextLost?location.reload():start();
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{started=true;selectView(b.dataset.view);}));
$('reset').onclick=()=>selectView(key);$('zoom-in').onclick=()=>zoom(-6);$('zoom-out').onclick=()=>zoom(6);
for(const[id,direction]of [['route-prev',-1],['route-next',1]])$(id).onclick=()=>{const next=route[route.indexOf(key)+direction];if(next){started=true;selectView(next);}};
$('help-open').onclick=()=>$('help').showModal();$('help-close').onclick=()=>$('help').close();
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.viewer').requestFullscreen();}catch{announce('画面を横にすると広く見られます');}};
$('share').onclick=async()=>{
 const data={title:'奥槍戸 山の家さんぽ — '+views[key].label,url:location.href};
 try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);$('share').textContent='リンクをコピーしました';setTimeout(()=>{$('share').textContent='この景色を共有 ↗';},2500);}}catch(e){if(e.name!=='AbortError')announce('アドレス欄のURLをコピーして共有してください。');}
};
window.addEventListener('hashchange',()=>selectView(location.hash.slice(1),false));
document.addEventListener('visibilitychange',invalidate);refreshUI();
