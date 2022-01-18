document.getElementById("add-form").addEventListener("submit", e => {
    e.preventDefault();
});

// Fairly simple AJAX to demonstrate why having an API is useful, it ensures there's no hashtags and
// then uses the API to search for the item name
const handleValidation = async () => {
    let objectName = document.getElementById("name-input").value;

    if (objectName !== "") {
        if (objectName.includes("#")) {
            document.getElementById("error-results").innerHTML = "Object names cannot have a hashtag";
            document.getElementById("error-results").style.display = "inline-block";
            setTimeout(e=> {$('.alert').hide();}, 3000);
        } else if (document.getElementById("checkbox-input").checked) {   
            try {
                // The user wants to make it public, so we need to lookup the object in the public database
                const rawSearchResult = await fetch(`/api/database/search?objectName=${objectName}&objectType=All&sortBy=A-Z&perPage=1&page=1`);
                const searchResult = await rawSearchResult.json();

                if (searchResult.numObjects == 0) {
                    document.getElementById("add-form").submit();
                } else {
                    document.getElementById("error-results").innerHTML = "The object is already on the public database, consider making it private";
                    document.getElementById("error-results").style.display = "inline-block";
                    setTimeout(e=> {$('.alert').hide();}, 3000);
                };
            
            } catch (e) {
                console.log("Something went wrong with the API");
            };
        } else {
            document.getElementById("add-form").submit();
        };
    };
};