// Node.js 기본 모듈만 사용하는 브라우저 로직 테스트. 실제 DOM/Flask 검증과는 별개다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../templates/index.html'), 'utf8');
assert.ok(html.indexOf('class="support-banner"') < html.indexOf('id="task-form"'));
assert.ok(html.includes('class="header-support" href="#support"'));
assert.ok(html.includes('<footer><a href="#support">'));
assert.ok(html.includes('id="support"'));
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

class Node {
  constructor(tag = 'div') { this.tag = tag; this.children = []; this.attrs = {}; this.dataset = {}; this.listeners = {}; this.hidden = false; this.disabled = false; this.value = ''; this.maxLength = 1000; }
  set innerHTML(_) { throw new Error('Unsafe HTML assignment'); }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes.flatMap(node => node.tag === 'fragment' ? node.children : [node]); }
  setAttribute(key, value) { this.attrs[key] = value; }
  removeAttribute(key) { delete this.attrs[key]; }
  focus() { this.focused = true; }
  querySelectorAll() { return this.children.flatMap(node => [node, ...node.querySelectorAll()]).filter(node => node.tag === 'button' && node.dataset.refine); }
}
const nodes = new Map();
const document = {
  querySelector: selector => { if (!nodes.has(selector)) nodes.set(selector, new Node()); return nodes.get(selector); },
  createElement: tag => new Node(tag),
  createDocumentFragment: () => new Node('fragment'),
  createTextNode: value => Object.assign(new Node('text'), {textContent:value}),
};
let calls = [];
let nextResponse;
const context = vm.createContext({document, console, setTimeout, clearTimeout, AbortController,
  fetch: (...args) => { calls.push(args); return nextResponse(...args); },
});
vm.runInContext(script, context); // 문법 검사 및 초기 이벤트 등록
const run = source => vm.runInContext(source, context);
const get = selector => document.querySelector(selector);
const valid = {steps:Array.from({length:3}, (_, i) => ({title:`행동 ${i + 1}`, description:'자료 열기', minutes:2, completion_criteria:'자료가 열림'})), feedback:'작게 시작해도 괜찮아요.'};
const ok = data => ({ok:true, json:async () => data});

(async () => {
  get('#task-form').listeners.submit({preventDefault(){}});
  assert.equal(calls.length, 0);
  assert.equal(get('#task').attrs['aria-invalid'], 'true');
  get('#task').value = '가'.repeat(1001);
  get('#task-form').listeners.submit({preventDefault(){}});
  assert.equal(calls.length, 0);

  let resolve;
  nextResponse = () => new Promise(done => { resolve = done; });
  const pending = run("requestSteps('/api/split', {task:'보고서'})");
  assert.equal(get('#submit').disabled, true);
  await run("requestSteps('/api/split', {task:'중복'})");
  assert.equal(calls.length, 1);
  const injection = structuredClone(valid);
  injection.steps[0].title = '<img src=x onerror=alert(1)>';
  resolve(ok(injection));
  await pending;
  assert.equal(get('#cards').children.length, 3);
  assert.equal(get('#cards').children[0].children[1].textContent, injection.steps[0].title);
  assert.equal(get('#submit').disabled, false);
  assert.equal(get('#result-title').focused, true);
  assert.equal(get('#cards').children[0].children[4].children[1].disabled, false);

  nextResponse = async () => ok(valid);
  await get('#cards').children[1].children[4].children[0].listeners.click();
  const [url, options] = calls.at(-1);
  assert.equal(url, '/api/refine');
  assert.equal(JSON.parse(options.body).step.title, '행동 2');
  assert.match(get('#context').textContent, /행동 2/);
  assert.equal(JSON.parse(options.body).task, '보고서');

  nextResponse = () => new Promise(done => { resolve = done; });
  const advance = get('#cards').children[0].children[4].children[1].listeners.click();
  assert.equal(calls.at(-1)[0], '/api/advance');
  assert.equal(JSON.parse(calls.at(-1)[1].body).step.title, '행동 1');
  assert.equal(JSON.parse(calls.at(-1)[1].body).task, '보고서');
  assert.match(get('#status').textContent, /행동 1.*다음 행동/);
  get('#cards').querySelectorAll().forEach(button => assert.equal(button.disabled, true));
  const callCount = calls.length;
  await get('#cards').children[1].children[4].children[1].listeners.click();
  assert.equal(calls.length, callCount);
  resolve(ok(valid));
  await advance;
  assert.match(get('#context').textContent, /행동 1.*조금 더 도전적인 다음 행동/);
  get('#cards').querySelectorAll().forEach(button => assert.equal(button.disabled, false));

  const previousCards = get('#cards').children;
  nextResponse = async () => ({ok:false, json:async () => ({error:{message:'잠시 후 다시 시도해 주세요.'}})});
  await get('#cards').children[0].children[4].children[1].listeners.click();
  assert.equal(get('#error').hidden, false);
  assert.equal(get('#cards').children, previousCards);
  assert.equal(get('#submit').disabled, false);
  assert.equal(get('#task').disabled, false);
  get('#cards').querySelectorAll().forEach(button => assert.equal(button.disabled, false));

  nextResponse = async () => ok({...valid, steps:valid.steps.slice(0, 2)});
  await run("requestSteps('/api/split', {task:'잘못된 결과'})");
  assert.equal(get('#cards').children, previousCards);

  nextResponse = async () => { const error = new Error(); error.name = 'AbortError'; throw error; };
  await run("requestSteps('/api/split', {task:'시간 초과'})");
  assert.match(get('#error').textContent, /응답 시간/);
  assert.equal(get('#submit').disabled, false);

  nextResponse = async () => ok(valid);
  await run("requestSteps('/api/split', {task:'복구'})");
  assert.equal(get('#error').hidden, true);
  assert.equal(get('#cards').children.length, 3);
  console.log('PASS: JS syntax, prominent support links, blank/long input, duplicate prevention, loading, 3-card render, safe text, refine/advance targets, both difficulty buttons, API errors, invalid response, timeout recovery');
})().catch(error => { console.error(error); process.exitCode = 1; });
