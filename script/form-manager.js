(function() {
    

    let visitedSteps = JSON.parse(localStorage.getItem("visitedSteps") || "[]");

    

    let currentStep = null;
    let stepEnterTime = null;

    function markStepCompleted(stepName) {
        if (!visitedSteps.includes(stepName)) {
            visitedSteps.push(stepName);
            localStorage.setItem("visitedSteps", JSON.stringify(visitedSteps));
            console.log(`✔ Etapa marcada como concluída: ${stepName}`);
        } else {
            console.log(`ℹ Etapa ${stepName} já estava marcada como concluída`);
        }
    }

    function handleStep(activeStep) {
        const stepName = activeStep.dataset.name;
        if (stepName === currentStep) return;
        currentStep = stepName;
        stepStartTime = Date.now();
        

        const btn = activeStep.querySelector(`[data-btn="${stepName}"]`);
        const countdown = activeStep.querySelector(`[data-countdown="${stepName}"]`);

        

        if (visitedSteps.includes(stepName)) {
            btn.disabled = false;
            if (stepName !== 'cadastro_final') {
                btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
            }
            if (countdown) countdown.textContent = '';
            console.log(`⏩ Delay removido da etapa ${stepName}, botão já liberado.`);
        } else {
            
        }

        btn.addEventListener("click", () => {
            const tempo = ((Date.now() - stepEnterTime) / 1000).toFixed(1);
            
            markStepCompleted(stepName);
        }, { once: true });
    }

    const observer = new MutationObserver(() => {
        const activeStep = document.querySelector(".step.active");
        if (activeStep) handleStep(activeStep);
    });

    observer.observe(document.querySelector("body"), { subtree: true, attributes: true, attributeFilter: ["class"] });

})();

function isStepVisited(stepName) {
    const visitedSteps = JSON.parse(localStorage.getItem("visitedSteps") || "[]");
    return visitedSteps.includes(stepName);
}
const ENABLE_DELAY = 1; // 1 = delay ativado, 0 = delay desativado

const steps = Array.from(document.querySelectorAll('.step')).map(step => step.dataset.name);

const stepNames = steps; // Alias para compatibilidade
let currentStep = steps[0]; // Inicia com o data-name da primeira etapa
let stepTimes = {};
steps.forEach(name => {
    stepTimes[`tempo_${name}`] = 0;
});
let stepStartTime = Date.now();

const USE_MILLISECONDS = 1; // 1 = milissegundos, 0 = segundos

const DELAY_FAQ = 3; // Delay para FAQs e etapas finais (etapas 16-19)
const DELAY_VIDEO_EXPLICACAO = 18; // Etapa 1
const DELAY_VIDEO_INICIAL = 78; // Etapa 2
const DELAY_DEPOIMENTOS = 60; // Etapa 3



function formatTimeSpent(startTime, endTime) {
    const timeDiff = endTime - startTime;
    return USE_MILLISECONDS ? timeDiff : Math.round(timeDiff / 1000);
}

function captureStep19Time() {
    if (stepStartTime && currentStep === 'cadastro_final') {
        const endTime = Date.now();
        const timeSpent = formatTimeSpent(stepStartTime, endTime);
        if (!stepTimes[`tempo_${currentStep}`] || stepTimes[`tempo_${currentStep}`] === 0) {
            stepTimes[`tempo_${currentStep}`] = timeSpent;
        }        
        localStorage.setItem('stepTimes', JSON.stringify(stepTimes));
        console.log(`Tempo Etapa cadastro_final capturado: ${timeSpent}${USE_MILLISECONDS ? 'ms' : 's'}`);
    }
}




// Inicializa stepTimes com valores padrão
stepNames.forEach(name => {
    stepTimes[`tempo_${name}`] = 0;
});

// Carrega dados do localStorage, se existirem, e mescla com valores padrão

if (localStorage.getItem('stepTimes')) {
    const savedTimes = JSON.parse(localStorage.getItem('stepTimes'));
    stepTimes = { ...stepTimes, ...savedTimes };
} else {
    localStorage.setItem('stepTimes', JSON.stringify(stepTimes));
}





const totalSteps = steps.length;

function updateStepIndicator() {
    const visibleTotal = steps.length - 1;
    const currentIndex = steps.indexOf(currentStep);
    document.getElementById('stepIndicator').textContent = `Etapa ${currentIndex} de ${visibleTotal}`;
}


