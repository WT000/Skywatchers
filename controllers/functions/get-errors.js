exports.getErrors = function(e) {
    let internalErrors = {};

    for (variable in e.keyValue) {
        let newMessage = `${variable} is taken.`;
        newMessage = newMessage[0].toUpperCase() + newMessage.slice(1);

        let newEntry = { message: newMessage };
        internalErrors[variable] = newEntry;
    };

    return internalErrors;
};
