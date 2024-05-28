document.addEventListener('DOMContentLoaded', async () => {
    const userButton = document.getElementById('user-button');
    const serverList = document.getElementById('server-list');
    const DEFAULT_ICON = '/images/placeholder-logo.png';

    try {
        const userResponse = await fetch('/api/user');
        const userData = await userResponse.json();
        userButton.textContent = userData.username;
        userButton.appendChild(createAvatarImg(userData.avatar, userData.id));

        const serversResponse = await fetch('/api/servers');
        const serversData = await serversResponse.json();

        console.log('Servers data:', serversData);

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
                if (server.isBotInServer) {
                    // Navigate to the server configuration page
                    window.location.href = `/dashboard/${server.id}`;
                } else {
                    // Redirect for Discord OAuth2 invite flow
                    const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot+applications.commands&permissions=${BOT_PERMISSIONS}&guild_id=${server.id}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
                    window.location.href = url;
                }
            });

            serverCard.appendChild(serverImg);
            serverCard.appendChild(serverName);
            serverCard.appendChild(actionButton);

            serverList.appendChild(serverCard);
        });
    } catch (error) {
        console.error('Error loading user or servers:', error);
    }

    handleOAuth2Callback(window.location.search);
});

function createAvatarImg(avatar, userId) {
    const img = document.createElement('img');
    img.src = avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128` : '/images/placeholder-logo.png';
    img.alt = 'User Avatar';
    return img;
}

function handleOAuth2Callback(search) {
    const params = new URLSearchParams(search);
    const code = params.get('code');
    if (code) {
        fetch(`/invite-callback?code=${code}`, {
            method: 'GET'
        }).then(response => response.json())
          .then(data => {
              console.log('Invite callback response:', data); // Add logging
              if (data.success) {
                  window.location.href = '/dashboard#success';
              } else {
                  window.location.href = '/dashboard#error';
              }
          }).catch(error => {
              console.error('Error:', error);
              window.location.href = '/dashboard#error';
          });
    }
}
