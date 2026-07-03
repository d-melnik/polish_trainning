/* ===== PDF Download — exercise results ===== */

/**
 * Dynamically load html2pdf.js from CDN (once).
 * Returns a Promise that resolves when the library is ready.
 */
function loadHtml2Pdf() {
    if (window.html2pdf) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Nie udało się załadować biblioteki PDF.'));
        document.head.appendChild(script);
    });
}

/** Generate a filename from the page title. */
function pdfFilename() {
    return (document.title || 'cwiczenie')
        .replace(/[^\w\s\u00C0-\u024F-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 60);
}

/** Escape HTML entities. */
function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Build a self-contained HTML element for the PDF.
 * Includes its own inline styles so html2pdf renders it correctly.
 */
function buildPdfContent(answers, matchingObj) {
    const chapterTitle = document.querySelector('h1')?.textContent || '';
    const exTitle = document.querySelector('h2')?.textContent || document.title;
    const chapterInfo = document.querySelector('.chapter-info')?.textContent || '';

    const pdfStyles = `
        <style>
            .pdf-page {
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #222;
                line-height: 1.7;
            }
            .pdf-header {
                border-bottom: 3px solid #c0392b;
                padding-bottom: 10px;
                margin-bottom: 14px;
            }
            .pdf-header h1 { font-size: 15px; color: #c0392b; margin: 0 0 4px 0; }
            .pdf-header h2 { font-size: 19px; color: #2c3e50; margin: 0 0 6px 0; }
            .pdf-header .pdf-info { font-size: 12px; color: #777; margin: 0; }
            .pdf-instruction {
                font-style: italic; color: #555;
                margin-bottom: 12px; font-size: 14px;
            }
            .pdf-body { font-size: 14px; }
            .pdf-body p { margin: 4px 0; }
            .pdf-answer {
                display: inline;
                background: #d5f5e3;
                color: #1a7a3a;
                font-weight: bold;
                padding: 1px 5px;
                border-radius: 3px;
                border-bottom: 2px solid #27ae60;
            }
            .pdf-dialog-block {
                background: #f9f9f9;
                border-left: 4px solid #3498db;
                border-radius: 0 5px 5px 0;
                padding: 10px 14px;
                margin: 10px 0;
            }
            .pdf-dialog-block h3 {
                color: #3498db; font-size: 14px; margin: 0 0 6px 0;
            }
            .pdf-match-table {
                width: 100%; border-collapse: collapse; margin: 10px 0;
            }
            .pdf-match-table th {
                background: #2c3e50; color: white;
                padding: 8px 12px; text-align: left; font-size: 13px;
            }
            .pdf-match-table td {
                border: 1px solid #ddd; padding: 7px 12px;
                font-size: 13px; vertical-align: top;
            }
            .pdf-match-table tr:nth-child(even) { background: #f4f6f7; }
            .pdf-match-arrow {
                color: #27ae60; font-weight: bold; text-align: center;
            }
            .pdf-footer {
                margin-top: 20px; padding-top: 8px;
                border-top: 1px solid #ccc;
                font-size: 11px; color: #999;
            }
            .pdf-word-bank {
                background: #eaf2f8; border: 1px dashed #3498db;
                border-radius: 5px; padding: 8px 12px;
                margin: 8px 0; font-size: 13px;
            }
            .pdf-fill-table {
                width: 100%; border-collapse: collapse; margin: 10px 0;
            }
            .pdf-fill-table td, .pdf-fill-table th {
                border: 1px solid #ddd; padding: 8px 10px;
                text-align: center; font-size: 13px;
            }
            .pdf-fill-table th {
                background: #3498db; color: white;
            }
        </style>
    `;

    let html = pdfStyles + '<div class="pdf-page">';

    // ── Header ──
    html += '<div class="pdf-header">';
    html += `<h1>${escHtml(chapterTitle)}</h1>`;
    html += `<h2>${escHtml(exTitle)}</h2>`;
    if (chapterInfo) html += `<p class="pdf-info">${escHtml(chapterInfo)}</p>`;
    html += '</div>';

    if (matchingObj) {
        // ── Matching exercise ──
        const instruction = document.querySelector('.instruction');
        if (instruction) html += `<p class="pdf-instruction">${escHtml(instruction.textContent)}</p>`;

        const correct = matchingObj.correctAnswers;
        const left = matchingObj.leftItems;
        const right = matchingObj.rightItems;

        html += '<table class="pdf-match-table">';
        html += '<tr><th style="width:5%">Nr</th><th style="width:42%">Element</th>';
        html += '<th style="width:6%"></th><th style="width:5%"></th>';
        html += '<th style="width:42%">Odpowiedź</th></tr>';

        for (const [leftIdx, rightIdx] of Object.entries(correct)) {
            const li = parseInt(leftIdx);
            const letter = String.fromCharCode(65 + rightIdx);
            html += `<tr>
                <td><strong>${li}</strong></td>
                <td>${escHtml(left[li])}</td>
                <td class="pdf-match-arrow">→</td>
                <td><strong>${letter}</strong></td>
                <td>${escHtml(right[rightIdx])}</td>
            </tr>`;
        }
        html += '</table>';

    } else if (answers) {
        // ── Fill-in / select exercise ──
        const container = document.querySelector('.exercise-container');
        if (container) {
            const clone = container.cloneNode(true);

            // Remove UI-only elements
            clone.querySelectorAll('.buttons, #result, .result, .no-answers-warning').forEach(el => el.remove());

            // Restyle word-bank
            clone.querySelectorAll('.word-bank').forEach(wb => { wb.className = 'pdf-word-bank'; });

            // Restyle tables
            clone.querySelectorAll('.fill-table').forEach(t => { t.className = 'pdf-fill-table'; });

            // Replace inputs/selects with styled answer spans
            const inputs = clone.querySelectorAll('.answer-input');
            inputs.forEach((input, index) => {
                const answer = answers[index];
                if (!answer) return;
                const displayAnswer = Array.isArray(answer) ? answer[0] : answer;
                const span = document.createElement('span');
                span.className = 'pdf-answer';
                span.textContent = displayAnswer;
                input.replaceWith(span);
            });

            // Restyle dialog blocks
            clone.querySelectorAll('.dialog-block').forEach(db => { db.className = 'pdf-dialog-block'; });

            // Extract instruction separately
            const cloneInstr = clone.querySelector('.instruction');
            if (cloneInstr) {
                html += `<p class="pdf-instruction">${escHtml(cloneInstr.textContent)}</p>`;
                cloneInstr.remove();
            }

            html += '<div class="pdf-body">' + clone.innerHTML + '</div>';
        }
    }

    // ── Footer ──
    html += '<div class="pdf-footer">';
    html += 'Materiały z podręcznika: B. Maliszewski, <em>Gramatyka z kulturą. Przez osoby</em>, Lublin 2023';
    html += ' &bull; polskizkultura.com.pl';
    html += '</div>';
    html += '</div>';

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper;
}

/**
 * Main entry: build styled content → render to PDF via html2pdf.js → download.
 */
function downloadExercisePDF(answers, matchingObj) {
    const btn = document.querySelector('.btn-download');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Generuję…'; }

    loadHtml2Pdf()
        .then(() => {
            const content = buildPdfContent(answers, matchingObj);

            // Temporarily add to DOM (hidden) so html2pdf can measure it
            content.style.position = 'fixed';
            content.style.left = '-9999px';
            content.style.top = '0';
            content.style.width = '180mm';
            document.body.appendChild(content);

            const opt = {
                margin:      [12, 14, 12, 14],
                filename:    pdfFilename() + '.pdf',
                image:       { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:   { mode: ['avoid-all', 'css', 'legacy'] }
            };

            return html2pdf().set(opt).from(content).save().then(() => {
                document.body.removeChild(content);
            });
        })
        .catch(err => {
            console.error(err);
            alert('Błąd: ' + err.message + '\n\nSpróbuj ponownie lub sprawdź połączenie internetowe.');
        })
        .finally(() => {
            if (btn) { btn.disabled = false; btn.innerHTML = '📥 Pobierz PDF'; }
        });
}


/* ===== Auto-inject download button into exercise pages ===== */

document.addEventListener('DOMContentLoaded', function() {
    const buttonsDiv = document.querySelector('.buttons');
    if (!buttonsDiv) return;

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-download';
    downloadBtn.innerHTML = '📥 Pobierz PDF';
    downloadBtn.title = 'Pobierz ćwiczenie z odpowiedziami jako PDF';
    downloadBtn.addEventListener('click', function() {
        if (typeof exercise !== 'undefined' && exercise instanceof MatchingExercise) {
            downloadExercisePDF(null, exercise);
        } else {
            // Capture answers from checkAnswers() closure
            const originalCheck = window.checkExercise;
            let capturedAnswers = null;
            window.checkExercise = function(a) { capturedAnswers = a; };
            try { if (typeof checkAnswers === 'function') checkAnswers(); } catch(e) {}
            window.checkExercise = originalCheck;

            if (capturedAnswers) {
                downloadExercisePDF(capturedAnswers);
            } else {
                alert('Nie udało się pobrać odpowiedzi dla tego ćwiczenia.');
            }
        }
    });

    const clearBtn = buttonsDiv.querySelector('.btn-clear');
    if (clearBtn) {
        clearBtn.insertAdjacentElement('afterend', downloadBtn);
    } else {
        buttonsDiv.insertBefore(downloadBtn, buttonsDiv.firstChild);
    }
});


/* ===== Fill-in exercises ===== */

function checkExercise(answers) {
    const inputs = document.querySelectorAll('.answer-input');
    let correct = 0;
    let total = inputs.length;

    // Remove old corrections
    document.querySelectorAll('.correction').forEach(el => el.remove());

    inputs.forEach((input, index) => {
        const userAnswer = input.value.trim();
        const correctAnswer = answers[index];
        
        input.classList.remove('correct', 'incorrect');
        
        if (!correctAnswer) return;
        
        let isCorrect = false;
        if (Array.isArray(correctAnswer)) {
            isCorrect = correctAnswer.some(a => a.toLowerCase() === userAnswer.toLowerCase());
        } else {
            isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
        }
        
        if (isCorrect) {
            input.classList.add('correct');
            correct++;
        } else {
            input.classList.add('incorrect');
            // Show correct answer next to incorrect input
            const correctionSpan = document.createElement('span');
            correctionSpan.className = 'correction';
            const displayAnswer = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;
            correctionSpan.textContent = ` → ${displayAnswer}`;
            input.parentNode.insertBefore(correctionSpan, input.nextSibling);
        }
    });

    showResult(correct, total);
}

function showResult(correct, total) {
    const resultDiv = document.getElementById('result');
    const percentage = Math.round((correct / total) * 100);
    
    resultDiv.classList.remove('result-good', 'result-partial', 'result-bad');
    resultDiv.classList.add('show');
    
    if (percentage === 100) {
        resultDiv.classList.add('result-good');
        resultDiv.textContent = `Doskonale! Wszystko poprawnie: ${correct}/${total} (${percentage}%)`;
    } else if (percentage >= 60) {
        resultDiv.classList.add('result-partial');
        resultDiv.textContent = `Nieźle! Poprawnych odpowiedzi: ${correct}/${total} (${percentage}%)`;
    } else {
        resultDiv.classList.add('result-bad');
        resultDiv.textContent = `Trzeba powtórzyć. Poprawnych odpowiedzi: ${correct}/${total} (${percentage}%)`;
    }
}

function clearExercise() {
    const inputs = document.querySelectorAll('.answer-input');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('correct', 'incorrect');
    });
    
    document.querySelectorAll('.correction').forEach(el => el.remove());
    
    const resultDiv = document.getElementById('result');
    resultDiv.classList.remove('show');
    resultDiv.textContent = '';
}


