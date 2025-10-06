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
        // --- NOVIDADE: Resetar o estado do mapa antes de começar ---
        mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height); // Limpa qualquer desenho antigo do canvas
        mapImage.src = ''; // Invalida a imagem antiga para evitar que a rota seja clicável enquanto carrega

        const selectedTemp = sharkSelect.value;
        
        loadingText.textContent = "Generating probability map...";
        loadingDiv.classList.remove('hidden');
        mapCanvas.classList.add('hidden');
        generateBtn.disabled = true;

        try {
            const response = await fetch('/generate_map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temperature: selectedTemp }),
            });

            if (!response.ok) throw new Error('Fail on the server response');

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
            console.error('Error:', error);
            alert('An error occurred when generating the map.');
            loadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    mapCanvas.addEventListener('click', async (event) => {
        if (!mapImage.src || mapImage.src === '') {
            alert("First, generate a probability map.");
            return;
        }

        const rect = mapCanvas.getBoundingClientRect();
        const scaleX = mapCanvas.width / rect.width;
        const scaleY = mapCanvas.height / rect.height;
        
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        //loadingText.textContent = "Calculando a rota mais provável...";
        //loadingDiv.classList.remove('hidden');

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
            console.error('Error when tracing the route:', error);
            alert('An error occurred when tracing the route.');
        } finally {
            //loadingDiv.classList.add('hidden');
        }
    });

    function drawTrajectory(trajectory) {
        mapCtx.drawImage(mapImage, 0, 0);

        if (trajectory && trajectory.length > 1) {
            mapCtx.strokeStyle = '#00FFFF';
            mapCtx.lineWidth = 3;
            mapCtx.shadowColor = 'black';
            mapCtx.shadowBlur = 4;

            mapCtx.beginPath();
            mapCtx.moveTo(trajectory[0][0], trajectory[0][1]);
            for (let i = 1; i < trajectory.length; i++) {
                mapCtx.lineTo(trajectory[i][0], trajectory[i][1]);
            }
            mapCtx.stroke();
            
            mapCtx.beginPath();
            mapCtx.arc(trajectory[0][0], trajectory[0][1], 8, 0, 2 * Math.PI);
            mapCtx.fillStyle = 'lime';
            mapCtx.fill();
            mapCtx.strokeStyle = 'black';
            mapCtx.lineWidth = 2;
            mapCtx.stroke();

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