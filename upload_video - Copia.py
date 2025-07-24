#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para fazer upload de vídeo grande (>25MB) para GitHub usando Git LFS
Autor: Assistente Claude
"""

import os
import subprocess
import sys
import shutil
import tempfile
import logging
from datetime import datetime
from pathlib import Path

def setup_logging():
    """Configura o sistema de logging"""
    log_filename = f"upload_video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    
    # Configuração do logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_filename, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"=== INÍCIO DO LOG - Upload de Vídeo para GitHub ===")
    logger.info(f"Arquivo de log: {log_filename}")
    
    return logger, log_filename

def run_command(command, cwd=None, check=True):
    """Executa um comando no terminal e retorna o resultado"""
    logger = logging.getLogger(__name__)
    logger.info(f"Executando comando: {command}")
    if cwd:
        logger.info(f"Diretório de trabalho: {cwd}")
    
    try:
        # No Windows, usar shell=True pode causar problemas com aspas
        # Vamos usar uma abordagem mais robusta
        if os.name == 'nt':  # Windows
            result = subprocess.run(
                command, 
                shell=True, 
                cwd=cwd, 
                capture_output=True, 
                text=True, 
                check=check
            )
        else:  # Unix/Linux/macOS
            result = subprocess.run(
                command, 
                shell=True, 
                cwd=cwd, 
                capture_output=True, 
                text=True, 
                check=check
            )
        
        if result.stdout:
            logger.info(f"STDOUT: {result.stdout.strip()}")
            print(f"✓ {result.stdout.strip()}")
        
        if result.stderr and result.stderr.strip():
            logger.warning(f"STDERR: {result.stderr.strip()}")
        
        logger.info(f"Comando executado com sucesso. Código de saída: {result.returncode}")
        return result
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Erro ao executar comando: {command}")
        logger.error(f"Código de saída: {e.returncode}")
        logger.error(f"STDOUT: {e.stdout}")
        logger.error(f"STDERR: {e.stderr}")
        print(f"✗ Erro ao executar: {command}")
        print(f"✗ {e.stderr}")
        raise

def check_git_lfs():
    """Verifica se o Git LFS está instalado"""
    logger = logging.getLogger(__name__)
    logger.info("Verificando se Git LFS está instalado...")
    
    try:
        run_command("git lfs version")
        logger.info("Git LFS está disponível")
        return True
    except subprocess.CalledProcessError:
        logger.error("Git LFS não está instalado!")
        print("✗ Git LFS não está instalado!")
        print("📋 Para instalar:")
        print("   Windows: Baixe de https://git-lfs.github.io/")
        print("   macOS: brew install git-lfs")
        print("   Ubuntu/Debian: sudo apt install git-lfs")
        return False

def upload_video_to_github():
    """Função principal para upload do vídeo"""
    logger = logging.getLogger(__name__)
    
    # Configurações
    VIDEO_FILE = "vid2.mp4"
    REPO_URL = "https://github.com/gabrielalmeidac3/violaocomgabriel.git"
    COMMIT_MESSAGE = "Adicionar vídeo vid2.mp4 via Git LFS"
    
    logger.info(f"Iniciando upload do arquivo: {VIDEO_FILE}")
    logger.info(f"Repositório de destino: {REPO_URL}")
    
    # Verifica se o arquivo de vídeo existe
    if not os.path.exists(VIDEO_FILE):
        logger.error(f"Arquivo {VIDEO_FILE} não encontrado no diretório atual!")
        logger.error(f"Diretório atual: {os.getcwd()}")
        print(f"✗ Arquivo {VIDEO_FILE} não encontrado no diretório atual!")
        print(f"📁 Diretório atual: {os.getcwd()}")
        return False
    
    # Verifica o tamanho do arquivo
    file_size = os.path.getsize(VIDEO_FILE) / (1024 * 1024)  # MB
    logger.info(f"Tamanho do arquivo: {file_size:.2f} MB")
    print(f"📊 Tamanho do arquivo: {file_size:.2f} MB")
    
    # Verifica se Git LFS está instalado
    if not check_git_lfs():
        return False
    
    # Cria pasta temporária
    temp_dir = tempfile.mkdtemp(prefix="github_upload_")
    logger.info(f"Pasta temporária criada: {temp_dir}")
    print(f"📁 Pasta temporária criada: {temp_dir}")
    
    try:
        logger.info("Iniciando processo de upload...")
        print("\n🔄 Iniciando processo de upload...")
        
        # Clone do repositório
        logger.info("Passo 1: Clonando repositório...")
        print("1️⃣ Clonando repositório...")
        run_command(f"git clone {REPO_URL} .", cwd=temp_dir)
        
        # Navega para o diretório clonado
        repo_dir = os.path.join(temp_dir, "violaocomgabriel")
        if not os.path.exists(repo_dir):
            # Se não existe subpasta, o clone foi feito no diretório raiz
            repo_dir = temp_dir
            logger.info("Clone feito no diretório raiz da pasta temporária")
        else:
            logger.info(f"Diretório do repositório: {repo_dir}")
        
        # Lista conteúdo do diretório clonado
        logger.info(f"Conteúdo do diretório clonado: {os.listdir(repo_dir)}")
        
        # Inicializa Git LFS no repositório
        logger.info("Passo 2: Configurando Git LFS...")
        print("2️⃣ Configurando Git LFS...")
        run_command("git lfs install", cwd=repo_dir)
        
        # Adiciona tracking para arquivos .mp4
        logger.info("Configurando tracking para arquivos .mp4...")
        run_command("git lfs track '*.mp4'", cwd=repo_dir)
        
        # Adiciona .gitattributes se foi criado
        gitattributes_path = os.path.join(repo_dir, ".gitattributes")
        if os.path.exists(gitattributes_path):
            logger.info("Arquivo .gitattributes encontrado, adicionando ao commit...")
            run_command("git add .gitattributes", cwd=repo_dir)
            run_command('git commit -m "Adicionar Git LFS tracking para arquivos .mp4"', cwd=repo_dir)
        else:
            logger.warning("Arquivo .gitattributes não foi criado")
        
        # Copia o vídeo para o repositório
        logger.info("Passo 3: Copiando vídeo...")
        print("3️⃣ Copiando vídeo...")
        video_dest = os.path.join(repo_dir, VIDEO_FILE)
        shutil.copy2(VIDEO_FILE, video_dest)
        logger.info(f"Vídeo copiado de {VIDEO_FILE} para {video_dest}")
        print(f"✓ Vídeo copiado para: {video_dest}")
        
        # Verifica se o arquivo foi copiado corretamente
        if os.path.exists(video_dest):
            dest_size = os.path.getsize(video_dest) / (1024 * 1024)
            logger.info(f"Arquivo copiado com sucesso. Tamanho: {dest_size:.2f} MB")
        else:
            logger.error("Falha ao copiar o arquivo!")
            return False
        
        # Adiciona o arquivo ao Git
        logger.info("Passo 4: Adicionando arquivo ao Git...")
        print("4️⃣ Adicionando arquivo ao Git...")
        run_command(f"git add {VIDEO_FILE}", cwd=repo_dir)
        
        # Verifica status do Git
        logger.info("Verificando status do Git...")
        run_command("git status", cwd=repo_dir)
        
        # Commit
        logger.info("Passo 5: Fazendo commit...")
        print("5️⃣ Fazendo commit...")
        run_command(f'git commit -m "Adicionar vídeo {VIDEO_FILE} via Git LFS"', cwd=repo_dir)
        
        # Push para o GitHub
        logger.info("Passo 6: Enviando para GitHub...")
        print("6️⃣ Enviando para GitHub...")
        print("⚠️  Você pode precisar inserir suas credenciais do GitHub")
        run_command("git push origin main", cwd=repo_dir)
        
        logger.info("Upload concluído com sucesso!")
        print("\n🎉 Upload concluído com sucesso!")
        print(f"🔗 Verifique em: {REPO_URL.replace('.git', '')}")
        
        return True
        
    except Exception as e:
        logger.error(f"Erro durante o upload: {str(e)}", exc_info=True)
        print(f"\n✗ Erro durante o upload: {str(e)}")
        return False
        
    finally:
        # Remove pasta temporária
        logger.info(f"Removendo pasta temporária: {temp_dir}")
        print(f"\n🧹 Removendo pasta temporária: {temp_dir}")
        try:
            # No Windows, às vezes há arquivos bloqueados pelo Git
            # Vamos tentar várias vezes com delay
            import time
            for attempt in range(3):
                try:
                    shutil.rmtree(temp_dir)
                    logger.info("Pasta temporária removida com sucesso")
                    print("✓ Pasta temporária removida")
                    break
                except PermissionError:
                    if attempt < 2:
                        logger.warning(f"Tentativa {attempt + 1} falhou, tentando novamente em 2 segundos...")
                        time.sleep(2)
                    else:
                        raise
        except Exception as e:
            logger.error(f"Erro ao remover pasta temporária: {e}")
            print(f"⚠️  Erro ao remover pasta temporária: {e}")
            print(f"📁 Pasta deixada em: {temp_dir}")
            print("   Você pode removê-la manualmente depois")

def main():
    """Função principal"""
    # Configura o sistema de logging
    logger, log_filename = setup_logging()
    
    print("🎬 Upload de Vídeo para GitHub com Git LFS")
    print("=" * 50)
    logger.info("Aplicação iniciada")
    
    # Verifica se está no diretório correto
    current_dir = os.getcwd()
    logger.info(f"Diretório atual: {current_dir}")
    print(f"📁 Diretório atual: {current_dir}")
    
    # Lista arquivos no diretório
    try:
        files = [f for f in os.listdir('.') if os.path.isfile(f)]
        logger.info(f"Arquivos encontrados: {files}")
        print(f"📋 Arquivos encontrados: {', '.join(files)}")
    except Exception as e:
        logger.error(f"Erro ao listar arquivos: {e}")
        print(f"✗ Erro ao listar arquivos: {e}")
    
    # Informações do sistema
    logger.info(f"Sistema operacional: {os.name}")
    logger.info(f"Python: {sys.version}")
    
    print(f"📄 Arquivo de log: {log_filename}")
    
    # Confirmação
    response = input("\n❓ Deseja continuar com o upload? (s/n): ").lower().strip()
    logger.info(f"Resposta do usuário: {response}")
    
    if response not in ['s', 'sim', 'y', 'yes']:
        logger.info("Upload cancelado pelo usuário")
        print("❌ Upload cancelado pelo usuário")
        return
    
    # Executa upload
    logger.info("Iniciando processo de upload...")
    success = upload_video_to_github()
    
    if success:
        logger.info("Processo concluído com sucesso!")
        print("\n✅ Processo concluído com sucesso!")
        print(f"📄 Log detalhado salvo em: {log_filename}")
    else:
        logger.error("Processo falhou")
        print("\n❌ Processo falhou. Verifique os erros acima.")
        print(f"📄 Log detalhado salvo em: {log_filename}")
        sys.exit(1)
    
    logger.info("=== FIM DO LOG ===")

if __name__ == "__main__":
    main()