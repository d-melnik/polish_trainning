# -*- coding: utf-8 -*-
"""
Проверяет все HTML-упражнения: сравнивает фразы из упражнений с текстом PDF.
"""
import re, pymupdf
from pathlib import Path

PDF = r'.sources\Maliszewski__Przez_osoby.pdf'
EX  = Path('exercises')

doc = pymupdf.open(PDF)
# doc[i].get_text() = страница с 0-индексом; book_page N = doc[N+1]
pdf_text = {}
for i in range(len(doc)):
    pdf_text[i] = doc[i].get_text().lower()

def pages_from_html(content):
    m = re.search(r'class="chapter-info"[^>]*>(.*?)</div>', content, re.DOTALL)
    if not m:
        return []
    nums = re.findall(r'\d+', m.group(1))
    return [int(n) for n in nums if 1 <= int(n) <= 250]

def all_text_from_html(content):
    """
    Извлекает весь текст: и из HTML, и из JS-массивов (для matching-упражнений).
    Возвращает строку в нижнем регистре.
    """
    # JS-строки (одиночные и двойные кавычки)
    js_strings = re.findall(r'["\']([^"\']{15,})["\']', content)
    # Убираем теги из основного HTML (но оставляем содержимое script)
    html_no_tags = re.sub(r'<(?!script|/script)[^>]+>', ' ', content)
    combined = html_no_tags + ' ' + ' '.join(js_strings)
    return combined.lower()

def phrases(text, n=5):
    """n-граммы из нормализованного текста (слова ≥ 4 польских буквы)."""
    words = re.findall(r'[a-ząćęłńóśźż]{4,}', text.lower())
    return set(' '.join(words[i:i+n]) for i in range(len(words)-n+1))

def match_score(html_text, book_pages):
    html_grams = phrases(html_text, 5)
    if not html_grams:
        return 0, 0, 100.0

    pdf_range = set()
    for bp in book_pages:
        for offset in range(-2, 5):   # ±2 страницы запаса
            idx = bp + 1 + offset     # book_page N → doc[N+1]
            if 0 <= idx < len(doc):
                pdf_range.add(idx)

    # Нормализуем PDF так же, как HTML
    combined_pdf_raw = ' '.join(pdf_text[i] for i in pdf_range)
    pdf_grams = phrases(combined_pdf_raw, 5)

    sample = list(html_grams)[:80]
    matched = sum(1 for g in sample if g in pdf_grams)
    pct = matched / len(sample) * 100 if sample else 100.0
    return matched, len(sample), pct

# ── Основной проход ──────────────────────────────────────────────────────────
results = []
for html_file in sorted(EX.glob('ch*/*.html')):
    content = html_file.read_text(encoding='utf-8')
    pages   = pages_from_html(content)
    if not pages:
        continue

    ex_txt = all_text_from_html(content)
    matched, total, pct = match_score(ex_txt, pages)

    results.append(dict(
        file    = html_file.relative_to(EX).as_posix(),
        pages   = ', '.join(f'str.{p}' for p in sorted(set(pages))),
        matched = matched,
        total   = total,
        pct     = pct,
    ))

results.sort(key=lambda r: r['pct'])

BAD   = [r for r in results if r['pct'] <  40]
WARN  = [r for r in results if 40 <= r['pct'] < 65]
OK    = [r for r in results if r['pct'] >= 65]

def print_section(title, rows, symbol):
    print(f'\n{"="*72}')
    print(f'  {symbol}  {title}  ({len(rows)} файлов)')
    print('='*72)
    print(f'  {"Файл":<40} {"Стр":>14}   {"Совп":>6}')
    print('-'*72)
    for r in rows:
        print(f'  {r["file"]:<40} {r["pages"]:>14}   {r["pct"]:5.0f}%')

print_section('ПРОБЛЕМНЫЕ (< 40%) — тексты вероятно выдуманы', BAD,  '❌')
print_section('СОМНИТЕЛЬНЫЕ (40–64%)',                          WARN, '⚠️')
print_section('ОК (≥ 65%)',                                     OK,   '✅')
print(f'\nВсего проверено: {len(results)} файлов')


PDF = r'.sources\Maliszewski__Przez_osoby.pdf'
EX  = Path('exercises')