/* ===== Matching exercises (click-to-connect) ===== */

class MatchingExercise {
    constructor(containerId, leftItems, rightItems, correctAnswers, prefilledPairs) {
        this.container = document.getElementById(containerId);
        this.leftItems = leftItems;   // array of strings
        this.rightItems = rightItems;  // array of strings
        this.correctAnswers = correctAnswers; // { leftIndex: rightIndex, ... }
        this.prefilledPairs = prefilledPairs || {}; // { leftIndex: rightIndex }
        this.pairs = { ...this.prefilledPairs };
        this.selectedLeft = null;
        this.checked = false;
        this.colors = [
            '#3498db', '#e74c3c', '#27ae60', '#9b59b6', '#f39c12',
            '#1abc9c', '#e67e22', '#2980b9', '#c0392b', '#16a085',
            '#8e44ad'
        ];
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        
        const instruction = document.createElement('p');
        instruction.className = 'matching-instruction';
        instruction.textContent = 'Kliknij element po lewej, następnie pasujący element po prawej, aby połączyć je w parę.';
        this.container.appendChild(instruction);
        
        const grid = document.createElement('div');
        grid.className = 'matching-grid';
        
        const leftCol = document.createElement('div');
        leftCol.className = 'matching-col matching-left';
        
        const rightCol = document.createElement('div');
        rightCol.className = 'matching-col matching-right';
        
        this.leftItems.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'matching-item matching-item-left';
            el.dataset.index = index;
            
            const isPrefilled = this.prefilledPairs.hasOwnProperty(index);
            if (isPrefilled) {
                el.classList.add('prefilled');
            }
            
            if (this.pairs.hasOwnProperty(index)) {
                el.style.borderLeftColor = this.colors[index % this.colors.length];
                el.style.borderLeftWidth = '5px';
                el.classList.add('paired');
            }
            
            if (this.selectedLeft === index) {
                el.classList.add('selected');
            }
            
            el.innerHTML = `<span class="matching-number">${index}</span><span class="matching-text">${item}</span>`;
            
            if (!isPrefilled && !this.checked) {
                el.addEventListener('click', () => this.selectLeft(index));
            }
            
            leftCol.appendChild(el);
        });
        
        this.rightItems.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'matching-item matching-item-right';
            el.dataset.index = index;
            
            // Check if this right item is paired
            let pairedLeftIdx = null;
            for (const [leftIdx, rightIdx] of Object.entries(this.pairs)) {
                if (rightIdx === index) {
                    pairedLeftIdx = parseInt(leftIdx);
                    break;
                }
            }
            
            if (pairedLeftIdx !== null) {
                el.style.borderRightColor = this.colors[pairedLeftIdx % this.colors.length];
                el.style.borderRightWidth = '5px';
                el.classList.add('paired');
            }
            
            const isUsedByPrefilled = Object.entries(this.prefilledPairs)
                .some(([, rIdx]) => rIdx === index);
            if (isUsedByPrefilled) {
                el.classList.add('prefilled');
            }
            
            const letter = String.fromCharCode(65 + index);
            el.innerHTML = `<span class="matching-letter">${letter}</span><span class="matching-text">${item}</span>`;
            
            if (!isUsedByPrefilled && !this.checked) {
                el.addEventListener('click', () => this.selectRight(index));
            }
            
            rightCol.appendChild(el);
        });
        
        grid.appendChild(leftCol);
        grid.appendChild(rightCol);
        this.container.appendChild(grid);
    }

    selectLeft(index) {
        if (this.checked) return;
        
        if (this.selectedLeft === index) {
            // Deselect - also allow removing existing pair
            if (this.pairs.hasOwnProperty(index)) {
                delete this.pairs[index];
            }
            this.selectedLeft = null;
        } else {
            this.selectedLeft = index;
        }
        this.render();
    }

    selectRight(index) {
        if (this.checked) return;
        if (this.selectedLeft === null) return;
        
        // Remove any existing pair that uses this right item (except prefilled)
        for (const [leftIdx, rightIdx] of Object.entries(this.pairs)) {
            if (rightIdx === index && !this.prefilledPairs.hasOwnProperty(parseInt(leftIdx))) {
                delete this.pairs[leftIdx];
            }
        }
        
        this.pairs[this.selectedLeft] = index;
        this.selectedLeft = null;
        this.render();
    }

    check() {
        this.checked = true;
        let correct = 0;
        const totalPairs = Object.keys(this.correctAnswers).length;
        const prefilledCount = Object.keys(this.prefilledPairs).length;
        const total = totalPairs - prefilledCount;
        const errors = [];

        // Remove old corrections
        const oldCorrections = this.container.parentNode.querySelector('.matching-corrections');
        if (oldCorrections) oldCorrections.remove();

        for (const [leftIdx, correctRightIdx] of Object.entries(this.correctAnswers)) {
            const li = parseInt(leftIdx);
            if (this.prefilledPairs.hasOwnProperty(li)) {
                continue; // don't count prefilled
            }
            
            if (this.pairs.hasOwnProperty(li) && this.pairs[li] === correctRightIdx) {
                correct++;
            } else {
                const userLetter = this.pairs.hasOwnProperty(li) 
                    ? String.fromCharCode(65 + this.pairs[li]) 
                    : '—';
                const correctLetter = String.fromCharCode(65 + correctRightIdx);
                errors.push(`<strong>${li}:</strong> twoja odpowiedź «${userLetter}» → poprawnie «${correctLetter}»`);
            }
        }

        // Show errors
        if (errors.length > 0) {
            const correctionsDiv = document.createElement('div');
            correctionsDiv.className = 'matching-corrections';
            correctionsDiv.innerHTML = '<strong>Błędy:</strong><br>' + errors.join('<br>');
            this.container.parentNode.insertBefore(correctionsDiv, this.container.nextSibling);
        }

        // Re-render with color coding
        this.renderChecked();
        showResult(correct, total);
    }

    renderChecked() {
        const leftEls = this.container.querySelectorAll('.matching-item-left');
        const rightEls = this.container.querySelectorAll('.matching-item-right');
        
        for (const [leftIdx, correctRightIdx] of Object.entries(this.correctAnswers)) {
            const li = parseInt(leftIdx);
            if (this.prefilledPairs.hasOwnProperty(li)) continue;
            
            if (this.pairs.hasOwnProperty(li) && this.pairs[li] === correctRightIdx) {
                leftEls[li].classList.add('match-correct');
            } else {
                leftEls[li].classList.add('match-incorrect');
            }
        }
    }

    clear() {
        this.checked = false;
        this.pairs = { ...this.prefilledPairs };
        this.selectedLeft = null;
        
        const oldCorrections = this.container.parentNode.querySelector('.matching-corrections');
        if (oldCorrections) oldCorrections.remove();
        
        const resultDiv = document.getElementById('result');
        resultDiv.classList.remove('show');
        resultDiv.textContent = '';
        
        this.render();
    }
}
