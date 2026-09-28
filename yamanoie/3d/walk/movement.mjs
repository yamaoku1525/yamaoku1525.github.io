// Grounded visitor movement in the existing model's relative coordinate system.
// Independent of rendering: fixed maximum travel per collision query prevents
// crossing thin walls during long frames; axes slide along obstacles.
export class WalkWorld {
  constructor(data) { this.data=data; this.radius=data.radius; }
  floor(x,z) {
    const f=this.data.floors.find(f=>x>=f.minX&&x<=f.maxX&&z>=f.minZ&&z<=f.maxZ);if(!f)return;
    const h=this.data.heightField;if(!h)return f;
    const u=(x-h.minX)/h.unit,v=(z-h.minZ)/h.unit,i=Math.floor(u),j=Math.floor(v);
    if(i<0||j<0||i>=h.width-1||j>=h.depth-1)return f;
    const at=(a,b)=>h.heights[b*h.width+a],tx=u-i,tz=v-j;
    return {...f,height:(at(i,j)*(1-tx)+at(i+1,j)*tx)*(1-tz)+(at(i,j+1)*(1-tx)+at(i+1,j+1)*tx)*tz};
  }
  canStand(x,z) {
    const r=this.radius;
    if(!this.floor(x,z)) return false;
    for(let i=0;i<16;i++) {
      const a=i*Math.PI/8;
      if(!this.floor(x+Math.cos(a)*r,z+Math.sin(a)*r)) return false;
    }
    const floorHeight=this.floor(x,z).height;
    const profiles=this.data.avatarProfile??[{radius:r,bottom:0,top:2}];
    return !this.data.obstacles.some(o=>profiles.some(profile=>{
      if(o.top<=floorHeight+profile.bottom||o.bottom>=floorHeight+profile.top)return false;
      const dx=x-Math.max(o.minX,Math.min(x,o.maxX));
      const dz=z-Math.max(o.minZ,Math.min(z,o.maxZ));
      return dx*dx+dz*dz<profile.radius*profile.radius-1e-8;
    }));
  }
  move(position,dx,dz) {
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.035));
    // Only the simulation passes bounded movement, but guard external misuse.
    if(steps>10000) throw new RangeError('Unbounded movement');
    const next={...position};
    const allowed=(x,z)=>this.canStand(x,z)&&Math.abs(this.floor(x,z).height-this.floor(next.x,next.z).height)<=(this.data.maxStep??.26);
    for(let i=0;i<steps;i++) {
      const x=next.x+dx/steps,z=next.z+dz/steps;
      if(allowed(x,z)) { next.x=x;next.z=z; }
      else {
        if(allowed(x,next.z)) next.x=x;
        if(allowed(next.x,z)) next.z=z;
      }
    }
    next.floor=this.floor(next.x,next.z)?.height??0;
    return next;
  }
}

export function movementVector(forward,right,yaw,speed,dt) {
  const length=Math.hypot(forward,right);
  if(!length) return {dx:0,dz:0};
  const s=Math.min(1,length)*speed*Math.min(Math.max(dt,0),.10)/length;
  return {dx:(Math.sin(yaw)*forward+Math.cos(yaw)*right)*s,
          dz:(-Math.cos(yaw)*forward+Math.sin(yaw)*right)*s};
}

// Fast walking eases down while the character turns, as a real short stride
// does. This keeps the support foot planted through abrupt direction changes.
export function turnPace(dx,dz,heading,speed=1.05){
  const length=Math.hypot(dx,dz);if(!length)return 1;
  const facing=(dx*Math.sin(heading)+dz*Math.cos(heading))/length;
  return Math.min(1,(.378+Math.max(0,speed-.378)*Math.max(0,facing)**4)/speed);
}
export function terrainPace(world,position,dx,dz,speed=1.05){
  const d=Math.hypot(dx,dz);if(!d)return 1;
  const heights=[-.24,-.12,0,.12,.24].map(t=>world.floor(position.x+dx/d*t,position.z+dz/d*t)?.height??position.floor);
  return Math.max(...heights)-Math.min(...heights)>.045?Math.min(1,.525/speed):1;
}
