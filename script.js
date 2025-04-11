// !!! IMPORTANT: Replace with your DEPLOYED Google Apps Script Web App URL !!!
// This URL is used to fetch Gallery and New Arrivals data.
const CONTENT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynJVLQR_1H2VWYCIM5gBIpgNppCqq9QVXJTYLNq3QM9rY_NAwOTUZBJVexMNhJW9NX/exec";

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
         if (!modal || !modalImg || !captionText) return;

         modal.style.display = "block";
         document.body.style.overflow = 'hidden'; // Prevent background scrolling
         modalImg.src = imgElement.src;

         // Try to get caption from parent slide's h3 tag
         let itemCaption = imgElement.alt; // Default to alt text
         const parentSlide = imgElement.closest('.gallery-slide, .slide'); // Works for both sliders
         if (parentSlide) {
             const h3 = parentSlide.querySelector('h3');
             if (h3) itemCaption = h3.textContent;
         }
         captionText.innerHTML = itemCaption;
    }

    function setupModalListeners() {
        if (!modal || !closeModalBtn) return;

         // Use event delegation on slider containers
        if (gallerySliderContainer) {
            gallerySliderContainer.addEventListener('click', (event) => {
                // Check if the clicked element is an IMG within a slide (and not a clone)
                if (event.target.tagName === 'IMG' && event.target.closest('.gallery-slide:not(.clone)')) {
                     openModal(event.target);
                }
            });
        }
         if (newArrivalsSliderContainer) {
             newArrivalsSliderContainer.addEventListener('click', (event) => {
                 // Check if the clicked element is an IMG within a slide (and not a clone)
                 if (event.target.tagName === 'IMG' && event.target.closest('.slide:not(.clone)')) {
                     openModal(event.target);
                 }
             });
         }


        // Function to close the modal
        const closeModalAction = () => {
            if(modal) modal.style.display = "none";
            document.body.style.overflow = ''; // Restore background scrolling
        }

        // Event listeners for closing the modal
        if(closeModalBtn) closeModalBtn.onclick = closeModalAction;
        if(modal) modal.onclick = function(event) { if (event.target === modal) { closeModalAction(); } }
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal && modal.style.display === "block") { closeModalAction(); } });
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
            return;
        }

        // Query slides *after* they might have been added dynamically
        const originalSlides = Array.from(slider.querySelectorAll('.slide, .gallery-slide')); // Convert NodeList to Array

        if (originalSlides.length <= 1) { // No need for looping or complex setup if 0 or 1 slide
             if(originalSlides.length === 1) {
                 prevBtn.style.display = 'none'; // Hide buttons if only one slide
                 nextBtn.style.display = 'none';
             } else { // 0 slides
                 prevBtn.style.display = 'none';
                 nextBtn.style.display = 'none';
                 sliderWrapper.style.display = 'none'; // Hide wrapper if no slides
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
        // Clear existing clones first in case of re-initialization (though ideally shouldn't happen often)
        slider.querySelectorAll('.clone').forEach(clone => clone.remove());

        // 1. Clone first and last slides
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
                 // Use getBoundingClientRect for more reliable width including transforms/scaling if needed
                 // For simple translate, offsetWidth + margins should be okay.
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
                  if (slider.style.transition === 'none' || !slider.style.transition) {
                       slider.style.transition = 'transform 0.5s ease-in-out'; // Set/Re-enable
                  }
            }

            slider.style.transform = `translateX(${offset}px)`;

            // If instant jump, force reflow and restore transition setting after a tiny delay
            if (instant) {
                 slider.offsetHeight; // Force reflow
                 // Using timeout helps ensure the transform applies instantly before transition is restored
                  setTimeout(() => {
                      if (slider.style.transition === 'none') {
                           slider.style.transition = 'transform 0.5s ease-in-out';
                      }
                  }, 0);
            }
        }

        function handleTransitionEnd() {
             // This check helps prevent jumps if the transition wasn't initiated by our code
             // (e.g., style change during devtools inspection)
             // However, it might interfere if other scripts trigger transitions, be cautious.
             // if (!isTransitioning && slider.style.transition !== 'none') {
             //     console.log(`${sliderId}: Transition end skipped (not initiated by button/swipe)`);
             //     return;
             // }

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
        slider.removeEventListener('transitionend', handleTransitionEnd); // Remove previous listener if any
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

         // Add animation class to original slides (ensure they are picked up by observer)
         originalSlides.forEach(slide => {
             if (!slide.classList.contains('animate-on-scroll')) {
                 slide.classList.add('animate-on-scroll', 'fade-in');
             }
         });
    } // --- End setupSlider ---


    // --- NEW: Fetch Data and Populate Sliders ---
    async function fetchAndDisplayData() {
        const galleryContainer = document.getElementById('gallerySlider');
        const arrivalsContainer = document.getElementById('newArrivalsSlider');

         // Display loading state (optional)
        if(galleryContainer) galleryContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Loading gallery...</p>';
        if(arrivalsContainer) arrivalsContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Loading new arrivals...</p>';


        // Check if URL is set
        if (CONTENT_SCRIPT_URL === "YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE" || !CONTENT_SCRIPT_URL) {
             console.error("CRITICAL: Set the CONTENT_SCRIPT_URL variable in script.js");
             const errorMsg = '<p style="color:red; text-align:center; padding: 20px;">Error: Content URL not configured.</p>';
             if(galleryContainer) galleryContainer.innerHTML = errorMsg;
             if(arrivalsContainer) arrivalsContainer.innerHTML = errorMsg;
             // Hide slider controls if URL is missing
             document.querySelectorAll('.slider-btn').forEach(btn => btn.style.display = 'none');
             return; // Stop if URL is missing
        }

        try {
            // Append timestamp to prevent caching if needed, but GAS usually handles this.
            // const fetchUrl = `${CONTENT_SCRIPT_URL}?action=getData&t=${new Date().getTime()}`;
            const fetchUrl = `${CONTENT_SCRIPT_URL}?action=getData`;
            const response = await fetch(fetchUrl);
            if (!response.ok) {
                 // Try to get error message from response body
                 let errorData;
                 try { errorData = await response.json(); } catch (e) { /* Ignore if not JSON */ }
                 throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}. ${errorData?.error || ''}`);
            }
            const data = await response.json();

            if(data.error){ // Check for error message from GAS itself
                throw new Error(`GAS Error: ${data.error}`);
            }

            let galleryHasItems = false;
            let arrivalsHasItems = false;

            // --- Populate Gallery ---
            if (galleryContainer) {
                galleryContainer.innerHTML = ''; // Clear loading/existing
                if (data.gallery && data.gallery.length > 0) {
                    galleryHasItems = true;
                    data.gallery.forEach(item => {
                        const slide = document.createElement('div');
                        slide.className = 'gallery-slide'; // Base class
                        // Add animation class here so observer can pick it up later
                        slide.classList.add('animate-on-scroll', 'fade-in');
                        if (item.Category) {
                            slide.dataset.category = item.Category.toLowerCase().trim();
                        }

                        const img = document.createElement('img');
                        img.src = item.ImageURL || 'images/placeholder.png'; // Add a fallback image path
                        img.alt = item.Title || 'Gallery Saree'; // Use Title for Alt text
                        img.loading = 'lazy';
                        img.onerror = () => { // Handle image loading errors
                            console.warn(`Image failed to load: ${img.src}. Replacing with placeholder.`);
                            img.src = 'images/placeholder.png'; // Path to your placeholder image
                            img.alt = 'Image unavailable';
                        };


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
                } else {
                     galleryContainer.innerHTML = '<p style="text-align:center; padding: 20px;">No gallery items found.</p>';
                }
            }

            // --- Populate New Arrivals ---
            if (arrivalsContainer) {
                arrivalsContainer.innerHTML = ''; // Clear loading/existing
                if (data.newArrivals && data.newArrivals.length > 0) {
                    arrivalsHasItems = true;
                    data.newArrivals.forEach(item => {
                        const slide = document.createElement('div');
                        slide.className = 'slide'; // Base class
                        // Add animation class here
                        slide.classList.add('animate-on-scroll', 'fade-in');

                        const img = document.createElement('img');
                        img.src = item.ImageURL || 'images/placeholder.png'; // Add a fallback image path
                        img.alt = item.Title || 'New Arrival Saree'; // Use Title for Alt text
                        img.loading = 'lazy';
                         img.onerror = () => { // Handle image loading errors
                            console.warn(`Image failed to load: ${img.src}. Replacing with placeholder.`);
                            img.src = 'images/placeholder.png'; // Path to your placeholder image
                            img.alt = 'Image unavailable';
                        };

                        const title = document.createElement('h3');
                        title.textContent = item.Title || 'New Arrival';

                        const description = document.createElement('p');
                        description.textContent = item.Description || '';

                        slide.appendChild(img);
                        slide.appendChild(title);
                        slide.appendChild(description);
                        arrivalsContainer.appendChild(slide);
                    });
                 } else {
                     arrivalsContainer.innerHTML = '<p style="text-align:center; padding: 20px;">No new arrivals found.</p>';
                 }
            }

             // --- IMPORTANT: Initialize Sliders AFTER elements are added ---
             // Call setupSlider here if data was successfully loaded for them
             if (galleryHasItems) {
                setupSlider('gallerySlider', 'galleryPrevBtn', 'galleryNextBtn');
             } else {
                // Hide slider controls if no slides
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

             // Re-run observer setup AFTER dynamic content is added AND layout is stable
             // Use a small timeout to ensure browser has rendered the new elements
             setTimeout(observeElements, 100);


        } catch (error) {
            console.error('Failed to fetch or display content:', error);
            const errorMsg = `<p style="color:red; text-align:center; padding: 20px;">Error loading content: ${error.message}</p>`;
            if(galleryContainer) galleryContainer.innerHTML = errorMsg;
            if(arrivalsContainer) arrivalsContainer.innerHTML = errorMsg;
            // Hide slider controls on error
             document.querySelectorAll('.slider-btn').forEach(btn => btn.style.display = 'none');
        }
    } // --- End fetchAndDisplayData ---


    // --- Intersection Observer for Scroll Animations ---
    let observer; // Define observer in a scope accessible by observeElements

    function observeElements() {
        // Disconnect previous observer if exists, to avoid observing old elements
        if (observer) {
            observer.disconnect();
        }

        // Target elements with class 'animate-on-scroll' that are NOT already visible
        // Important: Exclude clones from being observed for animation
        const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.is-visible):not(.clone)');

        // Re-create observer instance
        observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observerInstance.unobserve(entry.target); // Stop observing once visible
                }
            });
        }, {
            threshold: 0.1, // Trigger when 10% of the element is visible
            // Optional: Adjust rootMargin if elements are inside scrollable containers
            // rootMargin: "0px 0px -50px 0px" // Example: Trigger slightly before fully in view
        });


        animatedElements.forEach(el => {
             // Only observe elements that are currently displayed
             if (window.getComputedStyle(el).display !== 'none') {
                 observer.observe(el);
             }
        });
    }
    // Initial observeElements call will happen after fetchAndDisplayData completes


    // --- Back to Top Button ---
    const backToTopButton = document.getElementById("back-to-top-btn");
    if (backToTopButton) {
        const scrollThreshold = 300; // Pixels to scroll before showing button
        let isButtonVisible = false;

        const toggleVis = () => {
            const shouldBeVisible = window.scrollY > scrollThreshold;
            if (shouldBeVisible !== isButtonVisible) {
                backToTopButton.style.display = shouldBeVisible ? "block" : "none";
                isButtonVisible = shouldBeVisible;
            }
        };

        // Initial check in case page loads already scrolled
        toggleVis();

        window.addEventListener('scroll', toggleVis, { passive: true });

        backToTopButton.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent potential hash jump if it were an anchor
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // --- Google Sheet Contact Form Submission ---
    // Ensure this URL is specifically for the CONTACT form submission script, if different from content script
    const scriptURL_contact = 'https://script.google.com/macros/s/AKfycbx9dCFy_hZu2wFZu60NZgQQ_rT1ZcLXqQ8ahbHRtQc31AJ2khUMSm4vCawWBpvubjLEGA/exec'; // *** VERIFY THIS URL ***
    const form = document.forms['submit-to-google-sheet']; // Make sure your form has name="submit-to-google-sheet"
    const formStatus = document.getElementById('form-status');
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;

    if (form && submitButton && formStatus) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            submitButton.disabled = true;
            formStatus.textContent = 'Sending...';
            formStatus.className = 'form-status'; // Reset classes

            fetch(scriptURL_contact, { method: 'POST', body: new FormData(form)})
                .then(response => {
                     // Check if the response status is indicative of success, even if opaque or non-JSON
                     // Google Apps Script often returns 302 redirect on success when called via fetch form submission
                     // Or it might return 200 with success message
                     if (response.ok || (response.status >= 200 && response.status < 300) || response.type === 'opaque' || response.status === 302) {
                         // Assuming success if response is ok or redirect
                         return { result: 'success' }; // Simulate success structure
                     } else {
                         // Try to parse error if possible
                         return response.json().then(errData => {
                             throw new Error(errData.error || `Server responded with status ${response.status}`);
                         }).catch(() => { throw new Error(`Server responded with status ${response.status}`); });
                     }
                 })
                .then(data => {
                     // Check our simulated or actual success indicator
                     if (data.result === 'success') {
                         formStatus.textContent = 'Message sent successfully!';
                         formStatus.classList.add('success');
                         form.reset();
                         submitButton.disabled = false;
                         setTimeout(() => { formStatus.textContent = ''; formStatus.className = 'form-status'; }, 5000);
                     } else {
                         // This case might not be reached if errors are thrown above
                         throw new Error(data.error || 'Submission failed with non-success result.');
                     }
                })
                .catch(error => {
                    console.error('Form Error!', error);
                    formStatus.textContent = 'Error sending message. Please try again.';
                    formStatus.classList.add('error');
                    submitButton.disabled = false;
                     setTimeout(() => { formStatus.textContent = ''; formStatus.className = 'form-status'; }, 5000);
                });
        });
    } else {
        if (!form) console.warn("Contact form with name='submit-to-google-sheet' not found.");
        if (form && !submitButton) console.warn("Submit button not found within the contact form.");
        if (form && !formStatus) console.warn("Element with id='form-status' not found for contact form feedback.");
    }
    // --- End Google Sheet Contact Form Submission ---


    // --- Update Footer Year ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        try {
            // Use Intl for timezone-aware year formatting
            const now = new Date();
            // Use 'en-IN' locale for India English format, 'Asia/Kolkata' timezone
            const options = { timeZone: 'Asia/Kolkata', year: 'numeric' };
            const formatter = new Intl.DateTimeFormat('en-IN', options);
            currentYearSpan.textContent = formatter.format(now);
        } catch (e) {
            // Fallback for browsers that might not support Intl or timezone
            console.warn("Could not get timezone-specific year, using local year.", e);
            currentYearSpan.textContent = new Date().getFullYear().toString();
        }
    }

    // --- Initial Actions on Load ---
    fetchAndDisplayData(); // Fetch data, populate sliders, THEN init sliders & observer inside this func.

}); // End DOMContentLoaded
