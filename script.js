document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('is-active');
            navLinks.classList.toggle('active');
            // Prevent body scroll when mobile menu is open
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                 if (navLinks.classList.contains('active')) {
                    menuToggle.classList.remove('is-active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = ''; // Restore scroll
                 }
            });
        });

        // Close menu if clicked outside the nav on mobile
        document.addEventListener('click', (event) => {
            const isClickInsideNav = navLinks.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            // Only close if the menu is active and the click is outside both nav and toggle
            if (navLinks.classList.contains('active') && !isClickInsideNav && !isClickOnToggle) {
                menuToggle.classList.remove('is-active');
                navLinks.classList.remove('active');
                document.body.style.overflow = ''; // Restore scroll
            }
        });
    }


    // --- Image Modal ---
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");
    // Query images in both gallery and new arrivals sliders
    const imagesForModal = document.querySelectorAll('.gallery-slide img, .slide img');
    const closeModalBtn = document.querySelector(".close-modal");

    if (modal && modalImg && captionText && imagesForModal.length > 0 && closeModalBtn) {
        imagesForModal.forEach(img => {
            img.addEventListener('click', function() {
                modal.style.display = "block";
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
                modalImg.src = this.src;

                // Try to get caption from parent slide's h3 tag
                let itemCaption = this.alt; // Default to alt text
                const parentSlide = this.closest('.gallery-slide') || this.closest('.slide'); // Check both types
                if (parentSlide) {
                    const h3 = parentSlide.querySelector('h3');
                    if(h3) itemCaption = h3.textContent;
                }
                captionText.innerHTML = itemCaption;
            });
        });

        // Function to close the modal
        const closeModalAction = () => {
            modal.style.display = "none";
            document.body.style.overflow = ''; // Restore background scrolling
        }

        // Event listeners for closing the modal
        closeModalBtn.onclick = closeModalAction;
        modal.onclick = function(event) { if (event.target === modal) { closeModalAction(); } }
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.style.display === "block") { closeModalAction(); } });
    }


    // --- Reusable Slider Function ---
    function setupSlider(sliderId, prevBtnId, nextBtnId) {
        // console.log(`Setting up slider: ${sliderId}`); // DEBUG: Check if function is called
        const slider = document.getElementById(sliderId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        // Find the correct parent wrapper class
        const sliderWrapper = slider ? slider.closest('.slider-wrapper, .gallery-slider-wrapper') : null;

        // DEBUG: Check if elements are found
        // if (!slider) console.error(`Slider element not found: #${sliderId}`);
        // if (!prevBtn) console.error(`Previous button not found: #${prevBtnId}`);
        // if (!nextBtn) console.error(`Next button not found: #${nextBtnId}`);
        // if (!sliderWrapper) console.error(`Slider wrapper not found for: #${sliderId}`);

        if (!slider || !prevBtn || !nextBtn || !sliderWrapper) {
            console.warn(`Slider setup aborted for: ${sliderId}. Essential elements missing.`);
            return; // Exit if essential elements are missing
        }

        const slides = slider.querySelectorAll('.slide, .gallery-slide'); // Select both types of slides
        // console.log(`Found ${slides.length} slides for ${sliderId}`); // DEBUG: Check slide count
        let currentIndex = 0;
        let slideWidth = 0;
        let itemsVisible = 1;

        function calculateSlideMetrics() {
            if (slides.length > 0) {
                 const style = window.getComputedStyle(slides[0]);
                 const marginRight = parseInt(style.marginRight, 10) || 0;
                 const marginLeft = parseInt(style.marginLeft, 10) || 0;
                 slideWidth = slides[0].offsetWidth + marginLeft + marginRight;
                 // Check for valid wrapper width and slide width
                 if (sliderWrapper.offsetWidth > 0 && slideWidth > 0) {
                    itemsVisible = Math.max(1, Math.floor(sliderWrapper.offsetWidth / slideWidth));
                 } else {
                    itemsVisible = 1; // Default if calculation fails
                 }
                 // DEBUG: Log calculated values
                 // console.log(`${sliderId} - slideWidth: ${slideWidth}, wrapperWidth: ${sliderWrapper.offsetWidth}, itemsVisible: ${itemsVisible}`);
            } else {
                slideWidth = 0;
                itemsVisible = 1;
            }
        }

        function updateSliderPosition() {
            calculateSlideMetrics(); // Recalculate on update
            if (slideWidth <= 0 || slides.length === 0) return; // Exit if no slides or invalid width

            // Ensure itemsVisible is at least 1, even if calculation seems off
             itemsVisible = Math.max(1, itemsVisible);

            const maxIndex = Math.max(0, slides.length - itemsVisible);
            currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));

            const offset = -currentIndex * slideWidth;
            slider.style.transform = `translateX(${offset}px)`;
            // DEBUG: Log slider movement
            // console.log(`${sliderId} - Moving to index: ${currentIndex}, offset: ${offset}px`);

            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= maxIndex;
            // DEBUG: Log button states
            // console.log(`${sliderId} - Prev disabled: ${prevBtn.disabled}, Next disabled: ${nextBtn.disabled} (maxIndex: ${maxIndex})`);
        }

        nextBtn.addEventListener('click', () => {
            // console.log(`${sliderId} - Next button clicked`); // DEBUG: Check click event
            // Recalculate itemsVisible right before potentially moving
            calculateSlideMetrics();
            itemsVisible = Math.max(1, itemsVisible); // Ensure it's at least 1
            const maxIndex = Math.max(0, slides.length - itemsVisible);
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateSliderPosition();
            } else {
                // console.log(`${sliderId} - Already at max index (${currentIndex})`); // DEBUG: Log if at end
            }
        });

        prevBtn.addEventListener('click', () => {
            // console.log(`${sliderId} - Prev button clicked`); // DEBUG: Check click event
            if (currentIndex > 0) {
                currentIndex--;
                updateSliderPosition();
            } else {
                // console.log(`${sliderId} - Already at index 0`); // DEBUG: Log if at beginning
            }
        });

        // Debounce function to limit resize event frequency
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => { clearTimeout(timeout); func(...args); };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        const debouncedUpdate = debounce(updateSliderPosition, 200); // Slightly longer debounce
        window.addEventListener('resize', debouncedUpdate);

        // Add animation class to slides
         slides.forEach(slide => {
            if (!slide.classList.contains('animate-on-scroll')) {
                slide.classList.add('animate-on-scroll', 'fade-in');
             }
         });

        // Initial setup after a slightly longer delay for layout stability
        setTimeout(updateSliderPosition, 200);
    }

    // --- Initialize Sliders ---
    // Make sure these IDs exactly match your HTML button/slider IDs!
    setupSlider('gallerySlider', 'galleryPrevBtn', 'galleryNextBtn');
    setupSlider('newArrivalsSlider', 'newArrivalsPrevBtn', 'newArrivalsNextBtn');


    // --- Intersection Observer for Scroll Animations ---
    let observer; // Define observer in a scope accessible by observeElements

    function observeElements() {
        // Target elements with class 'animate-on-scroll' that are NOT already visible
        const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.is-visible)');

        // Initialize observer only if it doesn't exist
        if (!observer) {
            observer = new IntersectionObserver((entries, observerInstance) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observerInstance.unobserve(entry.target); // Stop observing once visible
                    }
                });
            }, {
                threshold: 0.1 // Trigger when 10% of the element is visible
                // rootMargin: '0px 0px -50px 0px' // Optional: Adjust trigger point relative to viewport
            });
        }

        // Observe each non-visible animated element if it's currently displayed
        animatedElements.forEach(el => {
            // Check if element is actually displayed before observing
             if (window.getComputedStyle(el).display !== 'none') {
                observer.observe(el);
             }
        });
    }

    // Initial call to observe elements on page load
    observeElements();


    // --- Back to Top Button ---
    const backToTopButton = document.getElementById("back-to-top-btn");

    if (backToTopButton) {
        const scrollThreshold = 300; // Pixels to scroll before showing button

        window.addEventListener('scroll', () => {
            // Use window.scrollY for modern browsers
            if (window.scrollY > scrollThreshold) {
                backToTopButton.style.display = "block";
            } else {
                backToTopButton.style.display = "none";
            }
        }, { passive: true }); // Improve scroll performance

        backToTopButton.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent default anchor behavior if it were an anchor
            window.scrollTo({
                top: 0,
                behavior: 'smooth' // Native smooth scrolling
            });
        });
    }


    // --- Google Sheet Contact Form Submission ---
    // !!! IMPORTANT: REPLACE THE PLACEHOLDER URL BELOW !!!
    const scriptURL = 'https://script.google.com/macros/s/AKfycbx9dCFy_hZu2wFZu60NZgQQ_rT1ZcLXqQ8ahbHRtQc31AJ2khUMSm4vCawWBpvubjLEGA/exec'; // *** REPLACE THIS!!! ***
    const form = document.forms['submit-to-google-sheet']; // Ensure your <form> has name="submit-to-google-sheet"
    const formStatus = document.getElementById('form-status');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;

    if (form && submitButton) {
        form.addEventListener('submit', e => {
            e.preventDefault(); // Prevent default form submission

            // Disable button and show 'sending' message
            submitButton.disabled = true;
            if(formStatus) formStatus.textContent = 'Sending...';
            if(formStatus) formStatus.className = 'form-status'; // Reset class

            fetch(scriptURL, { method: 'POST', body: new FormData(form)})
                .then(response => {
                    // Check if response is ok (status 200-299)
                    if (!response.ok) {
                         // Try to get error details if server provided JSON error response
                         return response.json().then(errData => {
                            throw new Error(errData.error || `Server responded with status ${response.status}`);
                         }).catch(() => {
                            // Fallback if response wasn't JSON or other error parsing
                            throw new Error(`Server responded with status ${response.status}`);
                         });
                    }
                    return response.json(); // Parse JSON response from Apps Script
                })
                .then(data => {
                    // Check the result field from the Apps Script response
                    if (data.result === 'success') {
                        console.log('Form Success:', data);
                        if(formStatus) formStatus.textContent = 'Message sent successfully!';
                        if(formStatus) formStatus.classList.add('success');
                        form.reset(); // Clear the form fields
                        submitButton.disabled = false; // Re-enable button
                        // Optional: Hide success message after a few seconds
                        setTimeout(() => { if(formStatus) { formStatus.textContent = ''; formStatus.className = 'form-status'; } }, 5000);
                    } else {
                        // Handle application-level errors returned from Apps Script
                        throw new Error(data.error || 'Submission failed.');
                    }
                })
                .catch(error => {
                    // Handle fetch errors (network issues) or errors thrown above
                    console.error('Form Error!', error.message);
                    if(formStatus) formStatus.textContent = 'Error sending message. Please try again.';
                    if(formStatus) formStatus.classList.add('error');
                    submitButton.disabled = false; // Re-enable button
                     // Optional: Hide error message after a few seconds
                     setTimeout(() => { if(formStatus) { formStatus.textContent = ''; formStatus.className = 'form-status'; } }, 5000);
                });
        });
    } else {
        if (!form) console.error("Contact form not found (make sure <form> has name='submit-to-google-sheet').");
        if (!submitButton) console.error("Submit button not found in the contact form.");
    }
    // --- End Google Sheet Contact Form Submission ---


    // --- Update Footer Year ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        try {
            // Get the current year based on Approximate IST (Asia/Kolkata)
            const now = new Date();
            // Options specify the timezone; use 'en-IN' or 'en-US' for locale preference if needed
            const options = { timeZone: 'Asia/Kolkata', year: 'numeric' };
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const currentYear = formatter.format(now);
            currentYearSpan.textContent = currentYear;
        } catch (e) {
            // Fallback if Intl or timezone is not supported
            console.warn("Could not get timezone-specific year, using local year.", e);
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }

}); // End DOMContentLoaded
