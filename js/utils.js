'use strict';
window.KP = window.KP || {};
KP.Utils = {
  clamp(v,min,max){ return Math.max(min, Math.min(max, v)); },
  rand(min,max){ return min + Math.random() * (max - min); },
  choice(a){ return a[Math.floor(Math.random()*a.length)]; },
  rects(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; },
  center(a){ return { x:a.x+a.w/2, y:a.y+a.h/2 }; },
  near(a,b,dx=70,dy=90){ const ca=this.center(a), cb=this.center(b); return Math.abs(ca.x-cb.x)<dx && Math.abs(ca.y-cb.y)<dy; },
  drawBar(ctx,x,y,w,h,ratio,fg='#52e152',bg='#171717'){
    ctx.fillStyle = bg; ctx.fillRect(x,y,w,h);
    ctx.fillStyle = ratio>.35 ? fg : '#ff4040'; ctx.fillRect(x,y,w*this.clamp(ratio,0,1),h);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.strokeRect(x,y,w,h);
  }
};
