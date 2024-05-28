document.addEventListener('DOMContentLoaded', async () => {
    const userButton = document.getElementById('user-button');
    const statusMessage = document.getElementById('status-message');
    const prefixForm = document.getElementById('prefix-form');
    const prefixInput = document.getElementById('prefix');

    try {
        const userResponse = await fetch('/api/user');
        const userData = await userResponse.json();
        userButton.textContent = userData.username;
        userButton.appendChild(createAvatarImg(userData.avatar, userData.id));
    } catch (error) {
        console.error('Error loading user info:', error);
    }

    await loadServerConfig();

    prefixForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const prefix = prefixInput.value;
        const serverId = window.location.pathname.split('/')[2];
        console.log(`Submitting prefix update for server ${serverId}: ${prefix}`);
        try {
            const response = await fetch(`http://toxicnetwork.ddns.net:3001/api/server/${serverId}/prefix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prefix })
            });
            if (response.ok) {
                statusMessage.textContent = 'Prefix updated successfully!';
            } else {
                const errorText = await response.text();
                statusMessage.textContent = `Failed to update prefix: ${errorText}`;
            }
        } catch (error) {
            console.error('Error setting prefix:', error);
            statusMessage.textContent = 'Error setting prefix.';
        }
    });
});

function createAvatarImg(avatar, userId) {
    const img = document.createElement('img');
    img.src = avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128` : '/images/placeholder-logo.png';
    img.alt = 'User Avatar';
    return img;
}

async function loadServerConfig() {
    const serverId = window.location.pathname.split('/')[2];
    console.log(`Loading config for server ${serverId}`);
    try {
        const response = await fetch(`http://toxicnetwork.ddns.net:3001/api/server/${serverId}/prefix`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Current prefix for server ${serverId}: ${data.prefix}`);
        document.getElementById('prefix').value = data.prefix;
    } catch (error) {
        console.error('Failed to load server configuration:', error);
    }
}
