document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-container');
    const playerIframe = document.getElementById('video-player');
    const mainContent = document.getElementById('watch-main-content');
    
    // Configurações da API
    const API_KEY = '860b66ade580bacae581f4228fad49fc';
    const API_URL = 'https://api.themoviedb.org/3';
    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

    // Função para buscar dados da API TMDB
    async function fetchData(endpoint) {
        try {
            const separator = endpoint.includes('?') ? '&' : '?';
            const response = await fetch(`${API_URL}${endpoint}${separator}api_key=${API_KEY}&language=pt-BR`);
            if (!response.ok) throw new Error('Falha na resposta da rede');
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            return null;
        }
    }

    // Função para renderizar um cabeçalho simplificado
    function renderHeader() {
        headerContainer.innerHTML = `
            <div class="header">
                <div class="container">
                    <div class="header-left">
                         <a href="/" class="logo-link"><img src="https://i.ibb.co/vxcnCL6Q/pipocine-logo.png" alt="PipoCine Logo" class="logo-img"></a>
                    </div>
                    <form id="search-form" class="search-form" action="/index.html" method="GET">
                        <input type="text" name="search" placeholder="Buscar..." class="search-input">
                        <button type="submit" class="search-button" aria-label="Buscar">
                            <i class="fas fa-search"></i>
                        </button>
                    </form>
                    <div class="header-right"></div>
                </div>
            </div>
        `;
        document.getElementById('search-form').addEventListener('submit', (event) => {
            event.preventDefault();
            const searchTerm = event.target.elements.search.value.trim();
            if (searchTerm) {
                window.location.href = `/index.html?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    }

    // Função para carregar as recomendações
    async function loadRecommendations(type, id) {
        const recommendationsGrid = document.getElementById('recommendations-grid');
        if (!recommendationsGrid) return;
        
        const data = await fetchData(`/${type}/${id}/recommendations`);
        const items = data ? data.results.slice(0, 6) : [];

        if (items.length > 0) {
            const cardsHTML = items.map(item => {
                const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
                return `
                    <div class="grid-item-card" data-id="${item.id}" data-type="${mediaType}">
                        <div class="media-card-poster-container">
                            <img src="${item.poster_path ? IMAGE_BASE_URL + item.poster_path : 'https://placehold.co/300x450'}" alt="${item.title || item.name}" class="media-card-poster">
                            <div class="play-overlay">
                               <img src="https://i.ibb.co/BVR11vG1/play-bot-o.png" alt="Play" class="play-button-img">
                            </div>
                        </div>
                        <div class="list-item-details">
                             <h3 class="media-card-title">${item.title || item.name}</h3>
                        </div>
                    </div>
                `;
            }).join('');
            recommendationsGrid.innerHTML = cardsHTML;
        } else {
            recommendationsGrid.innerHTML = "<p>Nenhuma recomendação encontrada.</p>";
        }
    }
    
    // Função para carregar o Disqus
    function loadDisqus(pageUrl, pageIdentifier) {
        var disqus_config = function () {
            this.page.url = pageUrl;
            this.page.identifier = pageIdentifier;
        };
        
        (function() { 
            var d = document, s = d.createElement('script');
            s.src = 'https://pipocine-vecel-app.disqus.com/embed.js';
            s.setAttribute('data-timestamp', +new Date());
            (d.head || d.body).appendChild(s);
        })();
    }

    // Função principal para carregar todo o conteúdo da página
    function loadContent() {
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        const id = params.get('id');
        const season = params.get('s');
        const episode = params.get('e');

        let streamUrl = '';

        // --- ALTERAÇÃO AQUI ---
        // URLs foram atualizadas para usar o PrimeVicio
        if (type === 'movie' && id) {
            streamUrl = `https://primevicio.vercel.app/embed/movie/${id}`;
        } else if (type === 'tv' && id && season && episode) {
            streamUrl = `https://primevicio.vercel.app/embed/tv/${id}/${season}/${episode}`;
        }

        if (streamUrl) {
            playerIframe.src = streamUrl;
            loadRecommendations(type, id);
            const pageUrl = window.location.href;
            const pageIdentifier = `${type}-${id}`;
            loadDisqus(pageUrl, pageIdentifier);
        } else {
            const watchContainer = document.querySelector('.watch-container');
            if(watchContainer) {
                watchContainer.innerHTML = '<p class="error-message">Erro: Informações inválidas para carregar o vídeo.</p>';
            }
        }
    }
    
    mainContent.addEventListener('click', (event) => {
        const card = event.target.closest('.grid-item-card');
        if (card) {
            const { id, type } = card.dataset;
            // Alterado para abrir na mesma aba para uma melhor experiência
            window.location.href = `/watch.html?type=${type}&id=${id}`;
        }
    });

    // Inicialização da página
    renderHeader();
    loadContent();
});
