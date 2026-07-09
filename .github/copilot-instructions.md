# Copilot Instructions

## Project Goal

This is a static HTML/CSS/JS project with interactive exercises for Bartlomiej
Maliszewski, "Gramatyka z kultura. Przez osoby". The main goal is correcting
exercise mismatches against the textbook: task wording, answer keys, options,
examples, page references, and navigation.

Use `.sources/Maliszewski__Przez_osoby.pdf` as the primary source and the
`.sources/ch*_book.txt` files as searchable extracted text. If they disagree,
trust the PDF. `PLAN.md` describes the exercise type conventions.

## Exercise Fix Rules

- Fix only the affected exercise and directly related index/navigation entries.
- Preserve existing static-page patterns: `answer-input`, inline `checkAnswers()`,
  `MatchingExercise`, `../style.css`, and `../script.js`.
- Keep exercise text in Polish and preserve Polish diacritics exactly.
- Verify the order of expected answers matches the order of `.answer-input`
  elements.
- For matching exercises, verify both arrays and `correctAnswers` indexes.
- Do not invent content when the textbook is ambiguous.
- Avoid large formatting-only rewrites.

## Commit & Push After Exercise Fixes

After fixing an exercise file or project instruction, immediately commit and push
the change. Use a short, descriptive commit message, for example:

- `fix ch3/ex10: correct verb form`
- `fix ch1/s1_ex3: add missing answer`
- `fix ch2/g1_ex5: update wording`
- `docs: add project maintenance instructions`

No need to ask for confirmation before committing and pushing.
