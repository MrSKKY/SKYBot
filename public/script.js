// Handle theme toggle
const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function toggleTheme() {
    if (root.classList.contains('light-mode')) {
        root.classList.remove('light-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        root.classList.add('light-mode');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

// Fetch server data and populate server cards (For dashboard)
async function fetchServers() {
    const response = await fetch('/api/servers');
    const servers = await response.json();
    const serverList = document.querySelector('.server-list');

    servers.forEach(server => {
        const serverCard = document.createElement('div');
        serverCard.classList.add('server-card');

        const iconUrl = server.icon 
            ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        serverCard.innerHTML = `
            <img src="${iconUrl}" alt="${server.name}">
            <h2>${server.name}</h2>
            <button class="button" onclick="handleServerClick('${server.id}')">Weiter</button>
        `;

        serverList.appendChild(serverCard);
    });
}

function handleServerClick(serverId) {
    window.location.href = `/server/${serverId}`;
}

if (document.querySelector('.server-list')) {
    fetchServers();
}

// Function to set user info
async function setUserInfo() {
    try {
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) {
            throw new Error('User not logged in');
        }
        const user = await userResponse.json();
        
        const userButton = document.querySelector('.user-button');
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        userButton.innerHTML = `
            ${user.username} <img src="${avatarUrl}" alt="User Avatar">
        `;
        document.querySelector('.login-button').style.display = 'none';
        document.querySelector('.dropdown').style.display = 'block';
        document.querySelector('.dashboard-button').style.display = 'block';
    } catch (error) {
        console.log('User not logged in:', error);
    }
}

if (document.querySelector('.user-button')) {
    setUserInfo();
}

// Localization handling
function setLanguage(lang) {
    document.documentElement.lang = lang;
    fetch(`/locales/${lang}.json`)
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll('[data-i18n-key]').forEach(element => {
                const key = element.getAttribute('data-i18n-key');
                element.textContent = data[key];
            });
        });
}

document.querySelectorAll('.language-selector').forEach(button => {
    button.addEventListener('click', () => {
        const lang = button.getAttribute('data-lang');
        setLanguage(lang);
    });
});
