// navbar-session.js
// Usado nas páginas que NÃO têm lógica própria de sessão (index.html, aprende.html):
// ao carregar a página, verifica se há uma sessão Supabase ativa e ajusta a navbar
// (mostra "Gerir Conta" em vez de "Entrar", etc.). jogar.html e entrar.html têm a sua
// própria versão desta lógica embutida no <script> de cada página, não usam este ficheiro.
document.addEventListener('DOMContentLoaded', async function () {
    // Elementos da navbar que este script pode ajustar (nem todas as páginas têm todos)
    const loginLink = document.querySelector('[data-nav-login]');
    const registerLink = document.querySelector('[data-nav-register]');
    const navGuestActions = document.getElementById('navGuestActions');
    const navUserActions = document.getElementById('navUserActions');
    const navUserLabel = document.getElementById('navUserLabel');

    if (!loginLink && !navGuestActions) return;
    if (!window.supabase || !window.APP_SUPABASE?.url || !window.APP_SUPABASE?.publishableKey) return;

    let supabaseClient = null;
    try {
        supabaseClient = window.supabase.createClient(
            window.APP_SUPABASE.url,
            window.APP_SUPABASE.publishableKey
        );
    } catch (e) {
        console.error('Erro ao inicializar a navbar de sessão:', e);
        return;
    }

    function obterNomeApresentacao(user) {
        return user?.user_metadata?.username || user?.user_metadata?.display_name || user?.email || 'Utilizador';
    }

    // Disponibiliza handleLogout globalmente porque o botão "Sair" na navbar chama-o via onclick no HTML
    if (navGuestActions && navUserActions) {
        window.handleLogout = async function handleLogout() {
            await supabaseClient.auth.signOut();
            navGuestActions.style.display = 'block';
            navUserActions.style.display = 'none';
        };
    }

    // Verifica se já existe sessão guardada (utilizador tinha sessão iniciada numa visita anterior)
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) return;

        const user = data?.session?.user;
        if (!user) return;

        if (loginLink) {
            loginLink.textContent = 'Gerir';
            loginLink.href = 'entrar.html';
            loginLink.setAttribute('aria-label', 'Gerir Conta');
        }

        if (registerLink) {
            registerLink.style.display = 'none';
        }

        if (navGuestActions && navUserActions) {
            navGuestActions.style.display = 'none';
            navUserActions.style.display = 'flex';
            if (navUserLabel) navUserLabel.innerText = obterNomeApresentacao(user);
        }
    } catch (e) {
        console.error('Erro ao verificar sessão da navbar:', e);
    }
});
