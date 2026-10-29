const fs=require('fs'),path=require('path');
const target=path.join(__dirname,'frontend');fs.mkdirSync(target,{recursive:true});
for(const file of ['index.html','shell.js','client.html','solo.html','classes.js'])fs.copyFileSync(path.join(__dirname,file),path.join(target,file));
const backend=new URL(process.env.MONSTER_BACKEND||'https://monster-rush-alpha.onrender.com');if(backend.protocol!=='https:')throw Error('Use an HTTPS backend origin');
fs.writeFileSync(path.join(target,'config.js'),'window.MONSTER_BACKEND='+JSON.stringify(backend.origin)+';\n');
fs.writeFileSync(path.join(target,'vercel.json'),JSON.stringify({version:2,rewrites:[{source:'/solo',destination:'/index.html'}],headers:[{source:'/config.js',headers:[{key:'Cache-Control',value:'no-store'}]}]},null,2)+'\n');
console.log('Prepared frontend/ for static Vercel hosting. Backend: '+backend.origin);
