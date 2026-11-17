// 문구 톤 검사. archive-design 스킬의 lint-tone 규칙을 JSX/JS 소스에 맞게 옮겼다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RULES = [
  [/의 모든 것/, "'~의 모든 것'"],
  [/핵심은/, "'핵심은'"],
  [/중요합니다|중요하다/, "'중요하다'"],
  [/효과적(인|으로)/, "'효과적인'"],
  [/다양한/, "'다양한'"],
  [/해보세요|하세요!|보세요!/, '권유형 명령'],
  [/[가-힣.]\s*!(?!=)/, '느낌표'],
  [/[\u{1F300}-\u{1FAFF}]/u, '이모지'],
  [/첫째|둘째|셋째/, '서수 나열'],
  [/[가-힣0-9]\s*~\s*[가-힣0-9]/, '물결표'],
  [/놀라운|획기적|비결|꿀팁/, '과장 표현'],
  [/에 대해 알아보|살펴보겠/, '안내문 말투'],
];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|html)$/.test(f) ? [p] : []; });
let bad = 0;
for (const f of [...walk('src'), 'index.html']) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (!/[가-힣]/.test(line) || /^\s*\/\//.test(line)) return;
    for (const [re, label] of RULES) if (re.test(line)) { console.log(`✗ ${f}:${i + 1} ${label} — ${line.trim().slice(0, 90)}`); bad++; }
  });
}
if (bad) { console.log(`\n톤 린트: ${bad}건`); process.exit(1); }
console.log('톤 린트: 통과');
