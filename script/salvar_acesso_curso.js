// salvar_acesso_curso.js - Módulo para salvar acesso do aluno no Firebase do site produtor

class SalvarAcessoCurso {
    constructor() {
        this.firebaseConfig = null;
        this.db = null;
        this.isInitialized = false;
    }

    // Gerar senha aleatória de 4 dígitos
    gerarSenhaAleatoria() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Inicializar Firebase com config do produtor
    async inicializarFirebase() {
        if (this.isInitialized) return;

        try {
            // Buscar config do Firebase produtor
            const response = await fetch('https://broken-silence-aaa9.2gabrielekaline.workers.dev');
            if (!response.ok) {
                throw new Error('Erro ao buscar config do Firebase produtor');
            }
            this.firebaseConfig = await response.json();

            // Verificar se Firebase já está carregado
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK não carregado. Adicione <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"></script> e <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"></script> ao HTML.');
            }

            firebase.initializeApp(this.firebaseConfig, 'produtor'); // Usar nome único para evitar conflitos
            this.db = firebase.firestore(firebase.app('produtor'));
            this.isInitialized = true;

            console.log('Firebase produtor inicializado para salvar acesso.');
        } catch (error) {
            console.error('Erro ao inicializar Firebase produtor:', error);
            throw error;
        }
    }

    // Salvar acesso do aluno
    async salvarAcesso(telefone, nome) {
        try {
            await this.inicializarFirebase();

            const senha = this.gerarSenhaAleatoria();

            // Criar documento na coleção 'alunos'
            const alunoData = {
                telefone: telefone,
                senha: senha,
                nome: nome,
                acesso: 'Liberado',
                criado_em: new Date()
            };

            // Usar telefone como ID do documento para evitar duplicatas
            const docRef = this.db.collection('alunos').doc(telefone);
            await docRef.set(alunoData);

            console.log(`✅ Acesso ao curso salvo: Nome ${nome}, Telefone ${telefone}, Senha ${senha}`);
            return { telefone, senha };
        } catch (error) {
            console.error('Erro ao salvar acesso:', error);
            throw error;
        }
    }

    // Buscar senha por telefone (com variações para dígito 9)
    async getPasswordByPhone(telefone) {
        try {
            await this.inicializarFirebase();
            console.log(`🔍 Buscando senha para telefone: ${telefone}`);

            // Lista de telefones a tentar
            const telefonesParaTentar = [telefone];

            // Se 10 dígitos, adicionar versão com 9
            if (telefone.length === 10) {
                const com9 = telefone.slice(0, 2) + '9' + telefone.slice(2);
                telefonesParaTentar.push(com9);
            }
            // Se 11 dígitos, adicionar versão sem 9 (se o 3º dígito for 9)
            else if (telefone.length === 11 && telefone[2] === '9') {
                const sem9 = telefone.slice(0, 2) + telefone.slice(3);
                telefonesParaTentar.push(sem9);
            }
            console.log(`📋 Variações a testar: ${telefonesParaTentar.join(', ')}`);

            // Tentar cada variação
            for (const tel of telefonesParaTentar) {
                console.log(`🔎 Tentando telefone: ${tel}`);
                try {
                    const querySnapshot = await this.db.collection('alunos').where('telefone', '==', tel).get();
                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        const data = doc.data();
                        console.log(`✅ Senha encontrada para ${tel}: ${data.senha || 'N/A'}`);
                        return data.senha || 'XXXX';
                    } else {
                        console.log(`❌ Documento não encontrado para ${tel}`);
                    }
                } catch (e) {
                    console.log(`⚠️ Erro ao consultar ${tel}: ${e.message}`);
                }
            }

            console.log(`🚫 Senha não encontrada para nenhuma variação de ${telefone}`);
            // Não encontrou
            return 'XXXX';
        } catch (error) {
            console.error(`💥 Erro geral em getPasswordByPhone: ${error.message}`);
            return 'XXXX';
        }
    }

    // Gerar acesso completo e retornar dados para copiar
    async generateAndSaveAccess(name, whatsapp) {
        try {
            console.log(`🎯 Iniciando geração de acesso para ${name} (${whatsapp})`);

            // Verificar se já tem acesso
            const existingPassword = await this.getPasswordByPhone(whatsapp);
            if (existingPassword !== 'XXXX') {
                console.log(`ℹ️ Acesso já existe: ${existingPassword}`);
                return {
                    success: true,
                    senha: existingPassword,
                    message: 'Acesso já existe'
                };
            }

            // Gerar e salvar novo acesso
            const result = await this.salvarAcesso(whatsapp, name);

            if (result && result.senha) {
                console.log(`✅ Acesso gerado e salvo: ${result.senha}`);

                // Retornar dados formatados para copiar
                const accessText = `Acesso ao Curso "Do Zero ao Repertório" da Comunidade Violão Depois dos 40

Aluno: ${name}

Telefone: ${whatsapp}
Senha: ${result.senha}`;

                return {
                    success: true,
                    senha: result.senha,
                    accessText: accessText,
                    message: 'Acesso gerado com sucesso'
                };
            } else {
                throw new Error('Falha ao gerar acesso');
            }

        } catch (error) {
            console.error(`❌ Erro em generateAndSaveAccess: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Instância global
const salvarAcessoCurso = new SalvarAcessoCurso();

// Função para uso direto (compatibilidade)
async function salvarAcessoDoCurso(telefone, nome) {
    return await salvarAcessoCurso.salvarAcesso(telefone, nome);
}

// Buscar senha por telefone
async function getPasswordByPhone(telefone) {
    return await salvarAcessoCurso.getPasswordByPhone(telefone);
}

// Gerar e salvar acesso completo (retorna dados para copiar)
async function generateAndSaveAccess(name, whatsapp) {
    return await salvarAcessoCurso.generateAndSaveAccess(name, whatsapp);
}
