import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url), root = resolve(import.meta.dirname, '..');
function load(relative) {
  const file = resolve(root, relative), module = { exports: {} };
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext('(function(require,module,exports){' + code + '\n})', { FormData, File, Response, AbortSignal, console })(id => id.startsWith('.') ? load(resolve(dirname(file), id) + '.ts') : require(id), module, module.exports);
  return module.exports;
}
const { createKycFlow, validateKycFiles } = load('src/utils/kyc-flow.ts');
const { buildVehicleRegistration, registrationPlateFromText } = load('src/utils/vehicle-registration.ts');
const { getVehicleCapabilities } = load('src/utils/vehicleCapabilities.ts');
const files = () => Object.fromEntries(['cccdFront','cccdBack','portrait'].map(key => [key, new File(['test'], key + '.jpg', { type: 'image/jpeg' })]));
const id = '123456789012345678901234';
const draft = { id, status: 'draft', verificationEligibility: 'not_started', identity: { fullName: 'TEST USER' } };
const complete = { ...draft, status: 'auto_verified', verificationEligibility: 'verified' };

test('KYC requires both ID sides and portrait before upload, with real MIME and size limits', () => {
  const f = files(); validateKycFiles(f); delete f.portrait;
  assert.throws(() => validateKycFiles(f));
  assert.throws(() => validateKycFiles({ ...files(), portrait: new File(['x'], 'x.svg', {type:'image/svg+xml'}) }));
  assert.throws(() => validateKycFiles({ ...files(), portrait: new File([], 'empty.jpg', {type:'image/jpeg'}) }));
});
test('unknown submit outcome reuses OCR draft and recovers completed result without a second submit', async () => {
  const calls = []; let submitted = false;
  const flow = createKycFlow(async (path, options) => {
    calls.push(path);
    if (path === '/kyc/upload') { assert.equal([...options.body.keys()].length,3); return {documents:{test:true}}; }
    if (path === '/kyc/extract') return { submission:{id}, identity:draft.identity };
    if (path.endsWith('/submit')) { submitted=true; throw Object.assign(new Error('timeout'), {uncertain:true}); }
    return {submission:submitted?complete:draft};
  }, 'stable-attempt-key');
  await assert.rejects(flow.run(files(),'tai-xe'));
  assert.equal((await flow.run(files(),'tai-xe')).verificationEligibility,'verified');
  assert.equal(calls.filter(x=>x==='/kyc/upload').length,1);
  assert.equal(calls.filter(x=>x==='/kyc/extract').length,1);
  assert.equal(calls.filter(x=>x.endsWith('/submit')).length,1);
});
test('retrying uncertain OCR keeps original documents and the same provider idempotency key', async () => {
  const bodies=[]; let uploads=0;
  const flow=createKycFlow(async(path,options)=>{
    if(path==='/kyc/upload'){uploads++;return {documents:{cccdFront:{storageKey:'same'}}};}
    if(path==='/kyc/extract'){bodies.push(options.body);if(bodies.length===1)throw new Error('timeout');return {submission:{id},identity:draft.identity};}
    return {submission:path.endsWith('/submit')?complete:draft};
  },'same-key-after-network-error');
  await assert.rejects(flow.run(files(),'tai-xe'));await flow.run(files(),'tai-xe');
  assert.equal(uploads,1);assert.equal(bodies.length,2);assert.equal(bodies[0],bodies[1]);
});
test('saved draft resumes without re-upload or paid OCR, and rejection remains rejection', async () => {
  const calls=[];
  const flow=createKycFlow(async(path)=>{calls.push(path);return {submission:path.endsWith('/submit')?{...complete,status:'rejected',verificationEligibility:'rejected'}:draft};},'resume-key');
  assert.equal((await flow.run({},'tai-xe',draft)).verificationEligibility,'rejected');
  assert.equal(calls.length,2);assert.ok(calls.every(p=>p.startsWith('/kyc/submissions/')));
});
test('concurrent KYC submission cannot dispatch duplicate OCR/upload', async () => {
  let release;const pending=new Promise(resolve=>{release=resolve;});let uploads=0;
  const flow=createKycFlow(async(path)=>{
    if(path==='/kyc/upload'){uploads++;await pending;return {documents:{test:true}};}
    if(path==='/kyc/extract')return {submission:{id},identity:draft.identity};
    return {submission:path.endsWith('/submit')?complete:draft};
  },'concurrent-key');
  const first=flow.run(files(),'tai-xe');await assert.rejects(flow.run(files(),'tai-xe'));release();await first;assert.equal(uploads,1);
});
test('plate parser reads exact car and numbered motorcycle series without guessing characters',()=>{
  assert.equal(registrationPlateFromText('BIEN SO: 51C-123.45'),'51C-123.45');
  assert.equal(registrationPlateFromText('Number plate\n59A3-139.57'),'59A3-139.57');
  assert.equal(registrationPlateFromText('51C12345'),'51C-123.45');
  assert.throws(()=>registrationPlateFromText('BIEN SO: 51C-123.45\nBIEN SO: 51C-987.65'));
  assert.throws(()=>registrationPlateFromText('BIEN SO:\nSO MAY: 51C12345'));
  assert.throws(()=>registrationPlateFromText('BIEN SO: 5IC-123.45'));
  assert.throws(()=>registrationPlateFromText('51C-123.456'));
});
const images={vehicleFronts:['/uploads/front.jpg'],vehicleSides:['/uploads/side.jpg'],registrationFrontPath:'/uploads/reg.jpg',registrationBackPath:'/uploads/back.jpg'};
const verification={plateNumber:'51C-123.45',verificationToken:'signed-proof'};
const form={type:'xe tải thùng bạt',child:'',brand:'TEST',seats:'',min:'0',max:'10',cargo:['general']};
test('registration keeps OCR plate, request ID, cargo and image grouping; removes dimensions and manual identities',()=>{
  const p=buildVehicleRegistration(form,images,verification,'stable-request');
  assert.equal(p.plateNumber,verification.plateNumber);assert.equal(p.capacityMin,0);assert.equal(p.capacityMax,10);
  assert.equal(p.registrationRequestId,'stable-request');assert.equal(p.licenseImages.length,4);
  for(const field of ['dimensions','chassisNumber','engineNumber','ownerName'])assert.equal(field in p,false);
  assert.throws(()=>buildVehicleRegistration({...form,cargo:[]},images,verification,'key'));
  assert.throws(()=>buildVehicleRegistration({...form,min:'12'},images,verification,'key'));
  assert.throws(()=>buildVehicleRegistration(form,{...images,vehicleSides:[]},verification,'key'));
  assert.throws(()=>buildVehicleRegistration(form,images,null,'key'));
});
test('motorcycle, passenger, container and construction registration obey backend field rules',()=>{
  for(const [type,seats,cargo,capacity]of [['xe máy','',[],0],['ô tô','7',[],0],['container / xe đầu kéo','',['general'],0],['các xe công trình','',['general'],0]]){
    const p=buildVehicleRegistration({...form,type,seats,cargo},images,verification,'request-'+type);
    assert.equal(p.capacity,capacity);assert.equal(p.capacityMax,null);assert.equal(p.seats,seats?7:null);
  }
  assert.equal(getVehicleCapabilities({type:'xe máy đào',vehicleTypeParent:'các xe công trình'}).category,'construction');
});
test('editing preserves plate and does not send create request ID; changed OCR plate is rejected',()=>{
  const old={id,type:form.type,plateNumber:verification.plateNumber};
  const p=buildVehicleRegistration(form,images,null,'unused',old);
  assert.equal('plateNumber' in p,false);assert.equal('registrationRequestId' in p,false);
  assert.throws(()=>buildVehicleRegistration(form,images,{...verification,plateNumber:'51C-999.99'},'x',old));
});

