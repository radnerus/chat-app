const socket = io();

const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const autoScroll = () => {
    // New Element
    const $newMessage = $messages.lastElementChild;

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = $messages.offsetHeight;

    // Height of the messages container
    const containerHeight = $messages.scrollHeight;

    // How far have we scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if ((containerHeight - newMessageHeight) <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }

}

socket.emit('join', {
    username,
    room
}, error => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});

socket.on('messages', (message) => {
    if (message) {
        const html = Mustache.render(messageTemplate, {
            message: message.text,
            time: moment(message.createdAt).format('h:mm:ss a'),
            username: message.username
        });
        $messages.insertAdjacentHTML('beforeend', html);
        autoScroll();
    }
});

socket.on('locationMessages', (message) => {
    if (message) {
        const html = Mustache.render(locationTemplate, {
            message: message.text,
            time: moment(message.createdAt).format('h:mm:ss a'),
            username: message.username
        });
        $messages.insertAdjacentHTML('beforeend', html);
    }
});

socket.on('userNotifications', (message) => {
    console.log(message);
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
})

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if ($messageFormInput.value) {
        $messageFormButton.setAttribute('disabled', true);
        socket.emit('messageFromClient', $messageFormInput.value, (error) => {
            $messageFormButton.removeAttribute('disabled');
            if (error) {
                return console.error(error);
            }
        });
        $messageFormInput.value = '';
        $messageFormInput.focus();
    }
});

const $locationButton = document.querySelector('#send-location');
$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('GeoLocation is not supported by your browser.');
    }
    navigator.geolocation.getCurrentPosition((position) => {
        $locationButton.setAttribute('disabled', true);
        socket.emit('locationFromClient', { latitude: position.coords.latitude, longitude: position.coords.longitude }, (error) => {
            $locationButton.removeAttribute('disabled');
            if (error) {
                return console.error(error);
            }
            console.log('Location shared.');
        });
    });
});