/* Wedding curtain transitions v6 — mobile/Safari and slow-network safe.
   On Page 2, the overlay never blocks content before BOTH fabric panels are ready.
   If the images or script fail, the invitation remains immediately accessible.
   ES5 syntax for older iOS Safari compatibility. */
(function(){
  'use strict';
  var doc=document.documentElement;
  var stage=document.querySelector('.drape-stage');
  if(!stage || !doc || !doc.classList)return;
  var mode=stage.getAttribute('data-drape');
  var ivory=mode==='ivory';
  var url=ivory ? ['curtain-ivory-lite-left-v6.jpg','curtain-ivory-lite-right-v6.jpg'] : ['curtain-emerald-left.jpg','curtain-emerald-right.jpg'];
  var im=[new Image(),new Image()],ready=[false,false],failed=false;
  var pending=2, loadedCallback=function(){};
  var canvas=stage.querySelector('canvas'),ctx=null;
  try{if(canvas && canvas.getContext)ctx=canvas.getContext('2d');}catch(ignore){}
  var raf=window.requestAnimationFrame||window.webkitRequestAnimationFrame;
  var reduced=false, saveData=false;
  try{reduced=!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(ignore){}
  try{var net=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
      saveData=!!(net && (net.saveData || net.effectiveType==='slow-2g' || net.effectiveType==='2g'));}catch(ignore){}
  var W=0,H=0,dpr=1,animating=false;
  function allReady(){return ready[0]&&ready[1]&&!failed;}
  function preload(cb){
    loadedCallback=cb||function(){};
    for(var i=0;i<2;i++)(function(idx){
      im[idx].onload=function(){
        if(im[idx].naturalWidth>0)ready[idx]=true;else failed=true;
        pending--;if(pending===0)loadedCallback();
      };
      im[idx].onerror=function(){failed=true;pending--;if(pending===0)loadedCallback();};
      im[idx].src=url[idx];
      if(im[idx].complete && im[idx].naturalWidth>0 && !ready[idx]){
        // Browsers that resolve cached image before dispatching load still call onload.
      }
    })(i);
  }
  function clamp(x){return x<0?0:x>1?1:x;}
  function ease(x){return x*x*(3-2*x);}
  function setSize(){
    W=Math.max(1,window.innerWidth||doc.clientWidth||375);
    H=Math.max(1,window.innerHeight||doc.clientHeight||667);
    if(!ctx)return;
    dpr=Math.max(1,Math.min(1.25,window.devicePixelRatio||1));
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function draw(raw,closing){
    if(!ctx || !allReady())return false;
    var p=clamp(raw),ep=ease(p),half=W*.505,shown=false;
    ctx.clearRect(0,0,W,H);
    for(var side=0;side<2;side++){
      var pic=im[side];
      var compression=closing ? (.69+.31*ep) : (1-.66*ep);
      var width=half*compression;
      var shift=half*1.055*(closing?(1-ep):ep);
      var origin=(side===0?0:W-half)+(side===0?-shift:shift);
      var sign=side===0?1:-1;
      var ripple=Math.sin(Math.PI*p);
      for(var y=0;y<H;y+=9){
        var h=Math.min(10,H-y),norm=y/H;
        var wave=Math.sin(norm*11+p*17+side*1.4)*ripple*(ivory?5.2:2.4);
        var wave2=Math.sin(norm*27-p*9+side)*ripple*(ivory?1.8:.9);
        var lag=(ivory?7:0)*Math.sin(Math.PI*norm)*ripple*Math.sin(p*7.5);
        var offset=sign*(wave+wave2+lag);
        var dw=width*(1+(ivory?.02:.01)*Math.sin(norm*9+p*13)*ripple);
        var sy=norm*pic.height,sh=Math.min(pic.height-sy,pic.height*h/H+1);
        try{ctx.drawImage(pic,0,sy,pic.width,sh,origin+offset,y,dw,h);shown=true;}
        catch(ignore){}
      }
    }
    return shown;
  }
  function clean(){
    animating=false;doc.classList.remove('curtain-exit');doc.classList.remove('curtain-arrive');
    stage.classList.remove('canvas-ready');stage.style.display='none';
  }
  function animate(closing,duration,done){
    var complete=false;
    function finish(){if(complete)return;complete=true;clean();if(done)done();}
    setSize();
    stage.style.display='block';
    var useCanvas=!!(ctx&&raf&&allReady()&&draw(0,closing));
    if(useCanvas)stage.classList.add('canvas-ready');
    else stage.classList.remove('canvas-ready');
    doc.classList.add(closing?'curtain-exit':'curtain-arrive');
    animating=true;
    if(!useCanvas){window.setTimeout(finish,duration);return;}
    var start=null;
    function frame(now){
      if(complete)return;
      if(start===null)start=now;
      var p=clamp((now-start)/duration);
      draw(p,closing);
      if(p<1)raf(frame);else finish();
    }
    raf(frame);window.setTimeout(finish,duration+350);
  }
  function removeEntryQuery(){
    try{if(history.replaceState)history.replaceState(history.state,'',location.pathname+location.hash);}catch(ignore){}
  }
  if(!ivory){
    var enter=document.querySelector('a.enter'),busy=false;
    preload(function(){});
    if(enter)enter.addEventListener('click',function(ev){
      if(busy){ev.preventDefault();return;}
      if(ev.defaultPrevented || (typeof ev.button==='number'&&ev.button!==0) ||
         ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || reduced || saveData)return;
      // Never show plain green curtain or delay navigation if fabric cannot load.
      if(!allReady() || animating)return;
      ev.preventDefault();busy=true;
      var destination=enter.href,changed=false;
      function go(){if(changed)return;changed=true;window.location.href=destination;}
      animate(true,1270,go);window.setTimeout(go,1720);
    },false);
    window.addEventListener('pageshow',function(){busy=false;clean();},false);
  }else{
    var requested=/(?:\?|&)curtain=1(?:&|$)/.test(location.search||'');
    if(!requested){clean();return;}
    var done=false,deadline;
    function skip(){if(done)return;done=true;window.clearTimeout(deadline);clean();removeEntryQuery();}
    if(reduced || saveData || (document.visibilityState==='hidden')){skip();return;}
    function launch(){
      if(done || !allReady())return;
      // Avoid abruptly covering the page if someone began interacting while waiting.
      if((window.pageYOffset||doc.scrollTop||0)>45 || document.visibilityState==='hidden'){skip();return;}
      done=true;window.clearTimeout(deadline);
      animate(false,2450,function(){removeEntryQuery();});
    }
    // If photos load slowly, skip the effect rather than blocking the invitation.
    deadline=window.setTimeout(skip,1100);
    preload(function(){if(allReady())launch();else skip();});
    window.addEventListener('pagehide',function(){clean();},false);
    window.addEventListener('pageshow',function(e){if(e.persisted){clean();removeEntryQuery();}},false);
  }
})();