function getStepFromURL() {
if (!steps || steps.length === 0) {
    console.error('Erro: steps não inicializado');
    return;
}
const stepIndex = parseInt(window.location.hash.replace('#', '')) || 0;
if (stepIndex >= 0 && stepIndex < totalSteps) {
    currentStep = stepNames[stepIndex];
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelector(`.step[data-name="${currentStep}"]`).classList.add('active');
    updateStepIndicator();
    // Se a etapa já foi visitada, esconde a mensagem .small-text
    if (isStepVisited(currentStep)) {
        const stepEl = document.querySelector(`.step[data-name="${currentStep}"]`);
        const msg = stepEl ? stepEl.querySelector('.small-text') : null;
        if (msg) msg.style.display = 'none';
    }

    

    stepStartTime = Date.now();
    const setupFunctions = {
        'video_explicacao': setupVideoDelayNew,
        'video_inicial': setupVideoDelay,
        'depoimentos': setupVideoDelay2,
        'dados_pessoais': setupFormDelay,
        'nivel_violao': setupLevelForm,
        'tipo_musica': setupMusicForm,
        'sabe_acorde': setupChordForm,
        'sabe_afinar': setupTuneForm,
        'sabe_ritmo': setupRhythmForm,
        'sabe_musica': setupSongForm,
        'objetivo_violao': setupGoalForm,
        'dificuldade_violao': setupDifficultyForm,
        'videochamada': setupCallForm,
        'disponibilidade_treino': setupTrainingForm,
        'objetivo_semana': setupWeeklyGoalForm,
        'informacoes_extras': setupExtraForm15

    };
    if (setupFunctions[currentStep]) {
        setupFunctions[currentStep]();
    } else if (steps.indexOf(currentStep) >= steps.indexOf('faq_parte1') && steps.indexOf(currentStep) < totalSteps - 1) {
        setupDelay(`btn_${currentStep}`, `countdown_${currentStep}`, currentStep);
    } else if (currentStep === 'cadastro_final') {
        const btn = document.querySelector(`[data-btn="${currentStep}"]`);
        if (btn) btn.disabled = false;
    }
}
}

function nextStep() {
    document.querySelectorAll('video').forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
    if (stepStartTime && stepNames.includes(currentStep)) {
        const endTime = Date.now();
        const timeSpent = formatTimeSpent(stepStartTime, endTime);
        if (!stepTimes[`tempo_${currentStep}`] || stepTimes[`tempo_${currentStep}`] === 0) {
            stepTimes[`tempo_${currentStep}`] = timeSpent; // só salva na primeira vez
        }        
        localStorage.setItem('stepTimes', JSON.stringify(stepTimes));
        console.log(`Tempo Etapa ${currentStep} capturado: ${timeSpent}${USE_MILLISECONDS ? 'ms' : 's'}`);
    }
    if (currentStep !== 'cadastro_final') {
        const nextStepIndex = stepNames.indexOf(currentStep) + 1;
        let nextStep = stepNames[nextStepIndex] || currentStep;

        // 🔒 Pular sabe_musica caso não tenha marcado SIM em acorde e ritmo
        if (nextStep === "sabe_musica") {
            const formData = JSON.parse(localStorage.getItem("formData") || "{}");
            const sabeAcorde = formData.sabe_acorde?.sabeAcorde;
            const sabeRitmo = formData.sabe_ritmo?.sabeRitmo;
            if (sabeAcorde !== "sim" || sabeRitmo !== "sim") {
                nextStep = stepNames[nextStepIndex + 1]; // pula direto
            }
        }

        console.log(`Próxima etapa a ser salva: ${nextStep}`);
        submissionManager.saveIncompleteSubmission(nextStep, stepTimes);
        // Esconder etapa atual e mostrar próxima
        const currentElement = document.querySelector(`[data-name="${currentStep}"]`);
        const nextElement = document.querySelector(`[data-name="${nextStep}"]`);
        if (currentElement && nextElement) {
            currentElement.classList.remove('active');
            currentElement.style.display = 'none';
            nextElement.classList.add('active');
            nextElement.style.display = 'block';
            currentStep = nextStep;
            stepStartTime = Date.now();
            updateStepIndicator();
            // Configurar próxima etapa
            const setupFunctions = {
                'video_explicacao': setupVideoDelayNew,
                'video_inicial': setupVideoDelay,
                'depoimentos': setupVideoDelay2,
                'dados_pessoais': setupFormDelay,
                'nivel_violao': setupLevelForm,
                'tipo_musica': setupMusicForm,
                'sabe_acorde': setupChordForm,
                'sabe_afinar': setupTuneForm,
                'sabe_ritmo': setupRhythmForm,
                'sabe_musica': setupSongForm,
                'objetivo_violao': setupGoalForm,
                'dificuldade_violao': setupDifficultyForm,
                'videochamada': setupCallForm,
                'disponibilidade_treino': setupTrainingForm,
                'objetivo_semana': setupWeeklyGoalForm,
                'informacoes_extras': setupExtraForm15
            };
            if (setupFunctions[nextStep]) {
                setupFunctions[nextStep]();
            } else if (stepNames.indexOf(nextStep) >= stepNames.indexOf('faq_parte1') && nextStep !== 'cadastro_final') {
                setupDelay(`btn_${nextStep}`, `countdown_${nextStep}`, nextStep);
            }
            // Se a etapa já foi visitada, habilitar botão
            if (isStepVisited(nextStep) && nextStep !== 'cadastro_final') {
                const btn = document.querySelector(`[data-btn="${nextStep}"]`);
                const countdown = document.querySelector(`[data-countdown="${nextStep}"]`);
                if (btn) {
                    btn.disabled = false;
                    btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
                }
                if (countdown) {
                    countdown.textContent = '';
                }
                const msg = document.querySelector(`[data-name="${nextStep}"] .small-text`);
                if (msg) msg.style.display = 'none';
            }
            // Tocar vídeo da próxima etapa, se houver (exceto vídeos dentro de toggles escondidos)
            const activeVideo = nextElement.querySelector('video');
            if (activeVideo) {
                // Verifica se o vídeo está dentro de um container escondido (display: none)
                const parentContainer = activeVideo.closest('[data-video]');
                const isHidden = parentContainer && window.getComputedStyle(parentContainer).display === 'none';
                
                if (!isHidden) {
                    setTimeout(() => activeVideo.play(), 100);
                }
            }
        } else {
            console.error(`Erro: Elemento não encontrado - currentStep: ${currentStep}, nextStep: ${nextStep}`);
        }
    }
}




