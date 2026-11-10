/* Shoeb & Fabbiha – two-tone satin drape transition. ES5 + Canvas 2D.
   Identical geometry and ruffle physics on both pages; only the fabric differs.
   Canvas is optional: prebuilt CSS animations remain as a fallback. */
(function(){
  'use strict';
  var root=document.documentElement;
  var stage=document.querySelector('.drape-stage');
  if(!stage || !root || !root.classList)return;
  var mode=stage.getAttribute('data-drape');
  var canvas=stage.querySelector('canvas');
  var ctx=null;
  try{if(canvas && canvas.getContext)ctx=canvas.getContext('2d');}catch(ignore){}
  var raf=window.requestAnimationFrame||window.webkitRequestAnimationFrame;
  var reduced=false;
  try{reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(ignore){}
  var prefix=mode==='emerald'?'curtain-emerald':'curtain-ivory-v4';
  var images=[new Image(),new Image()];
  var loaded=[false,false];
  var W=0,H=0,dpr=1;
  function hasImages(){return loaded[0]&&loaded[1];}
  function preload(){
    for(var i=0;i<2;i++){
      (function(i){
        images[i].onload=function(){loaded[i]=true;};
        images[i].onerror=function(){loaded[i]=false;};
        images[i].src=prefix+(i===0?'-left.jpg':'-right.jpg')+'?v=20261110d';
        if(images[i].complete&&images[i].naturalWidth>0)loaded[i]=true;
      })(i);
    }
  }
  preload();
  function sizeCanvas(){
    if(!ctx)return;
    W=Math.max(1,window.innerWidth||document.documentElement.clientWidth||375);
    H=Math.max(1,window.innerHeight||document.documentElement.clientHeight||667);
    dpr=Math.max(1,Math.min(1.5,window.devicePixelRatio||1));
    canvas.width=Math.round(W*dpr);
    canvas.height=Math.round(H*dpr);
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function clamp(v){return v<0?0:v>1?1:v;}
  function smooth(v){return v*v*(3-2*v);}
  /* The photographed fabric is painted in a series of narrow horizontal strips.
     Each strip moves at a slightly different phase, simulating loose fabric
     rippling, compressing into folds and drawing back from the centre. */
  function paint(raw,closing){
    if(!ctx||!hasImages())return;
    var p=clamp(raw),e=smooth(p),half=W*.505;
    ctx.clearRect(0,0,W,H);
    for(var side=0;side<2;side++){
      var im=images[side];
      var compression=closing?(.69+.31*e):(1-.66*e);
      var dw=half*compression;
      var shift=half*1.055*(closing?(1-e):e);
      var base=(side===0?0:W-half)+(side===0?-shift:shift);
      var sign=side===0?1:-1;
      var ripple=Math.sin(Math.PI*p);
      var sliceH=6;
      for(var y=0;y<H;y+=sliceH){
        var h=Math.min(sliceH+1,H-y);
        var norm=y/H;
        var wave=Math.sin(norm*11+p*17+side*1.4)*ripple*(mode==='ivory'?5.2:2.4);
        var wave2=Math.sin(norm*27-p*9+side)*ripple*(mode==='ivory'?1.8:.9);
        var lag=(mode==='ivory'?7:0)*Math.sin(Math.PI*norm)*ripple*Math.sin(p*7.5);
        var offset=sign*(wave+wave2+lag);
        var width=dw*(1+(mode==='ivory' ? 0.020 : 0.010)*Math.sin(norm*9+p*13)*ripple);
        var sy=norm*im.height;
        var sh=Math.min(im.height-sy,im.height*h/H+1);
        try{ctx.drawImage(im,0,sy,im.width,sh,base+offset,y,width,h);}catch(ignore){}
        var shadow=.045*Math.max(0,Math.sin(norm*10+p*16+side*1.3));
        if(shadow>.006){
          ctx.fillStyle='rgba(0,0,0,'+shadow+')';
          ctx.fillRect(base+offset,y,width,h);
        }
      }
    }
  }
  function animate(closing,duration,done){
    if(!ctx||!raf||reduced){if(done)window.setTimeout(done,duration);return;}
    sizeCanvas();
    var start=(window.performance&&performance.now)?performance.now():Date.now();
    var ended=false;
    function finish(){if(ended)return;ended=true;if(done)done();}
    function frame(t){
      if(ended)return;
      var p=clamp((t-start)/duration);
      if(hasImages()){
        stage.classList.add('canvas-ready');
        paint(p,closing);
      }
      if(p<1)raf(frame);else finish();
    }
    raf(frame);
    window.setTimeout(finish,duration+180);
  }
  function clean(){
    root.classList.remove('curtain-exit');
    root.classList.remove('curtain-arrive');
    stage.classList.remove('canvas-ready');
    stage.style.display='none';
  }
  if(mode==='emerald'){
    var enter=document.querySelector('a.enter');
    if(enter){
      var busy=false;
      enter.addEventListener('click',function(ev){
        if(busy){ev.preventDefault();return;}
        if(ev.defaultPrevented || (typeof ev.button==='number'&&ev.button!==0) ||
           ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey||reduced)return;
        ev.preventDefault();busy=true;
        stage.style.display='block';root.classList.add('curtain-exit');
        var target=enter.href;
        var once=false;
        function next(){if(once)return;once=true;window.location.href=target;}
        animate(true,1270,next);
        window.setTimeout(next,1750);
      },false);
    }
    window.addEventListener('pageshow',function(){busy=false;clean();},false);
  }else{
    var show=(window.location.search||'').indexOf('curtain=1')>=0;
    if(show&&!reduced){
      stage.style.display='block';root.classList.add('curtain-arrive');
      var complete=false;
      function hide(){
        if(complete)return;complete=true;clean();
        try{if(window.history&&history.replaceState){
          history.replaceState(history.state,'',window.location.pathname+window.location.hash);
        }}catch(ignore){}
      }
      animate(false,2850,hide);
      window.setTimeout(hide,3550);
      window.addEventListener('pagehide',hide,false);
      window.addEventListener('pageshow',function(e){if(e.persisted)hide();},false);
    }else clean();
  }
})();
