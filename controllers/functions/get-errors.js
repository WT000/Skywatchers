// Used when error code 11000 (duplicate key) errors happen and converts them into an error
// format similar to validation errors
exports.getErrors = function (e) {
    let internalErrors = {};

    for (variable in e.keyValue) {
        let newMessage = `${variable} is already taken and being used.`;
        newMessage = newMessage[0].toUpperCase() + newMessage.slice(1);

        let newEntry = { message: newMessage };
        internalErrors[variable] = newEntry;
    };

    return internalErrors;
};
