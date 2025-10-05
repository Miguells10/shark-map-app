// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const sharkSelect = document.getElementById('shark-select');
    const generateBtn = document.getElementById('generate-btn');
    const resultImage = document.getElementById('result-image');
    const loadingDiv = document.getElementById('loading');

    generateBtn.addEventListener('click', async () => {
        const selectedTemp = sharkSelect.value;
        
        // Esconde a imagem antiga e mostra o spinner de loading
        resultImage.style.display = 'none';
        loadingDiv.classList.remove('hidden');
        generateBtn.disabled = true; // Desabilita o botão

        try {
            const response = await fetch('/generate_map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ temperature: selectedTemp }),
            });

            if (!response.ok) {
                throw new Error('Falha na resposta do servidor.');
            }

            const data = await response.json();
            
            // Define o caminho da nova imagem
            // A pasta 'static' é o padrão, então não precisamos incluí-la no caminho
            resultImage.src = `/static/${data.image_filename}`;
            resultImage.style.display = 'block';

        } catch (error) {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao gerar o mapa. Tente novamente.');
        } finally {
            // Esconde o spinner e reabilita o botão
            loadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });
});