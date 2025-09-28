// profit-chart.js - Gráfico de barras de lucros por prazo

let profitChart;

async function renderProfitChart(clients) {
    const ctx = document.getElementById('profit-chart').getContext('2d');

    // Agrupa lucros por prazo (deadline)
    const dataMap = {};
    clients.forEach(client => {
        if (!client.deadline || isNaN(new Date(client.deadline).getTime())) return;
        const prazo = new Date(client.deadline).toLocaleDateString('pt-BR');
        dataMap[prazo] = (dataMap[prazo] || 0) + (client.paid || 0);
    });

    const labels = Object.keys(dataMap).sort((a, b) => {
        // Ordena por data
        const da = a.split('/').reverse().join('-');
        const db = b.split('/').reverse().join('-');
        return new Date(da) - new Date(db);
    });
    const values = labels.map(label => dataMap[label]);

    if (profitChart) profitChart.destroy();

    profitChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Lucro por Prazo',
                data: values,
                backgroundColor: 'rgba(42, 107, 242, 0.7)',
                borderColor: 'rgba(42, 107, 242, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Lucro por Prazo'
                }
            },
            scales: {
                x: { title: { display: true, text: 'Prazo' } },
                y: { title: { display: true, text: 'Lucro (R$)' }, beginAtZero: true }
            }
        }
    });
}

// Exemplo de integração: chame renderProfitChart após carregar clientes
// clientManager.loadClients().then(() => renderProfitChart(clientManager.clients));