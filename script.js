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
                // Send directly to Zapier
                const zapierParams = new URLSearchParams();
                zapierParams.append('nombre', data.nombre);
                zapierParams.append('apellido', data.apellido);
                zapierParams.append('email', data.email);
                zapierParams.append('telefono', data.telefono);
                zapierParams.append('etiqueta', 'salón');

                fetch('https://hooks.zapier.com/hooks/catch/13513217/u7m4eoq/', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: zapierParams.toString()
                }).catch(e => console.warn('Zapier direct failed'));

                const response = await fetch('https://n8n.4ventures.es/webhook/virginia-molet-coaching', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error('Error en el envío');

                // Redirect to thank you page
                setTimeout(() => {
                    window.location.href = 'gracias.html';
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

    if (form && floatingCta) {
        // Use Intersection Observer to hide/show based on form visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    floatingCta.classList.remove('active');
                } else {
                    if (window.scrollY > 400) {
                        floatingCta.classList.add('active');
                    }
                }
            });
        }, { threshold: 0.1 });

        observer.observe(form);

        // Simple scroll behavior
        window.addEventListener('scroll', () => {
            const rect = form.getBoundingClientRect();
            const isFormVisible = rect.top < window.innerHeight && rect.bottom > 0;
            const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
            
            if (window.scrollY > 50 && !isFormVisible && !isBottom) {
                floatingCta.classList.add('active');
            } else {
                floatingCta.classList.remove('active');
            }
        });

        // Smooth scroll to form
        floatingCta.addEventListener('click', (e) => {
            e.preventDefault();
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
});
