document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    const publicApiUrl = 'https://script.google.com/macros/s/AKfycbz1wOHAYnl6XihWKCEui-0T00spZinXcNDAvVjCnlc8O-sRLOp_zP-2Vm-eOnz2LLbE5A/exec'; // <<< REPLACE WITH YOUR PUBLIC FETCHING URL
    const contactFormScriptURL = 'https://script.google.com/macros/s/AKfycbx9dCFy_hZu2wFZu60NZgQQ_rT1ZcLXqQ8ahbHRtQc31AJ2khUMSm4vCawWBpvubjLEGA/exec'; // <<< REPLACE WITH YOUR CONTACT FORM URL
    //new
    
    let TRUNCATE_LENGTH = 50; // Default Max characters for preview text in slides
    // Check window width and adjust if necessary
    if (window.innerWidth < 599) {
        TRUNCATE_LENGTH = 15; // Use shorter length for small screens
    }
    
    //end
    const SLIDER_TRANSITION_DURATION = 500; // Milliseconds, match CSS if possible

    // --- Helper Function for Text Truncation ---
    function truncateText(text, maxLength) {
        if (typeof text !== 'string') return '';
        if (text.length <= maxLength) {
            return text;
        }
        // Find the last space within the maxLength to avoid cutting words
        let truncated = text.substring(0, maxLength);
        let lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > maxLength / 2) { // Only cut at space if it's reasonably far in
            truncated = truncated.substring(0, lastSpace);
        }
        return truncated.trim() + '...';
    }

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('is-active');
            navLinks.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    menuToggle.classList.remove('is-active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
        document.addEventListener('click', (event) => {
            const isClickInsideNav = navLinks.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            if (navLinks.classList.contains('active') && !isClickInsideNav && !isClickOnToggle) {
                menuToggle.classList.remove('is-active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // --- Image Modal Setup ---
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");
    const closeModalBtn = document.querySelector(".close-modal");

    // Function to attach modal listeners
    function setupModalListeners(selector) {
        const imagesForModal = document.querySelectorAll(selector);

        // Detach previous listeners
         document.querySelectorAll(selector).forEach(img => {
            const clone = img.cloneNode(true);
            if (img.parentNode) { img.parentNode.replaceChild(clone, img); }
        });

        // Attach new listeners
        document.querySelectorAll(selector).forEach(img => {
            img.addEventListener('click', function() {
                if (!modal || !modalImg || !captionText) return;

                modal.style.display = "block";
                document.body.style.overflow = 'hidden';
                modalImg.src = this.src;

                let fullName = this.alt;
                let fullInfo = '';
                const parentSlide = this.closest('.gallery-slide, .slide');
                if (parentSlide) {
                    fullName = parentSlide.dataset.fullName || fullName;
                    fullInfo = parentSlide.dataset.fullInfo || '';
                }
                captionText.innerHTML = `<h3>${fullName}</h3><p>${fullInfo}</p>`;
            });
        });
    }

    // Function to close the modal
    const closeModalAction = () => {
         if(modal){ modal.style.display = "none"; document.body.style.overflow = ''; }
    }
    // Attach modal closing listeners once
    if(closeModalBtn) closeModalBtn.onclick = closeModalAction;
    if(modal) modal.onclick = function(event) { if (event.target === modal) { closeModalAction(); } }
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal && modal.style.display === "block") { closeModalAction(); } });
    // --- End Image Modal Setup ---


    // --- REVISED Reusable Slider Function (Center Mode + Infinite Loop) ---
    function setupSlider(sliderId, prevBtnId, nextBtnId) {
        const slider = document.getElementById(sliderId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const sliderWrapper = slider ? slider.closest('.slider-wrapper, .gallery-slider-wrapper') : null;

        if (!slider || !prevBtn || !nextBtn || !sliderWrapper) {
            console.warn(`Slider setup aborted for: ${sliderId}. Missing elements.`);
            if (prevBtn) prevBtn.disabled = true; if (nextBtn) nextBtn.disabled = true;
            return;
        }

        let originalSlides = [];
        let allSlides = []; // Includes clones
        let originalTotalSlides = 0;
        let itemsVisibleApprox = 1; // How many roughly fit (for cloning)
        let slideWidth = 0;
        let containerWidth = 0;
        let isInfinite = false;
        let currentIndex = 0; // Index of the slide to be centered
        let isTransitioning = false;
        let cloneCount = 0;

        function initializeSlider() {
            isTransitioning = false; // Reset flag
            originalSlides = slider.querySelectorAll('.slide:not(.clone), .gallery-slide:not(.clone)');
            originalTotalSlides = originalSlides.length;

            prevBtn.disabled = false; nextBtn.disabled = false; // Enable for checks

            if (originalTotalSlides === 0) {
                prevBtn.disabled = true; nextBtn.disabled = true; return;
            }

            calculateDimensions(); // Calculate widths and visible items first

            isInfinite = originalTotalSlides > 1; // Loop if more than 1 slide

            // Clean up previous clones
            const oldClones = slider.querySelectorAll('.clone');
            oldClones.forEach(clone => clone.remove());
            cloneCount = 0; // Reset clone count

            if (isInfinite) {
                // Clone enough slides to fill approx visible area on each side
                cloneCount = Math.max(1, Math.ceil(itemsVisibleApprox)); // Clone at least 1, or enough to fill view

                // Prepend clones of last slides
                for (let i = 0; i < cloneCount; i++) {
                    if (originalSlides[originalTotalSlides - 1 - (i % originalTotalSlides)]) { // Loop if cloneCount > total
                        const clone = originalSlides[originalTotalSlides - 1 - (i % originalTotalSlides)].cloneNode(true);
                        clone.classList.add('clone'); slider.insertBefore(clone, slider.firstChild);
                    }
                }
                // Append clones of first slides
                for (let i = 0; i < cloneCount; i++) {
                    if (originalSlides[i % originalTotalSlides]) { // Loop if cloneCount > total
                        const clone = originalSlides[i % originalTotalSlides].cloneNode(true);
                        clone.classList.add('clone'); slider.appendChild(clone);
                    }
                }
                currentIndex = cloneCount; // Start centered on the first original slide
            } else {
                currentIndex = 0; // Start centered on the first slide
            }

            allSlides = slider.querySelectorAll('.slide, .gallery-slide'); // Update total list including clones
            slider.style.transition = 'none'; // No transition for initial set
            centerSlide(currentIndex, false); // Center initial slide instantly
            // Re-enable transition after a tiny delay
            setTimeout(() => {
                if (slider) slider.style.transition = `transform ${SLIDER_TRANSITION_DURATION / 1000}s ease-in-out`;
            }, 50);

            updateButtonStates(); // Update buttons based on initial state
        }

        function calculateDimensions() {
            containerWidth = sliderWrapper.offsetWidth;
            const currentSlides = slider.querySelectorAll('.slide, .gallery-slide'); // Use current total slides for calculation

            if (currentSlides.length > 0) {
                const style = window.getComputedStyle(currentSlides[0]);
                const marginRight = parseInt(style.marginRight, 10) || 0;
                const marginLeft = parseInt(style.marginLeft, 10) || 0;
                if (currentSlides[0].offsetWidth > 0) {
                    slideWidth = currentSlides[0].offsetWidth + marginLeft + marginRight;
                } else { slideWidth = containerWidth * 0.8; console.warn(`${sliderId}: Slide offsetWidth 0, estimating.`); } // Estimate if needed

                if (containerWidth > 0 && slideWidth > 0) {
                     // Calculate approx how many items fit for cloning strategy
                     itemsVisibleApprox = Math.max(1, containerWidth / slideWidth);
                } else { itemsVisibleApprox = 1; }
            } else { slideWidth = 0; itemsVisibleApprox = 1; }
        }

        function updateButtonStates() {
            if (originalTotalSlides <= 1) { // Disable if only 1 slide
                prevBtn.disabled = true;
                nextBtn.disabled = true;
            } else if (!isInfinite) { // Non-infinite logic
                prevBtn.disabled = currentIndex === 0;
                nextBtn.disabled = currentIndex === originalTotalSlides - 1;
            } else { // Infinite loop - always enabled if more than 1 slide
                prevBtn.disabled = false;
                nextBtn.disabled = false;
            }
        }

        // Function to apply centering transform and manage active class
        function centerSlide(index, useTransition = true) {
            if (isTransitioning && useTransition) return;
            if (!slideWidth || allSlides.length === 0) return; // Can't center if width is 0 or no slides

            if (useTransition) isTransitioning = true;

            // Calculate offset needed to center the slide at 'index'
            const containerCenter = containerWidth / 2;
            // Center of the target slide = (start position) + (half its width without margin)
            const targetSlideElement = allSlides[index];
            const targetSlideWidth = targetSlideElement ? targetSlideElement.offsetWidth : slideWidth; // Use actual width if possible
            const slideCenter = (index * slideWidth) + (targetSlideWidth / 2);
            const offsetX = containerCenter - slideCenter;

            // Apply Transform
            slider.style.transition = useTransition ? `transform ${SLIDER_TRANSITION_DURATION / 1000}s ease-in-out` : 'none';
            slider.style.transform = `translateX(${offsetX}px)`;

            // Update Active Class
            allSlides.forEach((slide, i) => {
                 slide.classList.toggle('active', i === index);
            });

            currentIndex = index; // Update the current centered index

            // Update Buttons (deferred slightly if using transition)
            if (useTransition) { setTimeout(updateButtonStates, 50); }
            else { updateButtonStates(); }

            // Reset transitioning flag
             if (useTransition) { setTimeout(() => { isTransitioning = false; }, SLIDER_TRANSITION_DURATION); }
             else { isTransitioning = false; }
        }


        // --- Event Listeners for Slider ---
        nextBtn.addEventListener('click', () => {
            if (isTransitioning || nextBtn.disabled) return;

            let nextIndex = currentIndex + 1;
            centerSlide(nextIndex, true); // Move with transition

            // Infinite Loop Check: If moved into the appended clones area
            if (isInfinite && nextIndex >= (cloneCount + originalTotalSlides)) {
                // After transition finishes, jump instantly to the first original slide
                setTimeout(() => {
                    centerSlide(cloneCount, false); // Jump to first original (index = cloneCount)
                }, SLIDER_TRANSITION_DURATION);
            }
        });

        prevBtn.addEventListener('click', () => {
            if (isTransitioning || prevBtn.disabled) return;

            let prevIndex = currentIndex - 1;
            centerSlide(prevIndex, true); // Move with transition

            // Infinite Loop Check: If moved into the prepended clones area
            if (isInfinite && prevIndex < cloneCount) {
                // After transition finishes, jump instantly to the last original slide
                setTimeout(() => {
                    const jumpToIndex = cloneCount + originalTotalSlides - 1; // Index of last original slide
                    centerSlide(jumpToIndex, false);
                }, SLIDER_TRANSITION_DURATION);
            }
        });

        // --- Resize Handling ---
        function debounce(func, wait) { let timeout; return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
        const debouncedResizeUpdate = debounce(() => {
            const oldItemsVisibleApprox = itemsVisibleApprox; // Store previous approximate count
            calculateDimensions(); // Recalc container/slide width and approx visible items
            // If infinite loop active AND the approx number of visible items changed, re-init fully
            if (isInfinite && Math.ceil(itemsVisibleApprox) !== Math.ceil(oldItemsVisibleApprox)) {
                console.log(`${sliderId} - Re-initializing slider due to significant change in visible items.`);
                initializeSlider(); // Re-run setup including cloning
            } else {
                // Otherwise, just re-center the current slide based on new dimensions
                centerSlide(currentIndex, false);
                 updateButtonStates(); // Update buttons based on possibly new slideWidth/containerWidth relationship
            }
        }, 250);
        window.addEventListener('resize', debouncedResizeUpdate);


        // --- Initial Call ---
        setTimeout(initializeSlider, 100); // Init after slight delay

    } // --- End setupSlider Function ---


    // --- Intersection Observer for Scroll Animations ---
    let observer;
    function observeElements() {
         if (observer) observer.disconnect();
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        if (!('IntersectionObserver' in window)) { animatedElements.forEach(el => el.classList.add('is-visible')); return; }
        observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observerInstance.unobserve(entry.target); }
            });
        }, { threshold: 0.1 });
        animatedElements.forEach(el => { if (el.offsetParent !== null) observer.observe(el); });
    }


    // --- Back to Top Button ---
    const backToTopButton = document.getElementById("back-to-top-btn");
    if (backToTopButton) {
        const scrollThreshold = 300;
        let isVisible = false;
        const checkScroll = () => {
            const shouldBeVisible = window.scrollY > scrollThreshold;
            if (shouldBeVisible !== isVisible) {
                backToTopButton.style.display = shouldBeVisible ? "block" : "none";
                isVisible = shouldBeVisible;
            }
        };
        window.addEventListener('scroll', checkScroll, { passive: true });
        backToTopButton.addEventListener("click", (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
        checkScroll(); // Initial check
     }


    // --- Google Sheet Contact Form Submission ---
    const contactForm = document.forms['submit-to-google-sheet'];
    const contactFormStatus = document.getElementById('form-status');
    const contactSubmitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
    if (contactForm && contactSubmitButton) {
        contactForm.addEventListener('submit', e => {
            e.preventDefault(); contactSubmitButton.disabled = true;
            if(contactFormStatus) { contactFormStatus.textContent = 'Sending...'; contactFormStatus.className = 'form-status sending'; contactFormStatus.style.display = 'block'; }
            fetch(contactFormScriptURL, { method: 'POST', body: new FormData(contactForm)})
            .then(response => { if (!response.ok) { return response.json().catch(() => { throw new Error(`Server status ${response.status}`); }).then(errData => { throw new Error(errData.error || `Server error`); }); } return response.json(); })
            .then(data => { if (data.result === 'success') { if(contactFormStatus) { contactFormStatus.textContent = 'Message sent!'; contactFormStatus.className = 'form-status success'; } contactForm.reset(); } else { throw new Error(data.error || 'Failed.'); } })
            .catch(error => { console.error('Contact Form Error!', error.message); if(contactFormStatus) { contactFormStatus.textContent = 'Error sending message.'; contactFormStatus.className = 'form-status error'; } })
            .finally(() => { contactSubmitButton.disabled = false; if(contactFormStatus) { setTimeout(() => { contactFormStatus.style.display = 'none'; }, 5000); } });
        });
    }


    // --- Update Footer Year ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) { try { const now = new Date(); const options = { timeZone: 'Asia/Kolkata', year: 'numeric' }; const formatter = new Intl.DateTimeFormat('en-US', options); currentYearSpan.textContent = formatter.format(now); } catch (e) { currentYearSpan.textContent = new Date().getFullYear(); } }


    // --- Generic Function to Load Items for Sliders ---
    function loadAndDisplayItems(config) {
        const sliderElement = document.getElementById(config.sliderId);
        const loadingMessage = document.getElementById(config.loadingMsgId);
        const prevBtn = document.getElementById(config.prevBtnId);
        const nextBtn = document.getElementById(config.nextBtnId);

        const disableControls = () => { if(prevBtn) prevBtn.disabled = true; if(nextBtn) nextBtn.disabled = true; }
        const showLoading = () => {
             if (!sliderElement) return;
             if (loadingMessage) loadingMessage.style.display = 'block';
             sliderElement.innerHTML = ''; if (loadingMessage) sliderElement.appendChild(loadingMessage);
             disableControls();
        }
        const showError = (message) => {
             if (!sliderElement) return;
             console.error(`Workspace/Process Error (${config.sliderId}):`, message);
             if (loadingMessage) loadingMessage.style.display = 'none';
             sliderElement.innerHTML = `<p style="text-align: center; padding: 20px; color: #dc3545;">Could not load items. ${message}</p>`;
             disableControls();
        }

        if (!sliderElement) { console.error(`Slider container #${config.sliderId} not found.`); return; }
        showLoading();

        const payload = { action: 'getItems' };
        fetch(publicApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', }, body: new URLSearchParams(payload).toString() })
        .then(response => { if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`); return response.json(); })
        .then(data => {
            if (loadingMessage) loadingMessage.style.display = 'none';
            sliderElement.innerHTML = '';

            if (data.success && Array.isArray(data.items)) {
                const filteredItems = data.items.filter(item => item.type === config.typeToFilter);

                if (filteredItems.length === 0) {
                    sliderElement.innerHTML = `<p style="text-align: center; padding: 20px; color: #555;">No ${config.typeToFilter.toLowerCase()} items available.</p>`;
                    disableControls(); return;
                }

                const slideClass = config.typeToFilter === 'Gallery' ? 'gallery-slide' : 'slide';
                filteredItems.forEach(item => {
                    const slideDiv = document.createElement('div');
                    slideDiv.className = `${slideClass} animate-on-scroll fade-in`; // No 'active' class initially
                    const fullName = item.name || 'Saree'; const fullInfo = item.info || '';
                    slideDiv.dataset.fullName = fullName; slideDiv.dataset.fullInfo = fullInfo;
                    const img = document.createElement('img');
                    const imageSrc = item.link || 'images/placeholder.jpg';
                    img.src = imageSrc; img.alt = item.alt || fullName; img.loading = 'lazy';
                    img.onerror = (e) => { e.target.src='images/placeholder.jpg'; e.target.alt='Image load error'; };
                    const infoDiv = document.createElement('div'); infoDiv.className = 'item-info';
                    const h3 = document.createElement('h3'); h3.textContent = truncateText(fullName, TRUNCATE_LENGTH);
                    const p = document.createElement('p'); p.textContent = truncateText(fullInfo, TRUNCATE_LENGTH);
                    infoDiv.appendChild(h3); infoDiv.appendChild(p);
                    slideDiv.appendChild(img); slideDiv.appendChild(infoDiv);
                    sliderElement.appendChild(slideDiv);
                });

                // Re-initialize features AFTER dynamic content is added
                setTimeout(() => {
                    setupSlider(config.sliderId, config.prevBtnId, config.nextBtnId);
                    setupModalListeners(`#${config.sliderId} .${slideClass} img`);
                    observeElements(); // Observe new elements
                }, 100);

            } else { throw new Error(data.message || "Invalid data format"); }
        })
        .catch(error => { showError(error.message); });
    }


    // --- Initializations on Page Load ---
    const galleryConfig = { sliderId: 'gallerySlider', typeToFilter: 'Gallery', prevBtnId: 'galleryPrevBtn', nextBtnId: 'galleryNextBtn', loadingMsgId: 'gallery-loading-message' };
    const newArrivalsConfig = { sliderId: 'newArrivalsSlider', typeToFilter: 'NewArrival', prevBtnId: 'newArrivalsPrevBtn', nextBtnId: 'newArrivalsNextBtn', loadingMsgId: 'new-arrivals-loading-message' };

    loadAndDisplayItems(galleryConfig);
    loadAndDisplayItems(newArrivalsConfig);
    observeElements(); // Observe static elements initially

}); // --- End DOMContentLoaded ---
