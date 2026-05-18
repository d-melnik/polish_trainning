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
        resultDiv.textContent = `Отлично! Все правильно: ${correct}/${total} (${percentage}%)`;
    } else if (percentage >= 60) {
        resultDiv.classList.add('result-partial');
        resultDiv.textContent = `Неплохо! Правильных ответов: ${correct}/${total} (${percentage}%)`;
    } else {
        resultDiv.classList.add('result-bad');
        resultDiv.textContent = `Нужно повторить. Правильных ответов: ${correct}/${total} (${percentage}%)`;
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
        instruction.textContent = 'Кликните на элемент слева, затем на соответствующий элемент справа, чтобы создать связь.';
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
                errors.push(`<strong>${li}:</strong> ваш ответ «${userLetter}» → правильно «${correctLetter}»`);
            }
        }

        // Show errors
        if (errors.length > 0) {
            const correctionsDiv = document.createElement('div');
            correctionsDiv.className = 'matching-corrections';
            correctionsDiv.innerHTML = '<strong>Ошибки:</strong><br>' + errors.join('<br>');
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
