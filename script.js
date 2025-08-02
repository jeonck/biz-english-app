// 전역 변수
let allData = [];
let currentSentences = [];
let currentSentenceIndex = 0;
let currentPhase = 0; // 0: 한글, 1: 영어 첫번째, 2: 영어 두번째
let learningTimer = null;
let isPaused = false;
let isLearning = false;
let totalSentencesLearned = 0;

// 타이밍 설정 (밀리초)
const KOREAN_DURATION = 3000;
const ENGLISH_FIRST_DURATION = 2000;
const ENGLISH_SECOND_DURATION = 3000;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
});

// 모든 데이터 로드 (이제 외부 파일에서 가져옴)
function loadAllData() {
    try {
        // data.js에서 데이터 가져오기
        allData = Object.keys(businessEnglishData).map(category => ({
            category: category,
            name: businessEnglishData[category].name,
            data: businessEnglishData[category]
        }));
        
        generateCategoryGrid();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        alert('데이터를 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
    }
}

// 카테고리 그리드 생성
function generateCategoryGrid() {
    const categoryGrid = document.getElementById('categoryGrid');
    
    allData.forEach(categoryData => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = `${categoryData.name} (${categoryData.data.sentences.length}개)`;
        button.onclick = () => startLearning(categoryData.category);
        categoryGrid.appendChild(button);
    });
}

// 학습 시작
function startLearning(selectedCategory) {
    if (selectedCategory === 'all') {
        // 모든 카테고리의 문장들 합치기
        currentSentences = [];
        allData.forEach(categoryData => {
            currentSentences = currentSentences.concat(categoryData.data.sentences);
        });
    } else {
        // 특정 카테고리의 문장들
        const categoryData = allData.find(cat => cat.category === selectedCategory);
        currentSentences = [...categoryData.data.sentences];
    }

    // 문장들을 랜덤하게 섞기
    shuffleArray(currentSentences);
    
    // 학습 상태 초기화
    currentSentenceIndex = 0;
    currentPhase = 0;
    totalSentencesLearned = 0;
    isPaused = false;
    isLearning = true;

    // 화면 전환
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('learningScreen').style.display = 'block';

    // 학습 시작
    showNextSentence();
}

// 배열 섞기 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 다음 문장 표시
function showNextSentence() {
    if (!isLearning || isPaused) return;

    const sentence = currentSentences[currentSentenceIndex];
    const display = document.getElementById('sentenceDisplay');
    const phaseIndicator = document.getElementById('phaseIndicator');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // 페이드 아웃 효과
    display.classList.add('fade-out');
    
    setTimeout(() => {
        display.classList.remove('fade-out');
        
        switch (currentPhase) {
            case 0: // 한글 표시
                display.innerHTML = `<div class="korean-text">${sentence.korean}</div>`;
                phaseIndicator.textContent = '한글 → 영어로 떠올려보세요';
                progressFill.style.transitionDuration = `${KOREAN_DURATION}ms`;
                progressFill.style.width = '33%';
                
                learningTimer = setTimeout(() => {
                    currentPhase = 1;
                    showNextSentence();
                }, KOREAN_DURATION);
                break;

            case 1: // 영어 첫 번째 표시
                display.innerHTML = `<div class="english-text">${sentence.english}</div>`;
                phaseIndicator.textContent = '정답 확인';
                progressFill.style.transitionDuration = `${ENGLISH_FIRST_DURATION}ms`;
                progressFill.style.width = '66%';
                
                learningTimer = setTimeout(() => {
                    currentPhase = 2;
                    showNextSentence();
                }, ENGLISH_FIRST_DURATION);
                break;

            case 2: // 영어 두 번째 표시 (복습)
                display.innerHTML = `<div class="english-text">${sentence.english}</div>`;
                phaseIndicator.textContent = '복습 - 기억해주세요';
                progressFill.style.transitionDuration = `${ENGLISH_SECOND_DURATION}ms`;
                progressFill.style.width = '100%';
                
                learningTimer = setTimeout(() => {
                    // 다음 문장으로 이동
                    totalSentencesLearned++;
                    currentSentenceIndex = (currentSentenceIndex + 1) % currentSentences.length;
                    
                    // 무한 반복을 위해 마지막 문장 후 다시 섞기
                    if (currentSentenceIndex === 0) {
                        shuffleArray(currentSentences);
                    }
                    
                    currentPhase = 0;
                    progressFill.style.width = '0%';
                    progressFill.style.transitionDuration = '0.5s';
                    
                    setTimeout(() => {
                        showNextSentence();
                    }, 500);
                }, ENGLISH_SECOND_DURATION);
                break;
        }

        // 페이드 인 효과
        display.classList.add('fade-in');
        setTimeout(() => {
            display.classList.remove('fade-in');
        }, 500);

        // 진행률 업데이트
        updateProgressText();

    }, 300);
}

