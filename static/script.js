// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const sharkSelect = document.getElementById('shark-select');
    const generateBtn = document.getElementById('generate-btn');
    const loadingDiv = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const mapCanvas = document.getElementById('map-canvas');
    const mapCtx = mapCanvas.getContext('2d');
    
    let mapImage = new Image();

    generateBtn.addEventListener('click', async () => {
        const selectedTemp = sharkSelect.value;
        
        loadingText.textContent = "Gerando mapa de probabilidade...";
        loadingDiv.classList.remove('hidden');
        mapCanvas.classList.add('hidden');
        generateBtn.disabled = true;

        try {
            const response = await fetch('/generate_map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temperature: selectedTemp }),
            });

            if (!response.ok) throw new Error('Falha na resposta do servidor.');

            const data = await response.json();
            
            mapImage.src = `/static/${data.image_filename}`;
            mapImage.onload = () => {
                mapCanvas.width = data.width;
                mapCanvas.height = data.height;
                mapCtx.drawImage(mapImage, 0, 0);
                
                mapCanvas.classList.remove('hidden');
                loadingDiv.classList.add('hidden');
                generateBtn.disabled = false;
            };

        } catch (error) {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao gerar o mapa.');
            loadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    mapCanvas.addEventListener('click', async (event) => {
        if (!mapImage.src || mapImage.src === '') {
            alert("Primeiro, gere um mapa de probabilidade.");
            return;
        }

        const rect = mapCanvas.getBoundingClientRect();
        const scaleX = mapCanvas.width / rect.width;
        const scaleY = mapCanvas.height / rect.height;
        
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        loadingText.textContent = "Calculando a rota mais provável...";
        loadingDiv.classList.remove('hidden');

        try {
            const response = await fetch('/trace_route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y }),
            });

            if (!response.ok) throw new Error('Falha ao calcular a rota.');

            const data = await response.json();
            drawTrajectory(data.trajectory);

        } catch (error) {
            console.error('Erro ao traçar rota:', error);
            alert('Ocorreu um erro ao calcular a rota.');
        } finally {
            loadingDiv.classList.add('hidden');
        }
    });

    function drawTrajectory(trajectory) {
        // 1. Redesenha o mapa original para apagar rotas antigas
        mapCtx.drawImage(mapImage, 0, 0);

        if (trajectory && trajectory.length > 1) {
            // 2. Configura o estilo da linha
            mapCtx.strokeStyle = '#00FFFF'; // Ciano
            mapCtx.lineWidth = 3;
            mapCtx.shadowColor = 'black';
            mapCtx.shadowBlur = 4;

            // 3. Desenha a rota
            mapCtx.beginPath();
            mapCtx.moveTo(trajectory[0][0], trajectory[0][1]);
            for (let i = 1; i < trajectory.length; i++) {
                mapCtx.lineTo(trajectory[i][0], trajectory[i][1]);
            }
            mapCtx.stroke();
            
            // 4. Desenha um ponto de início (círculo verde)
            const sharkIcon = new Image();
            sharkIcon.src = '/static/shark_icon.png';
            sharkIcon.onload = () => {
                const iconWidth = 80;  // ajuste conforme o tamanho real da imagem
                const iconHeight = 80;
                const x = trajectory[0][0] - iconWidth / 2;
                const y = trajectory[0][1] - iconHeight / 2;
                mapCtx.drawImage(sharkIcon, x, y, iconWidth, iconHeight);
            };

            // 5. Desenha o ponto final (círculo vermelho)
            const endPoint = trajectory[trajectory.length - 1];
            mapCtx.beginPath();
            mapCtx.arc(endPoint[0], endPoint[1], 8, 0, 2 * Math.PI);
            mapCtx.fillStyle = 'red';
            mapCtx.fill();
            mapCtx.strokeStyle = 'black';
            mapCtx.lineWidth = 2;
            mapCtx.stroke();
        }
    }
});