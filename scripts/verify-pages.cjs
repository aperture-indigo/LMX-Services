const {chromium}=require('/home/apertureindigo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const routes=['/','/our-services','/our-services/home-renovations','/our-services/landscaping-and-lawn','/our-services/demolition-junk-removal','/our-services/flooring','/our-services/repairs-maintenance','/our-services/custom-projects','/our-services/auto-detailing','/our-services/pest-rodent-control','/our-services/snow-removal','/about-us','/client-testimonials'];
(async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3018'},stdio:'pipe'});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.stderr.once('data',d=>reject(new Error(String(d))))});
 let browser;
 try{
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const externalPhotos=[];
  await page.route('**/*',route=>{
   const request=route.request();
   const url=new URL(request.url());
   if(url.hostname==='primary.jwwb.nl'||(request.resourceType()==='image'&&url.origin!=='http://127.0.0.1:3018')){
    externalPhotos.push(request.url());return route.abort();
   }
   return route.continue();
  });
  for(const route of routes){
   const response=await page.goto('http://127.0.0.1:3018'+route);
   assert.equal(response.status(),200,route);
   await page.locator('main h1').waitFor();
   assert(!(await page.locator('main').textContent()).includes('reserved for the next phase'),route);
   await page.evaluate(()=>document.fonts.ready);
   const thumbCount=await page.locator('.collection-photo').count();
   if(['/our-services/pest-rodent-control','/our-services/snow-removal'].includes(route)){
    assert.equal(await page.locator('#projects,.collection-grid,[data-project]').count(),0,'Service page must not have a photo gallery');
    assert.equal(await page.locator('.service-illustration').count(),1);
    assert.equal(await page.locator('.offerings li').count(),6);
   }
   if(thumbCount){
    const thumb=page.locator('.collection-photo').last();
    const n=Number(await thumb.getAttribute('data-photo'))+1;
    await thumb.click();await page.locator('dialog[open]').waitFor();
    assert((await page.locator('#original').getAttribute('href')).startsWith('/images/'),'Original photo must be local');
    assert((await page.locator('#gallery-caption').textContent()).startsWith(String(n).padStart(2,'0')));
    await page.locator('.next').click();await page.keyboard.press('ArrowLeft');
    assert((await page.locator('#gallery-caption').textContent()).startsWith(String(n).padStart(2,'0')));
    await page.keyboard.press('Escape');assert(!await page.locator('dialog').isVisible());
    while(await page.locator('#more-photos').count())await page.locator('#more-photos').click();
    const expected=Number((await page.locator('#collection-count').textContent()).match(/of (\d+)/)[1]);
    assert.equal(await page.locator('.collection-photo').count(),expected);
    await page.locator('.collection-photo').last().click();
    await page.locator('.next').click();assert((await page.locator('#gallery-caption').textContent()).startsWith('01'));
    await page.keyboard.press('Escape');
   }
   await page.evaluate(async()=>{const images=[...document.querySelectorAll('main img')];for(const image of images){image.loading='eager';}await Promise.all(images.map(img=>img.decode().catch(()=>{})))});
   const broken=await page.locator('main img').evaluateAll(images=>images.filter(i=>!i.naturalWidth).map(i=>i.src));
   assert.deepEqual(broken,[],route+' broken images');
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),route+' desktop overflow');
   await page.evaluate(()=>scrollTo(0,0));
   if(['/our-services/pest-rodent-control','/our-services/snow-removal'].includes(route))await page.screenshot({path:'/tmp/lmx-'+route.split('/').pop()+'-new-desktop.png',fullPage:true});
   console.log('PASS',route,thumbCount?'gallery verified':'page verified');
  }
  await page.goto('http://127.0.0.1:3018/');await page.locator('main h1').waitFor();
  assert.equal(await page.locator('#navigation > a[href="/our-services/home-renovations"]').count(),0);
  await page.locator('.services-toggle').click();assert(await page.locator('#services-dropdown').isVisible());
  assert.equal(await page.locator('#services-dropdown a').count(),9);
  await page.keyboard.press('Escape');
  await page.locator('.quick-service[href="/our-services/snow-removal"]').click();
  await page.locator('.service-overview h2').waitFor();assert(page.url().endsWith('/snow-removal'));
  await page.goto('http://127.0.0.1:3018/');await page.locator('main h1').waitFor();await page.locator('.services-toggle').click();
  await page.screenshot({path:'/tmp/lmx-dropdown-desktop.png'});
  await page.keyboard.press('Escape');assert(!await page.locator('#services-dropdown').isVisible());
  await page.locator('.services-toggle').focus();await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('href')),'/our-services/home-renovations');
  await page.keyboard.press('Escape');
  await page.locator('.services-toggle').click();await page.locator('#services-dropdown a[href="/our-services/home-renovations"]').click();await page.locator('main h1').waitFor();
  for(const card of await page.locator('.project-card').all()){
   await card.click();await page.locator('dialog[open]').waitFor();
   const total=Number((await page.locator('#gallery-caption').textContent()).split('/')[1]);
   for(let i=0;i<total;i++){
    const image=page.locator('#gallery-image');await image.evaluate(el=>el.decode());
    assert((await page.locator('#original').getAttribute('href')).startsWith('/images/'));
    await page.locator('.next').click();
   }
   await page.keyboard.press('Escape');
  }
  await page.locator('[data-filter="Interiors"]').click();assert.equal(await page.locator('.project-card').count(),3);
  await page.setViewportSize({width:390,height:844});
  for(const route of routes){
   await page.goto('http://127.0.0.1:3018'+route);await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),route+' mobile overflow');
   if(['/our-services/pest-rodent-control','/our-services/snow-removal'].includes(route))await page.screenshot({path:'/tmp/lmx-'+route.split('/').pop()+'-new-mobile.png',fullPage:true});
  }
  await page.locator('.menu').click();await page.locator('.services-toggle').click();assert(await page.locator('#services-dropdown').isVisible());
  await page.screenshot({path:'/tmp/lmx-dropdown-mobile.png'});
  await page.locator('#services-dropdown a[href="/our-services/auto-detailing"]').click();await page.locator('main h1').waitFor();assert(page.url().endsWith('/auto-detailing'));
  assert.deepEqual(errors,[]);
  assert.deepEqual(externalPhotos,[],'No photos may depend on an external host');
  console.log('PASS all desktop/mobile pages, local images with external photos blocked, dropdown, keyboard controls, gallery pagination and renovation filters');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(error=>{console.error(error);process.exitCode=1});
