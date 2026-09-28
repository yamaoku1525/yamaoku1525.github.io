// Grab the scene like a panorama; zoom changes the view, never the position.
export const WALK_SPEED=.58,FAST_SPEED=1.5,TOUR_SPEED=.50,TURN_SPEED=1.6;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function keyboardMotion(keys){
  return {
    forward:Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),
    right:Number(keys.has('KeyD'))-Number(keys.has('KeyA')),
    turn:Number(keys.has('KeyE')||keys.has('ArrowRight'))-Number(keys.has('KeyQ')||keys.has('ArrowLeft'))
  };
}
export function dragView(yaw,pitch,dx,dy,height,fov){
  const scale=2*Math.tan(fov*Math.PI/360)/Math.max(1,height);
  return {yaw:yaw-Math.atan(dx*scale),pitch:clamp(pitch+Math.atan(dy*scale),-1.15,1.15)};
}
export function wheelZoom(zoom,delta,mode,height){
  const pixels=delta*(mode===1?16:mode===2?height:1);
  return clamp(zoom*Math.exp(-clamp(pixels,-300,300)*.0015),1,2.4);
}
