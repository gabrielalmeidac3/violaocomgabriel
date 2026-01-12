const API_URL = 'https://lively-hall-dce9.suportegabriel7.workers.dev/inscricoes';
const INCOMPLETE_API_URL = 'https://lively-hall-dce9.suportegabriel7.workers.dev/incompletos';

        // Inicializar sessionStorage1
        function initSession() {
            if (!localStorage.getItem('formData')) {
                localStorage.setItem('formData', JSON.stringify({}));
            }
        }
        
        function sanitizeInput(input) {
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        }

        // Salvar dados no localStorage
        function saveToSession(key, value) {
            let formData = JSON.parse(localStorage.getItem('formData')) || {};
            formData[key] = value;
            localStorage.setItem('formData', JSON.stringify(formData));
        }



        // Sistema de envio mais robusto para Firebase
        class FormSubmissionManager {
            constructor() {
                this.maxRetries = 3;
                this.retryDelay = 2000; // 2 segundos
                this.isSubmitting = false;
                this.apiUrl = API_URL;
                this.incompleteApiUrl = INCOMPLETE_API_URL;
                this.incompleteDocId = localStorage.getItem('incompleteDocId') || null; // restaura do storage
                this.isSavingIncomplete = false;
            }

            // Enviar com sistema de retry
            async sendToFirebaseWithRetry() {
                if (this.isSubmitting) {
                    console.log('Envio já em andamento...');
                    return { success: false, error: 'Envio em andamento' };
                }

                this.isSubmitting = true;
                let lastError = null;

                for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                    try {
                        console.log(`Tentativa ${attempt}/${this.maxRetries} de envio...`);
                        
                        const result = await this.attemptSubmission();
                        
                        if (result.success) {
                            console.log('✅ Dados enviados com sucesso!');
                            this.clearFormData();
                            this.isSubmitting = false;
                            return result;
                        }
                        
                        lastError = result.error;
                        console.warn(`❌ Tentativa ${attempt} falhou:`, result.error);
                        
                    } catch (error) {
                        lastError = error.message;
                        console.error(`❌ Erro na tentativa ${attempt}:`, error);
                    }

                    // Aguardar antes da próxima tentativa (exceto na última)
                    if (attempt < this.maxRetries) {
                        console.log(`⏳ Aguardando ${this.retryDelay}ms antes da próxima tentativa...`);
                        await this.delay(this.retryDelay);
                        this.retryDelay *= 1.5; // Aumenta o delay progressivamente
                    }
                }

                this.isSubmitting = false;
                console.error('❌ Todas as tentativas falharam. Dados mantidos no storage.');
                
                // Salvar tentativa falhada para retry posterior
                this.saveFailedSubmission();
                
                return { 
                    success: false, 
                    error: `Falha após ${this.maxRetries} tentativas: ${lastError}`,
                    canRetry: true
                };
            }

            // Tentativa individual de envio
            async attemptSubmission() {
                const formData = JSON.parse(localStorage.getItem('formData') || '{}');
                let stepTimesData = JSON.parse(localStorage.getItem('stepTimes') || '{}'); // 🔑 pega antes de apagar


                
                if (Object.keys(formData).length === 0) {
                    throw new Error('Nenhum dado para enviar');
                }

          

                const counter = await this.getNextCounterWithRetry();
                const dataToSend = this.prepareDataForSubmission(formData, counter, stepTimesData);


                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Erro desconhecido');
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || 'Resposta de erro do servidor');
                }

                return result;
            }

            // Obter contador para documentos incompletos
            async getNextIncompleteCounter() {
                for (let i = 0; i < 3; i++) {
                    try {
                        const response = await fetch(this.incompleteApiUrl);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const result = await response.json();
                        if (result.success && result.data) {
                            const counters = result.data
                                .filter(doc => doc.id_documento_incompleto?.startsWith('incompleto_'))
                                .map(doc => parseInt(doc.id_documento_incompleto.split('_')[1]))
                                .filter(n => !isNaN(n));
                            return counters.length > 0 ? Math.max(...counters) + 1 : 1;
                        }
                    } catch (error) {
                        console.warn(`Erro ao obter contador incompleto (tentativa ${i + 1}):`, error);
                        if (i === 2) return 1; // Fallback para 1
                    }
                }
                return 1;
            }

            // Obter contador com retry
            async getNextCounterWithRetry() {
                for (let i = 0; i < 3; i++) {
                    try {
                        const response = await fetch(this.apiUrl);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        
                        const result = await response.json();
                        if (result.success && result.data) {
                            const counters = result.data
                                .filter(doc => doc.documentId?.startsWith('15diasgratis_'))
                                .map(doc => parseInt(doc.documentId.replace('15diasgratis_', '')))
                                .filter(n => !isNaN(n));
                            
                            return counters.length > 0 ? Math.max(...counters) + 1 : 1;
                        }
                    } catch (error) {
                        console.warn(`Erro ao obter contador (tentativa ${i + 1}):`, error);
                        if (i === 2) return Date.now(); // Fallback com timestamp
                    }
                }
                return 1;
            }

            // Preparar dados para envio
            prepareDataForSubmission(formData, counter, stepTimesData) {
                const timestamp = Date.now();
                return {
                    documentId: `15diasgratis_${counter}_${timestamp}`,
                    step_times: JSON.stringify(stepTimesData),
                    
                    nome: formData.dados_pessoais?.nome || '',
                    whatsapp: formData.dados_pessoais?.whatsapp || '',
                    idade: formData.dados_pessoais?.idade || '',
                    nivel_violao: formData.nivel_violao?.nivel || '',
                    nivel_personalizado: formData.nivel_violao?.nivel_personalizado || '',
                    tipo_musica: formData.tipo_musica?.musica || '',
                    musica_personalizada: formData.tipo_musica?.musica_personalizada || '',
                    sabe_acorde: formData.sabe_acorde?.sabeAcorde || '',
                    tipo_acorde: formData.sabe_acorde?.tipoAcorde || '',
                    acorde_personalizado: formData.sabe_acorde?.acordePersonalizado || '',
                    sabe_afinar: formData.sabe_afinar?.sabeAfinar || '',
                    sabe_ritmo: formData.sabe_ritmo?.sabeRitmo || '',
                    ritmos: formData.sabe_ritmo?.ritmos || [],
                    ritmo_personalizado: formData.sabe_ritmo?.ritmoPersonalizado || '',
                    sabe_musica: formData.sabe_musica?.sabeMusica || '',
                    musicas: formData.sabe_musica?.musicas || '',
                    objetivo_violao: formData.objetivo_violao?.objetivo || '',
                    objetivo_personalizado: formData.objetivo_violao?.objetivoPersonalizado || '',
                    dificuldade_violao: formData.dificuldade_violao?.dificuldade || '',
                    videochamada: formData.videochamada?.videochamada || '',
                    objetivo_semana: formData.objetivo_semana?.objetivoSemana || '',
                    dia_melhor_envio: formData.dia_melhor_envio?.diaEnvio || '',
                    disponibilidade_treino: formData.disponibilidade_treino?.disponibilidade || '',
                    data_inscricao: new Date().toISOString(),
                    tipo: "inscricao"
                };
            }

            // Salvar tentativa falhada para retry posterior
            saveFailedSubmission() {
                const failedData = {
                    formData: localStorage.getItem('formData'),
                    stepTimes: localStorage.getItem('stepTimes'),
                    timestamp: Date.now(),
                    attempts: (JSON.parse(localStorage.getItem('failedSubmission') || '{}').attempts || 0) + 1
                };
                
                localStorage.setItem('failedSubmission', JSON.stringify(failedData));
                console.log('💾 Dados salvos para retry posterior');
            }

            // Tentar reenviar dados salvos
            async retryFailedSubmissions() {
                const failedData = localStorage.getItem('failedSubmission');
                if (!failedData) return;

                try {
                    const data = JSON.parse(failedData);
                    console.log('🔄 Tentando reenviar dados salvos...');
                    
                    // Restaurar dados temporariamente
                    if (data.formData) localStorage.setItem('formData', data.formData);
                    if (data.stepTimes) localStorage.setItem('stepTimes', data.stepTimes);

                    
                    const result = await this.sendToFirebaseWithRetry();
                    
                    if (result.success) {
                        localStorage.removeItem('failedSubmission');
                        console.log('✅ Dados anteriores reenviados com sucesso!');
                    }
                    
                } catch (error) {
                    console.error('❌ Erro ao reenviar dados salvos:', error);
                }
            }

            // Limpar dados após sucesso
            async clearFormData() {
                await this.deleteIncompleteSubmission();
                localStorage.removeItem('formData');
                localStorage.removeItem('stepTimes');
                
                
                localStorage.removeItem('failedSubmission');
                console.log('🧹 Dados limpos após envio bem-sucedido');
            }

            // Utility: delay
            delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            // Verificar se há dados pendentes
            hasPendingData() {
                return localStorage.getItem('formData') || localStorage.getItem('failedSubmission');
            }

            // Status da conexão
            isOnline() {
                return navigator.onLine;
            }

            async saveIncompleteSubmission(nextStep, stepTimes) {
                // Obter o maior contador de documentos incompletos
                const counter = await this.getNextIncompleteCounter();
                if (this.isSavingIncomplete) {
                    
                    return;
                }
                this.isSavingIncomplete = true;
                const formData = JSON.parse(localStorage.getItem('formData') || '{}');
                const timestamp = Date.now();
                if (!this.incompleteDocId) {
                    this.incompleteDocId = `incompleto_${counter}_${timestamp}`;
                    localStorage.setItem('incompleteDocId', this.incompleteDocId); // salva no storage
                }          
                const preparedData = this.prepareDataForSubmission(formData, 1, stepTimes); // 🔑 pega os dados e inclui tempos
                delete preparedData.documentId;
                delete preparedData.tipo;
                // Formatar data e hora para Manaus (UTC-4) no formato "25 ago 25 12:45:25"
                const date = new Date();
                const optionsTime = { timeZone: 'America/Manaus', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
                const optionsDate = { timeZone: 'America/Manaus', day: '2-digit', month: 'short', year: '2-digit' };
                const formattedTime = date.toLocaleTimeString('pt-BR', optionsTime).replace(/:/g, ':');
                const formattedDate = date.toLocaleDateString('pt-BR', optionsDate).replace(/ de /g, ' ').replace('.', '');
                const formattedDateTime = `${formattedDate} ${formattedTime} UTC-4`;
                preparedData.data_inscricao = formattedDateTime;
                const dataToSend = {
                    documentId: this.incompleteDocId,
                    id_documento_incompleto: this.incompleteDocId,
                    step_atual: String(nextStep),
                    step_times: JSON.stringify(stepTimes),
                    tipo: 'incompleto',
                    ...preparedData
                };

                
                try {
                    const response = await fetch(this.incompleteApiUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSend)
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    console.log(`✅ Documento incompleto ${this.incompleteDocId} salvo/atualizado`);
                } catch (error) {
                    console.error(`❌ Erro ao salvar documento incompleto: ${error.message}`);
                } finally {
                    this.isSavingIncomplete = false;
                }
            }
            async deleteIncompleteSubmission() {
                if (!this.incompleteDocId) return;
                try {
                    const response = await fetch(`${this.incompleteApiUrl}/${this.incompleteDocId}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    console.log(`✅ Documento incompleto ${this.incompleteDocId} excluído`);
                    localStorage.removeItem('incompleteDocId'); // limpa do storage
                } catch (error) {
                    console.error(`❌ Erro ao excluir documento incompleto: ${error.message}`);
                }
            }

        }
        

        // Instanciar o gerenciador
        const submissionManager = new FormSubmissionManager();

        // Função principal para substituir a original
        async function sendToFirebase() {
            const result = await submissionManager.sendToFirebaseWithRetry();
            return result.success;
        }

        // Restaurar dados do formulário
        function restoreFormData() {
            const formData = JSON.parse(localStorage.getItem('formData') || '{}');



        // Restaurar dados pessoais
        if (formData.dados_pessoais) {
            const data = formData.dados_pessoais;
            if (data.nome) document.getElementById('nome').value = data.nome;
            if (data.whatsapp) document.getElementById('whatsapp').value = data.whatsapp;
            if (data.idade) document.getElementById('idade').value = data.idade;
            const inputs = document.querySelectorAll('[data-form="dados_pessoais"] input');
            inputs.forEach(input => input.dispatchEvent(new Event('input', { bubbles: true })));
        }

        // Restaurar nível do violão
        if (formData.nivel_violao) {
            const radio = document.querySelector(`input[name="nivel"][value="${formData.nivel_violao.nivel}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                if (formData.nivel_violao.nivel === 'personalizado') {
                    const textarea = document.getElementById('textoNivelPersonalizado');
                    textarea.style.display = 'block';
                    textarea.value = formData.nivel_violao.nivel_personalizado || '';
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }

        // Restaurar tipo de música
        if (formData.tipo_musica) {
            const radio = document.querySelector(`input[name="musica"][value="${formData.tipo_musica.musica}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                if (formData.tipo_musica.musica === 'outro') {
                    const textarea = document.getElementById('textoOutraMusica');
                    textarea.style.display = 'block';
                    textarea.value = formData.tipo_musica.musica_personalizada || '';
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }

        // Restaurar acordes
        if (formData.sabe_acorde) {
            const radio = document.querySelector(`input[name="sabeAcorde"][value="${formData.sabe_acorde.sabeAcorde}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                if (formData.sabe_acorde.sabeAcorde === 'sim') {
                    document.getElementById('acordesOptions').style.display = 'block';
                    if (formData.sabe_acorde.tipoAcorde) {
                        const tipoRadio = document.querySelector(`input[name="tipoAcorde"][value="${formData.sabe_acorde.tipoAcorde}"]`);
                        if (tipoRadio) {
                            tipoRadio.checked = true;
                            tipoRadio.dispatchEvent(new Event('change', { bubbles: true }));
                            if (formData.sabe_acorde.tipoAcorde === 'personalizado') {
                                const textarea = document.getElementById('textoAcordePersonalizado');
                                textarea.style.display = 'block';
                                textarea.value = formData.sabe_acorde.acordePersonalizado || '';
                                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }
                    }
                }
            }
        }

        // Restaurar afinar
        if (formData.sabe_afinar) {
            const radio = document.querySelector(`input[name="sabeAfinar"][value="${formData.sabe_afinar.sabeAfinar}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // Restaurar ritmos
        if (formData.sabe_ritmo) {
            const radio = document.querySelector(`input[name="sabeRitmo"][value="${formData.sabe_ritmo.sabeRitmo}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                if (formData.sabe_ritmo.sabeRitmo === 'sim') {
                    document.getElementById('ritmosOptions').style.display = 'block';
                    if (formData.sabe_ritmo.ritmos) {
                        formData.sabe_ritmo.ritmos.forEach(ritmo => {
                            const checkbox = document.querySelector(`input[name="ritmo"][value="${ritmo}"]`);
                            if (checkbox) {
                                checkbox.checked = true;
                                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        });
                    }
                    if (formData.sabe_ritmo.ritmoPersonalizado) {
                        const ritmoPersonalizado = document.getElementById('ritmoPersonalizado');
                        if (ritmoPersonalizado) {
                            ritmoPersonalizado.checked = true;
                            ritmoPersonalizado.dispatchEvent(new Event('change', { bubbles: true }));
                            const textarea = document.getElementById('textoRitmoPersonalizado');
                            textarea.style.display = 'block';
                            textarea.value = formData.sabe_ritmo.ritmoPersonalizado;
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                }
            }
        }

        // Restaurar música completa
        if (formData.sabe_musica) {
            const radio = document.querySelector(`input[name="sabeMusica"][value="${formData.sabe_musica.sabeMusica}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                if (formData.sabe_musica.sabeMusica === 'sim') {
                    const textarea = document.getElementById('textoMusica');
                    textarea.style.display = 'block';
                    textarea.value = formData.sabe_musica.musicas || '';
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }

        // Restaurar objetivo
        if (formData.objetivo_violao) {
            const radio = document.querySelector(`input[name="objetivo"][value="${formData.objetivo_violao.objetivo}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
                if (formData.objetivo_violao.objetivo === 'outro') {
                    const textarea = document.getElementById('textoObjetivo');
                    textarea.style.display = 'block';
                    textarea.value = formData.objetivo_violao.objetivoPersonalizado || '';
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }

        // Restaurar dificuldade
        if (formData.dificuldade_violao && formData.dificuldade_violao.dificuldade) {
            const textarea = document.getElementById('textoDificuldade');
            textarea.value = formData.dificuldade_violao.dificuldade;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Restaurar videochamada
        if (formData.videochamada) {
            const radio = document.querySelector(`input[name="videochamada"][value="${formData.videochamada.videochamada}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // Restaurar disponibilidade treino
        if (formData.disponibilidade_treino) {
            const radio = document.querySelector(`input[name="disponibilidade"][value="${formData.disponibilidade_treino.disponibilidade}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // Restaurar objetivo semana
        if (formData.objetivo_semana && formData.objetivo_semana.objetivoSemana) {
            const textarea = document.getElementById('textoObjetivoSemana');
            textarea.value = formData.objetivo_semana.objetivoSemana;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Restaurar dia melhor envio
        if (formData.dia_melhor_envio) {
            const radio = document.querySelector(`input[name="diaEnvio"][value="${formData.dia_melhor_envio.diaEnvio}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    
        // Iniciar sessionStorage
        // Tentar reenviar dados ao carregar a página
        window.addEventListener('load', () => {
            restoreFormData(); // Restaurar dados salvos
            if (submissionManager.hasPendingData()) {
                setTimeout(() => {
                    submissionManager.retryFailedSubmissions();
                }, 2000);
            }
        });

        // Tentar reenviar quando voltar online
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada, tentando reenviar dados...');
            if (submissionManager.hasPendingData()) {
                setTimeout(() => {
                    submissionManager.retryFailedSubmissions();
                }, 1000);
            }
        });

        // Capturar função de tempo da etapa final
        function captureStep19Time() {
            if (stepStartTime && currentStep === 'cadastro_final') {
                const endTime = Date.now();
                const timeSpent = USE_MILLISECONDS ? (endTime - stepStartTime) : Math.round((endTime - stepStartTime) / 1000);
                stepTimes[`tempo_${currentStep}`] = timeSpent;
                localStorage.setItem('stepTimes', JSON.stringify(stepTimes));


            }
        }

        function saveStepTimes() {
        localStorage.setItem('stepTimes', JSON.stringify(stepTimes));
        }

        async function processarInscricaoCompleta() {
            
            const btn = document.querySelector('[data-btn="cadastro_final"]');
            const aguardeMsg = document.getElementById('aguardeMsg');
            const finalSuccess = document.getElementById('finalSuccess');
            
            // Esconder botão e mostrar mensagem de aguarde
            btn.style.display = 'none';
            aguardeMsg.style.display = 'block';
            let restante = 7;
            aguardeMsg.textContent = `⏳ Finalizando sua inscrição... você será direcionado ao WhatsApp em ${restante} segundos ou menos.`;
            const interval = setInterval(() => {
                restante--;
                if (restante > 0) {
                    aguardeMsg.textContent = `⏳ Finalizando sua inscrição... você será direcionado ao WhatsApp em ${restante} segundos ou menos.`;
                } else {
                    clearInterval(interval);
                }
            }, 1000);

            
            // Capturar tempo e salvar
            captureStep19Time();
            saveStepTimes();

            // Salvar acesso ao curso
            const formData = JSON.parse(localStorage.getItem('formData') || '{}');
            const nome = formData.dados_pessoais?.nome || '';
            const whatsapp = formData.dados_pessoais?.whatsapp || '';
            if (nome && whatsapp) {
                const accessData = await salvarAcessoDoCurso(whatsapp, nome);
                formData.senha_acesso = accessData.senha;
                localStorage.setItem('formData', JSON.stringify(formData));
            }

            // Enviar para Firebase e aguardar confirmação
            const enviadoComSucesso = await sendToFirebase();

            if (enviadoComSucesso) {
                await submissionManager.clearFormData();
                localStorage.removeItem("visitedSteps");

                


                // Esconder mensagem de aguarde e mostrar sucesso
                aguardeMsg.style.display = 'none';
                clearInterval(interval);
                

                finalSuccess.style.display = 'block';
                
                // Redirecionar para WhatsApp
                window.open('https://wa.me/5595984224764?text=Vi%20todos%20os%20detalhes%20e%20quero%20aproveitar%20os%2015%20dias%20gr%C3%A1tis', '_blank');
            } else {
                aguardeMsg.style.display = 'none';
                clearInterval(interval);

                btn.style.display = 'none';

                const wrapper = document.createElement('div');
                wrapper.classList.add('botoes-falha');

                wrapper.innerHTML = `
                <p style="color:#c00; font-weight:bold; margin-bottom:15px;">❌ houve uma falha na sua inscrição.</p>
                
                <button style="width:100%; margin-bottom:10px; padding:12px; border:none; border-radius:8px; color:white; font-size:16px; cursor:pointer; background:linear-gradient(45deg,#ff6b35,#f7931e);" onclick="location.reload()">
                    Tentar novamente
                </button>

                <button style="width:100%; padding:12px; border:none; border-radius:8px; color:white; font-size:16px; cursor:pointer; background:linear-gradient(45deg,#28a745,#34d058);" onclick="window.open('https://wa.me/5595984224764?text=Oi,%20minha%20inscrição%20deu%20erro','_blank')">
                    Conversar com Gabriel Almeida
                </button>
                `;

                btn.parentElement.appendChild(wrapper);
            }


        }

     

        // Iniciar sessionStorage
        // Tentar reenviar dados ao carregar a página
        window.addEventListener('load', () => {
            if (submissionManager.hasPendingData()) {
                setTimeout(() => {
                    submissionManager.retryFailedSubmissions();
                }, 2000);
            }
        });

        // Tentar reenviar quando voltar online
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada, tentando reenviar dados...');
            if (submissionManager.hasPendingData()) {
                setTimeout(() => {
                    submissionManager.retryFailedSubmissions();
                }, 1000);
            }
        });
        initSession();
