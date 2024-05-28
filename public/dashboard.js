document.addEventListener('DOMContentLoaded', async () => {
    const userButton = document.getElementById('user-button');
    const serverList = document.getElementById('server-list');
    const DEFAULT_ICON = '/images/placeholder-logo.png'; // Add a default icon path

    try {
        const userResponse = await fetch('/api/user');
        const userData = await userResponse.json();
        userButton.textContent = userData.username;
        userButton.appendChild(createAvatarImg(userData.avatar, userData.id));

        const serversResponse = await fetch('/api/servers');
        const serversData = await serversResponse.json();

        console.log('Servers data:', serversData); // Debugging line

        if (serversData.length === 0) {
            const noServersMessage = document.createElement('p');
            noServersMessage.textContent = "No servers available to manage.";
            serverList.appendChild(noServersMessage);
        }

        serversData.forEach(server => {
            const serverCard = document.createElement('div');
            serverCard.classList.add('server-card');

            const serverImg = document.createElement('img');
            serverImg.src = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128` : DEFAULT_ICON;
            serverImg.alt = `${server.name} Icon`;

            const serverName = document.createElement('h2');
            serverName.textContent = server.name;

            const actionButton = document.createElement('button');
            actionButton.classList.add('button');
            actionButton.textContent = server.isBotInServer ? 'Setup' : 'Invite';
            actionButton.addEventListener('click', () => {
                const url = server.isBotInServer ? 
                    `/dashboard/${server.id}` :  // Updated URL to point to the correct route
                    `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot+applications.commands&permissions=${BOT_PERMISSIONS}&guild_id=${server.id}&response_type=code&redirect_uri=${REDIRECT_URI}`;
                window.open(url, 'discordInvite', 'width=500,height=800');
            });

            serverCard.appendChild(serverImg);
            serverCard.appendChild(serverName);
            serverCard.appendChild(actionButton);

            serverList.appendChild(serverCard);
        });
    } catch (error) {
        console.error('Error loading user or servers:', error);
    }
});

function createAvatarImg(avatar, userId) {
    const img = document.createElement('img');
    if (avatar) {
        img.src = `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`;
    } else {
        // If user has no avatar, use a default avatar image
        img.src = '/images/placeholder-logo.png'; // Change this to the path of your default avatar image
    }
    img.alt = 'User Avatar';
    return img;
}
