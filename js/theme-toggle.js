// theme-toggle.js
// Carregado em todas as páginas. Cria (se ainda não existir) o botão de alternar modo claro/escuro
// na navbar, e guarda a escolha em localStorage para se manter entre visitas e entre páginas.
const SUN_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"></circle><line x1="12" y1="1.5" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22.5"></line><line x1="4.2" y1="4.2" x2="5.9" y2="5.9"></line><line x1="18.1" y1="18.1" x2="19.8" y2="19.8"></line><line x1="1.5" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22.5" y2="12"></line><line x1="4.2" y1="19.8" x2="5.9" y2="18.1"></line><line x1="18.1" y1="5.9" x2="19.8" y2="4.2"></line></svg>';
const MOON_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.4A8.5 8.5 0 1 1 9.6 3.5a7 7 0 0 0 10.9 10.9z"></path></svg>';

// Corre uma vez por página: aplica o tema guardado e cria o botão se a página ainda não o tiver.
function initThemeToggle() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    let themeBtn = document.getElementById('themeToggle');
    if (!themeBtn && document.querySelector('body')) {
        themeBtn = document.createElement('button');
        themeBtn.id = 'themeToggle';
        themeBtn.className = 'theme-toggle';
        themeBtn.type = 'button';
        themeBtn.setAttribute('title', 'Alternar tema');
        themeBtn.setAttribute('aria-label', 'Alternar entre modo claro e escuro');
        themeBtn.innerHTML = savedTheme === 'dark' ? SUN_ICON : MOON_ICON;
        themeBtn.onclick = toggleTheme;

        // Encaixar junto aos outros controlos de navegação em vez de um filho solto da navbar
        const navAuth = document.querySelector('.nav-auth');
        const navLinks = document.querySelector('.nav-links');
        const navbar = document.querySelector('.navbar') || document.querySelector('nav');

        if (navAuth) {
            navAuth.appendChild(themeBtn);
        } else if (navLinks) {
            const li = document.createElement('li');
            li.appendChild(themeBtn);
            navLinks.appendChild(li);
        } else if (navbar) {
            navbar.appendChild(themeBtn);
        } else {
            document.body.appendChild(themeBtn);
        }
    }
}

// Chamado ao clicar no botão: troca claro <-> escuro e guarda a escolha
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    updateThemeButton(newTheme);
}

// Aplica o tema ao <html>/<body> (o CSS reage a data-theme="light" e à classe .light-mode)
function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.add('light-mode');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.remove('light-mode');
    }
}

function updateThemeButton(theme) {
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
    initThemeToggle();
}
