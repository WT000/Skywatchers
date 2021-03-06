document.getElementById("object-form").addEventListener("submit", e => {
    e.preventDefault();
});

// Fairly simple AJAX to demonstrate why having an API is useful, it ensures there's no hashtags and
// then uses the API to search for the item name
const handleValidation = async (editorId) => {
    let objectName = document.getElementById("name-input").value;

    if (objectName !== "") {
        if (objectName.includes("#")) {
            document.getElementById("error-results").innerHTML = "Object names cannot have a hashtag";
            document.getElementById("error-results").style.display = "inline-block";
            setTimeout(e=> {$('.alert').hide();}, 3000);
        } else if (document.getElementById("checkbox-input").checked) {   
            try {
                // The user wants to make it public, so we need to lookup the object in the public database
                const rawSearchResult = await fetch(`/api/database/valid?objectName=${objectName}`);
                const searchResult = await rawSearchResult.json();

                console.log(`found: ${searchResult.numObjects}`);

                // In case there's an error with the API or the result is 0, allow the form to submit (as the server-side code will handle the rest)
                if (Object.keys(searchResult).length == 0 || searchResult.numObjects == 0) {
                    document.getElementById("object-form").submit();
                } else if (editorId) {
                    // Check if the brought in editUser matches the uploader id, so we know that the user can attempt to edit the object
                    // Only validaiton is done at this stage, so if someone were to inspect element to change another object, the server-side code would
                    // detect it and not make any changes
                    let objectId = document.getElementById("objectId").value;
                    let allowed = false;

                    if (editorId) {
                        searchResult.objects.forEach(object => {
                            if (object.uploader._id === editorId && object._id === objectId ) {
                                document.getElementById("object-form").submit();
                                allowed = true;
                            };
                        });
                    };

                    // Prevents the error from coming up a few seconds before editing
                    if (!allowed) {
                        document.getElementById("error-results").innerHTML = "The object is already on the public database, consider making it private";
                        document.getElementById("error-results").style.display = "inline-block";
                        setTimeout(e=> {$('.alert').hide();}, 3000);
                    };
                } else {
                    // User isn't editing and is trying to add a new object, simply show the same error as above
                    document.getElementById("error-results").innerHTML = "The object is already on the public database, consider making it private";
                    document.getElementById("error-results").style.display = "inline-block";
                    setTimeout(e=> {$('.alert').hide();}, 3000);
                };
            
            } catch (e) {
                console.log(e);
                console.log("Something went wrong with the API");
            };
        } else {
            document.getElementById("object-form").submit();
        };
    };
};