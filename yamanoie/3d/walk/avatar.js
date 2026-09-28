import * as THREE from 'three';
import {FootPlanner,solveLeg} from './gait.mjs?v=7ac40a17a3a5';
const V=(p)=>new THREE.Vector3(p.x,p.y,p.z),UP=new THREE.Vector3(0,1,0),X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
const deltaAngle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export class Nagika {
  constructor(root,world){
    this.root=root;this.world=world;this.heading=Math.PI;this.time=0;this.amount=0;this.phase=0;this.root.userData.isAvatar=true;this.bones={};this.rest={};this.meshes=[];this.height=0;this.error=0;
    this.scale=.9;root.scale.setScalar(this.scale);root.updateMatrixWorld(true);
    root.traverse(o=>{if(o.isBone){this.bones[o.name]=o;this.rest[o.name]={position:o.position.clone(),quaternion:o.quaternion.clone(),world:o.getWorldQuaternion(new THREE.Quaternion())};}if(o.isSkinnedMesh)this.meshes.push(o);});
    for(const name of ['hips','chest','head','leftUpperLeg','leftLowerLeg','leftFoot','rightUpperLeg','rightLowerLeg','rightFoot'])if(!this.bones[name])throw new Error('なぎかの骨格がありません: '+name);
    this.lengths={};for(const side of ['left','right']){const a=this.bones[side+'UpperLeg'].getWorldPosition(new THREE.Vector3()),b=this.bones[side+'LowerLeg'].getWorldPosition(new THREE.Vector3()),c=this.bones[side+'Foot'].getWorldPosition(new THREE.Vector3());this.lengths[side]=[a.distanceTo(b),b.distanceTo(c)];}
    this.planner=new FootPlanner((x,z)=>world.floor(x,z)?.height??this.height,(x,z)=>!!world.floor(x,z),this.scale);
    const gradient=new THREE.DataTexture(new Uint8Array([100,180,235,255]),4,1,THREE.RedFormat);gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;this.gradient=gradient;
    const cache=new Map();root.traverse(o=>{if(!o.isMesh)return;o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;const convert=m=>{if(!cache.has(m)){const common={color:0xffffff,vertexColors:true,side:THREE.DoubleSide};const mat=m.name==='Ink'?new THREE.MeshBasicMaterial(common):new THREE.MeshToonMaterial({...common,gradientMap:gradient});mat.name=m.name;cache.set(m,mat);}return cache.get(m);};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);});this.materials=[...cache.values()];for(const old of cache.keys())old.dispose();
    // Preserve the illustration palette under the very bright room lights.
    // Soft cel shading and a fine brown edge keep the face readable in profile.
    for(const material of this.materials){
      material.toneMapped=false;
      if(material.name==='Ink')continue;
      material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        float nagikaLight=dot(normalize(normal),normalize(vec3(-0.35,0.65,0.68)));
        float nagikaShade=mix(0.70,1.0,smoothstep(-0.25,0.55,nagikaLight));
        float nagikaRim=1.0-abs(dot(normalize(normal),normalize(vViewPosition)));
        outgoingLight=diffuseColor.rgb*nagikaShade;
        outgoingLight=mix(outgoingLight,vec3(0.043,0.018,0.007),smoothstep(0.82,0.98,nagikaRim)*0.65);
        #include <opaque_fragment>
      `);};
      material.customProgramCacheKey=()=> 'nagika-soft-cel-v2';
    }
    const shadowPixels=new Uint8Array(64*64*4);
    for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);shadowPixels[i]=shadowPixels[i+1]=shadowPixels[i+2]=255;shadowPixels[i+3]=Math.round(255*Math.pow(Math.max(0,1-r*r),2));}
    this.shadowMap=new THREE.DataTexture(shadowPixels,64,64,THREE.RGBAFormat);this.shadowMap.minFilter=this.shadowMap.magFilter=THREE.LinearFilter;this.shadowMap.needsUpdate=true;
    const makeShadow=(w,h,opacity)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:this.shadowMap,color:0x392e22,transparent:true,opacity,depthWrite:false,toneMapped:false}));m.rotation.x=-Math.PI/2;m.renderOrder=2;return m;};
    this.shadow=new THREE.Group();this.shadow.add(makeShadow(.70,.50,.18));this.footShadows=[makeShadow(.19,.32,.28),makeShadow(.19,.32,.28)];this.shadow.add(...this.footShadows);
  }
  reset(position,yaw){this.heading=Math.PI-yaw;this.root.position.set(position.x,position.floor,position.z);this.root.rotation.set(0,this.heading,0);this.root.updateMatrixWorld(true);this.height=position.floor;this.planner.reset(position,this.heading);this.previous={...position};this.amount=0;this.phase=0;this.update(position,1/60);}
  rotateWorld(boneName,q){const bone=this.bones[boneName];const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();bone.quaternion.copy(parent.multiply(q));bone.updateMatrixWorld(true);}
  direction(boneName,childName,target){const bone=this.bones[boneName],child=this.bones[childName],p=bone.getWorldPosition(new THREE.Vector3()),v=child.getWorldPosition(new THREE.Vector3()).sub(p).normalize(),desired=target.clone().sub(p).normalize(),q=bone.getWorldQuaternion(new THREE.Quaternion());const d=new THREE.Quaternion().setFromUnitVectors(v,desired);this.rotateWorld(boneName,d.multiply(q));}
  update(position,dt,standingHeading){
    this.time+=dt;const dx=position.x-this.previous.x,dz=position.z-this.previous.z,d=Math.hypot(dx,dz),speed=d/Math.max(dt,.00001);this.previous={...position};
    if(d>.00001){const target=Math.atan2(dx,dz);this.heading+=THREE.MathUtils.clamp(deltaAngle(target,this.heading),-7*dt,7*dt);}
    else if(standingHeading!==undefined)this.heading+=THREE.MathUtils.clamp(deltaAngle(standingHeading,this.heading),-7*dt,7*dt);
    this.amount+=(Math.min(1,speed/.58)-this.amount)*(1-Math.exp(-10*dt));this.phase+=d/.57*Math.PI*2;
    this.height+=(position.floor-this.height)*(1-Math.exp(-18*dt));
    this.root.position.set(position.x,this.height,position.z);this.root.rotation.set(0,this.heading,0);
    for(const [name,b]of Object.entries(this.bones)){b.position.copy(this.rest[name].position);b.quaternion.copy(this.rest[name].quaternion);}
    const feet=this.planner.update(position,this.heading,dt);
    const spread=Math.max(...feet.map(f=>Math.hypot(f.ankle.x-position.x,f.ankle.z-position.z)));
    // Lower the pelvis to keep both short legs inside their reachable envelope.
    const passing=Math.max(...feet.map(f=>f.swing?Math.sin(Math.PI*f.swing.t):0));
    let hipY=(.55-.023*this.amount+.002*passing*this.amount)*this.scale;
    for(const f of feet){const side=f.side===1?'left':'right';const h=this.planner.neutral(position,this.heading,f.side);const horizontal=Math.hypot(f.ankle.x-h.x,f.ankle.z-h.z);const reach=this.lengths[side][0]+this.lengths[side][1]-.010;const available=Math.sqrt(Math.max(.01,reach*reach-horizontal*horizontal));hipY=Math.min(hipY,f.ankle.y-this.height+available);}
    this.bones.hips.position.y=hipY/this.scale+.002*Math.sin(this.time*2.1)*(1-this.amount);
    const leftFoot=feet.find(f=>f.side===1),rightFoot=feet.find(f=>f.side===-1);
    const advance=f=>(f.base.x-position.x)*Math.sin(this.heading)+(f.base.z-position.z)*Math.cos(this.heading);
    const stride=THREE.MathUtils.clamp((advance(leftFoot)-advance(rightFoot))/.30,-1,1);
    this.stride=(this.stride??0)+(stride-(this.stride??0))*(1-Math.exp(-16*dt));
    const supportWeight=THREE.MathUtils.clamp((rightFoot.lift-leftFoot.lift)/.048,-1,1);
    this.weightShift=(this.weightShift??0)+(supportWeight-(this.weightShift??0))*(1-Math.exp(-14*dt));
    this.sway=(this.sway??0)+(this.stride-(this.sway??0))*(1-Math.exp(-7*dt));
    this.bones.hips.position.x+=.008*this.weightShift*this.amount;
    this.bones.chest.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(UP,.025*this.stride*this.amount));
    this.bones.head.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X,-.018*this.amount+.009*Math.sin(this.time*2.1)));
    this.root.updateMatrixWorld(true);const yawQ=new THREE.Quaternion().setFromAxisAngle(UP,this.heading);
    for(const side of ['left','right']){
      const sign=side==='left'?1:-1,swing=sign*this.stride*.30*this.amount;
      const armQ=yawQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(X,swing)).multiply(new THREE.Quaternion().setFromAxisAngle(Z,-sign*.31)).multiply(this.rest[side+'UpperArm'].world);
      this.rotateWorld(side+'UpperArm',armQ);
      this.bones[side+'LowerArm'].quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X,-.12-.07*this.amount));
      this.bones[side+'HairRoot'].quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X,this.sway*.055*this.amount));
    }
    this.bones.backpack.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X,Math.sin(this.phase*2-.4)*.015*this.amount));
    this.bones.flower.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X,Math.sin(this.phase-.8)*.10*this.amount));
    this.root.updateMatrixWorld(true);this.error=0;let kneeAdvance=0;
    for(const f of feet){
      const side=f.side===1?'left':'right',upper=side+'UpperLeg',lower=side+'LowerLeg',foot=side+'Foot';
      const hip=this.bones[upper].getWorldPosition(new THREE.Vector3()),[a,b]=this.lengths[side];
      const solution=solveLeg(hip,f.ankle,a,b,{x:Math.sin(this.heading),y:0,z:Math.cos(this.heading)});this.error=Math.max(this.error,solution.reachError);
      kneeAdvance=Math.max(kneeAdvance,(solution.knee.x-hip.x)*Math.sin(this.heading)+(solution.knee.z-hip.z)*Math.cos(this.heading));
      this.direction(upper,lower,V(solution.knee));this.direction(lower,foot,V(solution.ankle));
      const footQ=new THREE.Quaternion().setFromAxisAngle(UP,f.renderHeading).multiply(new THREE.Quaternion().setFromAxisAngle(X,f.roll)).multiply(this.rest[foot].world);this.rotateWorld(foot,footQ);
    }
    // A bent thigh still needs clearance after the foot lands. Use the actual
    // solved knee, and settle slowly only when that clearance is no longer needed.
    const apronTarget=-.12-.40*THREE.MathUtils.clamp((kneeAdvance-.04)/.13,0,1);
    this.apronAngle=Math.min(apronTarget,(this.apronAngle??apronTarget)+(apronTarget-(this.apronAngle??apronTarget))*(1-Math.exp(-12*dt)));
    this.bones.apronFront.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X,this.apronAngle));
    const blinkPhase=this.time%4.1,blink=blinkPhase<.16?Math.sin(Math.PI*blinkPhase/.16):0;
    for(const mesh of this.meshes)if(mesh.morphTargetDictionary){for(const n of ['blinkLeft','blinkRight']){const idx=mesh.morphTargetDictionary[n];if(idx!==undefined)mesh.morphTargetInfluences[idx]=blink;}}
    this.root.updateMatrixWorld(true);this.shadow.position.set(position.x,position.floor+.009,position.z);
    feet.forEach((f,i)=>{const shadow=this.footShadows[i];shadow.position.set(f.base.x-position.x,f.base.y-position.floor+.001,f.base.z-position.z);shadow.quaternion.setFromAxisAngle(UP,f.renderHeading).multiply(new THREE.Quaternion().setFromAxisAngle(X,-Math.PI/2));shadow.material.opacity=.28*Math.exp(-f.lift*15);shadow.scale.setScalar(1+f.lift*2);});
    return speed>.01||this.planner.active||this.amount>.005||blink>0;
  }
  dispose(){this.gradient.dispose();this.shadowMap.dispose();for(const m of this.materials)m.dispose();const geometries=new Set();this.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());this.shadow.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.root.removeFromParent();this.shadow.removeFromParent();}
}
