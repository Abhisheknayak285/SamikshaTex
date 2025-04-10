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
    // Important: Query images within the original slider container ID
    const galleryImages = document.querySelectorAll('#gallerySlider .gallery-slide img');
    const newArrivalImages = document.querySelectorAll('#newArrivalsSlider .slide img');
    const imagesForModal = [...galleryImages, ...newArrivalImages]; // Combine NodeLists
    const closeModalBtn = document.querySelector(".close-modal");

    if (modal && modalImg && captionText && imagesForModal.length > 0 && closeModalBtn) {
        imagesForModal.forEach(img => {
            // Ensure we don't attach listeners to clones if they somehow get selected
             if (!img.closest('.clone')) { // Check if the image is inside an element marked as a clone
                 img.addEventListener('click', function() {
                    modal.style.display = "block";
                    document.body.style.overflow = 'hidden'; // Prevent background scrolling
                    modalImg.src = this.src;

                    // Try to get caption from parent slide's h3 tag
                    let itemCaption = this.alt; // Default to alt text
                    // Find the closest slide parent, EXCLUDING clones if necessary
                    const parentSlide = this.closest('.gallery-slide:not(.clone), .slide:not(.clone)');
                    if (parentSlide) {
                        const h3 = parentSlide.querySelector('h3');
                        if(h3) itemCaption = h3.textContent;
                    }
                    captionText.innerHTML = itemCaption;
                });
            }
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


    // --- Reusable Slider Function (with Infinite Loop) ---
    function setupSlider(sliderId, prevBtnId, nextBtnId) {
        const slider = document.getElementById(sliderId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const sliderWrapper = slider ? slider.closest('.slider-wrapper, .gallery-slider-wrapper') : null;

        if (!slider || !prevBtn || !nextBtn || !sliderWrapper) {
            console.warn(`Slider setup aborted for: ${sliderId}. Essential elements missing.`);
            return;
        }

        const originalSlides = Array.from(slider.querySelectorAll('.slide, .gallery-slide')); // Convert NodeList to Array
        if (originalSlides.length <= 1) { // No need for looping or complex setup if 0 or 1 slide
             if(originalSlides.length === 1) {
                 prevBtn.style.display = 'none'; // Hide buttons if only one slide
                 nextBtn.style.display = 'none';
             }
             console.warn(`Slider setup minimal for: ${sliderId}. ${originalSlides.length} slides found.`);
             // Even if 1 slide, ensure observer finds it if needed
              originalSlides.forEach(slide => {
                  if (!slide.classList.contains('animate-on-scroll')) {
                      slide.classList.add('animate-on-scroll', 'fade-in');
                  }
              });
             return;
        }

        // --- Infinite Loop Setup ---
        // 1. Clone first and last slides
        const firstSlideClone = originalSlides[0].cloneNode(true);
        const lastSlideClone = originalSlides[originalSlides.length - 1].cloneNode(true);
        firstSlideClone.classList.add('clone'); // Mark clones
        lastSlideClone.classList.add('clone');

        // 2. Add clones to the slider
        slider.appendChild(firstSlideClone);
        slider.insertBefore(lastSlideClone, originalSlides[0]);

        // 3. Get ALL slides (originals + clones) NodeList
        const allSlidesNodeList = slider.querySelectorAll('.slide, .gallery-slide');
        const allSlides = Array.from(allSlidesNodeList); // Work with an array

        // --- End Infinite Loop Setup ---

        let currentIndex = 1; // Start at the first *real* slide (index 1 after prepending clone)
        let slideWidth = 0;
        let isTransitioning = false; // Flag to prevent rapid clicks during transition

        function calculateSlideMetrics() {
            // Calculate based on the first *real* slide
            const targetSlide = allSlides[1]; // Use the first real slide for measurement
             if (targetSlide) {
                const style = window.getComputedStyle(targetSlide);
                const marginRight = parseInt(style.marginRight, 10) || 0;
                const marginLeft = parseInt(style.marginLeft, 10) || 0;
                slideWidth = targetSlide.offsetWidth + marginLeft + marginRight;

                 // Fallback if width calculation fails
                  if (slideWidth <= 0) {
                      slideWidth = sliderWrapper.offsetWidth; // Approx. full width on mobile/tablet
                       console.warn("Slide width calculation fallback used for", sliderId);
                  }
            } else {
                slideWidth = sliderWrapper.offsetWidth; // Fallback
                console.error("Cannot find target slide for metrics in", sliderId);
            }
            // console.log(`${sliderId} - slideWidth: ${slideWidth}`);
        }

        function updateSliderPosition(instant = false) {
            // Ensure width is calculated, especially needed before first positioning
            if (slideWidth <= 0) {
                 calculateSlideMetrics();
             }
             // Exit if width calculation failed completely
             if (slideWidth <= 0) {
                 console.error("Cannot update slider position, slideWidth is zero for", sliderId);
                 return;
             };

            const offset = -currentIndex * slideWidth;

            if (instant) {
                slider.style.transition = 'none'; // Disable transition for instant jump
            } else {
                // Check if transition style is already set, prevent overriding if none
                 if (slider.style.transition === 'none') {
                     slider.style.transition = 'transform 0.5s ease-in-out'; // Re-enable if it was none
                 } else if (!slider.style.transition) {
                      slider.style.transition = 'transform 0.5s ease-in-out'; // Set if not set at all
                 }
            }

            slider.style.transform = `translateX(${offset}px)`;

            // If instant jump, force reflow and restore transition setting after a tiny delay
            if (instant) {
                slider.offsetHeight; // Force reflow
                // Restore transition style slightly delayed if needed, or rely on next update call
                 // Using timeout helps ensure the transform applies instantly
                 setTimeout(() => {
                    if (slider.style.transition === 'none') {
                         slider.style.transition = 'transform 0.5s ease-in-out';
                    }
                 }, 0);
            }
        }

        function handleTransitionEnd() {
             // Only process jump if we were actually transitioning
             if (!isTransitioning && slider.style.transition !== 'none') {
                  // This case might happen on initial load or resize jumps
                  // console.log(`${sliderId}: Transition end skipped (not initiated by button/swipe)`);
                  return;
              }

             // Check if we landed on a clone and need to jump
             let jumpNeeded = false;
             if (currentIndex === 0) { // Landed on the prepended clone (of the last slide)
                 // console.log(`${sliderId}: Transition end - Jump PREPENDED clone to real LAST`);
                 currentIndex = allSlides.length - 2; // Index of the real last slide
                 updateSliderPosition(true); // Instant jump
                 jumpNeeded = true;
             } else if (currentIndex === allSlides.length - 1) { // Landed on the appended clone (of the first slide)
                 // console.log(`${sliderId}: Transition end - Jump APPENDED clone to real FIRST`);
                 currentIndex = 1; // Index of the real first slide
                 updateSliderPosition(true); // Instant jump
                 jumpNeeded = true;
             }

             // Always reset transitioning flag after transition ends
             isTransitioning = false;

             // Re-enable buttons only after transition ends (and potential jump)
             prevBtn.disabled = false;
             nextBtn.disabled = false;
        }

        // Add the transitionend listener
        slider.addEventListener('transitionend', handleTransitionEnd);

        // Button click handlers
        nextBtn.addEventListener('click', () => {
            if (isTransitioning) return; // Prevent action if already moving
            isTransitioning = true;
            prevBtn.disabled = true; // Disable buttons during transition
            nextBtn.disabled = true;
            currentIndex++;
            updateSliderPosition(); // Regular transition
        });

        prevBtn.addEventListener('click', () => {
             if (isTransitioning) return;
             isTransitioning = true;
             prevBtn.disabled = true;
             nextBtn.disabled = true;
             currentIndex--;
             updateSliderPosition(); // Regular transition
        });

        // Debounce function
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => { clearTimeout(timeout); func(...args); };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Update on resize
        const handleResize = () => {
             // Temporarily disable transition during resize calculation/jump
             slider.style.transition = 'none';
             calculateSlideMetrics(); // Recalculate width based on new viewport
             // Instantly jump to the correct position for the current slide index
             updateSliderPosition(true);
        }
        const debouncedResize = debounce(handleResize, 250);
        window.addEventListener('resize', debouncedResize);

        // Initial setup
        calculateSlideMetrics();
        // Instantly move to the starting slide position (index 1) without animation
        updateSliderPosition(true);

        // Add animation class to original slides
        originalSlides.forEach(slide => {
            if (!slide.classList.contains('animate-on-scroll')) {
                slide.classList.add('animate-on-scroll', 'fade-in');
            }
        });
    }

    // --- Initialize Sliders ---
    setupSlider('gallerySlider', 'galleryPrevBtn', 'galleryNextBtn');
    setupSlider('newArrivalsSlider', 'newArrivalsPrevBtn', 'newArrivalsNextBtn');


    // --- Intersection Observer for Scroll Animations ---
    let observer; // Define observer in a scope accessible by observeElements

    function observeElements() {
        // Target elements with class 'animate-on-scroll' that are NOT already visible
        // Important: Exclude clones from being observed for animation
        const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.is-visible):not(.clone)');

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
            });
        }

        animatedElements.forEach(el => {
             if (window.getComputedStyle(el).display !== 'none') {
                 observer.observe(el);
             }
        });
    }
    // Initial call
    observeElements();


    // --- Back to Top Button --- (Keep As Is)
    const backToTopButton = document.getElementById("back-to-top-btn");
    if (backToTopButton) {
        const scrollThreshold = 300;
        window.addEventListener('scroll', () => {
            if (window.scrollY > scrollThreshold) {
                backToTopButton.style.display = "block";
            } else {
                backToTopButton.style.display = "none";
            }
        }, { passive: true });
        backToTopButton.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // --- Google Sheet Contact Form Submission --- (Keep As Is, ensure URL is correct)
    const scriptURL = 'https://script.google.com/macros/s/AKfycbx9dCFy_hZu2wFZu60NZgQQ_rT1ZcLXqQ8ahbHRtQc31AJ2khUMSm4vCawWBpvubjLEGA/exec'; // *** CHECK THIS URL ***
    const form = document.forms['submit-to-google-sheet'];
    const formStatus = document.getElementById('form-status');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;
    if (form && submitButton) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            submitButton.disabled = true;
            if(formStatus) formStatus.textContent = 'Sending...';
            if(formStatus) formStatus.className = 'form-status';

            fetch(scriptURL, { method: 'POST', body: new FormData(form)})
                .then(response => {
                    if (!response.ok) {
                         return response.json().then(errData => {
                             throw new Error(errData.error || `Server responded with status ${response.status}`);
                         }).catch(() => { throw new Error(`Server responded with status ${response.status}`); });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.result === 'success') {
                        if(formStatus) formStatus.textContent = 'Message sent successfully!';
                        if(formStatus) formStatus.classList.add('success');
                        form.reset();
                        submitButton.disabled = false;
                        setTimeout(() => { if(formStatus) { formStatus.textContent = ''; formStatus.className = 'form-status'; } }, 5000);
                    } else { throw new Error(data.error || 'Submission failed.'); }
                })
                .catch(error => {
                    console.error('Form Error!', error.message);
                    if(formStatus) formStatus.textContent = 'Error sending message. Please try again.';
                    if(formStatus) formStatus.classList.add('error');
                    submitButton.disabled = false;
                     setTimeout(() => { if(formStatus) { formStatus.textContent = ''; formStatus.className = 'form-status'; } }, 5000);
                });
        });
    } else { /* console errors if form/button not found */ }
    // --- End Google Sheet Contact Form Submission ---


    // --- Update Footer Year --- (Keep As Is)
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        try {
            const now = new Date();
            const options = { timeZone: 'Asia/Kolkata', year: 'numeric' };
            const formatter = new Intl.DateTimeFormat('en-US', options); // Use en-US for consistency
            currentYearSpan.textContent = formatter.format(now);
        } catch (e) {
            console.warn("Could not get timezone-specific year, using local year.", e);
            currentYearSpan.textContent = new Date().getFullYear().toString();
        }
    }

}); // End DOMContentLoaded
