/* v7: reliable ivory curtain hand-off on iPhone Safari and slow networks.
   ES5 for older mobile browsers. First frame is drawn before the green shield
   is faded, so no white / bare-ivory flash can precede the curtains. */
(function(){
  'use strict';
  var root=document.documentElement,stage=document.querySelector('.drape-stage');
  if(!root||!stage||!root.classList)return;
  var requested=/(?:\?|&)curtain=1(?:&|$)/.test(location.search||'');
  var reduced=false,saveData=false;
  try{reduced=!!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(ignore){}
  try{var cn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    saveData=!!(cn&&(cn.saveData||cn.effectiveType==='2g'||cn.effectiveType==='slow-2g'));}catch(ignore){}
  var raf=window.requestAnimationFrame||window.webkitRequestAnimationFrame;
  var left=new Image(),right=new Image(),ready=[false,false],failed=false,finished=false;
  var canvas=stage.querySelector('canvas'),ctx=null,drawW=0,drawH=0,dpr=1;
  try{if(canvas&&canvas.getContext)ctx=canvas.getContext('2d');}catch(ignore){}
  function clean(){root.classList.remove('curtain-boot');root.classList.remove('curtain-arrive');
    stage.classList.remove('canvas-ready');stage.style.opacity='';stage.style.display='none';}
  function clearURL(){try{if(history.replaceState)history.replaceState(history.state,'',location.pathname+location.hash);}catch(ignore){}}
  function done(){if(finished)return;finished=true;clean();clearURL();}
  function fadeAway(){
    if(finished)return;
    root.classList.remove('curtain-boot');
    stage.style.opacity='0';
    window.setTimeout(done,380);
  }
  if(!requested){clean();return;}
  if(reduced || saveData || document.visibilityState==='hidden'){fadeAway();return;}
  // The head bootstrap has already painted an emerald shield, continuing the
  // closing curtain from Page 1. It stays up until fabric pixels are ready.
  if(!root.classList.contains('curtain-boot'))root.classList.add('curtain-boot');
  stage.style.display='block';
  var timeout=window.setTimeout(fadeAway,3100);
  function dimensions(){
    drawW=Math.max(1,window.innerWidth||root.clientWidth||375);
    drawH=Math.max(1,window.innerHeight||root.clientHeight||667);
    if(!ctx)return;
    dpr=Math.max(1,Math.min(1.25,window.devicePixelRatio||1));
    canvas.width=Math.round(drawW*dpr);canvas.height=Math.round(drawH*dpr);
    canvas.style.width=drawW+'px';canvas.style.height=drawH+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function clamp(x){return x<0?0:x>1?1:x;}
  function ease(x){return x*x*(3-2*x);}
  function paint(p){
    if(!ctx||!ready[0]||!ready[1])return false;
    var images=[left,right],e=ease(clamp(p)),half=drawW*.505;
    ctx.clearRect(0,0,drawW,drawH);
    for(var side=0;side<2;side++){
      var im=images[side],width=half*(1-.66*e),shift=half*1.055*e;
      var base=(side===0?0:drawW-half)+(side===0?-shift:shift);
      var sign=side===0?1:-1,ripple=Math.sin(Math.PI*p);
      for(var y=0;y<drawH;y+=10){
        var h=Math.min(11,drawH-y),n=y/drawH;
        var wave=Math.sin(n*11+p*17+side*1.4)*ripple*4.5;
        var wave2=Math.sin(n*27-p*9+side)*ripple*1.5;
        var lag=6*Math.sin(Math.PI*n)*ripple*Math.sin(p*7.5);
        var dx=sign*(wave+wave2+lag);
        var sourceY=Math.min(im.height-1,n*im.height);
        try{ctx.drawImage(im,0,sourceY,im.width,Math.min(im.height-sourceY,im.height*h/drawH+1),
          base+dx,y,width,h);}catch(ignore){}
      }
    }
    return true;
  }
  function launch(){
    if(finished||failed||!ready[0]||!ready[1])return;
    window.clearTimeout(timeout);
    if((window.pageYOffset||root.scrollTop||0)>35 || document.visibilityState==='hidden'){
      fadeAway();return;
    }
    dimensions();
    var useCanvas=!!(ctx&&raf&&paint(0));
    if(useCanvas)stage.classList.add('canvas-ready');
    // Make ivory curtains visible BEFORE fading the opaque emerald shield.
    root.classList.add('curtain-arrive');
    root.classList.remove('curtain-boot');
    stage.style.display='block';
    var duration=2450;
    if(!useCanvas){window.setTimeout(done,duration+380);return;}
    var start=null;
    function frame(now){
      if(finished)return;
      if(start===null)start=now;
      var p=clamp((now-start)/duration);
      paint(p);
      if(p<1)raf(frame);else done();
    }
    // A short hold lets the green-to-ivory crossfade finish without any frame gap.
    window.setTimeout(function(){if(!finished)raf(frame);},280);
    window.setTimeout(done,duration+650);
  }
  function loaded(side){return function(){
    if(finished)return;
    if(this.naturalWidth>0)ready[side]=true;else failed=true;
    if(failed)fadeAway();else if(ready[0]&&ready[1])launch();
  };}
  function error(){failed=true;fadeAway();}
  left.onload=loaded(0);right.onload=loaded(1);
  left.onerror=error;right.onerror=error;
  left.src='curtain-ivory-lite-left-v6.jpg';
  right.src='curtain-ivory-lite-right-v6.jpg';
  window.addEventListener('pagehide',done,false);
  window.addEventListener('pageshow',function(e){if(e.persisted)done();},false);
})();
