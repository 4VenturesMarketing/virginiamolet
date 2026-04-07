document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inscription-form');
    const submitBtn = document.getElementById('submitBtn');
    const spinner = submitBtn.querySelector('.spinner');
    const btnText = submitBtn.querySelector('span');
    const successMsg = document.getElementById('successMsg');

    if(form) {
        // Form Submission Logic
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Show loading state
            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
            submitBtn.disabled = true;
            
            // Collect data
            const formData = new FormData(form);
            const data = {
                nombre: formData.get('nombre'),
                apellido: formData.get('apellido'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                legal: formData.get('legal') === 'on',
                source: window.location.hostname
            };

            try {
                // Send directly to Zapier using form-urlencoded (avoids most CORS issues)
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
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });

        // Floating CTA Logic
        const floatingCta = document.getElementById('floatingCta');
        
        // Use Intersection Observer to hide/show based on form visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    floatingCta.classList.remove('active');
                } else {
                    // Show if we scrolled past the hero or form
                    if (window.scrollY > 400) {
                        floatingCta.classList.add('active');
                    }
                }
            });
        }, { threshold: 0.1 });

        observer.observe(form);

        // Simple scroll behavior as fallback/addition
        window.addEventListener('scroll', () => {
            const rect = form.getBoundingClientRect();
            const isFormVisible = rect.top < window.innerHeight && rect.bottom > 0;
            const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
            
            // Show when user scrolls down at least 50px, but hide if form is visible or at bottom
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
