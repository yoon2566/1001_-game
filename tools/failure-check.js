(async()=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms)),snap=()=>lastExit.snapshot(),checks=[];
 document.querySelector('#start').click();
 const code='KeyW';window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));const until=performance.now()+13000;
 while(snap().position.z>-5.9){if(performance.now()>until)throw Error('movement timed out');await sleep(16);}
 window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));let before=snap();await sleep(600);let after=snap();const standingRate=(after.exposure-before.exposure)/(after.elapsed-before.elapsed);
 document.querySelector('#crouch').click();before=snap();await sleep(600);after=snap();const crouchRate=(after.exposure-before.exposure)/(after.elapsed-before.elapsed);checks.push({name:'crouch reduces but does not remove smoke exposure',pass:crouchRate>0&&crouchRate<standingRate,standingRate,crouchRate});
 window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));const deadline=performance.now()+12000;while(snap().mode==='playing'&&performance.now()<deadline)await sleep(30);window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
 const end=snap();checks.push({name:'fire barrier collision',pass:end.position.z>-8&&end.position.z< -7.5,position:end.position});checks.push({name:'exposure failure',pass:end.mode==='result'&&end.exposure===100});
 document.querySelector('#again').click();const reset=snap();checks.push({name:'restart resets all gameplay state',pass:reset.exposure===0&&reset.elapsed<.2&&!reset.crouching&&!reset.alerted&&reset.position.z===17&&reset.mode==='playing'});
 // Direction-pad pointer capture is checked with real browser pointer input,
 // because synthetic pointer IDs are not registered active browser pointers.
 document.querySelector('#pause').click();return JSON.stringify(checks);
})()
