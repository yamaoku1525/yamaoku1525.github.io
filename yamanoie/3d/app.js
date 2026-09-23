import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';

const $=id=>document.getElementById(id),host=$('canvas-host');
const vec=([x,y,z])=>new THREE.Vector3(x,z,-y);
const views={
 entry:{label:'入口と三角窓',p:[.45,1.15,1.61],t:[1.8,-2.8,2.0],note:'三角窓のある入口から、山の家の空気を感じてみる。'},
 blue:{label:'青い椅子の奥',p:[1.2,-1.1,1.58],t:[5,.18,1.35],note:'青い椅子の後ろにも、窓とベンチのある空間が続きます。'},
 counter:{label:'カウンター',p:[.35,-2.1,1.65],t:[-1.55,1.4,1.8],note:'客席からカウンターを眺める。厨房は見える範囲を再現しています。'},
 dining:{label:'窓側の机席',p:[-7.2,-1.31,1.56],t:[-3.6,-1.35,1.75],note:'低い天井の机席から、主客席へとつながる眺め。'},
 tatami:{label:'畳の部屋',p:[-7.20,-1.50,1.62],t:[-10,.20,1.35],note:'一段上がった畳の部屋。窓と座卓、低い梁が見えます。'},
 overview:{label:'全体を見る',note:'屋根を外した表示で、部屋のつながりを見られます。実測の間取り図ではありません。'}
};
let key=views[location.hash.slice(1)]?location.hash.slice(1):'entry';
let renderer,scene,camera,orbit,model,roof,ready=false,loading=false,yaw=0,pitch=0,fov=70,dirty=true;
let overviewRadius=11,points=new Map(),pinchDistance=0,dragging=false;
const announce=t=>{$('announcement').textContent=t;};
const invalidate=()=>{dirty=true;};
function selectView(next,updateHash=true){
 key=views[next]?next:'entry'; const v=views[key];
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));
 $('view-name').textContent=v.label;$('scene-note').textContent=v.note;
 $('gesture').textContent=key==='overview'?'1本指で回転・2本指で移動と拡大':'指で見回す・2本指で拡大';
 if(updateHash)history.replaceState(null,'','#'+key);
 if(!ready)return;
 points.clear();roof.forEach(o=>o.visible=key!=='overview');
 orbit.enabled=key==='overview';
 if(orbit.enabled){
   camera.fov=45;orbit.target.copy(vec([-3,.0,.5]));
   const distance=overviewRadius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))/Math.min(camera.aspect,1)*1.12;
   camera.position.copy(orbit.target).add(new THREE.Vector3(-.25,.94,1).normalize().multiplyScalar(distance));
   orbit.minDistance=7;orbit.maxDistance=65;orbit.minPolarAngle=.08;orbit.maxPolarAngle=Math.PI*.46;
   orbit.enablePan=true;orbit.update();
 }else{
   camera.position.copy(vec(v.p));const d=vec(v.t).sub(camera.position).normalize();
   yaw=Math.atan2(d.x,-d.z);pitch=Math.asin(d.y);fov=camera.aspect<1?76:68;look();
 }
 camera.updateProjectionMatrix();invalidate();announce(v.label+'を表示しています');
}
function look(){
 pitch=THREE.MathUtils.clamp(pitch,-1.20,1.20);camera.fov=fov;
 const direction=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
 camera.lookAt(camera.position.clone().add(direction));camera.updateProjectionMatrix();invalidate();
}
function resize(){if(!renderer)return;const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);invalidate();}
function showError(message){$('loading').hidden=true;$('error').hidden=false;$('error-detail').textContent=message;loading=false;}
async function start(){
 if(loading||ready)return;loading=true;$('error').hidden=true;$('welcome').hidden=true;$('loading').hidden=false;
 try{
   if(!renderer){
     renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
     renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;
     renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
     host.appendChild(renderer.domElement);scene=new THREE.Scene();scene.background=new THREE.Color('#dfe5df');
     camera=new THREE.PerspectiveCamera(70,1,.035,160);
     scene.add(new THREE.HemisphereLight(0xf2f2e8,0x656050,1.9));
     const sun=new THREE.DirectionalLight(0xffe8ca,1.3);sun.position.set(-2,7,5);scene.add(sun);
     const fill=new THREE.DirectionalLight(0xcce5ff,.8);fill.position.set(6,4,-2);scene.add(fill);
     for(const p of [[-2.55,-.4,3.36],[.6,1.35,3.3],[3.65,.1,3.15],[-6.2,-1.2,2.11],[-9.6,-1.25,2.1]]){
       const l=new THREE.PointLight(0xffe7c1,14,9,2);l.position.copy(vec(p));scene.add(l);
     }
     orbit=new OrbitControls(camera,renderer.domElement);orbit.enabled=false;orbit.enableDamping=false;orbit.rotateSpeed=.65;orbit.zoomSpeed=.75;orbit.addEventListener('change',invalidate);
     renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;showError('3Dの表示が中断されました。ページを再読み込みしてください。');});
     new ResizeObserver(resize).observe(host);bindGestures();resize();
     renderer.setAnimationLoop(()=>{if(dirty&&!document.hidden){renderer.render(scene,camera);dirty=false;}});
   }
   const gltf=await new GLTFLoader().loadAsync('./yamanoie.glb',e=>{$('progress').textContent=e.total?Math.round(e.loaded/e.total*100)+'%':'データを読み込み中';});
   model=gltf.scene;roof=[];
   model.traverse(o=>{
     if(o.userData.web_layer==='roof')roof.push(o);
     if(o.isMesh){
       const mats=Array.isArray(o.material)?o.material:[o.material];
       for(const m of mats){
         m.side=THREE.DoubleSide;
         // A neutral outdoor backing avoids costly screen-space transmission on phones.
         if(m.name.includes('glass')||m.name.includes('Glass')){m.transmission=0;m.color.set('#c4d1ca');m.roughness=.8;m.metalness=0;m.emissive.set('#68766f');m.emissiveIntensity=.12;}
         if(m.map)m.map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
         m.needsUpdate=true;
       }
     }
   });
   scene.add(model);ready=true;loading=false;$('loading').hidden=true;selectView(key,false);resize();
   host.dataset.loaded='true';host.dataset.meshes=String(gltf.parser.json.meshes.length);
 }catch(e){console.error('3D load failed',e);showError('読み込みに失敗しました。通信を確認して「もう一度開く」を押してください。表示されない場合はSafariやChromeの最新版でお試しください。');}
}
function zoom(delta){
 if(!ready)return;
 if(key==='overview'){const offset=camera.position.clone().sub(orbit.target);const r=THREE.MathUtils.clamp(offset.length()*Math.exp(delta*.025),7,65);camera.position.copy(orbit.target).add(offset.setLength(r));orbit.update();invalidate();}
 else{fov=THREE.MathUtils.clamp(fov+delta,35,100);look();}
}
function bindGestures(){
 const canvas=renderer.domElement;
 canvas.addEventListener('pointerdown',e=>{
   if(!ready||key==='overview')return;canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});dragging=true;
   if(points.size===2){const [a,b]=[...points.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}
 });
 canvas.addEventListener('pointermove',e=>{
   if(!ready||key==='overview'||!points.has(e.pointerId))return;
   const prev=points.get(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(points.size===1){yaw-=(e.clientX-prev.x)*.004;pitch+=(e.clientY-prev.y)*.004;look();}
   else if(points.size===2){const [a,b]=[...points.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance>0){fov=THREE.MathUtils.clamp(fov*pinchDistance/Math.max(d,1),35,100);look();}pinchDistance=d;}
 });
 const release=e=>{points.delete(e.pointerId);pinchDistance=0;dragging=points.size>0;};
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release);
 canvas.addEventListener('wheel',e=>{if(key!=='overview'&&ready){e.preventDefault();zoom(e.deltaY*.035);}},{passive:false});
 host.addEventListener('keydown',e=>{
   if(!ready)return;
   if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home'].includes(e.key))e.preventDefault();else return;
   if(e.key==='Home'){selectView(key);return;}if(e.key==='+'||e.key==='='){zoom(-5);return;}if(e.key==='-'){zoom(5);return;}
   if(key==='overview'){
     const off=camera.position.clone().sub(orbit.target);const s=new THREE.Spherical().setFromVector3(off);
     s.theta+=e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0;s.phi=THREE.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-.08:e.key==='ArrowDown'?.08:0),.08,Math.PI*.46);
     camera.position.copy(orbit.target).add(new THREE.Vector3().setFromSpherical(s));orbit.update();invalidate();
   }else{yaw+=e.key==='ArrowLeft'?-.1:e.key==='ArrowRight'?.1:0;pitch+=e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0;look();}
 });
}
$('start').addEventListener('click',start);$('retry').addEventListener('click',()=>renderer&&!ready&&host.dataset.loaded?location.reload():start());
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{selectView(b.dataset.view);if(!ready&&!loading)start();}));
$('reset').addEventListener('click',()=>selectView(key));$('zoom-in').addEventListener('click',()=>zoom(-6));$('zoom-out').addEventListener('click',()=>zoom(6));
$('help-open').addEventListener('click',()=>$('help').showModal());$('help-close').addEventListener('click',()=>$('help').close());
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.viewer').requestFullscreen();}catch{announce('このブラウザでは全画面表示を利用できません。画面を横にすると広く見られます。');$('gesture').textContent='画面を横にすると広く見られます';}});
$('share').addEventListener('click',async()=>{
 const data={title:'奥槍戸 山の家 3D — '+views[key].label,url:location.href};
 try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);$('share').textContent='リンクをコピーしました';setTimeout(()=>{$('share').textContent='この景色を共有 ↗';},2500);}}catch(e){if(e.name!=='AbortError')announce('アドレス欄のURLをコピーして共有してください。');}
});
window.addEventListener('hashchange',()=>selectView(location.hash.slice(1),false));
document.addEventListener('visibilitychange',invalidate);selectView(key,false);
