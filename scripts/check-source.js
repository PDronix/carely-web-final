'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function walk(dir,ext){
  const found=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())found.push(...walk(full,ext));
    else if(entry.name.endsWith(ext))found.push(full);
  }
  return found;
}
const jsFiles=['backend','scripts','tests','frontend/public/js']
  .flatMap(dir=>walk(path.join(root,dir),'.js'));
for(const file of jsFiles){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0)throw new Error(`JavaScript syntax error ${file}\n${result.stderr}`);
}
const ejsFiles=walk(path.join(root,'frontend/views'),'.ejs');
for(const file of ejsFiles){
  const content=fs.readFileSync(file,'utf8');
  const tags=/<%([=\-#]?)([\s\S]*?)%>/g;
  let buffer='let output="";\nwith(data){\n',from=0,match;
  while((match=tags.exec(content))){
    buffer+=`output+=${JSON.stringify(content.slice(from,match.index))};\n`;
    if(match[1]==='=')buffer+=`output+=escapeHtml(${match[2]});\n`;
    else if(match[1]==='-')buffer+=`output+=(${match[2]});\n`;
    else if(match[1]!=='#')buffer+=match[2]+'\n';
    from=match.index+match[0].length;
  }
  buffer+=`output+=${JSON.stringify(content.slice(from))};\n}\nreturn output;`;
  try { new Function('data','include','escapeHtml',buffer); }
  catch(err){ throw new Error(`EJS source syntax error ${file}\n${err.message}`); }
}
console.log(`PASS: ${jsFiles.length} JavaScript files and ${ejsFiles.length} EJS templates`);
