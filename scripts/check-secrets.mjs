import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean)
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\b(?:sk_live_|sk_test_)[A-Za-z0-9]{20,}\b/]
const problems=[]
for(const file of files){
 if(/(^|\/)\.env(?!\.example$)|\.(?:pem|key|p12|pfx|tgz)$/.test(file)){problems.push(file);continue}
 const body=readFileSync(file,'utf8');if(patterns.some(p=>p.test(body)))problems.push(file)
}
if(problems.length){console.error('Potential sensitive files:',problems.join(', '));process.exitCode=1}else console.log(`Secret-pattern scan passed for ${files.length} tracked files. Also scan exact local credentials and release contents before publishing.`)
