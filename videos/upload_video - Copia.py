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
    REPO_URL = "https://github.com/gabrielalmeidac3/violaocomgabriel.git"
    
    logger.info(f"Iniciando sincronização com repositório: {REPO_URL}")
    
    # Conta quantos arquivos serão processados (exceto script e logs)
    current_dir = os.getcwd()
    files_to_process = []
    total_size = 0
    
    for item in os.listdir(current_dir):
        item_path = os.path.join(current_dir, item)
        if (os.path.isdir(item_path) or 
            item == "upload_video.py" or 
            item.startswith("upload_video_") and item.endswith(".log")):
            continue
        files_to_process.append(item)
        total_size += os.path.getsize(item_path)
    
    if not files_to_process:
        logger.error("Nenhum arquivo encontrado para sincronizar!")
        print("✗ Nenhum arquivo encontrado para sincronizar!")
        return False
    
    total_size_mb = total_size / (1024 * 1024)
    logger.info(f"Arquivos a processar: {len(files_to_process)}")
    logger.info(f"Tamanho total: {total_size_mb:.2f} MB")
    print(f"📊 Arquivos a processar: {len(files_to_process)}")
    print(f"📊 Tamanho total: {total_size_mb:.2f} MB")
    print(f"📋 Arquivos: {', '.join(files_to_process)}")
    
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
            # Só faz commit se houver alterações pendentes
            status_result = run_command("git status --porcelain", cwd=repo_dir)
            if status_result.stdout.strip():
                run_command('git commit -m "Adicionar Git LFS tracking para arquivos .mp4"', cwd=repo_dir)
            else:
                logger.info("Nenhuma alteração em .gitattributes para comitar")

        else:
            logger.warning("Arquivo .gitattributes não foi criado")
        
        # Copia todos os arquivos da pasta atual (exceto script e logs)
        logger.info("Passo 3: Copiando arquivos da pasta atual...")
        print("3️⃣ Copiando arquivos da pasta atual...")
        
        current_dir = os.getcwd()
        copied_files = []
        
        for item in os.listdir(current_dir):
            item_path = os.path.join(current_dir, item)
            
            # Pula diretórios, o próprio script e arquivos de log
            if (os.path.isdir(item_path) or 
                item == "upload_video.py" or 
                item.startswith("upload_video_") and item.endswith(".log")):
                continue
            
            dest_path = os.path.join(repo_dir, item)
            try:
                shutil.copy2(item_path, dest_path)
                file_size = os.path.getsize(item_path) / (1024 * 1024)
                logger.info(f"Copiado: {item} ({file_size:.2f} MB)")
                print(f"✓ Copiado: {item} ({file_size:.2f} MB)")
                copied_files.append(item)
            except Exception as e:
                logger.error(f"Erro ao copiar {item}: {e}")
                print(f"✗ Erro ao copiar {item}: {e}")
        
        if not copied_files:
            logger.error("Nenhum arquivo foi copiado!")
            print("✗ Nenhum arquivo foi copiado!")
            return False
        
        logger.info(f"Total de arquivos copiados: {len(copied_files)}")
        print(f"✓ Total de arquivos copiados: {len(copied_files)}")
        
        # Adiciona todos os arquivos copiados ao Git
        logger.info("Passo 4: Adicionando arquivos ao Git...")
        print("4️⃣ Adicionando arquivos ao Git...")
        
        # Adiciona todos os arquivos que foram copiados
        for file in copied_files:
            logger.info(f"Adicionando {file} ao Git...")
            run_command(f'git add --force "{file}"', cwd=repo_dir)
        
        # Adiciona qualquer arquivo novo que possa ter sido criado
        run_command("git add -A", cwd=repo_dir)

        
        # Verifica status do Git
        logger.info("Verificando status do Git...")
        run_command("git status", cwd=repo_dir)
        
        # Commit
        logger.info("Passo 5: Fazendo commit...")
        print("5️⃣ Fazendo commit...")
        
        # Verifica se há algo para comitar
        status_result = run_command("git status --porcelain", cwd=repo_dir)
        if not status_result.stdout.strip():
            logger.info("Nenhuma alteração para comitar - todos os arquivos já estão atualizados")
            print("ℹ️  Nenhuma alteração para comitar - todos os arquivos já estão atualizados")
            return True
        
        # Mostra o que será commitado
        logger.info("Arquivos que serão commitados:")
        print("📋 Arquivos que serão commitados:")
        run_command("git status --short", cwd=repo_dir)
        
        # Faz o commit
        commit_msg = f"Atualizar arquivos do projeto - {len(copied_files)} arquivos"
        run_command(f'git commit -m "{commit_msg}"', cwd=repo_dir)
        
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