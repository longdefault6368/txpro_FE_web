import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url), root = resolve(import.meta.dirname, '..');
const server = new URL('../../../BE/txepro-backend/server/',import.meta.url), backend = createRequire(new URL('package.json',server));
const request=backend('supertest');
const {setupTestApp,teardownTestApp,authHeaderForUser}=await import(new URL('tests/helpers/testApp.js',server));
const User=(await import(new URL('src/models/User.model.js',server))).default;
const {Vehicle}=await import(new URL('src/models/Vehicle.model.js',server));
const {createVehicleVerificationToken}=await import(new URL('src/services/vehicleRegistration.service.js',server));
function load(file){file=resolve(root,file);const m={exports:{}};const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext('(function(require,module,exports){'+js+'\n})',{})(id=>id.startsWith('.')?load(resolve(dirname(file),id)+'.ts'):require(id),m,m.exports);return m.exports;}
const {buildVehicleRegistration}=load('src/utils/vehicle-registration.ts');
let app,driver;
test.before(async()=>{process.env.MONGODB_URI='mongodb://127.0.0.1/not-used-web-onboarding';app=await setupTestApp({rateLimitMax:1000});await Vehicle.init();driver=await User.create({name:'Web Onboarding Test',phone:'+84999000511',password:'test-only',role:'tai-xe',isActive:true,kycStatus:'verified',kycSummary:{verificationEligibility:'verified'}});});
test.after(async()=>{await teardownTestApp();});
test('web-generated registration payloads create, replay, edit and list the exact registered vehicles',async()=>{
  let index=0;
  for(const [type,seats,cargo,child]of [['xe tải thùng bạt','',['general'],''],['ô tô','7',[],'7 ghế'],['container / xe đầu kéo','',['general'],'xe container 40 feet'],['xe máy','',[],''],['xe cẩu tự hành','',['general'],''],['các xe công trình','',['general'],'xe máy đào']]){
    index++;const plateNumber='51C-'+String(81000+index).slice(0,3)+'.'+String(81000+index).slice(3);
    const token=createVehicleVerificationToken({driverId:driver._id,verification:{type:'vehicle-registration-verification',plateNumber,plateNumberKey:plateNumber.replace(/[^A-Z0-9]/g,''),provider:'device_ocr',confidence:null}});
    const form={type,child,brand:'TEST',seats,min:'0',max:'10',cargo};
    const images={vehicleFronts:['/uploads/front.jpg'],vehicleSides:['/uploads/side.jpg'],registrationFrontPath:'/uploads/registration.jpg',registrationBackPath:'/uploads/back.jpg'};
    const payload=buildVehicleRegistration(form,images,{plateNumber,verificationToken:token},'web-request-'+index);
    const first=await request(app).post('/api/v1/tai-xe/vehicles').set('Authorization',authHeaderForUser(driver)).send(payload);
    assert.equal(first.status,201,JSON.stringify(first.body));
    const saved=first.body.data.vehicle;assert.equal(saved.plateNumber,plateNumber);assert.equal(saved.dimensions,null);
    const retry=await request(app).post('/api/v1/tai-xe/vehicles').set('Authorization',authHeaderForUser(driver)).send(payload);
    assert.equal(retry.status,200);assert.equal(retry.body.data.vehicle.id,saved.id);
    const updated=await request(app).put('/api/v1/tai-xe/vehicles/'+saved.id).set('Authorization',authHeaderForUser(driver)).send(buildVehicleRegistration({...form,brand:'UPDATED'},images,null,'unused',saved));
    assert.equal(updated.status,200,JSON.stringify(updated.body));assert.equal(updated.body.data.vehicle.brand,'UPDATED');
  }
  const list=await request(app).get('/api/v1/tai-xe/vehicles?paginated=true&limit=100&page=1').set('Authorization',authHeaderForUser(driver));
  assert.equal(list.status,200);assert.equal(list.body.data.items.length,6);assert.equal(await Vehicle.countDocuments({driverId:driver._id}),6);
});
