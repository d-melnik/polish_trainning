#!/usr/bin/env node
/**
 * Static consistency check for exercise answer keys.
 *
 * Catches the classes of bug that make an exercise silently mis-grade:
 *   COUNT   - number of answers does not match number of gradable fields
 *   KEYS    - object-format answers whose keys are not exactly 1..N
 *   OPTION  - a <select> answer that is not one of that select's own options
 *   RADIO   - radio-based items, which checkExercise() cannot grade
 *   PARSE   - the answers literal is not valid JavaScript
 *
 * Usage: node tools/check-answers.js     (exits 1 if anything is wrong)
 */
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const ROOT = path.join(REPO, 'exercises');

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return walk(p);
        return e.isFile() && e.name.endsWith('.html') ? [p] : [];
    });
}

const FIELD_RE = /<(?:input|select)\b[^>]*class="[^"]*\banswer-input\b[^"]*"[^>]*>/gi;
const SELECT_RE = /<select\b[^>]*class="[^"]*\banswer-input\b[^"]*"[^>]*>([\s\S]*?)<\/select>/gi;
const OPTION_RE = /<option\b[^>]*>([\s\S]*?)<\/option>/gi;

const problems = [];
const skipped = [];
let checked = 0;

function add(file, msg) {
    problems.push([file, msg]);
}

for (const file of walk(ROOT)) {
    if (path.basename(file) === 'index.html') continue;

    const rel = path.relative(REPO, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf8');

    if (!html.includes('answer-input')) continue;

    if (html.includes('MatchingExercise') && !html.includes('checkExercise')) {
        skipped.push([rel, 'matching exercise (separate mechanism)']);
        continue;
    }

    const m = html.match(/const answers\s*=\s*([\s\S]*?);\s*\n?\s*checkExercise/);
    if (!m) {
        skipped.push([rel, 'no "const answers" found before checkExercise']);
        continue;
    }

    let answers;
    try {
        answers = new Function('return (' + m[1] + ')')();
    } catch (e) {
        add(rel, 'PARSE: answers literal is not valid JS - ' + e.message);
        continue;
    }
    checked++;

    const fields = html.match(FIELD_RE) || [];
    const radios = fields.filter(f => /type="radio"/i.test(f));

    const isArray = Array.isArray(answers);
    const nAns = isArray ? answers.length : Object.keys(answers).length;

    // Radio groups: checkExercise() reads input.value, which for a radio is its
    // static value= attribute regardless of whether the user selected it.
    if (radios.length) {
        const names = new Set(
            radios.map(r => (r.match(/name="([^"]*)"/) || [])[1]).filter(Boolean)
        );
        add(rel,
            'RADIO: ' + radios.length + ' radio fields carry .answer-input (' +
            names.size + ' questions, ' + nAns + ' answers); checkExercise() cannot grade radios');
        continue;
    }

    if (fields.length !== nAns) {
        add(rel, 'COUNT: ' + fields.length + ' .answer-input fields vs ' + nAns + ' answers');
    }

    if (!isArray) {
        const keys = Object.keys(answers);
        const expect = Array.from({ length: nAns }, (_, i) => String(i + 1));
        if (keys.join(',') !== expect.join(',')) {
            add(rel, 'KEYS: expected 1..' + nAns + ', got ' + keys.join(','));
        }
    }

    // A <select> answer must be one of that select's own option texts,
    // because checkExercise() compares against select.value.
    const selects = [...html.matchAll(SELECT_RE)].map(x => x[1]);
    if (selects.length && selects.length === fields.length) {
        selects.forEach((block, i) => {
            const opts = [...block.matchAll(OPTION_RE)]
                .map(o => o[1].trim())
                .filter(o => o && o !== '—');
            const exp = isArray ? answers[i] : answers[String(i + 1)];
            for (const c of (Array.isArray(exp) ? exp : [exp])) {
                if (c != null && !opts.includes(c)) {
                    add(rel, 'OPTION: item ' + (i + 1) + ' expects ' + JSON.stringify(c) +
                             ', not among its options ' + JSON.stringify(opts));
                }
            }
        });
    }
}

console.log('checked ' + checked + ' exercise pages with inline answers');

if (problems.length) {
    const byFile = new Map();
    for (const [f, msg] of problems) {
        if (!byFile.has(f)) byFile.set(f, []);
        byFile.get(f).push(msg);
    }
    console.log('\n' + problems.length + ' problem(s) in ' + byFile.size + ' file(s):\n');
    for (const [f, msgs] of byFile) {
        console.log('  ' + f);
        for (const msg of msgs) {
            console.log('      ' + (msg.length > 160 ? msg.slice(0, 160) + '...' : msg));
        }
    }
} else {
    console.log('\nNo problems found.');
}

if (skipped.length) {
    const counts = {};
    for (const [, r] of skipped) counts[r] = (counts[r] || 0) + 1;
    console.log('\nnot auto-checkable:');
    for (const [r, c] of Object.entries(counts)) console.log('  ' + r + ': ' + c);
}

process.exit(problems.length ? 1 : 0);
