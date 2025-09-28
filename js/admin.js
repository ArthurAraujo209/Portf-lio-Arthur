// admin.js - Sistema de Gerenciamento de Clientes

class ClientManager {
    constructor() {
        this.currentClient = null;
        this.clients = [];
        this.init();
    }

    async init() {
        await this.loadClients();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Formulário de cliente
        const clientForm = document.getElementById('client-form');
        if (clientForm) {
            clientForm.addEventListener('submit', (e) => this.saveClient(e));
        }

        // Filtros
        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterClients());
        }
        const filterPayment = document.getElementById('filter-payment');
        if (filterPayment) {
            filterPayment.addEventListener('change', () => this.filterClients());
        }
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterClients());
        }
    }

    async loadClients() {
        try {
            const snapshot = await db.collection('clients').orderBy('createdAt', 'desc').get();
            this.clients = snapshot.docs.map(doc => {
                const data = doc.data();
                // Garantir que value e paid sejam números válidos
                data.value = typeof data.value === 'number' ? data.value : parseFloat(data.value) || 0;
                data.paid = typeof data.paid === 'number' ? data.paid : parseFloat(data.paid) || 0;
                return { id: doc.id, ...data };
            });
            this.displayClients(this.clients);
            if (typeof renderProfitChart === 'function') {
                renderProfitChart(this.clients);
            }
            this.updateStats(this.clients);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    }

    displayClients(clients) {
        const tbody = document.getElementById('clients-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        clients.forEach(client => {
            const row = this.createClientRow(client);
            tbody.appendChild(row);
        });
    }

    createClientRow(client) {
        const row = document.createElement('tr');

        // Calcular status de pagamento
        const paymentStatus = this.getPaymentStatus(client.value, client.paid);
        const progress = client.value > 0 ? ((client.paid / client.value) * 100).toFixed(0) : 0;

        row.innerHTML = `
            <td>
                <strong>${this.escapeHTML(client.name)}</strong><br>
                <small>${this.escapeHTML(client.email)}</small>
            </td>
            <td>${this.escapeHTML(client.project)}</td>
            <td>R$ ${client.value.toFixed(2)}</td>
            <td>
                <div class="payment-info">
                    <div>R$ ${client.paid.toFixed(2)} pago</div>
                    <small>${progress}% concluído</small>
                    <div class="payment-status ${paymentStatus}">${this.getPaymentStatusText(paymentStatus)}</div>
                </div>
            </td>
            <td>${client.deadline ? this.formatDate(client.deadline) : 'Não definido'}</td>
            <td><span class="status status-${client.status}">${this.getStatusText(client.status)}</span></td>
            <td class="actions">
                <button class="action-btn action-edit" onclick="clientManager.editClient('${client.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn action-delete" onclick="clientManager.deleteClient('${client.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        return row;
    }

    getPaymentStatus(total, paid) {
        if (paid >= total && total > 0) return 'paid';
        if (paid > 0 && paid < total) return 'partial';
        return 'pending';
    }

    getPaymentStatusText(status) {
        const map = {
            paid: 'Pago',
            partial: 'Parcial',
            pending: 'Pendente'
        };
        return map[status] || status;
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Ativo',
            'pending': 'Pendente',
            'completed': 'Concluído'
        };
        return statusMap[status] || status;
    }

    formatDate(dateStr) {
        // Aceita tanto Date quanto string
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) return 'Não definido';
        return date.toLocaleDateString('pt-BR');
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async saveClient(e) {
        e.preventDefault();

        const name = document.getElementById('client-name').value.trim();
        const email = document.getElementById('client-email').value.trim();
        const project = document.getElementById('client-project').value.trim();
        const description = document.getElementById('client-description').value.trim();
        const value = parseFloat(document.getElementById('client-value').value);
        const paid = parseFloat(document.getElementById('client-paid').value) || 0;
        const deadline = document.getElementById('client-deadline').value;
        const status = document.getElementById('client-status').value;

        // Validação básica
        if (!name || !email || !project || isNaN(value) || value < 0 || paid < 0) {
            this.showAlert('Preencha todos os campos obrigatórios corretamente.', 'error');
            return;
        }
        if (paid > value) {
            this.showAlert('O valor pago não pode ser maior que o valor total.', 'error');
            return;
        }

        const formData = {
            name,
            email,
            project,
            description,
            value,
            paid,
            deadline,
            status,
            updatedAt: new Date()
        };

        try {
            if (this.currentClient) {
                // Editar cliente existente
                await db.collection('clients').doc(this.currentClient).update(formData);
                this.showAlert('Cliente atualizado com sucesso!', 'success');
            } else {
                // Novo cliente
                formData.createdAt = new Date();
                await db.collection('clients').add(formData);
                this.showAlert('Cliente adicionado com sucesso!', 'success');
            }

            await this.loadClients();
            this.closeModal();
            this.resetForm();

        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            this.showAlert('Erro ao salvar cliente.', 'error');
        }
    }

    async editClient(clientId) {
        try {
            const doc = await db.collection('clients').doc(clientId).get();
            if (doc.exists) {
                const client = doc.data();
                this.currentClient = clientId;

                // Preencher formulário
                document.getElementById('client-name').value = client.name || '';
                document.getElementById('client-email').value = client.email || '';
                document.getElementById('client-project').value = client.project || '';
                document.getElementById('client-description').value = client.description || '';
                document.getElementById('client-value').value = client.value || 0;
                document.getElementById('client-paid').value = client.paid || 0;
                document.getElementById('client-deadline').value = client.deadline || '';
                document.getElementById('client-status').value = client.status || 'active';

                document.getElementById('modal-title').textContent = 'Editar Cliente';
                this.openModal();
            }
        } catch (error) {
            console.error('Erro ao carregar cliente:', error);
            this.showAlert('Erro ao carregar cliente.', 'error');
        }
    }

    async deleteClient(clientId) {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                await db.collection('clients').doc(clientId).delete();
                this.showAlert('Cliente excluído com sucesso!', 'success');
                await this.loadClients();
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                this.showAlert('Erro ao excluir cliente.', 'error');
            }
        }
    }

    filterClients() {
        const statusFilter = document.getElementById('filter-status').value;
        const paymentFilter = document.getElementById('filter-payment').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        const filteredClients = this.clients.filter(client => {
            // Filtro de status
            if (statusFilter !== 'all' && client.status !== statusFilter) {
                return false;
            }

            // Filtro de pagamento
            if (paymentFilter !== 'all') {
                const paymentStatus = this.getPaymentStatus(client.value, client.paid);
                if (paymentStatus !== paymentFilter) {
                    return false;
                }
            }

            // Filtro de busca
            if (searchTerm) {
                const searchable = `${client.name} ${client.email} ${client.project} ${client.description}`.toLowerCase();
                if (!searchable.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.displayClients(filteredClients);
    }

    openModal() {
        document.getElementById('client-modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('client-modal').style.display = 'none';
        this.currentClient = null;
        this.resetForm();
    }

    resetForm() {
        const form = document.getElementById('client-form');
        if (form) form.reset();
        document.getElementById('modal-title').textContent = 'Novo Cliente';
    }

    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    updateStats(clients) {
        const totalProfit = clients.reduce((sum, c) => sum + (c.paid || 0), 0);
        const totalProjects = clients.length;
        const avgProfit = totalProjects ? totalProfit / totalProjects : 0;

        document.getElementById('total-profit').textContent = `R$ ${totalProfit.toFixed(2)}`;
        document.getElementById('total-projects').textContent = totalProjects;
        document.getElementById('avg-profit').textContent = `R$ ${avgProfit.toFixed(2)}`;
    }
}

// Funções globais para o modal
function openModal() {
    if (window.clientManager) window.clientManager.openModal();
}

function closeModal() {
    if (window.clientManager) window.clientManager.closeModal();
}

// Inicializar quando o DOM estiver pronto
let clientManager;
document.addEventListener('DOMContentLoaded', function () {
    clientManager = new ClientManager();
    window.clientManager = clientManager;
});

// CSS adicional para alertas e status de pagamento
const additionalStyles = `
    .alert {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        animation: slideIn 0.3s ease;
    }

    .alert-content {
        background: var(--card-bg);
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .alert-success .alert-content {
        border-left-color: var(--verde);
        background: linear-gradient(135deg, var(--card-bg) 0%, rgba(40, 167, 69, 0.1) 100%);
    }

    .alert-error .alert-content {
        border-left-color: var(--vermelho);
        background: linear-gradient(135deg, var(--card-bg) 0%, rgba(220, 53, 69, 0.1) 100%);
    }

    .payment-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .payment-status {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.7rem;
        font-weight: 500;
        text-transform: uppercase;
    }

    .payment-status.paid {
        background: var(--verde);
        color: white;
    }

    .payment-status.partial {
        background: var(--amarelo);
        color: var(--preto);
    }

    .payment-status.pending {
        background: var(--vermelho);
        color: white;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

// Adicionar estilos
const style = document.createElement('style');
style.textContent = additionalStyles;
document.head.appendChild(style);

// Exemplo de ajuste para incluir o dia final inteiro
const endDate = new Date(document.getElementById('end-date').value);
endDate.setHours(23, 59, 59, 999); // Inclui todo o dia final