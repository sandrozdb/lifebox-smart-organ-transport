const fs=require('fs');const path=require('path');
function getStatus(){const file=path.resolve(__dirname,'..','..','work','qa-last-run.json');try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return{passed:null,failed:null,status:'PENDENTE',validatedAt:null}}}
module.exports={getStatus};
