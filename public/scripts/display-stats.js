const statView = (type) => `
<tr>
    <td class="align-middle">${type.name}</td>
    <td class="align-middle">${type.count}</td>
</tr>
`;

const handleStats = async () => {
    try {
        const rawStatResult = await fetch("/api/database/stats");
        const statResult = await rawStatResult.json();

        let statHtml = [];

        for (var type in statResult) {
            statHtml.push(statView({ name: type, count: statResult[type] }))
        };

        document.getElementById("type-container").innerHTML = statHtml.join("");
    
    } catch (e) {
        console.log(e);
        console.log("Invalid Query");
    };
};

handleStats();