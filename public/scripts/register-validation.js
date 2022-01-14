document.getElementById("register-form").addEventListener("submit", e => {
    e.preventDefault();
});

const handleValidation = async () => {
    let username = document.getElementById("username-input").value;
    let email = document.getElementById("email-input").value;
    let password = document.getElementById("password-input").value;

    if (username !== "" && email !== "" && password !== "") {
        try {
            const rawValidationResult = await fetch(`/api/validate/register?username=${username}&email=${email}&password=${password}`);
            const validationResult = await rawValidationResult.json();

            if (Object.keys(validationResult.errors).length == 0) {
                document.getElementById("register-form").submit()
            } else {
                let errorHtml = [];

                for (var error in validationResult.errors) {
                    console.log(validationResult.errors[error].message);
                    errorHtml.push(`${validationResult.errors[error].message}<br>`);
                };
                
                document.getElementById("error-results").innerHTML = errorHtml.join("");
                document.getElementById("error-results").style.display = "inline-block";
                setTimeout(e=> {$('.alert').hide();}, 3000);
            };
        
        } catch (e) {
            console.log("Something went wrong with the API");
        };
    };
};