doc = pymupdf.open(PDF)
# Кэш текста PDF по номеру страницы книги (book_page → text)
# Book page N ≈ doc[N+1] (определено эмпирически из предыдущих сессий)
pdf_text = {}
for i in range(len(doc)):
    pdf_text[i] = doc[i].get_text().lower()

def pages_from_html(content):
    """Извлекает номера страниц книги из chapter-info div."""
    m = re.search(r'class="chapter-info"[^>]*>(.*?)</div>', content, re.DOTALL)
    if not m:
        return []
    nums = re.findall(r'\d+', m.group(1))
    return [int(n) for n in nums if 1 <= int(n) <= 250]

def exercise_text(content):
    """Извлекает весь текст внутри exercise-container (без тегов и скриптов)."""
    # Убираем script/style
    content = re.sub(r'<script.*?</script>', ' ', content, flags=re.DOTALL)
    content = re.sub(r'<style.*?</style>',  ' ', content, flags=re.DOTALL)
    # Берём блок exercise-container
    m = re.search(r'class="exercise-container">(.*)', content, re.DOTALL)
    body = m.group(1) if m else content
    # Убираем теги
    body = re.sub(r'<[^>]+>', ' ', body)
    body = re.sub(r'\s+', ' ', body).strip()
    return body.lower()

def ngrams(text, n=4):
    """Возвращает все n-граммы (последовательности n слов) из текста."""
    words = re.findall(r'[a-ząćęłńóśźż]{3,}', text)
    return [' '.join(words[i:i+n]) for i in range(len(words)-n+1)]

def match_score(html_text, book_pages):
    """
    Берёт n-граммы из HTML-текста и ищет их в PDF-страницах ±2 от указанных.
    Возвращает (matched, total, %).
    """
    grams = ngrams(html_text, 4)
    if not grams:
        return 0, 0, 100.0

    # Диапазон страниц PDF для поиска
    pdf_range = set()
    for bp in book_pages:
        for offset in range(-1, 4):
            idx = bp + offset + 1  # +1 эмпирическая поправка
            if 0 <= idx < len(doc):
                pdf_range.add(idx)

    combined_pdf = ' '.join(pdf_text[i] for i in pdf_range)

    # Проверяем первые 60 n-грамм (репрезентативная выборка)
    sample = grams[:60]
    matched = sum(1 for g in sample if g in combined_pdf)
    pct = matched / len(sample) * 100 if sample else 100.0
    return matched, len(sample), pct

# ── Основной проход ─────────────────────────────────────────────────────────
results = []
for html_file in sorted(EX.glob('ch*/*.html')):
    content = html_file.read_text(encoding='utf-8')
    pages   = pages_from_html(content)
    if not pages:
        continue  # нет ссылки на страницы — пропускаем

    ex_txt = exercise_text(content)
    matched, total, pct = match_score(ex_txt, pages)

    results.append(dict(
        file    = html_file.relative_to(EX).as_posix(),
        pages   = ', '.join(f'str.{p}' for p in sorted(set(pages))),
        matched = matched,
        total   = total,
        pct     = pct,
    ))

results.sort(key=lambda r: r['pct'])

# ── Вывод ────────────────────────────────────────────────────────────────────
BAD   = [r for r in results if r['pct'] <  50]
WARN  = [r for r in results if 50 <= r['pct'] < 75]
OK    = [r for r in results if r['pct'] >= 75]

def print_section(title, rows, symbol):
    print(f'\n{"="*70}')
    print(f'  {symbol}  {title}  ({len(rows)} файлов)')
    print('='*70)
    print(f'  {"Файл":<38} {"Стр":>12}   {"Совп":>6}')
    print('-'*70)
    for r in rows:
        print(f'  {r["file"]:<38} {r["pages"]:>12}   {r["pct"]:5.0f}%')

print_section('ПРОБЛЕМНЫЕ (< 50%) — тексты вероятно выдуманы', BAD,  '❌')
print_section('СОМНИТЕЛЬНЫЕ (50–74%)',                          WARN, '⚠️')
print_section('ОК (≥ 75%)',                                     OK,   '✅')
print(f'\nВсего проверено: {len(results)} файлов')