function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}






function scrollTextareaToTop(textarea) {
    textarea.addEventListener('input', () => {
        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPosition);
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: ${textarea.offsetWidth}px;
            font: ${getComputedStyle(textarea).font};
            padding: ${getComputedStyle(textarea).padding};
            white-space: pre-wrap;
            line-height: ${getComputedStyle(textarea).lineHeight};
            border: ${getComputedStyle(textarea).border};
        `;
        tempDiv.textContent = textBeforeCursor + '\n';
        document.body.appendChild(tempDiv);
        const cursorY = tempDiv.getBoundingClientRect().height;
        document.body.removeChild(tempDiv);
        const textareaRect = textarea.getBoundingClientRect();
        const offsetFromTop = textareaRect.top + window.scrollY;
        window.scrollTo({
            top: offsetFromTop + cursorY - 50, // Mantém o cursor ~50px abaixo do topo
            behavior: 'smooth'
        });
    });
}

function setupVideoDelay() {
    const btn = document.querySelector('[data-btn="video_inicial"]');
    const countdown = document.querySelector('[data-countdown="video_inicial"]');
    const video = document.querySelector('[data-video="video_inicial"]');
    const step = document.querySelector('.step[data-name="video_inicial"]');
    if (isStepVisited('video_inicial')) {
        btn.disabled = false;
        countdown.textContent = '';
        btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        return;
    }
    let timeLeft = DELAY_VIDEO_INICIAL;
    
    if (!ENABLE_DELAY) {
        btn.disabled = false;
        countdown.textContent = '';
        btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        return;
    }
    
    
    btn.disabled = true;
    
    const timer = setInterval(() => {
        countdown.textContent = `Botão liberado em ${timeLeft}s`;
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timer);
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        }
    }, 1000);

    // Opcional: acelerar se o vídeo for assistido
    video.addEventListener('ended', () => {
        if (timeLeft > 5) {
            timeLeft = 5;
        }
    });
}

function setupVideoDelayNew() {
    const btn = document.querySelector('[data-btn="video_explicacao"]');
    const countdown = document.querySelector('[data-countdown="video_explicacao"]');
    const video = document.querySelector('.step[data-name="video_explicacao"] video');
    const step = document.querySelector('.step[data-name="video_explicacao"]');
    if (isStepVisited('video_explicacao')) {
        btn.disabled = false;
        countdown.textContent = '';
        btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        return;
    }
    let timeLeft = DELAY_VIDEO_EXPLICACAO;
    
    if (!ENABLE_DELAY) {
        btn.disabled = false;
        countdown.textContent = '';
        btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        return;
    }
    
    
    btn.disabled = true;
    
    const timer = setInterval(() => {
        countdown.textContent = `Botão liberado em ${timeLeft}s`;
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timer);
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        }
    }, 1000);
    
    video.addEventListener('ended', () => {
        if (timeLeft > 5) {
            timeLeft = 5;
        }
    });
    
    video.addEventListener('play', function() {
        this.muted = false;
    });
}


function setupVideoDelay2() {
    const btn = document.querySelector('[data-btn="depoimentos"]');
    const countdown = document.querySelector('[data-countdown="depoimentos"]');
    const video = document.querySelector('[data-video="depoimentos"]');
    const step = document.querySelector('.step[data-name="depoimentos"]');
    if (isStepVisited('depoimentos')) {
        btn.disabled = false;
        countdown.textContent = '';
        btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        return;
    }
    let timeLeft = DELAY_DEPOIMENTOS;
    
    if (!ENABLE_DELAY) {
        btn.disabled = false;
        countdown.textContent = '';
        btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        return;
    }

    
    btn.disabled = true;
    
    const timer = setInterval(() => {
        countdown.textContent = `Botão liberado em ${timeLeft}s`;
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timer);
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        }
    }, 1000);

    // Opcional: acelerar se o vídeo for assistido
    video.addEventListener('ended', () => {
        if (timeLeft > 5) {
            timeLeft = 5;
        }
    });
}

function setupDelay(buttonId, countdownId, stepName) {
    const btn = document.querySelector(`[data-btn="${stepName}"]`);
    const countdown = document.querySelector(`[data-countdown="${stepName}"]`);
    const step = document.querySelector(`.step[data-name="${stepName}"]`);
    if (!btn) {
        console.error(`Erro: Botão ${buttonId} não encontrado`);
        return;
    }
    if (!countdown) {
        console.error(`Erro: Elemento ${countdownId} não encontrado`);
        return;
    }
    if (isStepVisited(stepName)) {
        btn.disabled = false;
        countdown.textContent = '';
        btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        return;
    }
    let timeLeft = DELAY_FAQ;
    
    if (!ENABLE_DELAY) {
        btn.disabled = false;
        countdown.textContent = '';
        btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        return;
    }
    btn.disabled = true;
    
    const timer = setInterval(() => {
        countdown.textContent = `Botão liberado em ${timeLeft}s`;
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timer);
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        }
    }, 1000);
}

// Inicializar
updateStepIndicator();

// Prevenir scroll horizontal
document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Scroll suave entre seções
window.addEventListener('beforeunload', function() {
    window.scrollTo(0, 0);
});

function toggleScroll() {
    const body = document.body;
    const container = document.querySelector('.container');
    const footer = document.querySelector('.footer');
    const contentHeight = container.offsetHeight + footer.offsetHeight;
    const windowHeight = window.innerHeight;

    if (contentHeight <= windowHeight) {
        body.style.overflowY = 'hidden';
    } else {
        body.style.overflowY = 'auto';
    }
}

window.addEventListener('load', toggleScroll);
window.addEventListener('resize', toggleScroll);

function updateFooterPosition() {
    const container = document.querySelector('.container');
    const footer = document.querySelector('.footer');
    container.style.minHeight = `calc(100vh - ${footer.offsetHeight}px)`;
}

window.addEventListener('load', updateFooterPosition);
window.addEventListener('resize', updateFooterPosition);

document.querySelector('[data-video="video_explicacao"]').addEventListener('play', function() {
    this.muted = false;
});

document.querySelector('[data-video="video_inicial"]').addEventListener('play', function() {
    this.muted = false;
});

document.querySelector('[data-video="depoimentos"]').addEventListener('play', function() {
    this.muted = false;
});

getStepFromURL();
window.addEventListener('hashchange', getStepFromURL);


function setupFormDelay() {
    const btn = document.querySelector('[data-btn="dados_pessoais"]');
    const countdown = document.querySelector('[data-countdown="dados_pessoais"]');
    const form = document.querySelector('[data-form="dados_pessoais"]');
    const inputs = form.querySelectorAll('input');
    
  
    btn.disabled = true;
    // Chamar validação inicial para dados restaurados
    if (typeof validateForm === "function") {
        validateForm();
    } else if (typeof checkForm === "function") {
        checkForm();
    }

    function validateForm() {
        const name = document.getElementById('nome').value.trim();
        const whatsapp = document.getElementById('whatsapp').value.trim();
        const age = parseInt(document.getElementById('idade').value.trim(), 10);

        const mensagemValidacao = document.getElementById('mensagemValidacao');
        const btn = document.querySelector('[data-btn="dados_pessoais"]');

        
        const nameRegex = /^[A-Za-zÀ-ÿ\s]{3,}$/;
        const whatsappRegex = /^\d{10,11}$/;
        
        let showError = false;
        
        // Verifica se há números no nome (quando o campo não está vazio)
        if (name && !nameRegex.test(name)) {
            showError = true;
        }
        
        // Verifica se o WhatsApp é inválido (quando o campo não está vazio)
        if (whatsapp && !whatsappRegex.test(whatsapp)) {
            showError = true;
        }
        
        // Verifica se a idade é menor que 40 ou tem 3 dígitos (quando o campo não está vazio)
        if (!isNaN(age) && (age < 40 || age > 99)) {

            showError = true;
        }
        
        const isValid = nameRegex.test(name) && whatsappRegex.test(whatsapp) && !isNaN(age) && age >= 40 && age <= 99;

        
        btn.disabled = !isValid;
        
        mensagemValidacao.classList.toggle('is-visible', showError);





        
        if (isValid) {
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        }
    }
    
    inputs.forEach(input => input.addEventListener('input', validateForm));
    validateForm(); // Chama a validação inicial
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            nome: document.getElementById('nome').value,
            whatsapp: document.getElementById('whatsapp').value,
            idade: document.getElementById('idade').value
        };
        saveToSession('dados_pessoais', formData);
        nextStep();
    });
}

function setupLevelForm() {
    const btn = document.querySelector('[data-btn="nivel_violao"]');
    const countdown = document.querySelector('[data-countdown="nivel_violao"]');
    const form = document.querySelector('[data-form="nivel_violao"]');
    const customLevel = document.getElementById('nivelPersonalizado');
    const customLevelText = document.getElementById('textoNivelPersonalizado');
    const radios = form.querySelectorAll('input[name="nivel"]');
   

    btn.disabled = true;
    
    function checkForm() {
        const isSelected = Array.from(radios).some(radio => radio.checked);
        const isCustomValid = !customLevel.checked || (customLevel.checked && customLevelText.value.trim() !== '');
        if (isSelected && isCustomValid) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = customLevel.checked ? 'Descreva seu nível' : 'Selecione uma opção';
        }
    }
    
    radios.forEach(radio => radio.addEventListener('change', () => {
        customLevelText.style.display = radio.value === 'personalizado' ? 'block' : 'none';
        checkForm();
    }));
    
    customLevelText.addEventListener('input', () => {
        customLevelText.style.height = 'auto';
        customLevelText.style.height = `${customLevelText.scrollHeight}px`;
        checkForm();
    });

    scrollTextareaToTop(customLevelText);
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const levelData = {
            nivel: form.querySelector('input[name="nivel"]:checked').value,
            nivel_personalizado: customLevel.checked ? sanitizeInput(customLevelText.value) : ''
        };
        saveToSession('nivel_violao', levelData);
        nextStep();
    });
    // 🔑 Inicializa visibilidade e validação com dados restaurados
    const selectedLevel = form.querySelector('input[name="nivel"]:checked');
    if (selectedLevel) {
    customLevelText.style.display = selectedLevel.value === 'personalizado' ? 'block' : 'none';
    }
    checkForm();

}

function setupMusicForm() {
    const btn = document.querySelector('[data-btn="tipo_musica"]');
    const countdown = document.querySelector('[data-countdown="tipo_musica"]');
    const form = document.querySelector('[data-form="tipo_musica"]');
    const radios = form.querySelectorAll('input[name="musica"]');
    const otherMusic = document.getElementById('outraMusica');
    const otherMusicText = document.getElementById('textoOutraMusica');
  
    
    btn.disabled = true;
    
    function checkForm() {
        const isSelected = Array.from(radios).some(radio => radio.checked);
        const isOtherValid = !otherMusic.checked || (otherMusic.checked && otherMusicText.value.trim() !== '');
        if (isSelected && isOtherValid) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = otherMusic.checked ? 'Especifique o tipo de música' : 'Selecione uma opção';
        }
    }
    
    radios.forEach(radio => radio.addEventListener('change', () => {
        otherMusicText.style.display = radio.value === 'outro' ? 'block' : 'none';
        checkForm();
    }));
    
    otherMusicText.addEventListener('input', checkForm);

    otherMusicText.addEventListener('input', () => {
        otherMusicText.style.height = 'auto';
        otherMusicText.style.height = `${otherMusicText.scrollHeight}px`;
    });
    scrollTextareaToTop(otherMusicText);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const musicData = {
            musica: form.querySelector('input[name="musica"]:checked').value,
            musica_personalizada: otherMusic.checked ? sanitizeInput(otherMusicText.value) : ''
        };
        saveToSession('tipo_musica', musicData);
        nextStep();
    });
    // 🔑 Inicializa visibilidade e validação com dados restaurados
    const selectedMusic = form.querySelector('input[name="musica"]:checked');
    if (selectedMusic) {
    otherMusicText.style.display = selectedMusic.value === 'outro' ? 'block' : 'none';
    }
    checkForm();

}

function toggleVideo(videoName) {
    const videoContainer = document.querySelector(`[data-video="${videoName}"]`);
    if (!videoContainer) {
        console.error(`Erro: Contêiner de vídeo ${videoName} não encontrado`);
        return;
    }
    const label = Array.from(document.querySelectorAll('label')).find(l => 
        l.querySelector(`button[onclick="toggleVideo('${videoName}')"]`)
    );
    if (!label || !label.querySelector('button')) {
        console.error(`Erro: Label ou botão para o vídeo ${videoName} não encontrado`);
        return;
    }
    const button = label.querySelector('button');
    const triangle = button.querySelector('.triangle');
    const video = videoContainer.querySelector('video');
    if (!video) {
        console.error(`Erro: Vídeo ${videoName} não encontrado no contêiner`);
        return;
    }
    videoContainer.style.display = videoContainer.style.display === 'none' ? 'block' : 'none';
    if (videoContainer.style.display === 'none') {
        video.pause();
        video.currentTime = 0;
    }
    if (triangle) {
        triangle.className = videoContainer.style.display === 'block' ? 'triangle triangle-up' : 'triangle triangle-down';
    }
    button.textContent = videoContainer.style.display === 'block' ? 'Fechar vídeo ' : 'Ver ritmo ';
    if (triangle) {
        const newTriangle = document.createElement('span');
        newTriangle.className = videoContainer.style.display === 'block' ? 'triangle triangle-up' : 'triangle triangle-down';
        button.appendChild(newTriangle);
    }
}

function setupExtraForm15() {
    const btn = document.querySelector('[data-btn="informacoes_extras"]');
    const countdown = document.querySelector('[data-countdown="informacoes_extras"]');
    const form = document.querySelector('[data-form="informacoes_extras"]');
    const radios = form.querySelectorAll('input[name="extra"]');
    const extraYes = document.getElementById('extraSim');
    const extraText = document.getElementById('textoExtra');
  
    btn.disabled = true;
    
    function checkForm() {
        const isSelected = Array.from(radios).some(radio => radio.checked);
        const isYesValid = !extraYes.checked || (extraYes.checked && extraText.value.trim() !== '');
        if (isSelected && isYesValid) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = extraYes.checked ? 'Escreva sua informação' : 'Selecione uma opção';
        }
    }
    
    radios.forEach(radio => radio.addEventListener('change', () => {
        extraText.style.display = radio.value === 'sim' ? 'block' : 'none';
        checkForm();
    }));
    
    extraText.addEventListener('input', () => {
        extraText.style.height = 'auto';
        extraText.style.height = `${extraText.scrollHeight}px`;
        checkForm();
    });
    scrollTextareaToTop(extraText);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const extraData = {
            resposta: form.querySelector('input[name="extra"]:checked').value,
            texto_extra: extraYes.checked ? sanitizeInput(extraText.value) : ''
        };
        saveToSession('informacoes_extras', extraData);
        nextStep();
    });
    // 🔑 Inicializa visibilidade e validação com dados restaurados
    const selectedExtra = form.querySelector('input[name="extra"]:checked');
    if (selectedExtra) {
    extraText.style.display = selectedExtra.value === 'sim' ? 'block' : 'none';
    }
    checkForm();

}

function setupChordForm() {
    const btn = document.querySelector('[data-btn="sabe_acorde"]');
    const countdown = document.querySelector('[data-countdown="sabe_acorde"]');
    const form = document.querySelector('[data-form="sabe_acorde"]');
    const sabeAcordeSim = document.getElementById('sabeAcordeSim');
    const acordesOptions = document.getElementById('acordesOptions');
    const acordePersonalizado = document.getElementById('acordePersonalizado');
    const textoAcordePersonalizado = document.getElementById('textoAcordePersonalizado');
    const radios = form.querySelectorAll('input[name="sabeAcorde"]');
    const tipoAcordeRadios = form.querySelectorAll('input[name="tipoAcorde"]');
   
    btn.disabled = true;

    function checkForm() {
        const isSabeAcordeSelected = Array.from(radios).some(radio => radio.checked);
        const isTipoAcordeValid = !sabeAcordeSim.checked || Array.from(tipoAcordeRadios).some(radio => radio.checked);
        const isCustomValid = !acordePersonalizado.checked || (acordePersonalizado.checked && textoAcordePersonalizado.value.trim() !== '');
        if (isSabeAcordeSelected && (!sabeAcordeSim.checked || (isTipoAcordeValid && isCustomValid))) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = sabeAcordeSim.checked ? (acordePersonalizado.checked ? 'Descreva os acordes' : 'Selecione uma opção de acorde') : 'Selecione uma opção';
        }
    }

    radios.forEach(radio => radio.addEventListener('change', () => {
        acordesOptions.style.display = radio.value === 'sim' ? 'block' : 'none';
        checkForm();
    }));

    tipoAcordeRadios.forEach(radio => radio.addEventListener('change', () => {
        textoAcordePersonalizado.style.display = radio.value === 'personalizado' ? 'block' : 'none';
        checkForm();
    }));

    textoAcordePersonalizado.addEventListener('input', () => {
        textoAcordePersonalizado.style.height = 'auto';
        textoAcordePersonalizado.style.height = `${textoAcordePersonalizado.scrollHeight}px`;
        checkForm();
    });
    scrollTextareaToTop(textoAcordePersonalizado);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const chordData = {
            sabeAcorde: form.querySelector('input[name="sabeAcorde"]:checked').value,
            tipoAcorde: sabeAcordeSim.checked ? form.querySelector('input[name="tipoAcorde"]:checked')?.value || '' : '',
            acordePersonalizado: acordePersonalizado.checked ? sanitizeInput(textoAcordePersonalizado.value) : ''
        };
        saveToSession('sabe_acorde', chordData);
        nextStep();
    });
    // 🔑 Inicializa visibilidade e validação com dados restaurados
    acordesOptions.style.display = sabeAcordeSim.checked ? 'block' : 'none';
    const selectedTipo = form.querySelector('input[name="tipoAcorde"]:checked');
    if (selectedTipo) {
    textoAcordePersonalizado.style.display = selectedTipo.value === 'personalizado' ? 'block' : 'none';
    }
    checkForm();

}

function setupTuneForm() {
    const btn = document.querySelector('[data-btn="sabe_afinar"]');
    const countdown = document.querySelector('[data-countdown="sabe_afinar"]');
    const form = document.querySelector('[data-form="sabe_afinar"]');
    const radios = form.querySelectorAll('input[name="sabeAfinar"]');
   
    btn.disabled = true;

    function checkForm() {
        if (Array.from(radios).some(radio => radio.checked)) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = 'Selecione uma opção';
        }
    }

    radios.forEach(radio => radio.addEventListener('change', checkForm));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const tuneData = {
            sabeAfinar: form.querySelector('input[name="sabeAfinar"]:checked').value
        };
        saveToSession('sabe_afinar', tuneData);
        nextStep();
    });
    // 🔑 Inicializa validação com dados restaurados
    checkForm();
}

function setupRhythmForm() {
    const btn = document.querySelector('[data-btn="sabe_ritmo"]');
    const countdown = document.querySelector('[data-countdown="sabe_ritmo"]');
    const form = document.querySelector('[data-form="sabe_ritmo"]');
    const sabeRitmoSim = document.getElementById('sabeRitmoSim');
    const ritmosOptions = document.getElementById('ritmosOptions');
    const ritmoPersonalizado = document.getElementById('ritmoPersonalizado');
    const textoRitmoPersonalizado = document.getElementById('textoRitmoPersonalizado');
    const radios = form.querySelectorAll('input[name="sabeRitmo"]');
    const checkboxes = form.querySelectorAll('input[name="ritmo"]');
    const ritmoPersonalizadoRadio = form.querySelector('input[name="ritmoPersonalizado"]');
   
    btn.disabled = true;

    function checkForm() {
        const isSabeRitmoSelected = Array.from(radios).some(radio => radio.checked);
        let isValid = isSabeRitmoSelected;
        if (sabeRitmoSim.checked) {
            const isRitmoChecked = Array.from(checkboxes).some(cb => cb.checked);
            const isCustomValid = !ritmoPersonalizado.checked || (ritmoPersonalizado.checked && textoRitmoPersonalizado.value.trim() !== '');
            isValid = isRitmoChecked || (ritmoPersonalizado.checked && isCustomValid);
        }
        if (isValid) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = sabeRitmoSim.checked ? (ritmoPersonalizado.checked ? 'Descreva os ritmos' : 'Selecione pelo menos um ritmo ou escreva') : 'Selecione uma opção';
        }
    }

    radios.forEach(radio => radio.addEventListener('change', () => {
        ritmosOptions.style.display = radio.value === 'sim' ? 'block' : 'none';
        textoRitmoPersonalizado.style.display = 'none';
        ritmoPersonalizado.checked = false; // Desmarcar rádio personalizado ao mudar sabeRitmo
        checkForm();
    }));

    checkboxes.forEach(cb => cb.addEventListener('change', checkForm));

    ritmoPersonalizadoRadio.addEventListener('change', () => {
        textoRitmoPersonalizado.style.display = ritmoPersonalizado.checked ? 'block' : 'none';
        checkForm();
    });

    textoRitmoPersonalizado.addEventListener('input', () => {
        textoRitmoPersonalizado.style.height = 'auto';
        textoRitmoPersonalizado.style.height = `${textoRitmoPersonalizado.scrollHeight}px`;
        checkForm();
    });

    scrollTextareaToTop(textoRitmoPersonalizado);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ritmos = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        const rhythmData = {
            sabeRitmo: form.querySelector('input[name="sabeRitmo"]:checked').value,
            ritmos: ritmos,
            ritmoPersonalizado: ritmoPersonalizado.checked ? sanitizeInput(textoRitmoPersonalizado.value) : ''
        };
        saveToSession('sabe_ritmo', rhythmData);
        nextStep();
    });
    // 🔑 Inicializa visibilidade e validação com dados restaurados
    ritmosOptions.style.display = sabeRitmoSim.checked ? 'block' : 'none';
    textoRitmoPersonalizado.style.display = ritmoPersonalizado.checked ? 'block' : 'none';
    checkForm();

}

function setupSongForm() {
    const btn = document.querySelector('[data-btn="sabe_musica"]');
    const countdown = document.querySelector('[data-countdown="sabe_musica"]');
    const form = document.querySelector('[data-form="sabe_musica"]');
    const sabeMusicaSim = form.querySelector('input[value="sim"]');
    const textoMusica = document.getElementById('textoMusica');
    const radios = form.querySelectorAll('input[name="sabeMusica"]');
   
    btn.disabled = true;

    function checkForm() {
        const isSelected = Array.from(radios).some(radio => radio.checked);
        const isTextValid = !sabeMusicaSim.checked || (sabeMusicaSim.checked && textoMusica.value.trim() !== '');
        if (isSelected && isTextValid) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = sabeMusicaSim.checked ? 'Descreva as músicas' : 'Selecione uma opção';
        }
    }

    radios.forEach(radio => radio.addEventListener('change', () => {
        textoMusica.style.display = radio.value === 'sim' ? 'block' : 'none';
        checkForm();
    }));

    textoMusica.addEventListener('input', () => {
        textoMusica.style.height = 'auto';
        textoMusica.style.height = `${textoMusica.scrollHeight}px`;
        checkForm();
    });
    scrollTextareaToTop(textoMusica);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const songData = {
            sabeMusica: form.querySelector('input[name="sabeMusica"]:checked').value,
            musicas: sabeMusicaSim.checked ? sanitizeInput(textoMusica.value) : ''
        };
        saveToSession('sabe_musica', songData);
        nextStep();
    });
    // 🔑 Inicializa visibilidade e validação com dados restaurados
    const selectedSabeMusica = form.querySelector('input[name="sabeMusica"]:checked');
    if (selectedSabeMusica) {
    textoMusica.style.display = selectedSabeMusica.value === 'sim' ? 'block' : 'none';
    }
    checkForm();

}

function setupGoalForm() {
    const btn = document.querySelector('[data-btn="objetivo_violao"]');
    const countdown = document.querySelector('[data-countdown="objetivo_violao"]');
    const form = document.querySelector('[data-form="objetivo_violao"]');
    const objetivoOutro = document.getElementById('objetivoOutro');
    const textoObjetivo = document.getElementById('textoObjetivo');
    const radios = form.querySelectorAll('input[name="objetivo"]');
 
    btn.disabled = true;

    function checkForm() {
        const isSelected = Array.from(radios).some(radio => radio.checked);
        const isCustomValid = !objetivoOutro.checked || (objetivoOutro.checked && textoObjetivo.value.trim() !== '');
        if (isSelected && isCustomValid) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = objetivoOutro.checked ? 'Descreva seu objetivo' : 'Selecione uma opção';
        }
    }

    radios.forEach(radio => radio.addEventListener('change', () => {
        textoObjetivo.style.display = radio.value === 'outro' ? 'block' : 'none';
        checkForm();
    }));

    textoObjetivo.addEventListener('input', () => {
        textoObjetivo.style.height = 'auto';
        textoObjetivo.style.height = `${textoObjetivo.scrollHeight}px`;
        checkForm();
    });
    scrollTextareaToTop(textoObjetivo);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const goalData = {
            objetivo: form.querySelector('input[name="objetivo"]:checked').value,
            objetivoPersonalizado: objetivoOutro.checked ? sanitizeInput(textoObjetivo.value) : ''
        };
        saveToSession('objetivo_violao', goalData);
        nextStep();
    });
    // 🔑 Inicializa visibilidade e validação com dados restaurados
    const selectedGoal = form.querySelector('input[name="objetivo"]:checked');
    if (selectedGoal) {
    textoObjetivo.style.display = selectedGoal.value === 'outro' ? 'block' : 'none';
    }
    checkForm();

}

function setupDifficultyForm() {
    const btn = document.querySelector('[data-btn="dificuldade_violao"]');
    const countdown = document.querySelector('[data-countdown="dificuldade_violao"]');
    const form = document.querySelector('[data-form="dificuldade_violao"]');
    const textoDificuldade = document.getElementById('textoDificuldade');
  
    btn.disabled = true;

    function checkForm() {
        if (textoDificuldade.value.trim() !== '') {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = 'Escreva sua dificuldade';
        }
    }

    textoDificuldade.addEventListener('input', () => {
        textoDificuldade.style.height = 'auto';
        textoDificuldade.style.height = `${textoDificuldade.scrollHeight}px`;
        checkForm();
    });
    scrollTextareaToTop(textoDificuldade);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const difficultyData = {
            dificuldade: sanitizeInput(textoDificuldade.value)
        };
        saveToSession('dificuldade_violao', difficultyData);
        nextStep();
    });
    // 🔑 Inicializa validação com dados restaurados
    checkForm();

}

function setupCallForm() {
    const btn = document.querySelector('[data-btn="videochamada"]');
    const countdown = document.querySelector('[data-countdown="videochamada"]');
    const form = document.querySelector('[data-form="videochamada"]');
    const radios = form.querySelectorAll('input[name="videochamada"]');
   
    btn.disabled = true;

    function checkForm() {
        if (Array.from(radios).some(radio => radio.checked)) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = 'Selecione uma opção';
        }
    }

    radios.forEach(radio => radio.addEventListener('change', checkForm));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const callData = {
            videochamada: form.querySelector('input[name="videochamada"]:checked').value
        };
        saveToSession('videochamada', callData);
        nextStep();
    });
    // 🔑 Inicializa validação com dados restaurados
    checkForm();

}

function setupTrainingForm() {
    const btn = document.querySelector('[data-btn="disponibilidade_treino"]');
    const countdown = document.querySelector('[data-countdown="disponibilidade_treino"]');
    const form = document.querySelector('[data-form="disponibilidade_treino"]');
    const radios = form.querySelectorAll('input[name="disponibilidade"]');
 
    btn.disabled = true;

    function checkForm() {
        if (Array.from(radios).some(radio => radio.checked)) {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = 'Selecione uma opção';
        }
    }

    radios.forEach(radio => radio.addEventListener('change', checkForm));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const trainingData = {
            disponibilidade: form.querySelector('input[name="disponibilidade"]:checked').value
        };
        saveToSession('disponibilidade_treino', trainingData);
        nextStep();
    });
    // 🔑 Inicializa validação com dados restaurados
    checkForm();

}

function setupWeeklyGoalForm() {
    const btn = document.querySelector('[data-btn="objetivo_semana"]');
    const countdown = document.querySelector('[data-countdown="objetivo_semana"]');
    const form = document.querySelector('[data-form="objetivo_semana"]');
    const textoObjetivoSemana = document.getElementById('textoObjetivoSemana');
  
    btn.disabled = true;

    function checkForm() {
        if (textoObjetivoSemana.value.trim() !== '') {
            btn.disabled = false;
            countdown.textContent = '';
            btn.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
        } else {
            btn.disabled = true;
            countdown.textContent = 'Escreva seu objetivo';
        }
    }

    textoObjetivoSemana.addEventListener('input', () => {
        textoObjetivoSemana.style.height = 'auto';
        textoObjetivoSemana.style.height = `${textoObjetivoSemana.scrollHeight}px`;
        checkForm();
    });
    scrollTextareaToTop(textoObjetivoSemana);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const weeklyGoalData = {
            objetivoSemana: sanitizeInput(textoObjetivoSemana.value)
        };
        saveToSession('objetivo_semana', weeklyGoalData);
        nextStep();
    });
    // 🔑 Inicializa validação com dados restaurados
    checkForm();

}