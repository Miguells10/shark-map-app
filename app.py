# app.py

import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from flask import Flask, render_template, request, jsonify
import os
import time

# --- Configuração do Servidor Flask ---
app = Flask(__name__)

# --- Variáveis Globais para guardar o último mapa e seu gradiente ---
last_prob_map = None
last_gradient_dx = None
last_gradient_dy = None

# --- Lógica de Geração do Mapa ---
def generate_probability_map(ideal_temp, sigma=5.0):
    """
    Gera o mapa de probabilidade e agora também calcula e armazena seu gradiente.
    """
    global last_prob_map, last_gradient_dx, last_gradient_dy

    print(f"Gerando mapa para temperatura ideal: {ideal_temp}°C")

    # Caminhos para as imagens de entrada
    path_clorofila = 'input_data/clorofila.png'
    path_temperatura = 'input_data/tempsuperficie.png'

    # Carregar e processar imagens
    img_chloro_original = Image.open(path_clorofila)
    img_temp_original = Image.open(path_temperatura)
    target_size = img_chloro_original.size
    img_temp_resized = img_temp_original.resize(target_size, Image.LANCZOS)
    
    array_chloro = np.array(img_chloro_original.convert('L')) / 255.0
    array_temp = np.array(img_temp_resized.convert('L')) / 255.0
    
    prob_map_chloro = array_chloro

    temp_min, temp_max = 0.0, 35.0
    temp_map_celsius = temp_min + array_temp * (temp_max - temp_min)

    def calcular_prob_gaussiana(valor_map, valor_ideal, dispersao_sigma):
        numerador = -(valor_map - valor_ideal)**2
        denominador = 2 * dispersao_sigma**2
        return np.exp(numerador / denominador)

    prob_map_temp = calcular_prob_gaussiana(temp_map_celsius, ideal_temp, sigma)
    
    # Combinar probabilidades
    final_prob_map = prob_map_chloro * prob_map_temp
    
    # --- CORREÇÃO 1: CALCULAR E ARMAZENAR O GRADIENTE ---
    # Esta parte estava faltando no código que você enviou.
    dy, dx = np.gradient(final_prob_map)
    last_prob_map = final_prob_map
    last_gradient_dx = dx
    last_gradient_dy = dy
    
    # --- Exportação da Imagem Final ---
    target_width, target_height = target_size
    timestamp = int(time.time())
    output_filename = f'mapa_prob_{timestamp}.png'
    output_path = os.path.join('static', output_filename)

    fig_export, ax_export = plt.subplots(figsize=(target_width / 100, target_height / 100), dpi=100)
    ax_export.imshow(final_prob_map, cmap='plasma', interpolation='nearest')
    ax_export.axis('off')
    ax_export.set_position([0, 0, 1, 1])  # Garante que a imagem preenche todo o canvas

    fig_export.savefig(output_path, dpi=100, bbox_inches=None, pad_inches=0)
    plt.close(fig_export)

    
    print(f"Mapa salvo em: {output_path}")
    return output_filename, target_width, target_height


# --- Função para Simular a Trajetória ---
# A sua função de simulação estava ótima, sem necessidade de alterações.
def simulate_trajectory(start_pos, dx, dy, width, height, steps=150, prob_threshold=0.0000001):
    """
    Calcula a rota de um tubarão a partir de um ponto inicial, seguindo o gradiente.
    """
    global last_prob_map

    trajectory = [start_pos]
    pos = np.array(start_pos, dtype=np.float64)
    
    point_density_y, point_density_x = dy.shape

    j_start = int(round(pos[0]))
    i_start = int(round(pos[1]))
    if not (0 <= i_start < point_density_y and 0 <= j_start < point_density_x):
        print(f"Ponto inicial ({j_start},{i_start}) fora dos limites.")
        return []
    
    if last_prob_map[i_start, j_start] < prob_threshold:
        print(f"Ponto inicial em área de probabilidade muito baixa. Parando.")
        return trajectory

    for _ in range(steps):
        j = int(round(pos[0]))
        i = int(round(pos[1]))
        
        if not (1 <= i < point_density_y - 1 and 1 <= j < point_density_x - 1):
            break
        
        grad = np.array([dx[i, j], dy[i, j]])
        grad_norm = np.linalg.norm(grad)
        
        if grad_norm < 1e-6:
            print(f"Gradiente muito baixo em ({i},{j}). Parando.")
            break
        
        direction_grad = grad / grad_norm
        random_component = np.random.randn(2) * 0.15
        
        direction = 0.9 * direction_grad + 0.1 * random_component
        
        direction_norm = np.linalg.norm(direction)
        if direction_norm > 1e-8:
            direction /= direction_norm
        
        step_size = width * 0.01
        next_pos = pos + direction * step_size
        next_pos_clipped = np.clip(next_pos, [0, 0], [width - 1, height - 1])
        
        next_j = int(round(next_pos_clipped[0]))
        next_i = int(round(next_pos_clipped[1]))

        if (0 <= next_i < point_density_y and 0 <= next_j < point_density_x):
            if last_prob_map[next_i, next_j] < prob_threshold:
                print(f"Próxima posição tem prob. baixa. Parando.")
                break
        else:
            print(f"Próxima posição fora dos limites. Parando.")
            break
            
        pos = next_pos_clipped
        trajectory.append(pos.copy())
    
    return np.array(trajectory).tolist()


# --- Rotas do Site ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_map', methods=['POST'])
def generate_map_route():
    data = request.get_json()
    temp_ideal = float(data.get('temperature', 22.0))
    image_filename, width, height = generate_probability_map(temp_ideal)
    return jsonify({
        'image_filename': image_filename,
        'width': width,
        'height': height
    })

@app.route('/trace_route', methods=['POST'])
def trace_route():
    if last_prob_map is None:
        return jsonify({'error': 'Mapa de probabilidade ainda não foi gerado.'}), 400

    data = request.get_json()
    start_pos = [data['x'], data['y']]
    
    height, width = last_prob_map.shape
    
    # --- CORREÇÃO 2: PASSAR OS GRADIENTES PARA A FUNÇÃO ---
    # Estávamos passando o mapa de probabilidade em vez dos gradientes dx e dy.
    trajectory = simulate_trajectory(start_pos, last_gradient_dx, last_gradient_dy, width, height)
    
    return jsonify({'trajectory': trajectory})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)