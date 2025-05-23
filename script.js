// ==========================================================================
// ========================== CONFIGURATION =================================
// ==========================================================================

// !!! IMPORTANT: Replace with your DEPLOYED Google Apps Script Web App URL !!!
// This URL is used to FETCH Gallery and New Arrivals data.
const CONTENT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynJVLQR_1H2VWYCIM5gBIpgNppCqq9QVXJTYLNq3QM9rY_NAwOTUZBJVexMNhJW9NX/exec";

// !!! IMPORTANT: Replace with your DEPLOYED Google Apps Script Web App URL !!!
// This URL is used to SUBMIT the Contact Form data.
const scriptURL_contact = "https://script.google.com/macros/s/AKfycbygnC1RLbNRwmCUml6js7jQK4m5JGnGmaWq92i-q_WeKo06_dKq7dJ_5VLN2GfzENqu/exec";

// Optional: Path to a placeholder image if gallery/arrival images fail to load
const PLACEHOLDER_IMAGE_PATH = 'images/placeholder.png'; // Create this image or change the path

// ==========================================================================
// ========================== MAIN SCRIPT LOGIC =============================
// ==========================================================================

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


    // --- Image Modal Setup (Using Event Delegation) ---
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");
    const closeModalBtn = document.querySelector(".close-modal");
    const gallerySliderContainer = document.getElementById('gallerySlider'); // Get container
    const newArrivalsSliderContainer = document.getElementById('newArrivalsSlider'); // Get container

    function openModal(imgElement) {
         if (!modal || !modalImg || !captionText || !imgElement) return;

         modal.style.display = "block";
         document.body.style.overflow = 'hidden'; // Prevent background scrolling
         modalImg.src = imgElement.src; // Set image source

         // Try to get caption from parent slide's h3 tag
         let itemCaption = imgElement.alt; // Default to alt text
         const parentSlide = imgElement.closest('.gallery-slide, .slide'); // Works for both sliders
         if (parentSlide) {
             const h3 = parentSlide.querySelector('h3');
             if (h3) itemCaption = h3.textContent;
         }
         captionText.innerHTML = itemCaption; // Set caption text
    }

    function setupModalListeners() {
        if (!modal || !closeModalBtn) {
            console.warn("Modal elements not found, cannot set up listeners.");
            return;
        }

         // Use event delegation on slider containers
        if (gallerySliderContainer) {
            gallerySliderContainer.addEventListener('click', (event) => {
                // Check if the clicked element is an IMG within a slide (and not a clone)
                const imgTarget = event.target.closest('.gallery-slide:not(.clone) img');
                if (imgTarget) {
                     openModal(imgTarget);
                }
            });
        } else {
             console.warn("Gallery slider container not found for modal listener.");
        }

         if (newArrivalsSliderContainer) {
             newArrivalsSliderContainer.addEventListener('click', (event) => {
                 // Check if the clicked element is an IMG within a slide (and not a clone)
                 const imgTarget = event.target.closest('.slide:not(.clone) img');
                 if (imgTarget) {
                     openModal(imgTarget);
                 }
             });
         } else {
              console.warn("New Arrivals slider container not found for modal listener.");
         }


        // Function to close the modal
        const closeModalAction = () => {
            if(modal) modal.style.display = "none";
            document.body.style.overflow = ''; // Restore background scrolling
        }

        // Event listeners for closing the modal
        closeModalBtn.onclick = closeModalAction;
        modal.onclick = function(event) {
             // Close if clicked on the modal background, not the image itself
             if (event.target === modal) {
                 closeModalAction();
             }
        }
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal && modal.style.display === "block") {
                closeModalAction();
            }
        });
    }
    // Call setupModalListeners after DOM loaded (listeners attached to containers, ready for dynamic content)
    setupModalListeners();


    // --- Reusable Slider Function (with Infinite Loop) ---
    function setupSlider(sliderId, prevBtnId, nextBtnId) {
        const slider = document.getElementById(sliderId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const sliderWrapper = slider ? slider.closest('.slider-wrapper, .gallery-slider-wrapper') : null;

        if (!slider || !prevBtn || !nextBtn || !sliderWrapper) {
            console.warn(`Slider setup aborted for: ${sliderId}. Essential elements missing.`);
            // Attempt to hide controls if they exist but slider/wrapper don't
            if(prevBtn) prevBtn.style.display = 'none';
            if(nextBtn) nextBtn.style.display = 'none';
            return;
        }

        // Query slides *after* they might have been added dynamically
        const originalSlides = Array.from(slider.querySelectorAll('.slide, .gallery-slide')); // Convert NodeList to Array

        if (originalSlides.length <= 1) { // No need for looping or complex setup if 0 or 1 slide
             if(originalSlides.length === 1) {
                 prevBtn.style.display = 'none'; // Hide buttons if only one slide
                 nextBtn.style.display = 'none';
                 sliderWrapper.style.display = 'block'; // Keep wrapper visible for single slide
             } else { // 0 slides
                 prevBtn.style.display = 'none';
                 nextBtn.style.display = 'none';
                 // Keep wrapper visible to show the "No items found" message if needed
                 // sliderWrapper.style.display = 'none';
             }
             console.warn(`Slider setup minimal for: ${sliderId}. ${originalSlides.length} slides found.`);
             // Ensure observer finds the single slide if needed
              originalSlides.forEach(slide => {
                  if (!slide.classList.contains('animate-on-scroll')) {
                      slide.classList.add('animate-on-scroll', 'fade-in');
                  }
              });
             return;
        } else {
            // Ensure buttons/wrapper are visible if we have multiple slides
             prevBtn.style.display = 'flex'; // Use flex to align icon center
             nextBtn.style.display = 'flex';
             sliderWrapper.style.display = 'block';
        }


        // --- Infinite Loop Setup ---
        // Clear existing clones first in case of re-initialization
        slider.querySelectorAll('.clone').forEach(clone => clone.remove());

        // 1. Clone first and last *original* slides
        const firstSlideClone = originalSlides[0].cloneNode(true);
        const lastSlideClone = originalSlides[originalSlides.length - 1].cloneNode(true);
        firstSlideClone.classList.add('clone'); // Mark clones
        lastSlideClone.classList.add('clone');
        // Remove animation visibility from clones to prevent flicker on jump
        firstSlideClone.classList.remove('is-visible');
        lastSlideClone.classList.remove('is-visible');


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

                  // Fallback if width calculation fails (e.g., display:none parent)
                   if (slideWidth <= 0 && sliderWrapper.offsetWidth > 0) {
                       slideWidth = sliderWrapper.offsetWidth / (window.innerWidth >= 992 ? 3 : 1); // Approx based on expected slides visible
                        console.warn(`Slide width calculation fallback used for ${sliderId}. Approximated: ${slideWidth}`);
                   } else if (slideWidth <= 0) {
                        console.error(`Cannot accurately calculate slideWidth for ${sliderId}. Wrapper/Slide might be hidden.`);
                        slideWidth = 300; // Absolute fallback
                   }
            } else {
                 slideWidth = sliderWrapper.offsetWidth / (window.innerWidth >= 992 ? 3 : 1); // Fallback if no slides[1]
                 console.error(`Cannot find target slide[1] for metrics in ${sliderId}. Approximating width.`);
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
                 console.error(`Cannot update slider ${sliderId} position, slideWidth is zero.`);
                 return;
             };

            const offset = -currentIndex * slideWidth;

            if (instant) {
                 slider.style.transition = 'none'; // Disable transition for instant jump
            } else {
                  // Ensure transition is set if it was none or not set
                  if (slider.style.transition === 'none' || !slider.style.transition) {
                       slider.style.transition = 'transform 0.5s ease-in-out';
                  }
            }

            slider.style.transform = `translateX(${offset}px)`;

            // If instant jump, force reflow and restore transition setting after a tiny delay
            if (instant) {
                 slider.offsetHeight; // Force reflow
                  setTimeout(() => {
                      if (slider.style.transition === 'none') {
                           slider.style.transition = 'transform 0.5s ease-in-out';
                      }
                  }, 10); // Small delay
            }
        }

        function handleTransitionEnd() {
             // Check if we landed on a clone and need to jump
             if (currentIndex === 0) { // Landed on the prepended clone
                 currentIndex = allSlides.length - 2; // Index of the real last slide
                 updateSliderPosition(true); // Instant jump
             } else if (currentIndex === allSlides.length - 1) { // Landed on the appended clone
                 currentIndex = 1; // Index of the real first slide
                 updateSliderPosition(true); // Instant jump
             }

             // Always reset transitioning flag after transition ends
             isTransitioning = false;

             // Re-enable buttons only after transition ends (and potential jump)
             prevBtn.disabled = false;
             nextBtn.disabled = false;
        }

        // Add the transitionend listener (ensure only one listener active)
        slider.removeEventListener('transitionend', handleTransitionEnd);
        slider.addEventListener('transitionend', handleTransitionEnd);

        // Button click handlers
        nextBtn.addEventListener('click', () => {
            if (isTransitioning) return;
            isTransitioning = true;
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            currentIndex++;
            updateSliderPosition();
        });

        prevBtn.addEventListener('click', () => {
             if (isTransitioning) return;
             isTransitioning = true;
             prevBtn.disabled = true;
             nextBtn.disabled = true;
             currentIndex--;
             updateSliderPosition();
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
             slider.style.transition = 'none'; // Temporarily disable transition
             calculateSlideMetrics(); // Recalculate width
             updateSliderPosition(true); // Instantly jump to correct position
        }
        const debouncedResize = debounce(handleResize, 250);
        // Use ResizeObserver if available for better performance on element resize, fallback to window resize
        if ('ResizeObserver' in window) {
             const resizeObserver = new ResizeObserver(debouncedResize);
             resizeObserver.observe(sliderWrapper);
        } else {
            window.addEventListener('resize', debouncedResize);
        }


        // Initial setup
        calculateSlideMetrics();
        updateSliderPosition(true); // Instantly move to the starting slide position

         // Add animation class to original slides (ensure they are picked up by observer)
         originalSlides.forEach(slide => {
             if (!slide.classList.contains('animate-on-scroll')) {
                 slide.classList.add('animate-on-scroll', 'fade-in');
             }
         });
    } // --- End setupSlider ---


    // --- Fetch Data and Populate Sliders ---
    async function fetchAndDisplayData() {
        const galleryContainer = document.getElementById('gallerySlider');
        const arrivalsContainer = document.getElementById('newArrivalsSlider');
        const defaultErrorMsg = '<p style="color:red; text-align:center; padding: 20px;">Could not load content at this time.</p>';

         // Display loading state
        if(galleryContainer) galleryContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Loading gallery...</p>';
        if(arrivalsContainer) arrivalsContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Loading new arrivals...</p>';

        // Check if URL is set correctly
        if (CONTENT_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_FOR_GALLERY_AND_ARRIVALS_HERE" || !CONTENT_SCRIPT_URL) {
             console.error("CRITICAL: Set the CONTENT_SCRIPT_URL variable in script.js");
             const errorMsg = '<p style="color:red; text-align:center; padding: 20px;">Error: Content URL not configured.</p>';
             if(galleryContainer) galleryContainer.innerHTML = errorMsg;
             if(arrivalsContainer) arrivalsContainer.innerHTML = errorMsg;
             document.querySelectorAll('.slider-btn').forEach(btn => btn.style.display = 'none');
             return;
        }

        try {
            const fetchUrl = `${CONTENT_SCRIPT_URL}?action=getData&v=${Date.now()}`; // Add cache-busting param
            const response = await fetch(fetchUrl, { cache: 'no-store' }); // Try to prevent caching

            if (!response.ok) {
                 let errorData = { message: `HTTP error! Status: ${response.status} ${response.statusText}`};
                 try { errorData = await response.json(); } catch (e) { /* Ignore if body isn't JSON */ }
                 throw new Error(errorData.error || errorData.message || `Failed to fetch content.`);
            }
            const data = await response.json();

            if(data.error){ // Check for error message from GAS itself
                throw new Error(`Data Error: ${data.error}`);
            }

            let galleryHasItems = false;
            let arrivalsHasItems = false;

            // --- Populate Gallery ---
            if (galleryContainer) {
                galleryContainer.innerHTML = ''; // Clear loading/existing
                if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
                    galleryHasItems = true;
                    data.gallery.forEach(item => {
                        // Basic validation of item structure
                        if (!item || !item.ImageURL) return;

                        const slide = document.createElement('div');
                        slide.className = 'gallery-slide animate-on-scroll fade-in'; // Add animation classes
                        if (item.Category) {
                            slide.dataset.category = String(item.Category).toLowerCase().trim();
                        }

                        const img = document.createElement('img');
                        img.src = item.ImageURL;
                        img.alt = item.Title || 'Gallery Saree';
                        img.loading = 'lazy';
                        img.onerror = () => { img.src = PLACEHOLDER_IMAGE_PATH; img.alt = 'Image unavailable'; };

                        const itemInfo = document.createElement('div');
                        itemInfo.className = 'item-info';
                        const title = document.createElement('h3');
                        title.textContent = item.Title || 'Saree';
                        const description = document.createElement('p');
                        description.textContent = item.Description || '';

                        itemInfo.appendChild(title);
                        itemInfo.appendChild(description);
                        slide.appendChild(img);
                        slide.appendChild(itemInfo);
                        galleryContainer.appendChild(slide);
                    });
                }
                 if (!galleryHasItems) {
                     galleryContainer.innerHTML = '<p style="text-align:center; padding: 20px;">No gallery items found.</p>';
                 }
            }

            // --- Populate New Arrivals ---
            if (arrivalsContainer) {
                arrivalsContainer.innerHTML = ''; // Clear loading/existing
                if (data.newArrivals && Array.isArray(data.newArrivals) && data.newArrivals.length > 0) {
                    arrivalsHasItems = true;
                    data.newArrivals.forEach(item => {
                        if (!item || !item.ImageURL) return;

                        const slide = document.createElement('div');
                        slide.className = 'slide animate-on-scroll fade-in'; // Add animation classes

                        const img = document.createElement('img');
                        img.src = item.ImageURL;
                        img.alt = item.Title || 'New Arrival Saree';
                        img.loading = 'lazy';
                        img.onerror = () => { img.src = PLACEHOLDER_IMAGE_PATH; img.alt = 'Image unavailable'; };

                        const title = document.createElement('h3');
                        title.textContent = item.Title || 'New Arrival';
                        const description = document.createElement('p');
                        description.textContent = item.Description || '';

                        slide.appendChild(img);
                        slide.appendChild(title);
                        slide.appendChild(description);
                        arrivalsContainer.appendChild(slide);
                    });
                 }
                 if (!arrivalsHasItems) {
                     arrivalsContainer.innerHTML = '<p style="text-align:center; padding: 20px;">No new arrivals found.</p>';
                 }
            }

             // --- Initialize Sliders AFTER elements are added ---
             if (galleryHasItems) {
                setupSlider('gallerySlider', 'galleryPrevBtn', 'galleryNextBtn');
             } else {
                const galleryPrev = document.getElementById('galleryPrevBtn');
                const galleryNext = document.getElementById('galleryNextBtn');
                if(galleryPrev) galleryPrev.style.display = 'none';
                if(galleryNext) galleryNext.style.display = 'none';
             }

             if (arrivalsHasItems) {
                 setupSlider('newArrivalsSlider', 'newArrivalsPrevBtn', 'newArrivalsNextBtn');
             } else {
                const arrivalsPrev = document.getElementById('newArrivalsPrevBtn');
                const arrivalsNext = document.getElementById('newArrivalsNextBtn');
                if(arrivalsPrev) arrivalsPrev.style.display = 'none';
                if(arrivalsNext) arrivalsNext.style.display = 'none';
             }

             // Re-run observer setup AFTER dynamic content is added
             setTimeout(observeElements, 100); // Small delay for rendering


        } catch (error) {
            console.error('Failed to fetch or display content:', error);
            if(galleryContainer) galleryContainer.innerHTML = defaultErrorMsg;
            if(arrivalsContainer) arrivalsContainer.innerHTML = defaultErrorMsg;
            // Hide slider controls on error
             document.querySelectorAll('.slider-btn').forEach(btn => btn.style.display = 'none');
        }
    } // --- End fetchAndDisplayData ---


    // --- Intersection Observer for Scroll Animations ---
    let observer; // Define observer in a scope accessible by observeElements

    function observeElements() {
        if (observer) { // Disconnect previous observer if exists
            observer.disconnect();
        }

        const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.is-visible):not(.clone)');
        if(animatedElements.length === 0) return; // No elements to observe

        observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observerInstance.unobserve(entry.target); // Stop observing once visible
                }
            });
        }, {
            threshold: 0.1, // Trigger when 10% is visible
            // rootMargin: "0px 0px -5% 0px" // Optional: Trigger slightly before entering viewport
        });

        animatedElements.forEach(el => {
             if (window.getComputedStyle(el).display !== 'none') { // Only observe visible elements
                 observer.observe(el);
             }
        });
    }
    // Initial observation will be triggered after fetchAndDisplayData completes


    // --- Back to Top Button ---
    const backToTopButton = document.getElementById("back-to-top-btn");
    if (backToTopButton) {
        const scrollThreshold = 300;
        let isButtonVisible = window.scrollY > scrollThreshold; // Check initial state

        const toggleVis = () => {
            const shouldBeVisible = window.scrollY > scrollThreshold;
            if (shouldBeVisible !== isButtonVisible) {
                backToTopButton.style.display = shouldBeVisible ? "block" : "none";
                isButtonVisible = shouldBeVisible;
            }
        };

        toggleVis(); // Set initial visibility
        window.addEventListener('scroll', toggleVis, { passive: true });

        backToTopButton.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // --- Google Sheet Contact Form Submission ---
    const form = document.forms['submit-to-google-sheet']; // Ensure form has name="submit-to-google-sheet"
    const formStatus = document.getElementById('form-status');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;

    // Check if the contact script URL is properly set
    const isContactUrlSet = scriptURL_contact && scriptURL_contact !== "YOUR_APPS_SCRIPT_URL_FOR_CONTACT_FORM_HERE";

    if (form && submitButton && formStatus) {
        if (!isContactUrlSet) {
             console.error("CRITICAL: Contact form submission URL (scriptURL_contact) is not set in script.js.");
             formStatus.textContent = 'Cannot submit form: Configuration missing.';
             formStatus.className = 'form-status error';
             formStatus.style.display = 'block';
             submitButton.disabled = true; // Disable submission
        } else {
            form.addEventListener('submit', e => {
                e.preventDefault();
                submitButton.disabled = true;
                formStatus.textContent = 'Sending...';
                formStatus.className = 'form-status'; // Reset classes

                fetch(scriptURL_contact, { method: 'POST', body: new FormData(form)})
                    .then(response => {
                         // Google Apps Script deployed as 'Anyone' often returns an opaque redirect or simple text/html success
                         // We can't always parse JSON reliably, so check response.ok or status codes
                         if (response.ok || (response.status >= 200 && response.status < 400)) {
                             // Assume success if status is OK or a redirect (3xx)
                             return response.text(); // Consume body even if not used directly
                         } else {
                             // Try to get error details if server sent specific error
                             return response.json().then(errData => {
                                 throw new Error(errData.message || errData.error || `Server error ${response.status}`);
                             }).catch(() => { throw new Error(`Server error ${response.status}`); });
                         }
                     })
                    .then(() => { // If fetch resolved without throwing error above
                         formStatus.textContent = 'Message sent successfully!';
                         formStatus.classList.add('success');
                         form.reset();
                         submitButton.disabled = false;
                         setTimeout(() => { formStatus.textContent = ''; formStatus.className = 'form-status'; }, 5000);
                    })
                    .catch(error => {
                        console.error('Contact Form Error!', error);
                        formStatus.textContent = `Error: ${error.message || 'Could not send message.'}`;
                        formStatus.classList.add('error');
                        submitButton.disabled = false;
                         setTimeout(() => { formStatus.textContent = ''; formStatus.className = 'form-status'; }, 7000); // Show error longer
                    });
            });
        }
    } else {
        if (!form) console.warn("Contact form with name='submit-to-google-sheet' not found.");
        // Optionally display a message if the form elements are missing
    }
    // --- End Google Sheet Contact Form Submission ---


    // --- Update Footer Year ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        try {
            const now = new Date();
            // Get year based on local time, should be sufficient unless specific timezone logic is critical
            currentYearSpan.textContent = now.getFullYear().toString();
             // Alternative using Intl for specific timezone (uncomment if needed)
             // const options = { timeZone: 'Asia/Kolkata', year: 'numeric' };
             // const formatter = new Intl.DateTimeFormat('en-IN', options); // 'en-IN' locale for India
             // currentYearSpan.textContent = formatter.format(now);
        } catch (e) {
            console.warn("Could not update footer year automatically.", e);
            // Keep the default year from HTML as fallback
        }
    }

    // --- Initial Actions on Load ---
    fetchAndDisplayData(); // Fetch data, populate sliders, THEN init sliders & observer inside this func.

}); // End DOMContentLoaded
