document.addEventListener('DOMContentLoaded', () => {
    // --- Configurações da API ---
    const API_KEY = '860b66ade580bacae581f4228fad49fc';
    const API_URL = 'https://api.themoviedb.org/3';
    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
    const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

    // --- Referências aos Elementos do DOM ---
    const headerContainer = document.getElementById('header-container');
    const mainContent = document.getElementById('main-content');
    const footerContainer = document.getElementById('footer-container');
    
    let debounceTimeout;

    // --- Funções Genéricas ---
    async function fetchData(endpoint) {
        try {
            const separator = endpoint.includes('?') ? '&' : '?';
            const response = await fetch(`${API_URL}${endpoint}${separator}api_key=${API_KEY}&language=pt-BR`);
            if (!response.ok) throw new Error('Falha na resposta da rede');
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            mainContent.innerHTML = `<p style="color: red;">Erro ao carregar conteúdo. Tente novamente mais tarde.</p>`;
            return null;
        }
    }

    // --- Funções de Renderização ---

    function renderHeader() {
        headerContainer.innerHTML = `
            <div class="header">
                <div class="container">
                    <div class="header-left">
                        <i id="menu-toggle-icon" class="fas fa-bars menu-icon"></i>
                        <a href="/" class="logo-link"><img src="https://i.ibb.co/vxcnCL6Q/pipocine-logo.png" alt="PipoCine Logo" class="logo-img"></a>
                    </div>
                    <form id="search-form" class="search-form">
                        <input type="text" id="search-input" placeholder="Buscar..." class="search-input">
                        <button type="submit" class="search-button" aria-label="Buscar">
                            <i class="fas fa-search"></i>
                        </button>
                    </form>
                    <div class="header-right"></div>
                </div>
            </div>
        `;
        document.getElementById('search-form').addEventListener('submit', handleSearchSubmit);
    }
    
    function renderSidebar() {
        const sidebarHTML = `
            <div id="sidebar" class="sidebar">
                <nav class="sidebar-nav">
                    <div class="sidebar-section">
                        <ul>
                            <li><a href="/" class="sidebar-link">Início</a></li>
                            <li><a href="#" id="mapa-do-site-link" class="sidebar-link">Mapa do Site</a></li>
                            <li><a href="#" class="sidebar-link" data-endpoint="/discover/movie?sort_by=vote_count.desc" data-title="Mapa dos Filmes">Mapa dos Filmes</a></li>
                        </ul>
                    </div>
                    <div class="sidebar-section">
                        <h3 class="sidebar-section-title">CATEGORIAS</h3>
                        <ul>
                            <li><a href="#" class="sidebar-link" data-endpoint="/movie/popular" data-title="Mais Acessados">Mais Acessados</a></li>
                            <li><a href="#" class="sidebar-link" data-endpoint="/movie/now_playing" data-title="Novos Vídeos">Novos Vídeos</a></li>
                            <li><a href="#" class="sidebar-link" data-provider="8" data-title="Netflix">Netflix</a></li>
                            <li><a href="#" class="sidebar-link" data-provider="337" data-title="Disney+">Disney+</a></li>
                             <li class="has-submenu">
                                <a href="#" class="submenu-toggle">Filmes <i class="fas fa-chevron-right"></i></a>
                                <ul class="submenu">
                                    <li><a href="#" class="sidebar-link" data-endpoint="/discover/movie?with_genres=28" data-title="Filmes de Ação">Ação</a></li>
                                    <li><a href="#" class="sidebar-link" data-endpoint="/discover/movie?with_genres=12" data-title="Filmes de Aventura">Aventura</a></li>
                                    <li><a href="#" class="sidebar-link" data-endpoint="/discover/movie?with_genres=35" data-title="Filmes de Comédia">Comédia</a></li>
                                </ul>
                            </li>
                            <li><a href="#" class="sidebar-link" data-endpoint="/discover/movie?with_genres=16" data-title="Animes">Animes</a></li>
                            <li><a href="#" class="sidebar-link" data-endpoint="/discover/movie?with_genres=10751" data-title="Desenhos">Desenhos</a></li>
                             <li class="has-submenu">
                                <a href="#" class="submenu-toggle">Séries <i class="fas fa-chevron-right"></i></a>
                                <ul class="submenu">
                                    <li><a href="#" class="sidebar-link" data-endpoint="/discover/tv?with_genres=10759" data-title="Séries de Ação">Ação</a></li>
                                    <li><a href="#" class="sidebar-link" data-endpoint="/discover/tv?with_genres=35" data-title="Séries de Comédia">Comédia</a></li>
                                    <li><a href="#" class="sidebar-link" data-endpoint="/discover/tv?with_genres=18" data-title="Séries de Drama">Drama</a></li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>
            <div id="sidebar-overlay" class="sidebar-overlay"></div>
        `;
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    }

    function renderFooter() {
        footerContainer.innerHTML = `
            <div class="footer container">
                <p>PipoCine &copy; 2024 - Todos os direitos reservados.</p>
                <p class="tmdb-notice">Este site utiliza a API do TMDB, mas não é endossado ou certificado por TMDB.</p>
            </div>
        `;
    }

    async function renderHomePage() {
        mainContent.classList.add('container');
        mainContent.innerHTML = `
            <div id="carousel-container"></div>
            <div class="lists-container">
                <div class="list-column-main" id="new-videos-column"></div>
                <div class="list-column-side" id="top-videos-column"></div>
            </div>
        `;
        
        const carouselContainer = document.getElementById('carousel-container');
        carouselContainer.innerHTML = await createCarouselHTML('VIDEO EM DESTAQUE NO PIPOCINE', '/trending/movie/week');
        addCarouselListeners();

        const newVideosColumn = document.getElementById('new-videos-column');
        newVideosColumn.innerHTML = await createGridHTML('NOVOS VÍDEOS', '/movie/now_playing', true);

        const topVideosColumn = document.getElementById('top-videos-column');
        topVideosColumn.innerHTML = await createSideListHTML('VÍDEOS TOP', '/movie/top_rated');
    }

    async function createCarouselHTML(title, endpoint) {
        const data = await fetchData(endpoint);
        const items = data ? data.results : [];
        if (!items || items.length === 0) return '';

        const cardsHTML = items.map(item => {
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
            return `
                <div class="media-card" data-id="${item.id}" data-type="${mediaType}">
                    <div class="media-card-poster-container">
                        <img src="${item.poster_path ? IMAGE_BASE_URL + item.poster_path : 'https://placehold.co/500x750/111827/FFFFFF?text=PipoCine'}" alt="${item.title || item.name}" class="media-card-poster">
                        <div class="play-overlay">
                           <img src="https://i.ibb.co/BVR11vG1/play-bot-o.png" alt="Play" class="play-button-img">
                        </div>
                    </div>
                    <h3 class="media-card-title">${item.title || item.name}</h3>
                </div>
            `;
        }).join('');

        return `
            <section class="carousel">
                <h2 class="section-title">${title}</h2>
                <div class="carousel-container">
                    <button class="carousel-button prev">&lt;</button>
                    <div class="carousel-track">${cardsHTML}</div>
                    <button class="carousel-button next">&gt;</button>
                </div>
            </section>
        `;
    }

    async function createGridHTML(title, endpoint, showNewTag) {
        const data = await fetchData(endpoint);
        const items = data ? data.results.slice(0, 16) : [];
        if (!items || items.length === 0) return '';

        const cardsHTML = items.map((item, index) => {
            const mediaType = item.title ? 'movie' : 'tv';
            const year = (item.release_date || 'N/A').substring(0, 4);
            const newTagHTML = showNewTag ? '<div class="new-tag">NOVO</div>' : '';
            const metaText = `${item.title || item.name} (Dublado) - ${year} - 1080p`;

            return `
                <div class="grid-item-card" data-id="${item.id}" data-type="${mediaType}">
                    <div class="media-card-poster-container">
                        ${newTagHTML}
                        <img src="${item.poster_path ? IMAGE_BASE_URL + item.poster_path : 'https://placehold.co/300x450'}" alt="${item.title || item.name}" class="media-card-poster">
                        <div class="play-overlay">
                           <img src="https://i.ibb.co/BVR11vG1/play-bot-o.png" alt="Play" class="play-button-img">
                        </div>
                    </div>
                    <div class="list-item-details">
                         <h3 class="media-card-title">${item.title || item.name}</h3>
                         <div class="list-item-meta">
                           <span class="meta-line">${metaText}</span>
                           <span class="meta-line">by PipoCine</span>
                           <span class="meta-line">Adicionado há poucas horas</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <section class="list-section">
                <h2 class="section-title">${title}</h2>
                <div class="grid-container">${cardsHTML}</div>
            </section>
        `;
    }

    async function createSideListHTML(title, endpoint) {
        const data = await fetchData(endpoint);
        const items = data ? data.results.slice(0, 10) : [];
        if (!items || items.length === 0) return '';

        const cardsHTML = items.map(item => {
            const mediaType = item.title ? 'movie' : 'tv';
            const year = (item.release_date || 'N/A').substring(0, 4);
            const metaText = item.title 
                ? `${item.title} (Dublado) / ${year}`
                : `${item.name} - Lista de Episódios`;

            return `
                <div class="side-list-item-card" data-id="${item.id}" data-type="${mediaType}">
                    <div class="media-card-poster-container">
                        <img src="${item.poster_path ? IMAGE_BASE_URL + item.poster_path : 'https://placehold.co/200x300'}" alt="${item.title || item.name}" class="media-card-poster">
                         <div class="play-overlay">
                           <img src="https://i.ibb.co/BVR11vG1/play-bot-o.png" alt="Play" class="play-button-img">
                        </div>
                    </div>
                    <div class="list-item-details">
                        <h3 class="media-card-title">${item.title || item.name}</h3>
                        <div class="list-item-meta">
                            <span class="meta-line">${metaText}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <section class="list-section">
                <h2 class="section-title">${title}</h2>
                <div class="grid-container">${cardsHTML}</div> 
            </section>
        `;
    }
    
    function createSearchResultItemHTML(item) {
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
        return `
            <div class="search-result-item">
                <span class="result-title">${item.title || item.name} (Dublado) -</span>
                <a href="#" class="watch-link" data-id="${item.id}" data-type="${mediaType}">Acessar</a>
            </div>
        `;
    }

    async function updateSearchResults(searchTerm) {
        const resultsListContainer = document.querySelector('.search-results-list');
        if (!resultsListContainer) return;

        if (!searchTerm) {
            resultsListContainer.innerHTML = '';
            return;
        }

        const data = await fetchData(`/search/multi?query=${encodeURIComponent(searchTerm)}`);
        const items = data ? data.results : [];
        const validItems = items.filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && (r.title || r.name));
        
        const resultsHTML = validItems.map(createSearchResultItemHTML).join('');
        
        resultsListContainer.innerHTML = validItems.length > 0 ? resultsHTML : `<p class="no-results">Nenhum resultado encontrado para "${searchTerm}".</p>`;
    }

    async function renderSearchResults(searchTerm) {
        mainContent.classList.remove('container');
        const data = await fetchData(`/search/multi?query=${encodeURIComponent(searchTerm)}`);
        const items = data ? data.results : [];
        const validItems = items.filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && (r.title || r.name));
        
        const resultsHTML = validItems.map(createSearchResultItemHTML).join('');
        
        mainContent.innerHTML = `
            <div class="search-page-container">
                <h2 class="search-page-title">Mapa de Filmes Completo | Mapa do Site Completo</h2>
                <input type="text" id="search-page-input" class="search-query-input" value="${searchTerm}" placeholder="Digite para pesquisar em tempo real...">
                <div class="search-results-list">
                    ${validItems.length > 0 ? resultsHTML : `<p class="no-results">Nenhum resultado encontrado para "${searchTerm}".</p>`}
                </div>
            </div>
        `;
        
        const searchInput = document.getElementById('search-page-input');
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                const newSearchTerm = searchInput.value.trim();
                updateSearchResults(newSearchTerm);
            }, 500);
        });
    }
    
    async function renderGridPage(title, endpoint) {
        mainContent.classList.add('container');
        mainContent.innerHTML = `<h2 class="page-main-title">${title}</h2><div id="grid-page-container" class="grid-page-container">Carregando...</div>`;
        
        const data = await fetchData(endpoint);
        const items = data ? data.results : [];
        if (!items || items.length === 0) {
            document.getElementById('grid-page-container').innerHTML = "Nenhum item encontrado.";
            return;
        }
        
        const cardsHTML = items.map(item => {
             const mediaType = item.title ? 'movie' : 'tv';
             const year = (item.release_date || item.first_air_date ||'N/A').substring(0, 4);
             const metaText = `${item.title || item.name} (Dublado) - ${year} - 1080p`;

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
                         <div class="list-item-meta">
                           <span class="meta-line">${metaText}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('grid-page-container').innerHTML = cardsHTML;
    }
    
    async function renderMapaCompletoPage() {
        mainContent.classList.remove('container');
        mainContent.innerHTML = `
            <div class="search-page-container">
                <h2 class="search-page-title">Mapa de Filmes Completo | Mapa do Site Completo</h2>
                <input type="text" id="search-page-input" class="search-query-input" value="mapa completo" placeholder="Digite para pesquisar...">
                <div class="search-results-list">
                    <p class="no-results">Carregando lista de títulos de A-Z...</p>
                </div>
            </div>`;

        const pagePromises = [];
        for (let i = 1; i <= 5; i++) {
            pagePromises.push(fetchData(`/discover/movie?sort_by=popularity.desc&page=${i}`));
        }
        const pageResults = await Promise.all(pagePromises);

        let allItems = pageResults.flatMap(page => page ? page.results : []);
        const validItems = allItems.filter(item => item && item.title);

        validItems.sort((a, b) => a.title.localeCompare(b.title));

        const resultsHTML = validItems.map(createSearchResultItemHTML).join('');
        const resultsListContainer = document.querySelector('.search-results-list');
        
        if (resultsListContainer) {
            resultsListContainer.innerHTML = resultsHTML;
        }
    }

    // AQUI ESTÁ A FUNÇÃO ATUALIZADA PARA O NOVO DESIGN
    async function renderSeriesDetails(seriesId) {
        mainContent.classList.add('container'); // Garante que o conteúdo fique centralizado
        const details = await fetchData(`/tv/${seriesId}`);
        if (!details) {
            mainContent.innerHTML = `<p class="error-message">Não foi possível carregar os detalhes da série.</p>`;
            return;
        }

        let seasonsHTML = '';
        const validSeasons = details.seasons.filter(season => season.season_number > 0 && season.episode_count > 0);

        for (const season of validSeasons) {
            const seasonDetails = await fetchData(`/tv/${seriesId}/season/${season.season_number}`);
            if (seasonDetails && seasonDetails.episodes) {
                // Gera a lista de episódios sem margem ou padding
                const episodesHTML = seasonDetails.episodes.map(ep => `
                    <div class="episode-item-new">
                        Episódio ${ep.episode_number} - ${ep.name} - 
                        <a href="/watch.html?type=tv&id=${seriesId}&s=${season.season_number}&e=${ep.episode_number}" target="_blank" rel="noopener noreferrer" class="watch-link-new">Assistir</a>
                    </div>
                `).join('');
                
                seasonsHTML += `
                    <div class="season-block-new">
                        <h3 class="season-title-new">${season.name}</h3>
                        <div class="episode-list-new">${episodesHTML}</div>
                    </div>
                `;
            }
        }

        // NOVA ESTRUTURA HTML - Simples, com banner no topo e lista embaixo
        const backdropUrl = details.backdrop_path ? `${BACKDROP_BASE_URL}${details.backdrop_path}` : '';
        mainContent.innerHTML = `
            <div class="series-details-page">
                <img src="${backdropUrl}" alt="Banner de ${details.name}" class="series-backdrop-banner">
                <div class="episodes-container">
                    ${seasonsHTML}
                </div>
            </div>
        `;
    }

    // --- Lógica de Navegação e Eventos ---
    
    function handleSearchSubmit(event) {
        event.preventDefault();
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            window.history.pushState({searchTerm}, `Busca por ${searchTerm}`, `/?search=${encodeURIComponent(searchTerm)}`);
            renderSearchResults(searchTerm);
            searchInput.value = '';
        }
    }

    function handleCardClick(event) {
        const card = event.target.closest('.media-card, .grid-item-card, .side-list-item-card');
        if (card) {
            const { id, type } = card.dataset;
            if (type === 'tv') {
                window.history.pushState({seriesId: id}, `Série ${id}`, `/?series=${id}`);
                renderSeriesDetails(id);
            } else if (type === 'movie') {
                const playerUrl = `/watch.html?type=movie&id=${id}`;
                window.open(playerUrl, '_blank');
            }
        }

        const watchLink = event.target.closest('.watch-link');
        if (watchLink) {
            event.preventDefault();
            const { id, type } = watchLink.dataset;
             if (type === 'tv') {
                window.history.pushState({seriesId: id}, `Série ${id}`, `/?series=${id}`);
                renderSeriesDetails(id);
            } else if (type === 'movie') {
                const playerUrl = `/watch.html?type=movie&id=${id}`;
                window.open(playerUrl, '_blank');
            }
        }
    }
    
    function addCarouselListeners() {
        document.querySelectorAll('.carousel').forEach(carousel => {
            const track = carousel.querySelector('.carousel-track');
            const prevBtn = carousel.querySelector('.prev');
            const nextBtn = carousel.querySelector('.next');

            nextBtn.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }));
            prevBtn.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' }));
        });
    }
    
    function addSidebarListeners() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        document.addEventListener('click', (event) => {
            if (event.target.closest('#menu-toggle-icon')) {
                sidebar.classList.toggle('visible');
                overlay.classList.toggle('visible');
            } else if (event.target.matches('#sidebar-overlay')) {
                sidebar.classList.remove('visible');
                overlay.classList.remove('visible');
            }
        });

        sidebar.addEventListener('click', (event) => {
            const link = event.target.closest('.sidebar-link');
            if (!link) {
                const submenuToggle = event.target.closest('.submenu-toggle');
                if(submenuToggle) {
                    event.preventDefault();
                    submenuToggle.parentElement.classList.toggle('open');
                }
                return;
            }

            event.preventDefault();

            if (link.id === 'mapa-do-site-link') {
                renderMapaCompletoPage();
            } else if(link.getAttribute('href') === '/') {
                 window.location.href = '/';
            } else {
                const endpoint = link.dataset.endpoint;
                const providerId = link.dataset.provider;
                const title = link.dataset.title || link.textContent;
                
                let finalEndpoint = endpoint;
                if (providerId) {
                    finalEndpoint = `/discover/movie?with_watch_providers=${providerId}&watch_region=BR`;
                }
                renderGridPage(title, finalEndpoint);
            }
            
            sidebar.classList.remove('visible');
            overlay.classList.remove('visible');
        });
    }

    mainContent.addEventListener('click', handleCardClick);

    // --- Roteador Simples e Inicialização ---
    function router() {
        const params = new URLSearchParams(window.location.search);
        const seriesId = params.get('series');
        const searchTerm = params.get('search');
        
        renderHeader();
        
        if (seriesId) {
            footerContainer.classList.add('hidden'); // Esconde o footer na página de detalhes
            renderSeriesDetails(seriesId);
        } else if (searchTerm) {
            mainContent.classList.remove('container');
            footerContainer.classList.remove('hidden');
            renderSearchResults(searchTerm);
            renderFooter();
        } else {
            mainContent.classList.add('container');
            footerContainer.classList.remove('hidden');
            renderHomePage();
            renderFooter();
        }
    }
    
    // --- INICIALIZAÇÃO ---
    renderSidebar();
    router();
    addSidebarListeners();
    window.addEventListener('popstate', router);
});