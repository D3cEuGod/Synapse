import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

function injectHeader() {
    const headerEl = document.getElementById("app-header");
    if (!headerEl) return;

    headerEl.className = "bg-gray-800 shadow-sm border-b border-gray-700 px-6 py-4 flex justify-between items-center";
    headerEl.innerHTML = `
        <div class="flex items-center space-x-4 text-[#5f9f87]">
            <a href="login.html" class="p-1 hover:bg-gray-700 rounded-md transition-colors">
                <i data-lucide="chevron-left" class="w-6 h-6"></i>
            </a>
            <div class="flex items-center space-x-2">
                <i data-lucide="activity" class="stroke-[2.5] w-6 h-6"></i>
                <h1 class="text-xl font-bold tracking-tight hidden sm:block text-gray-100">Synapse Wellbeing</h1>
            </div>
        </div>
        <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-400 hidden md:block">
                Logged in as <span class="font-medium text-gray-100" id="nav-email"></span>
            </div>
            <button id="logout-btn" class="flex items-center space-x-1 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                <span>Logout</span>
            </button>
        </div>
    `;

    lucide.createIcons();

    document.getElementById("logout-btn").addEventListener("click", () => {
        signOut(auth).then(() => { window.location.href = "login.html"; });
    });
}

export function initAppShell() {
    injectHeader();

    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                document.getElementById("nav-email").innerText = user.email;
                document.getElementById("view-loading").classList.add("hidden");
                const appView = document.getElementById("view-app");
                appView.classList.remove("hidden");
                appView.classList.add("flex");
                window.currentUser = user;
                resolve(user);
            } else {
                window.location.href = "login.html";
            }
        });
    });
}
