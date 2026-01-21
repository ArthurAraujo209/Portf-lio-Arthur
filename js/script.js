// scripts.js - Scripts otimizados para SEO e performance

document.addEventListener('DOMContentLoaded', function() {
    // Configuração do Particles.js (mantida)
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#2A6BF2" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#2A6BF2",
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "grab" },
                onclick: { enable: true, mode: "push" },
                resize: true
            }
        },
        retina_detect: true
    });

    // Dark/Light Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        
        if (document.body.classList.contains('light-mode')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'dark');
        }
    });
    
    // Verificar tema salvo
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    
    // Scroll suave para âncoras
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Atualizar URL sem recarregar a página
                history.pushState(null, null, targetId);
            }
        });
    });
    
    // Intersection Observer para animações
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
    
    // Filtro de projetos
    const filterButtons = document.querySelectorAll('.filter-btn');
    let projectCards = [];
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe active de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona a classe active ao botão clicado
            button.classList.add('active');
            
            // Filtra os projetos
            const filter = button.getAttribute('data-filter');
            filterProjects(filter);
            
            // Registrar interação para analytics
            if (window.db) {
                try {
                    window.db.collection('interactions').add({
                        type: 'project_filter',
                        filter: filter,
                        timestamp: new Date().toISOString()
                    });
                } catch (e) {
                    // Silencioso em caso de erro
                }
            }
        });
    });
    
    function filterProjects(filter) {
        projectCards.forEach(card => {
            const cardTech = card.getAttribute('data-tech');
            
            if (filter === 'all' || cardTech === filter) {
                card.style.display = 'block';
                card.setAttribute('aria-hidden', 'false');
            } else {
                card.style.display = 'none';
                card.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    // Inicializar cards de projeto
    setTimeout(() => {
        projectCards = document.querySelectorAll('.project-card');
    }, 1000);
});