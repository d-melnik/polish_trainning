# Project Instructions

## Project Goal

This repository contains static interactive exercises for the Polish grammar textbook
Bartlomiej Maliszewski, "Gramatyka z kultura. Przez osoby".

The main maintenance goal is to correct exercises so that their wording, options,
answers, examples, page references, and navigation match the textbook as closely as
possible. Exercise bugs usually mean the implemented exercise does not match the
book or the answer key.

## Source Material

- Treat `.sources/Maliszewski__Przez_osoby.pdf` as the primary source.
- Use `.sources/ch*_book.txt` as searchable extracted text when it is available.
- `PLAN.md` documents the original implementation plan and exercise type patterns.
- If PDF text and extracted text disagree, trust the PDF.
- Do not invent exercise content when the book is ambiguous. Prefer leaving a clear
  note in the exercise or asking for the exact page/exercise reference.

## Repository Shape

- The app is plain static HTML/CSS/JS. There is no build step and no backend.
- Open `exercises/index.html` directly in a browser to use the app.
- Shared assets:
  - `exercises/style.css`
  - `exercises/script.js`
- Exercise pages live under `exercises/chN/`.
- Each exercise page stores its expected answers locally in an inline
  `checkAnswers()` function or in `MatchingExercise` initialization data.

## Exercise Fix Workflow

1. Identify the exact textbook chapter, page, and exercise number.
2. Compare the implemented HTML against the PDF/source text and the answer key.
3. Fix only the affected exercise and any directly required navigation/index entry.
4. Preserve existing UI patterns: `answer-input`, `checkAnswers()`, buttons,
   `result`, and relative links to `../style.css` and `../script.js`.
5. Keep the task text in Polish, matching the textbook when possible.
6. Keep interface labels and warning notes consistent with the existing project.
7. Verify answer order matches the order of `.answer-input` elements exactly.
8. For matching exercises, verify left/right item arrays and `correctAnswers`
   indexes together.
9. After changing an exercise, open or inspect the file enough to confirm the HTML,
   script references, and previous/next/menu links are valid.

## Answer Rules

- Prefer official answer-key values from the textbook.
- If multiple answers are accepted, use an array of accepted strings in the answer
  position, following the existing `checkExercise()` behavior.
- There is exactly one answer per `.answer-input` field, in document order. Never
  include the worked example in the answers: the example is rendered text, not a
  field, so an extra leading entry shifts every item by one.
- Two answer container formats are supported. An array is indexed from 0; an object
  must use string keys `"1".."N"` matching the visible item numbers. Do not mix them.
- For `<select>` items the answer must be the **full option text** (`"c) obwarzanka"`),
  not the bare letter, because `checkExercise()` compares against `select.value`.
- Do not use radio inputs for gradable fields. `checkExercise()` reads `input.value`,
  which for a radio is its static `value=` attribute and ignores the user's choice.
  Use a `<select class="answer-input">` instead.
- Run `node tools/check-answers.js` after changing any exercise; it verifies all of
  the above and exits non-zero on failure.
- Preserve Polish diacritics exactly: `ą ć ę ł ń ó ś ź ż`.
- Do not normalize away punctuation or case unless shared JS explicitly supports it.
- Do not silently change the exercise into a different task type to make checking
  easier.
- If an original exercise depends on images/audio that are not present, keep the
  project's established approach: textual description, warning, or no autocheck
  when a reliable answer cannot be determined.

## Encoding

- Keep files encoded as UTF-8.
- Be careful with PowerShell console mojibake on Windows. Corrupt display in the
  terminal does not necessarily mean the file is corrupt.
- Avoid large formatting-only rewrites of existing HTML files.

## Git

- After fixing an exercise or project instruction, commit and push without asking
  for extra confirmation.
- Use short, specific commit messages, for example:
  - `fix ch3/ex10: correct verb form`
  - `fix ch1/s1_ex3: add missing answer`
  - `docs: add project maintenance instructions`
