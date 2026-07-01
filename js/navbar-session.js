document.addEventListener('DOMContentLoaded', async function () {
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

    if (navGuestActions && navUserActions) {
        window.handleLogout = async function handleLogout() {
            await supabaseClient.auth.signOut();
            navGuestActions.style.display = 'block';
            navUserActions.style.display = 'none';
        };
    }

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
