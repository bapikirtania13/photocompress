// Contact form functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeContactForm();
    initializeFAQ();
    detectBrowserInfo();
});

// Initialize contact form
function initializeContactForm() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validate form
    if (!validateForm(data)) {
        return;
    }
    
    // Create mailto link (since this is a static site)
    const subject = encodeURIComponent(`[Image Processor] ${data.subject}: ${data.name}`);
    const body = encodeURIComponent(
        `Name: ${data.name}\n` +
        `Email: ${data.email}\n` +
        `Subject: ${data.subject}\n` +
        `Browser: ${data.browser || 'Not provided'}\n\n` +
        `Message:\n${data.message}\n\n` +
        `---\n` +
        `Sent from Professional Image Processor Contact Form`
    );
    
    const mailtoLink = `mailto:business.kirtania@gmail.com?subject=${subject}&body=${body}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show success message
    showSuccessMessage();
    
    // Reset form
    e.target.reset();
}

// Validate form data
function validateForm(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!data.subject) {
        errors.push('Please select a subject');
    }
    
    if (!data.message || data.message.trim().length < 10) {
        errors.push('Message must be at least 10 characters long');
    }
    
    if (errors.length > 0) {
        showErrorMessage(errors);
        return false;
    }
    
    return true;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show success message
function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'alert alert-success';
    message.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <strong>Message Sent!</strong> Your email client should open with a pre-filled message. 
        Please send it to complete your inquiry. We'll respond within 48 hours.
    `;
    
    const form = document.querySelector('.contact-form');
    form.parentNode.insertBefore(message, form);
    
    // Remove message after 10 seconds
    setTimeout(() => {
        message.remove();
    }, 10000);
    
    // Scroll to message
    message.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Show error message
function showErrorMessage(errors) {
    const message = document.createElement('div');
    message.className = 'alert alert-error';
    message.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Please fix the following errors:</strong>
        <ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>
    `;
    
    const form = document.querySelector('.contact-form');
    
    // Remove existing alerts
    const existingAlerts = form.parentNode.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    form.parentNode.insertBefore(message, form);
    
    // Remove message after 8 seconds
    setTimeout(() => {
        message.remove();
    }, 8000);
    
    // Scroll to message
    message.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Initialize FAQ functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = question.querySelector('i');
        
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('open');
                otherItem.querySelector('.faq-answer').style.maxHeight = '0';
                otherItem.querySelector('.faq-question i').className = 'fas fa-plus';
            });
            
            // Toggle current item
            if (!isOpen) {
                item.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                icon.className = 'fas fa-minus';
            }
        });
    });
}

// Auto-detect browser information
function detectBrowserInfo() {
    const browserField = document.getElementById('browser');
    if (browserField && !browserField.value) {
        const browserInfo = getBrowserInfo();
        browserField.value = browserInfo;
    }
}

// Get browser information
function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';
    
    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browser = 'Chrome';
        const match = userAgent.match(/Chrome\/(\d+)/);
        version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
        const match = userAgent.match(/Firefox\/(\d+)/);
        version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
        const match = userAgent.match(/Safari\/(\d+)/);
        version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edg')) {
        browser = 'Edge';
        const match = userAgent.match(/Edg\/(\d+)/);
        version = match ? match[1] : 'Unknown';
    }
    
    // Get OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) {
        os = 'Windows';
    } else if (userAgent.includes('Mac')) {
        os = 'macOS';
    } else if (userAgent.includes('Linux')) {
        os = 'Linux';
    } else if (userAgent.includes('Android')) {
        os = 'Android';
    } else if (userAgent.includes('iOS')) {
        os = 'iOS';
    }
    
    return `${browser} ${version} on ${os}`;
}