// Prepare data visualisation
let typeLabels = [];
let typeCounts = [];
let currentType = 0;
let visualTypes = ["bar", "pie", "polarArea"];
let myChart;

const statView = (type) => `
<tr>
    <td class="align-middle">${type.name}</td>
    <td class="align-middle">${type.count}</td>
</tr>
`;

const allView = (type) => `
<tr>
    <th class="align-middle">${type.name}</th>
    <th class="align-middle">${type.count}</th>
</tr>
`;

const handleStats = async () => {
    try {
        const rawStatResult = await fetch("/api/database/stats");
        const statResult = await rawStatResult.json();

        let statHtml = [];

        for (var type in statResult) {
            if (type !== "All") {
                statHtml.push(statView({ name: type, count: statResult[type] }));
                typeLabels.push(type);
                typeCounts.push(parseInt(statResult[type]));
            } else {
                statHtml.push(allView({ name: type, count: statResult[type] }));
            }
        };

        visualStats(currentType);
        document.getElementById("type-container").innerHTML = statHtml.join("");
    
    } catch (e) {
        console.log(e);
        console.log("Invalid Query");
    };
};

const visualStats = (typeIndex) => {
    const data = {
        labels: typeLabels,
        datasets: [{
        label: "No. Objects in category",
        backgroundColor: [
            "#EEEEEE",
            "#CCCCCC",
            "#666666",
            "#999999",
          ],
          borderColor: [
            "#EEEEEE",
            "#CCCCCC",
            "#666666",
            "#999999",
          ],
        data: typeCounts,
        }]
    };

    const config = {
        type: visualTypes[typeIndex],
        options: {
            ticks: {
                precision: 0
            },
            plugins: {
                legend: {
                    display: false
                }
            },
        }
    };

    config["data"] = data
    
    myChart = new Chart(
        document.getElementById('myChart'),
        config
    );
};

handleStats(currentType);

document.getElementById("visual-change").addEventListener("click", e => {
    if (currentType + 1 < visualTypes.length) {
        currentType += 1;
    } else {
        currentType = 0;
    }

    myChart.destroy();
    visualStats(currentType);
});