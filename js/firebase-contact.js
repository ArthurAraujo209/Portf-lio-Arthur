// firebase-contact.js - Versão Corrigida

class ContactForm {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.addRealTimeValidation();
        }
    }

    // ... (mantenha todas as outras funções como validateField, isValidEmail, etc.)

    async handleSubmit(e) {
        e.preventDefault();
        
        // Validar todos os campos
        const inputs = this.form.querySelectorAll('input, textarea');
        let allValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                allValid = false;
            }
        });

        if (!allValid) {
            this.showToast('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        // Verificar se Firebase está disponível - FORMA CORRIGIDA
        if (typeof firebase === 'undefined' || !window.db) {
            this.showToast('Sistema temporariamente indisponível. Recarregue a página.', 'error');
            console.error('Firebase não disponível');
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

        try {
            // Mostrar loading
            this.setLoading(true);
            
            // Usar window.db para garantir acesso global - LINHA CORRIGIDA
            await window.db.collection('contacts').add(formData);
            
            // Sucesso!
            this.showToast('Mensagem enviada com sucesso! Entrarei em contato em breve.', 'success');
            this.form.reset();
            
            // Limpar validações
            inputs.forEach(input => this.clearValidation(input));
            
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.showToast('Erro ao enviar mensagem. Tente novamente.', 'error');
        } finally {
            this.setLoading(false);
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

    showToast(message, type = 'success') {
        // Remove toast anterior se existir
        const existingToast = document.getElementById('contact-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Cria novo toast
        const toast = document.createElement('div');
        toast.id = 'contact-toast';
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.padding = '15px 20px';
        toast.style.borderRadius = '5px';
        toast.style.color = 'white';
        toast.style.zIndex = '10000';
        toast.style.maxWidth = '300px';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.animation = 'slideIn 0.3s ease';
        
        toast.style.background = type === 'success' ? '#28a745' : '#dc3545';
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        `;

        document.body.appendChild(toast);

        // Remove após 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
}

// Funções de validação (mantenha as que já existiam)
ContactForm.prototype.validateField = function(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = '';

    switch(field.type) {
        case 'text':
            isValid = value.length >= 2;
            message = isValid ? '' : 'Nome deve ter pelo menos 2 caracteres';
            break;
        case 'email':
            isValid = this.isValidEmail(value);
            message = isValid ? '' : 'Email inválido';
            break;
        case 'textarea':
            isValid = value.length >= 10;
            message = isValid ? '' : 'Mensagem deve ter pelo menos 10 caracteres';
            break;
    }

    this.setFieldValidation(field, isValid, message);
    return isValid;
};

ContactForm.prototype.isValidEmail = function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

ContactForm.prototype.setFieldValidation = function(field, isValid, message) {
    field.classList.remove('is-valid', 'is-invalid');
    field.classList.add(isValid ? 'is-valid' : 'is-invalid');
    
    this.removeValidationMessage(field);
    
    if (!isValid && message) {
        this.showValidationMessage(field, message);
    }
};

ContactForm.prototype.showValidationMessage = function(field, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-message';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
};

ContactForm.prototype.removeValidationMessage = function(field) {
    const existingMessage = field.parentNode.querySelector('.validation-message');
    if (existingMessage) {
        existingMessage.remove();
    }
};

ContactForm.prototype.clearValidation = function(field) {
    field.classList.remove('is-invalid');
    this.removeValidationMessage(field);
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Esperar um pouco para garantir que Firebase carregue
    setTimeout(() => {
        new ContactForm();
        console.log('✅ Formulário de contato inicializado');
    }, 500);
});

// CSS para validações
const toastStyles = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .is-valid {
        border-color: #28a745 !important;
    }
    
    .is-invalid {
        border-color: #dc3545 !important;
    }
    
    .validation-message {
        color: #dc3545;
        font-size: 0.8rem;
        margin-top: 5px;
    }
`;

// Inject styles
const style = document.createElement('style');
style.textContent = toastStyles;
document.head.appendChild(style);