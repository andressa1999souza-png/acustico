// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado com sucesso!');
    // Aqui no futuro você pode mandar ele salvar páginas no cache para funcionar offline
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker ativado e pronto para controlar a rede.');
});

// Interceptando requisições (obrigatório para ser um PWA válido)
self.addEventListener('fetch', (event) => {
    // Por enquanto, ele apenas deixa a requisição passar normalmente
    event.respondWith(fetch(event.request));
});