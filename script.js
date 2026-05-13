document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Toggle (Always enabled) ---
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        const navLinks = navMenu.querySelectorAll('a');
        
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }

    // --- Form & Floating CTA Logic (Page-specific) ---
    const form = document.getElementById('inscription-form');
    const floatingCta = document.getElementById('floatingCta');
    const submitBtn = document.getElementById('submitBtn');

    if (form && submitBtn) {
        const spinner = submitBtn.querySelector('.spinner');
        const btnText = submitBtn.querySelector('span');

        // Form Submission Logic
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show loading state
            if (btnText) btnText.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');
            submitBtn.disabled = true;
            
            // Collect data
            const formData = new FormData(form);
            const fullPhone = `${formData.get('codigo-pais')}${formData.get('telefono')}`;
            
            const data = {
                nombre: formData.get('nombre'),
                apellido: formData.get('apellido'),
                email: formData.get('email'),
                telefono: fullPhone,
                legal: formData.get('legal') === 'on',
                source: window.location.hostname
            };

            try {
                // Send directly to Zapier (Backup)
                const zapierParams = new URLSearchParams();
                zapierParams.append('nombre', data.nombre);
                zapierParams.append('apellido', data.apellido);
                zapierParams.append('email', data.email);
                zapierParams.append('telefono', data.telefono);
                const lang = (document.documentElement.lang || '').toLowerCase();
                const path = (window.location.pathname || '').toLowerCase();
                const isEn = lang.startsWith('en') || path.includes('/en');
                zapierParams.append('etiqueta', isEn ? 'salon_en' : 'salón');

                const zapierPromise = fetch('https://hooks.zapier.com/hooks/catch/13513217/u7m4eoq/', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: zapierParams.toString()
                }).catch(e => console.warn('Zapier direct failed'));

                // Send to n8n (Primary) with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                try {
                    const response = await fetch('https://n8n-agencia.4ventures.es/webhook/virginia-molet-coaching', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    if (!response.ok) console.warn('n8n primary failed, relying on Zapier');
                } catch (n8nErr) {
                    console.warn('n8n request failed or timed out', n8nErr);
                }

                // Ensure Zapier at least started before redirecting
                await zapierPromise;

                // Redirect to thank you page
                const redirectPath = isEn ? '/en/thanks.html' : '/gracias.html';
                window.location.href = redirectPath;

            } catch (err) {
                console.error('Submission error:', err);
                alert('Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.');
                if (btnText) btnText.classList.remove('hidden');
                if (spinner) spinner.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
    }

    // --- Contact Form Logic ---
    const contactForm = document.getElementById('contact-form');
    const contactSubmitBtn = document.getElementById('contactSubmitBtn');

    if (contactForm && contactSubmitBtn) {
        const contactSpinner = contactSubmitBtn.querySelector('.spinner');
        const contactBtnText = contactSubmitBtn.querySelector('span');

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Show loading state
            if (contactBtnText) contactBtnText.classList.add('hidden');
            if (contactSpinner) contactSpinner.classList.remove('hidden');
            contactSubmitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const data = {
                nombre: formData.get('nombre'),
                email: formData.get('email'),
                mensaje: formData.get('mensaje'),
                legal: formData.get('legal') === 'on',
                type: 'contact',
                source: window.location.hostname
            };

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch('https://n8n-agencia.4ventures.es/webhook/virginia-molet-coaching', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) throw new Error('Error en el envío');

                // Show success feedback
                if (contactBtnText) contactBtnText.innerText = 'Sent Successfully!';
                if (contactBtnText) contactBtnText.classList.remove('hidden');
                if (contactSpinner) contactSpinner.classList.add('hidden');
                
                contactForm.reset();
                setTimeout(() => {
                    if (contactBtnText) contactBtnText.innerText = 'Send Message';
                    contactSubmitBtn.disabled = false;
                }, 3000);

            } catch (err) {
                console.error(err);
                alert('There was an error sending your message. Please try again.');
                if (contactBtnText) contactBtnText.classList.remove('hidden');
                if (contactSpinner) contactSpinner.classList.add('hidden');
                contactSubmitBtn.disabled = false;
            }
        });
    }

    if (floatingCta) {
        const contactSection = document.getElementById('contacto');

        // Helper: check if an element is currently in the viewport
        const isVisible = (el) => {
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
        };

        // Helper: should the CTA be shown?
        const shouldShow = () => {
            const scrolledEnough = window.scrollY > 400;
            const formVisible    = isVisible(form);
            const contactVisible = isVisible(contactSection);
            const atBottom       = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
            return scrolledEnough && !formVisible && !contactVisible && !atBottom;
        };

        const updateCta = () => {
            if (shouldShow()) {
                floatingCta.classList.add('active');
            } else {
                floatingCta.classList.remove('active');
            }
        };

        // Scroll listener (throttled with requestAnimationFrame for performance)
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateCta();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Click behavior
        floatingCta.addEventListener('click', (e) => {
            if (form) {
                e.preventDefault();
                form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            // If no form, let the default <a> behavior link to index.html#inscription-form
        });
    }
});
