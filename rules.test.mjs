import test from 'node:test';
import assert from 'node:assert/strict';
import {stages,actionFor,feedback} from './dist/rules.mjs';
test('모든 단계에 2분 시작과 5분 확장, 완료 기준 제공',()=>{for(const stage of stages){const small=actionFor(stage),large=actionFor(stage,1);assert.equal(small.minutes,2);assert.equal(large.minutes,5);assert.ok(small.criterion);assert.notEqual(small.title,large.title);}});
test('어려운 행동은 2분으로 재분할',()=>{assert.equal(actionFor(stages[3],1,'크게 느껴져요').minutes,2);assert.match(actionFor(stages[3],1,'크게 느껴져요').criterion,/단어 하나/);});
test('결과별 재시도 피드백',()=>{assert.match(feedback('완료'),/마쳤어요/);assert.match(feedback('일부 진행'),/작은 행동/);assert.match(feedback('시도하지 못함'),/다시 선택/);});
