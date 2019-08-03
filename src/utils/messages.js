const generateMessage = (message, username) => {
    return {
        text: message,
        createdAt: new Date().getTime(),
        username: username
    }
};

module.exports = {
    generateMessage
};
