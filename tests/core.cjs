const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'../web'),bank=JSON.parse(fs.readFileSync(root+'/bank.json')),ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(root+'/core.js','utf8'),ctx);
const grade=vm.runInContext('grade',ctx);
for(const q of bank){assert(grade(q.slots,q.slots.map(s=>' '+s[0].toUpperCase()+' ')));assert(!grade(q.slots,q.slots.map(()=>'')));for(let i=0;i<q.slots.length;i++)for(const a of q.slots[i])assert(grade(q.slots,q.slots.map((s,j)=>j===i?a:s[0])));if(q.options.length)for(const group of q.slots)assert(q.options.some(x=>grade([group],[x])),q.id);if(q.slotOptions)q.slots.forEach(([key],i)=>assert(q.slotOptions[i].length===4 && q.slotOptions[i].includes(key)))}
assert(!grade([['at'],['noon']],['at']));assert.deepEqual(bank.slice(0,500),require('../tools/bank21/base500.json'));assert.equal(bank.length,3000);console.log(bank.length,'items: canonical, alternate, empty, slot count and choice checks passed');
