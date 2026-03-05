/**
 * UI Engine para AHSE Paquetería
 * Controla la generación dinámica de Sidebar y Navbar con Amazing Tabs.
 */

const NAV_CONFIG = {
    admin: {
        accent: "#10b981",
        links: [
            { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard.html', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'empresas',  label: 'Empresas',  href: '/admin/empresas.html',  icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5' },
            { id: 'tarifas',   label: 'Tarifas',   href: '/admin/tarifas.html',   icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01' },
            { id: 'logs',      label: 'Logs',      href: '/admin/logs.html',      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5' }
        ]
    },
    empresa: {
        accent: "#38bdf8",
        links: [
            { id: 'dashboard', label: 'Dashboard', href: '/empresas/dashboard.html', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
            { id: 'pedidos',   label: 'Pedidos',   href: '/empresas/pedidos.html',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7' },
            { id: 'chats',     label: 'Mensajes',  href: '/empresas/chats.html',     icon: 'M8 12h.01M12 12h.01M16 12h.01' }
        ]
    }
};

function initAmazingInterface(role, activePageId) {
    const config = NAV_CONFIG[role];
    if (!config) return;

    // 1. Inyectar Sidebar
    const sidebarContainer = document.getElementById('sidebarContainer');
    if (sidebarContainer) {
        const activeIndex = config.links.findIndex(l => l.id === activePageId);
        document.documentElement.style.setProperty('--accent-primary', config.accent);

        sidebarContainer.innerHTML = `
        <aside class="amazing-sidebar">
            <div class="sidebar-header">
                <div style="width:10px; height:24px; background:var(--accent-primary); border-radius:4px;"></div>
                <h2 style="font-weight: 800; letter-spacing: -1px; font-size: 20px;">AHSE</h2>
            </div>
            <ul class="nav-list">
                <div class="nav-slider" style="transform: translateY(${activeIndex * 48}px)"></div>
                ${config.links.map(link => `
                    <li class="nav-item">
                        <a href="${link.href}" class="nav-link ${link.id === activePageId ? 'active' : ''}">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="${link.icon}"/>
                            </svg>
                            ${link.label}
                        </a>
                    </li>
                `).join('')}
            </ul>
        </aside>`;
    }

    // 2. Inyectar Navbar
    const navbarContainer = document.getElementById('navbarContainer');
    if (navbarContainer) {
        const user = typeof getUser === 'function' ? getUser() : { username: 'Usuario' };
        navbarContainer.innerHTML = `
        <nav class="top-navbar">
            <div class="breadcrumb">
                <span style="color:var(--text-muted); font-size: 13px; font-weight:500;">Panel / </span>
                <span style="color:white; font-size: 13px; font-weight:700; text-transform: capitalize;">${activePageId}</span>
            </div>
            <div class="user-profile">
                <div style="text-align: right">
                    <p style="font-size: 14px; font-weight: 700; color: white;">${user.username}</p>
                    <p style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">${role}</p>
                </div>
                <button onclick="logout()" class="logout-btn">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7"/>
                    </svg>
                    Salir
                </button>
            </div>
        </nav>`;
    }
}