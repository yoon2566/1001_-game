const fs=require('node:fs');const path=require('node:path');const root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'src/shell.html'),'utf8');
for(const [mark,file] of [['STYLES','src/style.css'],['THREE','vendor/three.min.js'],['WORLD','src/world.js'],['GAME','src/game.js']]){let content=fs.readFileSync(path.join(root,file),'utf8');if(mark==='THREE'){content='/* Three.js MIT license\n'+fs.readFileSync(path.join(root,'vendor/THREE-LICENSE.txt'),'utf8')+'*/\n'+content;}html=html.replace('/* '+mark+' */',()=>content.replace(/<\/script/gi,'<\\/script'));}
fs.writeFileSync(path.join(root,'쿠팡허브_화재탈출.html'),html,'utf8');console.log('Built standalone HTML: '+Buffer.byteLength(html)+' bytes');
