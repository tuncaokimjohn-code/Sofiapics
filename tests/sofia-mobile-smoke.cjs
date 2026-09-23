/* Mobile end-to-end smoke test. Runs against a local checkout, never publishes user media. */
const { chromium } = require("playwright");
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const conf = { window: {} };
vm.runInNewContext(fs.readFileSync("config.js", "utf8"), conf);
const pin = conf.window.BIRTHDAY_CONFIG.passcode;

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{width:320,height:640}, {width:360,height:700}, {width:390,height:844}, {width:412,height:915}]) {
      const page = await browser.newPage({ viewport, isMobile:true, hasTouch:true });
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.goto("http://127.0.0.1:8765/", { waitUntil:"load" });
      // Verify referenced local image and proposal assets exist without changing them.
      const missingAssets = await page.evaluate(async () => {
        const paths = [...new Set(Array.from(document.querySelectorAll("img[src],source[src]"))
          .map(el=>el.getAttribute("src")).filter(p=>p && !p.startsWith("data:")))];
        return (await Promise.all(paths.map(async path => {
          const response=await fetch(path,{method:"HEAD"});
          return response.ok ? null : path+" HTTP "+response.status;
        }))).filter(Boolean);
      });
      assert.deepEqual(missingAssets, [], "original photos/proposal media URLs resolve");
      await page.locator("#passcode").fill(pin);
      await page.locator("#scene-hero.active").waitFor({ timeout:12000 });
      assert.equal(await page.locator(".scene.active").count(),1,"single scene after unlock");
      assert.equal(await page.locator("#scene-lock").isVisible(),false,"PIN never remains visible");
      // Palagi is protected. Its iframe must remain mounted when hidden and
      // survive scene changes instead of silently restarting.
      await page.locator("#sound-toggle").dispatchEvent("click");
      await page.locator("#song-sheet.open").waitFor();
      const palagiBefore=await page.locator("#palagi-player").getAttribute("src");
      assert.ok(palagiBefore && palagiBefore.includes("v82VtUUGFqk"),"approved Palagi embed remains");
      await page.locator("#song-hide").dispatchEvent("click");
      assert.equal(await page.locator("#palagi-player").getAttribute("src"),palagiBefore,"hiding preserves player");
      await page.locator('[data-next="story"]').click();
      await page.locator("#scene-story.active").waitFor();
      // The page intentionally fades/slides each full-screen scene into view.
      // Measure final layout only after the current scene has finished moving.
      await page.locator("#scene-story").evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));
      assert.equal(await page.locator("#palagi-player").getAttribute("src"),palagiBefore,
        "Palagi survives scene transition");
      const n = await page.locator(".story-card").count();
      assert.equal(n,8,"all eight memories present");
      for (let i=0;i<n;i++) {
        const card = page.locator(".story-card.active");
        assert.equal(await card.getAttribute("data-story"),String(i),"correct chapter");
        const stage = page.locator("#story-stage");
        await stage.evaluate(el=>{el.scrollTop=el.scrollHeight;});
        const caption=await card.locator(".story-copy").evaluate(el=>{
          const r=el.getBoundingClientRect(),p=el.closest("#story-stage").getBoundingClientRect();
          return {top:r.top,bottom:r.bottom,stageTop:p.top,stageBottom:p.bottom,content:el.textContent.trim(),h:el.scrollHeight};
        });
        assert.ok(caption.content.length>20,"chapter caption present "+i);
        assert.ok(caption.top < caption.stageBottom && caption.bottom>caption.stageTop,
          "chapter caption reachable inside story scroller "+i+": "+JSON.stringify(caption));
        const nav=await page.evaluate(()=>{
          const stage=document.querySelector("#story-stage").getBoundingClientRect();
          const controls=document.querySelector("#scene-story .story-controls").getBoundingClientRect();
          return {stageEnd:stage.bottom,navTop:controls.top,navEnd:controls.bottom,screen:innerHeight};
        });
        assert.ok(nav.navTop>=nav.stageEnd-3 && nav.navEnd<=nav.screen+2,
          "navigation does not overlay captions or leave screen: "+JSON.stringify(nav));
        await page.locator("#story-next").click();
      }
      await page.locator("#scene-chaos.active").waitFor();
      for (const first of await page.locator(".chaos-card").all()) {
        const caption=(await first.locator("figcaption").innerText()).trim();
        // The gallery cards float continuously, so dispatch a genuine
        // DOM click instead of Playwright's permanently unstable click wait.
        await first.locator("img").dispatchEvent("click");
        await page.locator(".photo-lightbox.open").waitFor();
        assert.equal((await page.locator(".photo-lightbox__caption").textContent()).trim(),caption,
          "lightbox uses authored caption for every photo");
        await page.locator(".photo-lightbox__close").dispatchEvent("click");
      }
      await page.locator('[data-next="game-intro"]').click();
      await page.locator("#scene-game-intro.active").waitFor();
      await page.locator("#start-game").click();
      await page.locator("#scene-game.active").waitFor();
      await page.evaluate(()=>{
        window.__scoreMax=0;
        window.__scorePoll=setInterval(()=>{
          window.__scoreMax=Math.max(window.__scoreMax,Number(document.querySelector("#game-score")?.textContent || 0));
        },50);
      });
      await page.locator("#scene-vault.active").waitFor({timeout:40000});
      assert.ok(await page.evaluate(()=>window.__scoreMax<=4),"live game score max four");
      await page.evaluate(()=>clearInterval(window.__scorePoll));
      await page.locator('[data-vault="childhood"]').click();
      let positions=await page.evaluate(()=>{
        const p=document.querySelector(".vault-panel").getBoundingClientRect();
        const b=document.querySelector("#to-cake").getBoundingClientRect();
        return {panelBottom:p.bottom,buttonTop:b.top};
      });
      assert.ok(positions.buttonTop>=positions.panelBottom,"vault button follows childhood panel");
      await page.locator('[data-vault="voice"]').dispatchEvent("click");
      positions=await page.evaluate(()=>{
        const p=document.querySelector(".vault-panel").getBoundingClientRect();
        const b=document.querySelector("#to-cake").getBoundingClientRect();
        return {panelBottom:p.bottom,buttonTop:b.top};
      });
      assert.ok(positions.buttonTop>=positions.panelBottom,"vault button follows voice content");
      await page.locator('[data-vault="letter"]').click();
      positions=await page.evaluate(()=>{
        const p=document.querySelector(".vault-panel").getBoundingClientRect();
        const b=document.querySelector("#to-cake").getBoundingClientRect();
        return {panelBottom:p.bottom,buttonTop:b.top,letter:document.querySelector(".vault-panel").innerText.length};
      });
      assert.ok(positions.letter>300,"birthday letter present");
      assert.ok(positions.buttonTop>=positions.panelBottom,"vault button follows full letter");
      await page.locator("#to-cake").click();
      await page.locator("#scene-cake.active").waitFor();
      await page.locator("#manual-blow").dispatchEvent("pointerdown");
      await page.waitForTimeout(1350);
      await page.locator("#manual-blow").dispatchEvent("pointerup");
      await page.locator("#scene-finale.active").waitFor({timeout:5000});
      assert.equal(await page.locator("#scene-lock").isVisible(),false,"PIN absent at finale");
      assert.equal(await page.locator(".scene.active").count(),1,"single scene at finale");
      assert.equal(await page.locator("#palagi-player").getAttribute("src"),palagiBefore,
        "Palagi player remains mounted through finale");
      assert.deepEqual(errors,[], "no uncaught errors: "+errors.join(" | "));
      console.log("PASS viewport "+viewport.width+"x"+viewport.height+" unlock/story/gallery/game/vault/cake/finale");
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error("FAIL",e); process.exitCode=1;});
