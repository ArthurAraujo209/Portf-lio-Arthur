// firebase-contact.js - Versão Simples e Funcional (Sem Email)

class ContactForm {
    constructor() {
        this.form = document.getElementById('contact-form');
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.addRealTimeValidation();
    }

    addRealTimeValidation() {
        const inputs = this.form.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearValidation(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        if (field.type === 'text') {
            isValid = value.length >= 2;
            message = isValid ? '' : 'Nome deve ter pelo menos 2 caracteres';
        } else if (field.type === 'email') {
            isValid = this.isValidEmail(value);
            message = isValid ? '' : 'Email inválido';
        } else if (field.type === 'textarea') {
            isValid = value.length >= 10;
            message = isValid ? '' : 'Mensagem deve ter pelo menos 10 caracteres';
        }

        this.setFieldValidation(field, isValid, message);
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setFieldValidation(field, isValid, message) {
        field.classList.remove('is-valid', 'is-invalid');

        if (isValid) {
            field.classList.add('is-valid');
        } else {
            field.classList.add('is-invalid');
        }

        this.removeValidationMessage(field);

        if (!isValid && message) {
            this.showValidationMessage(field, message);
        }
    }

    showValidationMessage(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-message';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;

        field.parentNode.appendChild(errorDiv);
    }

    removeValidationMessage(field) {
        const existingMessage = field.parentNode.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    clearValidation(field) {
        field.classList.remove('is-invalid');
        this.removeValidationMessage(field);
    }

    async handleSubmit(e) {
        e.preventDefault();

        console.log('📤 Enviando mensagem...');

        // Validar todos os campos
        const inputs = this.form.querySelectorAll('input, textarea');
        let allValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                allValid = false;
            }
        });

        if (!allValid) {
            this.showAlert('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        // Verificar se Firebase está disponível
        if (typeof firebase === 'undefined' || typeof window.db === 'undefined') {
            this.showAlert('Sistema temporariamente indisponível. Recarregue a página.', 'error');
            return;
        }

        // Coletar dados do formulário
        const formData = {
            name: this.form.querySelector('input[type="text"]').value.trim(),
            email: this.form.querySelector('input[type="email"]').value.trim(),
            message: this.form.querySelector('textarea').value.trim(),
            timestamp: new Date(),
            read: false
        };

        this.setLoading(true);

        try {
            // 1. Salvar mensagem de contato
            const docRef = await window.db.collection('contacts').add(formData);
            console.log('✅ Mensagem salva no Firebase ID:', docRef.id);

            // 2. Criar/atualizar cliente potencial (EM BACKGROUND)
            this.createPotentialClient(formData);

            // 3. Sucesso! - Mensagem simples e eficaz
            this.showAlert('✅ Mensagem enviada com sucesso! \\n\\n Entrarei em contato em breve.\\n\\n Obrigado pelo contato!');
            this.form.reset();

            // Limpar validações
            inputs.forEach(input => this.clearValidation(input));

        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            this.showAlert('Erro ao enviar mensagem. Tente novamente.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async createPotentialClient(formData) {
        try {
            // Verificar se já existe um cliente com este email
            const snapshot = await window.db.collection('clients')
                .where('email', '==', formData.email.toLowerCase())
                .get();

            if (snapshot.empty) {
                // Criar novo cliente potencial
                const clientData = {
                    name: formData.name,
                    email: formData.email.toLowerCase(),
                    project: 'Contato via Site',
                    description: `Mensagem: ${formData.message}\n\n📞 Contato iniciado via formulário do site`,
                    value: 0,
                    paid: 0,
                    status: 'pending',
                    source: 'website_form',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastContact: new Date(),
                    notes: `Cliente entrou em contato em ${new Date().toLocaleDateString()}\nMensagem: "${formData.message}"`
                };

                await window.db.collection('clients').add(clientData);
                console.log('✅ Cliente potencial criado automaticamente');
            } else {
                console.log('📝 Cliente já existe, atualizando...');
                const clientDoc = snapshot.docs[0];
                const clientData = clientDoc.data();

                // Atualizar cliente existente
                await window.db.collection('clients').doc(clientDoc.id).update({
                    lastContact: new Date(),
                    notes: `${clientData.notes || ''}\n\n📞 Novo contato em ${new Date().toLocaleDateString()}: "${formData.message}"`,
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            console.log('⚠️ Erro ao criar cliente potencial:', error);
            // Não alertar o usuário, é um processo em background
        }
    }

    setLoading(loading) {
        const submitButton = this.form.querySelector('button[type="submit"]');

        if (loading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensagem';
        }
    }
    // 🎨 ALERTAS ANIMADOS ESTILOSOS
    showAlert(message, type = 'success', duration = 4000) {
        // Remover alerta anterior se existir
        this.removeExistingAlert();

        // Criar elemento do alerta
        const alert = document.createElement('div');
        alert.className = `custom-alert ${type}`;
        alert.innerHTML = `
        <div class="alert-content">
            <div class="alert-icon">
                ${type === 'success' ?
                '<i class="fas fa-check-circle"></i>' :
                '<i class="fas fa-exclamation-circle"></i>'
            }
            </div>
            <div class="alert-message">${message}</div>
            <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

        // Adicionar ao documento
        document.body.appendChild(alert);

        // Animação de entrada
        setTimeout(() => {
            alert.classList.add('show');
        }, 10);

        // Auto-remover após duração
        if (duration > 0) {
            setTimeout(() => {
                this.removeAlert(alert);
            }, duration);
        }

        return alert;
    }

    removeExistingAlert() {
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
    }

    removeAlert(alertElement) {
        if (alertElement && alertElement.parentNode) {
            alertElement.classList.remove('show');
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.remove();
                }
            }, 300);
        }
    }
}


// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    console.log('📋 Formulário de contato carregado (sem email)');
    new ContactForm();
});

// CSS para alertas animados e validações
const validationStyles = `
    /* Validações do formulário */
    .is-valid {
        border-color: #28a745 !important;
        box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2) !important;
    }
    
    .is-invalid {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2) !important;
    }
    
    .validation-message {
        color: #dc3545;
        font-size: 0.8rem;
        margin-top: 5px;
        display: block;
        animation: slideDown 0.3s ease;
    }

    /* Alertas personalizados */
    .custom-alert {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 300px;
        max-width: 400px;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    
    .custom-alert.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .alert-content {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        border-left: 4px solid;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
    }
    
    .custom-alert.success .alert-content {
        border-left-color: #28a745;
        background: linear-gradient(135deg, var(--card-bg) 0%, rgba(40, 167, 69, 0.1) 100%);
    }
    
    .custom-alert.error .alert-content {
        border-left-color: #dc3545;
        background: linear-gradient(135deg, var(--card-bg) 0%, rgba(220, 53, 69, 0.1) 100%);
    }
    
    .alert-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
    }
    
    .custom-alert.success .alert-icon {
        color: #28a745;
        animation: bounceIn 0.6s ease;
    }
    
    .custom-alert.error .alert-icon {
        color: #dc3545;
        animation: shake 0.6s ease;
    }
    
    .alert-message {
        flex: 1;
        color: var(--text-primary);
        font-size: 0.9rem;
        line-height: 1.4;
    }
    
    .alert-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        transition: all 0.3s ease;
        flex-shrink: 0;
    }
    
    .alert-close:hover {
        color: var(--text-primary);
        background: rgba(0, 0, 0, 0.1);
        transform: rotate(90deg);
    }
    
    /* Animações */
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes bounceIn {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        50% {
            transform: scale(1.2);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    @keyframes shake {
        0%, 100% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-5px);
        }
        75% {
            transform: translateX(5px);
        }
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
    
    /* Responsivo */
    @media (max-width: 768px) {
        .custom-alert {
            left: 20px;
            right: 20px;
            min-width: auto;
            max-width: none;
        }
        
        .alert-content {
            padding: 12px;
        }
    }
`;

// Inject styles
const style = document.createElement('style');
style.textContent = validationStyles;
document.head.appendChild(style);
