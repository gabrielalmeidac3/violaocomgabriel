import requests
import json
import re

# URL da API que retorna os dados dos inscritos
API_URL = 'https://lively-hall-dce9.suportegabriel7.workers.dev/inscricoes'

def formatar_whatsapp(numero):
    """Formata o número de WhatsApp removendo caracteres não numéricos"""
    if not numero:
        return ""
    return re.sub(r'[^\d]', '', numero)

def gerar_arquivo_contatos():
    try:
        # Faz a requisição para a API
        response = requests.get(API_URL)
        response.raise_for_status()  # Levanta um erro se a requisição falhar

        # Parseia a resposta JSON
        data = response.json()

        # Verifica se a resposta contém os dados esperados
        if not data.get('success') or not isinstance(data.get('data'), list):
            print("Formato de resposta inesperado da API")
            return

        contatos = data['data']

        # Cria o arquivo de saída
        with open('contatos_whatsapp.txt', 'w', encoding='utf-8') as file:
            for contato in contatos:
                nome = contato.get('nome', '').strip()
                whatsapp = contato.get('whatsapp', '')

                # Formata o número de WhatsApp
                numero_formatado = formatar_whatsapp(whatsapp)

                if nome and numero_formatado:
                    # Cria o link do WhatsApp
                    link_whatsapp = f"https://wa.me/55{numero_formatado}"
                    # Escreve no arquivo no formato "Nome / link"
                    file.write(f"{nome} / {link_whatsapp}\n")

        print(f"Arquivo 'contatos_whatsapp.txt' gerado com sucesso com {len(contatos)} contatos!")

    except requests.exceptions.RequestException as e:
        print(f"Erro ao acessar a API: {e}")
    except json.JSONDecodeError as e:
        print(f"Erro ao parsear a resposta JSON: {e}")
    except Exception as e:
        print(f"Erro inesperado: {e}")

if __name__ == "__main__":
    gerar_arquivo_contatos()