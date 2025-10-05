# app.py

import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from flask import Flask, render_template, request, jsonify
import os
import time

# --- Configuração do Servidor Flask ---
app = Flask(__name__)

# --- Lógica de Processpip inamento de Imagem (Seu código adaptado) ---

def generate_probability_map(ideal_temp, sigma=5.0):
    """
    Função que encapsula toda a lógica de geração do mapa de probabilidade.
    Recebe uma temperatura ideal e retorna o caminho para a imagem gerada.
    """
    print(f"Gerando mapa para temperatura ideal: {ideal_temp}°C")

    # Caminhos para as imagens de entrada
    path_clorofila = 'input_data/clorofila.png'
    path_temperatura = 'input_data/tempsuperficie.png'

    # Carregar imagens
    img_chloro_original = Image.open(path_clorofila)
    img_temp_original = Image.open(path_temperatura)
    
    # Redimensionar
    target_size = img_chloro_original.size
    img_temp_resized = img_temp_original.resize(target_size, Image.LANCZOS)
    
    # Converter para dados numéricos
    array_chloro = np.array(img_chloro_original.convert('L')) / 255.0
    array_temp = np.array(img_temp_resized.convert('L')) / 255.0
    
    # Probabilidade da Clorofila
    prob_map_chloro = array_chloro

    # Mapa de Temperatura Estimado
    temp_min = 0.0
    temp_max = 35.0
    temp_map_celsius = temp_min + array_temp * (temp_max - temp_min)

    # Função Gaussiana
    def calcular_prob_gaussiana(valor_map, valor_ideal, dispersao_sigma):
        numerador = -(valor_map - valor_ideal)**2
        denominador = 2 * dispersao_sigma**2
        return np.exp(numerador / denominador)

    prob_map_temp = calcular_prob_gaussiana(temp_map_celsius, ideal_temp, sigma)
    
    # Combinar probabilidades
    final_prob_map = prob_map_chloro * prob_map_temp
    
    # --- Exportação da Imagem Final ---
    target_width, target_height = target_size
    
    # Gera um nome de arquivo único para evitar problemas de cache do navegador
    timestamp = int(time.time())
    output_filename = f'mapa_prob_{timestamp}.png'
    output_path = os.path.join('static', output_filename) # Salva na pasta 'static'

    fig_export, ax_export = plt.subplots(figsize=(target_width / 100, target_height / 100), dpi=100)
    ax_export.imshow(final_prob_map, cmap='plasma', interpolation='bilinear')
    ax_export.axis('off')
    
    plt.savefig(output_path, dpi=100, bbox_inches='tight', pad_inches=0)
    plt.close(fig_export)
    
    print(f"Mapa salvo em: {output_path}")
    return output_filename


# --- Rotas do Site ---

@app.route('/')
def index():
    """ Rota principal que carrega a página HTML. """
    return render_template('index.html')

@app.route('/generate_map', methods=['POST'])
def generate_map_route():
    """ Rota que recebe o pedido do site, processa e retorna o nome da imagem. """
    data = request.get_json()
    
    # Pega a temperatura ideal do pedido, com um valor padrão de 22
    temp_ideal = float(data.get('temperature', 22.0))
    
    # Chama a função para gerar a imagem
    image_filename = generate_probability_map(temp_ideal)
    
    # Retorna o nome do arquivo para o JavaScript
    return jsonify({'image_filename': image_filename})

if __name__ == '__main__':
    app.run(debug=True)