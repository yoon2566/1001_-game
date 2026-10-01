(async () => {
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const snap=()=>lastExit.snapshot(); const checks=[];
 const before=snap();await sleep(450);const after=snap();checks.push({name:'pause freezes timer',pass:before.mode==='paused'&&after.elapsed===before.elapsed});
 document.querySelector('#resume').click();
 async function move(axis,target){const initial=snap().position[axis];const direction=Math.sign(target-initial);const code=axis==='x'?(direction>0?'KeyD':'KeyA'):(direction>0?'KeyS':'KeyW');const deadline=performance.now()+15000;window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));try{while((target-snap().position[axis])*direction>.06){if(snap().mode!=='playing')throw Error('Unexpected mode '+snap().mode);if(performance.now()>deadline)throw Error('Movement timed out: '+axis+' '+target+' at '+JSON.stringify(snap()));await sleep(16);}}finally{window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));}}
 await move('z',-3.25);await move('x',12.5);await move('z',-14.6);await move('x',0);await move('z',-24.6);
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));for(let i=0;i<100&&snap().mode==='playing';i++)await sleep(16);window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
 checks.push({name:'walk to assembly with keyboard events',pass:snap().mode==='quiz',state:snap()});checks.push({name:'smoke can be avoided completely',pass:snap().exposure===0});
 document.querySelector('[data-answer="correct"]').click();checks.push({name:'119 answer feedback',pass:!document.querySelector('#see-result').hidden&&snap().quizCorrect});document.querySelector('#see-result').click();checks.push({name:'report 100 points',pass:snap().mode==='result'&&document.querySelector('.score-row b').textContent.includes('100')});return JSON.stringify(checks);
})()
