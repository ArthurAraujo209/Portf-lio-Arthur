// profit-chart.js - Gráfico de Linha Profissional

class ProfitChart {
    constructor() {
        this.chart = null;
        this.init();
    }

    async init() {
        await this.createChart();
        this.setupEventListeners();
        this.setupDefaultDates();
    }

    setupDefaultDates() {
        // Data inicial: primeiro dia do mês atual
        const firstDay = new Date();
        firstDay.setDate(1);
        document.getElementById('start-date').value = firstDay.toISOString().split('T')[0];
        
        // Data final: hoje
        document.getElementById('end-date').value = new Date().toISOString().split('T')[0];
    }

    async createChart() {
        const ctx = document.getElementById('profit-chart').getContext('2d');
        
        // Registrar plugin para fundo gradiente
        const gradientPlugin = {
            id: 'chartgradient',
            beforeDraw(chart) {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                
                if (!chartArea) return;
                
                // Gradiente de fundo
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(42, 107, 242, 0.1)');
                gradient.addColorStop(1, 'rgba(42, 107, 242, 0.01)');
                
                ctx.save();
                ctx.fillStyle = gradient;
                ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
                ctx.restore();
            }
        };

        // Destruir chart anterior se existir
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Lucro Acumulado',
                    data: [],
                    borderColor: '#2A6BF2',
                    backgroundColor: 'rgba(42, 107, 242, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#2A6BF2',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4, // Suaviza a linha
                    cubicInterpolationMode: 'monotone'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#2A6BF2',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `R$ ${context.raw.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                            },
                            title: function(context) {
                                return context[0].label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            tooltipFormat: 'dd/MM/yyyy',
                            displayFormats: {
                                day: 'dd/MM',
                                week: "'Sem' w",
                                month: 'MMM/yy',
                                year: 'yyyy'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888',
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'linear'
                    }
                }
            },
            plugins: [gradientPlugin]
        });

        await this.updateChart();
    }

    async updateChart() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const groupBy = document.getElementById('group-by').value;

        try {
            // Buscar todos os clientes com valor
            const snapshot = await db.collection('clients')
                .where('value', '>', 0)
                .orderBy('value', 'desc')
                .get();

            let clients = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));

            // Filtrar por período
            clients = clients.filter(client => {
                const clientDate = client.createdAt;
                return clientDate >= new Date(startDate) && 
                       clientDate <= new Date(endDate + 'T23:59:59');
            });

            // Criar dados para o gráfico de linha (acumulado)
            const chartData = this.createLineChartData(clients, groupBy);
            
            // Atualizar gráfico
            this.chart.data.datasets[0].data = chartData;
            this.chart.options.scales.x.time.unit = groupBy;
            this.chart.update();

            // Atualizar estatísticas
            this.updateStatistics(clients);

        } catch (error) {
            console.error('Erro ao atualizar gráfico:', error);
        }
    }

    createLineChartData(clients, groupBy) {
        // Ordenar por data
        clients.sort((a, b) => a.createdAt - b.createdAt);
        
        const data = [];
        let cumulativeProfit = 0;

        clients.forEach(client => {
            cumulativeProfit += client.value;
            
            data.push({
                x: client.createdAt,
                y: cumulativeProfit
            });
        });

        return data;
    }

    updateStatistics(clients) {
        const totalProfit = clients.reduce((sum, client) => sum + client.value, 0);
        const totalReceived = clients.reduce((sum, client) => sum + (client.paid || 0), 0);
        const totalPending = totalProfit - totalReceived;
        const avgProfit = clients.length > 0 ? totalProfit / clients.length : 0;

        // Formatar valores em Real Brasileiro
        const formatBRL = (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        };

        document.getElementById('total-profit').textContent = formatBRL(totalProfit);
        document.getElementById('total-projects').textContent = clients.length;
        document.getElementById('avg-profit').textContent = formatBRL(avgProfit);

        // Adicionar mais estatísticas se quiser
        console.log('📈 Estatísticas:', {
            totalProfit: formatBRL(totalProfit),
            totalReceived: formatBRL(totalReceived),
            totalPending: formatBRL(totalPending),
            projects: clients.length
        });
    }

    setupEventListeners() {
        document.getElementById('start-date').addEventListener('change', () => this.updateChart());
        document.getElementById('end-date').addEventListener('change', () => this.updateChart());
        document.getElementById('group-by').addEventListener('change', () => this.updateChart());
    }

    // Função de debug
    async debugProfits() {
        const snapshot = await db.collection('clients').get();
        const allClients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));

        console.log('🔍 Clientes com valor:');
        allClients.filter(c => c.value > 0).forEach(client => {
            console.log(
                `• ${client.name}: ${new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(client.value)} | ${client.createdAt.toLocaleDateString()}`
            );
        });
    }
}

// Inicializar
let profitChart;
document.addEventListener('DOMContentLoaded', function() {
    profitChart = new ProfitChart();
});