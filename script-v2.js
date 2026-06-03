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
    const contactForm = document.getElementById('contact-form');
    const floatingCta = document.getElementById('floatingCta');
    const submitBtn = document.getElementById('submitBtn');
    const contactSubmitBtn = document.getElementById('contactSubmitBtn');

    // Helper to send data to n8n
    const sendToN8n = async (data) => {
        const response = await fetch('https://n8n.4ventures.es/webhook/virginia-molet-coaching', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error en el envío a n8n');
        return response;
    };

    if (form && submitBtn) {
        const spinner = submitBtn.querySelector('.spinner');
        const btnText = submitBtn.querySelector('span');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (btnText) btnText.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');
            submitBtn.disabled = true;
            
            const formData = new FormData(form);
            const fullPhone = `${formData.get('codigo-pais')}${formData.get('telefono')}`;
            
            const data = {
                type: 'registration',
                nombre: formData.get('nombre'),
                apellido: formData.get('apellido'),
                email: formData.get('email'),
                telefono: fullPhone,
                legal: formData.get('legal') === 'on',
                source: window.location.hostname
            };

            try {
                // Send to Zapier
                const zapierParams = new URLSearchParams();
                zapierParams.append('nombre', data.nombre);
                zapierParams.append('apellido', data.apellido);
                zapierParams.append('email', data.email);
                zapierParams.append('telefono', data.telefono);
                const lang = (document.documentElement.lang || '').toLowerCase();
                const path = (window.location.pathname || '').toLowerCase();
                const isEn = lang.startsWith('en') || path.includes('/en');
                zapierParams.append('etiqueta', isEn ? 'salon_en' : 'salón');

                fetch('https://hooks.zapier.com/hooks/catch/13513217/u7m4eoq/', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: zapierParams.toString()
                }).catch(e => console.warn('Zapier direct failed'));

                await sendToN8n(data);

                setTimeout(() => {
                    if (isEn) {
                        window.location.href = '/en/thanks.html';
                    } else {
                        window.location.href = '/gracias.html';
                    }
                }, 500);

            } catch (err) {
                console.error(err);
                alert('Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.');
                if (btnText) btnText.classList.remove('hidden');
                if (spinner) spinner.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
    }

    if (contactForm && contactSubmitBtn) {
        const spinner = contactSubmitBtn.querySelector('.spinner');
        const btnText = contactSubmitBtn.querySelector('span');

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (btnText) btnText.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');
            contactSubmitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const data = {
                type: 'contact',
                nombre: formData.get('nombre'),
                email: formData.get('email'),
                mensaje: formData.get('mensaje'),
                legal: formData.get('legal') === 'on',
                source: window.location.hostname
            };

            try {
                await sendToN8n(data);
                
                // Show success alert and reset
                alert(document.documentElement.lang === 'en' ? 'Message sent successfully!' : '¡Mensaje enviado con éxito!');
                contactForm.reset();
            } catch (err) {
                console.error(err);
                alert('Hubo un error al enviar el mensaje.');
            } finally {
                if (btnText) btnText.classList.remove('hidden');
                if (spinner) spinner.classList.add('hidden');
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

    // --- Dynamic Counter Logic ---
    const counterEl = document.getElementById('registered-counter');
    if (counterEl) {
        const targetCount = 1134;
        
        // Dynamic Count-Up Animation
        const duration = 1500; // 1.5 seconds animation
        const startCount = Math.max(560, targetCount - 20); // start 20 counts below for aesthetic transition
        let currentCount = startCount;
        
        counterEl.textContent = startCount.toLocaleString('es-ES');
        
        // Calculate dynamic speed based on range
        const totalSteps = targetCount - startCount;
        const incrementTime = totalSteps > 0 ? Math.floor(duration / totalSteps) : 50;
        
        const timer = setInterval(() => {
            if (currentCount >= targetCount) {
                counterEl.textContent = targetCount.toLocaleString('es-ES');
                clearInterval(timer);
            } else {
                currentCount++;
                counterEl.textContent = currentCount.toLocaleString('es-ES');
            }
        }, incrementTime);
    }

    // --- SICE Countdown Timer ---
    const targetDate = new Date('2026-06-12T09:30:00').getTime();
    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-mins');
    const secsEl = document.getElementById('countdown-secs');

    if (daysEl && hoursEl && minsEl && secsEl) {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minsEl.textContent = '00';
                secsEl.textContent = '00';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minsEl.textContent = String(minutes).padStart(2, '0');
            secsEl.textContent = String(seconds).padStart(2, '0');
        };

        // Run once immediately
        updateCountdown();
        // Update every second
        setInterval(updateCountdown, 1000);
    }
});
