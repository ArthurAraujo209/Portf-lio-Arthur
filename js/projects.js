// projects.js - Arquivo separado para gerenciar os projetos do portfólio

// Lista manual dos repositórios que você quer mostrar
const selectedRepositories = [
    {
        name: "Oca da Serra - Reservas",
        description: "Um site Responsivo para exibir fotos dos chalés de um cliente e fazer as reservas deles",
        html_url: "https://github.com/ArthurAraujo209/Oca-da-Serra---Chal-s",
        homepage: "https://reservas-oca-da-serra.web.app",
        technologies: ["html","css","js","firebase"],
        image: '../img/Oca-da-serra-reservas.png'
    },
    {
        name: "Oca da Serra - Cardápio",
        description: "Um cardápio virtual responsivo para um Chalé",
        html_url: "https://github.com/ArthurAraujo209/Oca-da-Serra",
        homepage: "https://cardapio-oca-da-serra.web.app",
        technologies: ["html","css","js","firebase"],
        image: '../img/Oca-da-serra-cardapio.png'
    },
    {
        name: "A Preferida",
        description: "Um Cardápio para uma cafeteria com temática Nordestina",
        html_url: "https://github.com/ArthurAraujo209/A-Preferida",
        homepage: "https://arthuraraujo209.github.io/A-Preferida/",
        technologies: ["html","css","js"],
        image: '../img/A-preferida.png'
    },
    {
        name: "Torra Café Bistrô",
        description: "Um cardápio virtual para um cafeteria",
        html_url: "https://github.com/ArthurAraujo209/Cardapio-Cafe-Torra-Bistro",
        homepage: "https://cafe-torra.web.app",
        technologies: ["html","css","js","firebase"],
        image: '../img/Torra.png'
    },
];
// Mapeamento de tecnologias para exibição
const TECH_DISPLAY_NAMES = {
    html: "HTML",
    css: "CSS", 
    js: "JavaScript",
    python: "Python",
    firebase: "Firebase",
};

// Imagens padrão para fallback 
const DEFAULT_IMAGES = {
    html: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=400&h=300&fit=crop',
    js: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop',
    python: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&h=300&fit=crop',
    default: 'https://images.unsplash.com/photo-1623479322729-28b25c16b011?w=400&h=300&fit=crop'
};

// Função para obter a tecnologia principal para filtros
function getPrimaryTech(technologies) {
    // Mantém a primeira tecnologia como principal para filtro
    // Isso faz com que HTML e CSS sejam considerados como tecnologia principal
    return technologies[0] || 'default';
}

// Função para gerar as tags de tecnologia
function generateTechTags(technologies) {
    return technologies.map(tech => `
        <span class="tech-tag" data-tech="${tech}">
            ${TECH_DISPLAY_NAMES[tech] || tech.toUpperCase()}
        </span>
    `).join('');
}

// Função principal para carregar projetos
function loadProjects() {
    const projectsGrid = document.querySelector('.projects-grid');
    
    if (!projectsGrid) {
        console.error('Elemento .projects-grid não encontrado!');
        return;
    }
    
    projectsGrid.innerHTML = '';
    
    selectedRepositories.forEach((project, index) => {
        const projectCard = createProjectCard(project, index);
        projectsGrid.appendChild(projectCard);
    });
    
    window.projectCards = document.querySelectorAll('.project-card');
    console.log('Projetos carregados com sucesso!');
}

// Função para criar card do projeto
function createProjectCard(project, index) {
    const projectCard = document.createElement('div');
    const primaryTech = getPrimaryTech(project.technologies);
    const techTags = generateTechTags(project.technologies);
    
    projectCard.className = 'project-card fade-in';
    projectCard.setAttribute('data-tech', primaryTech);
    projectCard.setAttribute('data-technologies', project.technologies.join(','));
    
    const hasDemo = !!project.homepage;
    const imageUrl = project.image || DEFAULT_IMAGES[primaryTech] || DEFAULT_IMAGES.default;
    
    projectCard.innerHTML = `
        <div class="project-img">
            <img src="${imageUrl}" alt="${project.name}" 
                 onerror="this.src='${DEFAULT_IMAGES[primaryTech] || DEFAULT_IMAGES.default}'">
            ${hasDemo ? `
            <div class="project-overlay">
                <button class="preview-btn" onclick="window.open('${project.homepage}', '_blank')">
                    <i class="fas fa-eye"></i> Ver Demo
                </button>
            </div>
            ` : ''}
        </div>
        <div class="project-info">
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <div class="project-tech">
                ${techTags}
            </div>
            <div class="project-links">
                <a href="${project.html_url}" class="project-link" target="_blank" rel="noopener noreferrer">
                    <i class="fab fa-github"></i> Código
                </a>
                ${hasDemo ? `
                <a href="${project.homepage}" class="project-link" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i> Demo
                </a>
                ` : ''}
            </div>
        </div>
    `;
    
    return projectCard;
}

// Funções de filtro (agora filtra pela tecnologia principal)
// NOVA função de filtro (substitua a antiga)
function filterProjects(filter) {
    if (!window.projectCards) return;
    
    window.projectCards.forEach(card => {
        const allTechs = card.getAttribute('data-technologies').split(',');
        
        if (filter === 'all' || allTechs.includes(filter)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function initProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterProjects(button.getAttribute('data-filter'));
        });
    });
}

// CSS adicional para múltiplas tags
function injectExtraCSS() {
    const css = `
        .project-img {
            position: relative;
            overflow: hidden;
            height: 200px;
            background: #f0f0f0;
        }

        .project-img img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .project-card:hover .project-img img {
            transform: scale(1.05);
        }

        .project-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .project-card:hover .project-overlay {
            opacity: 1;
        }

        .preview-btn {
            background: var(--azul-principal);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .preview-btn:hover {
            background: var(--azul-claro);
            transform: translateY(-2px);
        }

        /* Estilo para múltiplas tags de tecnologia */
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 15px;
        }

        .tech-tag {
            padding: 4px 12px;
            background: var(--azul-principal);
            color: white;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .tech-tag:hover {
            background: var(--azul-claro);
            transform: translateY(-2px);
        }

        /* Cores diferentes para diferentes tecnologias */
        .tech-tag[data-tech="html"] { background: #e34f26; }
        .tech-tag[data-tech="css"] { background: #1572b6; }
        .tech-tag[data-tech="js"] { background: #f7df1e; color: #000; }
        .tech-tag[data-tech="python"] { background: #3776ab; }
        .tech-tag[data-tech="firebase"] { background: #FFA611; color: #000; }
        .tech-tag[data-tech="nodejs"] { background: #339933; }
        .tech-tag[data-tech="express"] { background: #000000; }
        .tech-tag[data-tech="mongodb"] { background: #47a248; }
        .tech-tag[data-tech="localstorage"] { background: #5a5a5a; }
        .tech-tag[data-tech="tkinter"] { background: #2c5e8e; }

        /* Estilo para quando não há imagem */
        .project-img:has(img[src*="unsplash"]) {
            background: linear-gradient(135deg, var(--azul-principal), var(--azul-claro));
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .project-img:has(img[src*="unsplash"]) img {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Carregando projetos com múltiplas tecnologias...');
    injectExtraCSS();
    loadProjects();
    initProjectFilters();
});