// 진행률 텍스트 업데이트
function updateProgressText() {
    const progressText = document.getElementById('progressText');
    progressText.textContent = `학습한 문장: ${totalSentencesLearned}개`;
}

// 일시정지/재개
function pauseResume() {
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (isPaused) {
        // 재개
        isPaused = false;
        pauseBtn.textContent = '일시정지';
        showNextSentence();
    } else {
        // 일시정지
        isPaused = true;
        pauseBtn.textContent = '재개';
        if (learningTimer) {
            clearTimeout(learningTimer);
            learningTimer = null;
        }
        
        // 진행바 일시정지
        const progressFill = document.getElementById('progressFill');
        const currentWidth = progressFill.style.width;
        progressFill.style.transitionDuration = '0s';
        progressFill.style.width = currentWidth;
    }
}

// 문장 건너뛰기
function skipSentence() {
    if (!isLearning) return;
    
    if (learningTimer) {
        clearTimeout(learningTimer);
        learningTimer = null;
    }
    
    // 다음 문장으로 바로 이동
    totalSentencesLearned++;
    currentSentenceIndex = (currentSentenceIndex + 1) % currentSentences.length;
    
    if (currentSentenceIndex === 0) {
        shuffleArray(currentSentences);
    }
    
    currentPhase = 0;
    
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = '0%';
    progressFill.style.transitionDuration = '0.3s';
    
    setTimeout(() => {
        showNextSentence();
    }, 300);
}

// 홈으로 돌아가기
function goHome() {
    if (learningTimer) {
        clearTimeout(learningTimer);
        learningTimer = null;
    }
    
    isLearning = false;
    isPaused = false;
    
    // 화면 전환
    document.getElementById('learningScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    
    // 상태 초기화
    document.getElementById('pauseBtn').textContent = '일시정지';
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = '0%';
    progressFill.style.transitionDuration = '0.3s';
}

// 키보드 단축키
document.addEventListener('keydown', function(event) {
    if (!isLearning) return;
    
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            pauseResume();
            break;
        case 'ArrowRight':
        case 'Enter':
            event.preventDefault();
            skipSentence();
            break;
        case 'Escape':
            event.preventDefault();
            goHome();
            break;
    }
});

// 터치 제스처 (모바일)
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(event) {
    touchStartY = event.changedTouches[0].screenY;
});

document.addEventListener('touchend', function(event) {
    if (!isLearning) return;
    
    touchEndY = event.changedTouches[0].screenY;
    const difference = touchStartY - touchEndY;
    
    // 위로 스와이프 - 건너뛰기
    if (difference > 50) {
        skipSentence();
    }
    // 아래로 스와이프 - 일시정지/재개
    else if (difference < -50) {
        pauseResume();
    }
});

// 화면 방향 변경 대응
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        // 화면 크기 재조정
        window.scrollTo(0, 0);
    }, 100);
});

// 백그라운드에서 포그라운드로 돌아올 때 처리
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isLearning && !isPaused) {
        // 백그라운드로 갈 때 자동으로 일시정지
        pauseResume();
    }
});