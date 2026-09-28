// Foot contacts live in world coordinates. A planted foot does not inherit
// character translation or yaw. Swinging feet alone travel to their next step.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=t=>t*t*(3-2*t);
const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export class FootPlanner {
  constructor(floorAt=()=>0,valid=()=>true,scale=1){this.floorAt=floorAt;this.valid=valid;this.scale=scale;this.feet=[];this.steps=0;this.travel=0;this.clock=0;}
  neutral(root,heading,side,ahead=0){return {x:root.x+Math.cos(heading)*side*.112*this.scale+Math.sin(heading)*ahead,z:root.z-Math.sin(heading)*side*.112*this.scale+Math.cos(heading)*ahead};}
  reset(root,heading){this.feet=[1,-1].map((side,i)=>{const p=this.neutral(root,heading,side);return {side,plant:{...p,y:this.floorAt(p.x,p.z)},heading,swing:null,roll:0,ankle:null};});this.previous={...root};this.heading=heading;this.speed=0;this.clock=0;this.steps=0;this.travel=0;this.update(root,heading,1/60);}
  safeTarget(root,heading,side,ahead){
    let target=this.neutral(root,heading,side,ahead);
    for(let i=0;i<12&&!this.valid(target.x,target.z);i++){target.x=target.x*.8+root.x*.2;target.z=target.z*.8+root.z*.2;}
    return {...target,y:this.floorAt(target.x,target.z)};
  }
  begin(foot,root,heading,speed,turnOnly=false){
    const duration=turnOnly?.25:clamp(.322-Math.max(0,speed-.58)*.25,.14,.36);
    const ahead=turnOnly?0:Math.min(.26,speed*duration+.070);
    foot.swing={t:0,duration,start:{...foot.plant},end:this.safeTarget(root,heading,foot.side,ahead),fromHeading:foot.heading,toHeading:heading,turnOnly};
    this.steps++;
  }
  update(root,heading,dt){
    dt=clamp(dt,0,.05);this.clock+=dt;
    const displacement=dist(root,this.previous),speed=displacement/Math.max(dt,.00001);this.travel+=displacement;
    this.speed+=(speed-this.speed)*(1-Math.exp(-15*dt));this.previous={...root};this.heading=heading;
    const moving=speed>.012;
    let active=this.feet.find(f=>f.swing);
    if(!active){
      const candidates=this.feet.map(f=>({foot:f,behind:(root.x-f.plant.x)*Math.sin(heading)+(root.z-f.plant.z)*Math.cos(heading),offset:dist(f.plant,this.neutral(root,heading,f.side)),turn:Math.abs(angle(heading,f.heading))}));
      const need=c=>Math.max(c.behind/.05,c.offset/.17,c.turn/.7);
      candidates.sort((a,b)=>need(b)-need(a));
      const c=candidates[0];
      if((moving&&(c.behind>.05||c.offset>.17||c.turn>.7))||(!moving&&(c.turn>.38||c.offset>.17)))this.begin(c.foot,root,heading,Math.max(speed,.15),!moving);
      active=this.feet.find(f=>f.swing);
    }
    for(const foot of this.feet){
      let base,headingFoot=foot.heading,roll=0,lift=0;
      if(foot.swing){
        const s=foot.swing;
        // A sharp corner cannot leave the support leg behind for a full
        // straight-line stride. Land the airborne foot sooner, then pivot on
        // it; the support foot still never slides across the floor.
        const support=this.feet.find(f=>f!==foot&&!f.swing);
        const supportReach=support?dist(support.plant,this.neutral(root,heading,support.side)):0;
        const catchup=clamp(1+(supportReach-.18)*24,1,3);
        s.t=Math.min(1,s.t+dt/s.duration*catchup);
        // Steering can adjust the landing early in flight, never a planted foot.
        if(moving&&s.t<.55){const fresh=this.safeTarget(root,heading,foot.side,Math.min(.26,speed*s.duration*(1-s.t)+.070));const a=1-Math.exp(-8*dt);s.end.x+=(fresh.x-s.end.x)*a;s.end.z+=(fresh.z-s.end.z)*a;s.end.y=this.floorAt(s.end.x,s.end.z);s.toHeading=heading;}
        // A stop finishes the airborne step near the body instead of freezing
        // mid-stride or dragging the planted support foot to a neutral pose.
        if(!moving&&!s.turnOnly&&s.t<.65){const stop=this.safeTarget(root,heading,foot.side,.025);const a=1-Math.exp(-12*dt);s.end.x+=(stop.x-s.end.x)*a;s.end.z+=(stop.z-s.end.z)*a;s.end.y=this.floorAt(s.end.x,s.end.z);}
        const u=smooth(s.t);base={x:s.start.x+(s.end.x-s.start.x)*u,z:s.start.z+(s.end.z-s.start.z)*u,y:s.start.y+(s.end.y-s.start.y)*u};
        const clearance=s.turnOnly?.036:.048+Math.min(.075,Math.max(0,s.end.y-s.start.y)*.5);
        lift=clearance*Math.sin(Math.PI*s.t);roll=-.08*Math.sin(Math.PI*s.t);headingFoot=s.fromHeading+angle(s.toHeading,s.fromHeading)*u;
        lift=Math.max(lift,this.floorAt(base.x,base.z)-base.y+.015*Math.sin(Math.PI*s.t));
        if(s.t===1){foot.plant={...s.end};foot.heading=s.toHeading;foot.swing=null;base={...foot.plant};headingFoot=foot.heading;lift=0;roll=-.12;foot.landing=.07;}
      }else{
        base={...foot.plant};
        const behind=(root.x-base.x)*Math.sin(foot.heading)+(root.z-base.z)*Math.cos(foot.heading);
        if(moving&&active)roll=clamp((behind-.06)*2.3,0,.38);
        if(foot.landing>0){foot.landing=Math.max(0,foot.landing-dt);roll=-.12*(foot.landing/.07);}
      }
      // Heel-strike / toe-off rotate about the ground contact, not the ankle.
      const pivot=(roll>=0?.184:-.094)*this.scale,ankleHeight=.14*this.scale;
      const forwardShift=ankleHeight*Math.sin(roll)+pivot*(1-Math.cos(roll));
      foot.ankle={x:base.x+Math.sin(headingFoot)*forwardShift,z:base.z+Math.cos(headingFoot)*forwardShift,y:base.y+lift+ankleHeight*Math.cos(roll)+pivot*Math.sin(roll)};
      foot.roll=roll;foot.renderHeading=headingFoot;foot.base=base;foot.lift=lift;
    }
    this.active=!!this.feet.find(f=>f.swing);return this.feet;
  }
}

// Analytic two-bone solution. Pole is a direction (knees bend forward).
export function solveLeg(hip,target,upper,lower,pole){
  const v={x:target.x-hip.x,y:target.y-hip.y,z:target.z-hip.z};const raw=Math.hypot(v.x,v.y,v.z);const d=clamp(raw,Math.abs(upper-lower)+1e-5,upper+lower-1e-5);const n={x:v.x/(raw||1),y:v.y/(raw||1),z:v.z/(raw||1)};
  const dot=pole.x*n.x+pole.y*n.y+pole.z*n.z;let p={x:pole.x-n.x*dot,y:pole.y-n.y*dot,z:pole.z-n.z*dot};const pl=Math.hypot(p.x,p.y,p.z)||1;p={x:p.x/pl,y:p.y/pl,z:p.z/pl};
  const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  return {knee:{x:hip.x+n.x*along+p.x*height,y:hip.y+n.y*along+p.y*height,z:hip.z+n.z*along+p.z*height},ankle:{x:hip.x+n.x*d,y:hip.y+n.y*d,z:hip.z+n.z*d},reachError:Math.max(0,raw-d)};
}
