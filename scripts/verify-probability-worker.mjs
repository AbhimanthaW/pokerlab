// Executes the production worker bundle under Node's worker host. Browser QA remains separate.
import { performance } from "node:perf_hooks";
import { setTimeout, clearTimeout } from "node:timers";
import console from "node:console";
import { Worker } from "node:worker_threads";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const asset = (await readdir("dist/assets")).find((name) => /^lab\.worker-.*\.js$/.test(name));
assert(asset, "Build before verifying the worker");
const url = pathToFileURL(resolve("dist/assets", asset)).href;
const parse = (text) => text.split(" ").map((id) => ({ id, rank: ({ T: 10, J: 11, Q: 12, K: 13, A: 14 })[id[0]] ?? Number(id[0]), suit: ({ c: "clubs", d: "diamonds", h: "hearts", s: "spades" })[id.at(-1)] }));
async function run(mode, cancel = false) {
  const start = performance.now();
  const worker = new Worker(`const {parentPort}=require('node:worker_threads');globalThis.self={postMessage:m=>parentPort.postMessage(m)};import(${JSON.stringify(url)}).then(()=>{parentPort.on('message',data=>self.onmessage({data}));parentPort.postMessage({type:'ready'});});`, { eval: true });
  return new Promise((resolveRun, reject) => {
    let messages = 0;
    const timeout = setTimeout(() => { void worker.terminate(); reject(new Error("Worker deadlock")); }, 15000);
    worker.on("error", (e) => { clearTimeout(timeout); reject(e); });
    worker.on("message", async (data) => {
      if (data.type === "ready") worker.postMessage({ id: 1, mode, seed: 42, samples: cancel ? 100000 : 2000, scenario: { privateCards: parse("Ah Kh"), board: parse("Qh Jh 2c"), unavailable: [] } });
      if (data.type === "progress") { messages++; if (cancel) { await worker.terminate(); clearTimeout(timeout); resolveRun({ mode, cancelled: true, progressMessages: messages, ms: +(performance.now() - start).toFixed(1) }); } }
      if (data.type === "error") { clearTimeout(timeout); await worker.terminate(); reject(new Error(data.message)); }
      if (data.type === "result") {
        clearTimeout(timeout); await worker.terminate(); assert.equal(data.result.counts.reduce((a,b)=>a+b,0),data.result.total);
        assert.equal(data.result.total,mode === "exact" ? 1081 : 2000);
        resolveRun({ mode, total: data.result.total, progressMessages: messages, ms: +(performance.now()-start).toFixed(1) });
      }
    });
  });
}
console.log(JSON.stringify([await run("exact"), await run("simulation"), await run("simulation", true)], null, 2));
