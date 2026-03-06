/* public/js/ui-engine.js */

/**
 * Inyecta el sistema de navegación y efectos visuales de fondo
 * Versión corregida - SOLUCIÓN DEFINITIVA
 */

function initAmazingInterface(role, activePageId) {
    // Añadir clase al body para estilos específicos del dashboard
    document.body.classList.add('dashboard');
    
    const config = {
        links: role === 'admin' ? [
            { 
                id: 'dashboard', 
                label: 'Dashboard', 
                href: '/admin/dashboard.html', 
                icon: 'M4 6h16M4 12h16M4 18h16' 
            },
            { 
                id: 'empresas', 
                label: 'Empresas', 
                href: '/admin/empresas.html', 
                icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16' 
            },
            { 
                id: 'logs', 
                label: 'Soporte', 
                href: '/admin/logs.html', 
                icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' 
            }
        ] : [
            { 
                id: 'dashboard', 
                label: 'Panel', 
                href: '/empresas/dashboard.html', 
                icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
            },
            { 
                id: 'pedidos', 
                label: 'Pedidos', 
                href: '/empresas/pedidos.html', 
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' 
            }
        ]
    };

    renderBackgroundFX();
    renderSidebar(config, activePageId, role);
    renderNavbar(role, activePageId);
}

function renderBackgroundFX() {
    // Si ya existen los elementos flotantes, no los duplicamos
    if (document.querySelector(".neo-floating-elements")) return;
    
    // Crear el mismo sistema de elementos flotantes que en login.html
    const fx = document.createElement("div");
    fx.className = "neo-floating-elements";
    fx.innerHTML = `
        <div class="neo-floating-circle c1"></div>
        <div class="neo-floating-circle c2"></div>
        <div class="neo-floating-circle c3"></div>
    `;
    
    // Insertar al principio del body (detrás de todo)
    document.body.prepend(fx);

    // Efecto de movimiento con el mouse (optimizado con requestAnimationFrame)
    const circles = Array.from(document.querySelectorAll(".neo-floating-circle"));
    if (!circles.length) return;

    let rafId = null;
    
    // Función de throttle para el mousemove
    const onMouseMove = (event) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            const dx = (event.clientX / window.innerWidth - 0.5) * 8;
            const dy = (event.clientY / window.innerHeight - 0.5) * 8;
            
            circles.forEach((circle, idx) => {
                const factor = (idx + 1) * 0.35;
                circle.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
            });
        });
    };

    // Limpiar event listener anterior si existe
    window.removeEventListener('mousemove', onMouseMove);
    window.addEventListener('mousemove', onMouseMove);
}

function renderSidebar(config, activePageId, role) { // <--- IMPORTANTE: recibir role como parámetro
    const sidebar = document.getElementById('sidebarContainer');
    if (!sidebar) return;
    
    sidebar.innerHTML = `
        <aside class="w-64 bg-[#0a1221]/80 backdrop-blur-xl border-r border-slate-700/40 flex flex-col h-screen sticky top-0">
            <div class="p-8">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#343A40] border border-[#4B5563] mb-2">
                    <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                </div>
                <h1 class="font-display text-2xl font-bold text-white">AHSE</h1>
                <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mt-1">Panel ${role === 'admin' ? 'Administrador' : 'Empresa'}</p>
            </div>
            
            <nav class="flex-1 px-4 space-y-1">
                ${config.links.map(link => {
                    const isActive = link.id === activePageId;
                    return `
                        <a href="${link.href}" 
                           class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 
                                  ${isActive 
                                      ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' 
                                      : 'text-slate-400 hover:bg-white/5 hover:text-white'}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="${link.icon}"/>
                            </svg>
                            <span class="text-sm font-medium tracking-wide">${link.label}</span>
                            ${isActive ? '<span class="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400"></span>' : ''}
                        </a>
                    `;
                }).join('')}
            </nav>
            
            <div class="p-6 border-t border-slate-700/40">
                <div class="bg-slate-900/40 rounded-xl p-4 border border-slate-700/40">
                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest">v2.0 Stable</p>
                    <p class="text-[8px] text-slate-600 mt-1">© 2026 AHSE</p>
                </div>
            </div>
        </aside>
    `;
}

function renderNavbar(role, activePageId) {
    const navbar = document.getElementById('navbarContainer');
    if (!navbar) return;
    
    // Obtener datos del usuario
    let userName = 'Usuario';
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userName = payload.username || payload.user?.username || 'Usuario';
        }
    } catch (e) {
        console.warn('No se pudo obtener el nombre de usuario');
    }

    navbar.innerHTML = `
        <div class="w-full h-16 border-b border-slate-700/40 flex items-center justify-between px-8 bg-[#2F343B] sticky top-0 z-50">
            <div class="flex items-center gap-4">
                <span class="text-gray-200 font-bold tracking-tighter text-xl">AHSE</span>
                <div class="h-4 w-[1px] bg-slate-700/40"></div>
                <span class="text-[10px] uppercase tracking-[0.2em] text-cyan-300/85 font-medium">${role === 'admin' ? 'Administrador' : 'Empresa'}</span>
                <span class="text-slate-600 text-xs">/</span>
                <span class="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">${activePageId}</span>
            </div>
            
            <div class="flex items-center gap-4">
                <div class="text-right hidden sm:block">
                    <p class="text-sm font-bold text-white leading-none">${userName}</p>
                    <p class="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Sesión activa
                    </p>
                </div>
                
                <button onclick="logout()" 
                        class="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200 border border-red-500/20 hover:border-red-500/50">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
}

// Función auxiliar para obtener token
function getToken() {
    return localStorage.getItem("token");
}