/* public/auth.js */

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location = "/login.html";
}

// Proteger página según rol requerido
function requireRole(...roles) {
  const token = getToken();
  if (!token) { window.location = "/login.html"; return false; }

  const user = getUser();
  if (!user || !roles.includes(user.role)) {
    // Redirigir al panel correcto según su rol real
    if (user?.role === "admin")   window.location = "/admin/dashboard.html";
    else if (user?.role === "empresa") window.location = "/empresas/dashboard.html";
    else window.location = "/login.html";
    return false;
  }
  return true;
}

// Redirigir después del login según rol
function redirectByRole(role) {
  if (role === "admin")   window.location = "/admin/dashboard.html";
  else if (role === "empresa") window.location = "/empresas/dashboard.html";
  else if (role === "usuario") window.location = "/empresas/dashboard.html";
  else window.location = "/login.html";
}
