let currentPage = 1;
let perPage = document.getElementById("objects-per-page").value;
let totalFound;
let finalPage;
let currentPageElement = document.getElementById("current-page-text");

const privateObjectView = (object) => `
<div class="col">
    <a class="text-decoration-none" href="/object/view/${object._id}">
    <div class="card h-100 shadow-sm bg-lightdark">
        <img src="/images/defaultImage.png" class="img-fluid" alt="...">

        <div class="card-body">
            <p class="card-text text-center card-title">${object.name}</p>
            <p class="mb-2 card-text text-center">Type: ${object.type.name}</p>
            <small class="text-muted discoverer"><span class="user-rank" style="color:red">PRIVATE</span></small>
        </div>
    </div>
    </a>
</div>
`;

const publicObjectView = (object) => `
<div class="col">
    <a class="text-decoration-none" href="/object/view/${object._id}">
    <div class="card h-100 shadow-sm bg-lightdark">
        <img src="/images/defaultImage.png" class="img-fluid" alt="...">

        <div class="card-body">
            <p class="card-text text-center card-title">${object.name}</p>
            <p class="mb-2 card-text text-center">Type: ${object.type.name}</p>
            <small class="text-muted discoverer"><span class="user-rank" style="color:lawngreen">PUBLIC (${object.type.rankScore} Rank Score)</span></small>
        </div>
    </div>
    </a>
</div>
`;

// Handling the searches
document.getElementById("search-form").addEventListener("submit", e => {
    e.preventDefault();
    $(document.activeElement).filter(':input:focus').blur();
    document.getElementById("results-container").scrollIntoView();
});

document.getElementById("object-name").addEventListener("input", e => {
    handleSearch();
});

document.getElementById("object-type").addEventListener("input", e => {
    handleSearch();
});

document.getElementById("object-order").addEventListener("input", e => {
    handleSearch();
});

document.getElementById("objects-per-page").addEventListener("input", e => {
    currentPage = 1;
    perPage = document.getElementById("objects-per-page").value;
    handleSearch();
});

// Handling the pagination
// First page
document.getElementById("first-page").addEventListener("click", e => {
    if (currentPage != 1) {
        currentPage = 1
        handleSearch();
    };
});

// Prev page
document.getElementById("prev-page").addEventListener("click", e => {
    if (currentPage - 1 > 0) {
        currentPage -= 1;
        handleSearch();
    };
});

// Next page
document.getElementById("next-page").addEventListener("click", e => {
    if (currentPage + 1 <= finalPage) {
        currentPage += 1;
        handleSearch();
    };
});

// Last page
document.getElementById("last-page").addEventListener("click", e => {
    if (currentPage != finalPage) {
        currentPage = finalPage;
        handleSearch();
    };
});

const handleSearch = async () => {
    let objectName = document.getElementById("object-name").value;
    let objectType = document.getElementById("object-type").value;
    let objectOrder = document.getElementById("object-order").value;

    if (objectName.includes("#")) {
        document.getElementById("results-count").innerHTML = "Name cannot contain a hashtag";
        return;
    };
    
    try {
        const rawSearchResult = await fetch(`/api/database/personal?objectName=${objectName}&objectType=${objectType}&sortBy=${objectOrder}&perPage=${perPage}&page=${currentPage}`);
        const searchResult = await rawSearchResult.json();

        let searchHtml = [];

        searchResult.objects.forEach(object => {
            if (object.isPrivate == true) {
                searchHtml.push(privateObjectView(object));
            } else {
                searchHtml.push(publicObjectView(object));
            };
        });

        if (searchHtml.length > 0) {  
            totalFound = searchResult.numObjects;
            
            // If we found less than per page, we don't need other pages
            // If found is greater than per page, we need to find the final page
            if (totalFound < perPage) {
                finalPage = 1;
            } else {
                finalPage = Math.ceil(totalFound / perPage);
            };

            document.getElementById("results-count").style.color = "#169c14";
            document.getElementById("results-container").innerHTML = searchHtml.join("");
            document.getElementById("results-count").innerHTML = `Results (${totalFound}):`;
        } else {
            currentPage = 1;
            finalPage = 1;

            if (objectName === "") {
                document.getElementById("results-count").style.color = "#9c1a11";
                document.getElementById("results-count").innerHTML = `Type "${objectType}" is empty`;
            } else {
                document.getElementById("results-count").style.color = "#c79c26";
                document.getElementById("results-count").innerHTML = `"${objectName}"`;
            }
        };

        currentPageElement.innerHTML = `( ${currentPage} / ${finalPage} )`;
    
    } catch (e) {
        console.log("Invalid Query");
    };
};

handleSearch();