const { createRegistrationClient, commitRegistrationSession } = load('src/utils/web-registration.ts');
test('registration network errors and invalid OTP never become offline success or get replayed',async()=>{
  for(const send of [async()=>{throw new Error('offline');},async()=>new Response(JSON.stringify({success:false,message:'Invalid OTP'}),{status:400})]){
    let calls=0;const request=createRegistrationClient('https://api.test',async(...args)=>{calls++;return send(...args);});
    await assert.rejects(request('/auth/verify-otp',{phone:'test',otp:'123456'}));assert.equal(calls,1);
  }
});
test('registration commits both tokens only after a complete real account response, never a name-based role',()=>{
  const map=new Map(),storage={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
  assert.throws(()=>commitRegistrationSession(storage,{user:{id,role:'tai-xe'},tokens:{accessToken:'a'}},null));assert.equal(map.size,0);
  assert.throws(()=>commitRegistrationSession(storage,{user:{id,role:'admin',name:'admin'},tokens:{accessToken:'a',refreshToken:'r'}},null));assert.equal(map.size,0);
  const result={user:{id,role:'tai-xe',name:'admin is just a name'},tokens:{accessToken:'real-access',refreshToken:'real-refresh'}};
  assert.equal(commitRegistrationSession(storage,result,null),'/tai-xe/phuong-tien');assert.equal(map.get('txpro_refresh_token'),'real-refresh');assert.equal(JSON.parse(map.get('txpro_user_session')).rawRole,'tai-xe');
  assert.throws(()=>commitRegistrationSession(storage,result,null));
});
test('login return paths support vehicle/KYC onboarding while excluding arbitrary destinations',()=>{
  const {safePostingReturn}=load('src/utils/posting-contract.ts');
  for(const path of ['/tai-xe/phuong-tien','/user/ekyc?next=%2Ftai-xe%2Fphuong-tien'])assert.equal(safePostingReturn(path),path);
  for(const path of ['https://evil.test','//evil.test','/admin','/tai-xe/phuong-tien/../admin'])assert.equal(safePostingReturn(path),null);
});
