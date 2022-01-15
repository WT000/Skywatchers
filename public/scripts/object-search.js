let currentPage = 1;
let perPage = 24;

const objectView = (object) => `
<div class="col">
    <a class="text-decoration-none" href="./viewObject">
    <div class="card h-100 shadow-sm bg-lightdark">
        <img src="images/defaultImage.png" class="img-fluid" alt="...">

        <div class="card-body">
            <p class="card-text text-center card-title">${object.name}</p>
            <p class="mb-2 card-text text-center">${object.type.name}</p>
            <small class="text-muted discoverer">Discovered by <span class="user-rank" style="color:${object.uploader.rank.colour}">${object.uploader.username}</span></small>
        </div>
    </div>
    </a>
</div>
`;

document.getElementById("search-form").addEventListener("submit", e => {
    e.preventDefault();
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

const handleSearch = async () => {
    let objectName = document.getElementById("object-name").value;
    let objectType = document.getElementById("object-type").value;
    let objectOrder = document.getElementById("object-order").value;
    
    try {
        const rawSearchResult = await fetch(`/api/database/search?objectName=${objectName}&objectType=${objectType}&sortBy=${objectOrder}&perPage=${perPage}&page=${currentPage}`);
        const searchResult = await rawSearchResult.json();

        let searchHtml = [];
        let foundNames = [];

        searchResult.objects.forEach(object => {
            searchHtml.push(objectView(object));
            foundNames.push(object.name);
        });

        if (searchHtml.length > 0) {  
            document.getElementById("results-container").innerHTML = searchHtml.join("");
            document.getElementById("results-count").innerHTML = "Results:";
        } else {
            document.getElementById("results-count").innerHTML = `"${objectName}"`;
        };
    
    } catch (e) {
        console.log("Something went wrong with the API");
    };
};

handleSearch();
