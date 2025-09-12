// contact-simple.js - Versão ultra simples sem async

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Dados do formulário
            const formData = {
                name: document.querySelector('input[type="text"]').value,
                email: document.querySelector('input[type="email"]').value,
                message: document.querySelector('textarea').value,
                timestamp: new Date()
            };
            
            // Verificar se Firebase está pronto
            if (!window.db) {
                alert('Sistema não carregou. Recarregue a página.');
                return;
            }
            
            // Mostrar loading
            const button = contactForm.querySelector('button');
            button.disabled = true;
            button.innerHTML = 'Enviando...';
            
            // Enviar para Firebase
            window.db.collection('contacts').add(formData)
                .then(function(docRef) {
                    contactForm.reset();
                })
                .catch(function(error) {
                    console.error('Erro:', error);
                })
                .finally(function() {
                    button.disabled = false;
                    button.innerHTML = 'Enviar Mensagem';
                });
        });
    }
});