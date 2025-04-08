document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('is-active');
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                 if (navLinks.classList.contains('active')) {
                    menuToggle.classList.remove('is-active');
                    navLinks.classList.remove('active');
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
            }
        });
    }


    // --- Saree Gallery Filtering ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterButtons.length > 0 && galleryItems.length > 0) {
        // Initially add animation class to all items for Intersection Observer
        galleryItems.forEach(item => item.classList.add('animate-on-scroll', 'fade-in'));

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');

                // Update active button state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Show/Hide gallery items
                galleryItems.forEach(item => {
                    const itemCategory = item.getAttribute('data-category');
                    // Temporarily remove animation visibility classes to re-trigger if needed
                    item.classList.remove('is-visible');

                    if (filter === 'all' || filter === itemCategory) {
                        item.style.display = 'flex'; // Use flex as defined in CSS for gallery items
                        // Re-add animation classes for observer
                        item.classList.add('animate-on-scroll', 'fade-in');
                    } else {
                        item.style.display = 'none';
                        item.classList.remove('animate-on-scroll', 'fade-in'); // Remove if hidden
                    }
                });

                // Re-trigger Intersection Observer for newly displayed items
                observeElements();
            });
        });
    }


    // --- Image Modal ---
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");
    // Query images in both gallery and slider
    const galleryAndNewImages = document.querySelectorAll('.gallery-item img, .slide img');
    const closeModalBtn = document.querySelector(".close-modal");

    if (modal && modalImg && captionText && galleryAndNewImages.length > 0 && closeModalBtn) {
        galleryAndNewImages.forEach(img => {
            img.addEventListener('click', function() {
                modal.style.display = "block";
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
                modalImg.src = this.src;

                // Try to get caption from sibling h3 or p tag within the parent container
                let itemCaption = this.alt; // Default to alt text
                const parentItem = this.closest('.gallery-item') || this.closest('.slide'); // Check both containers
                if (parentItem) {
                    const h3 = parentItem.querySelector('h3');
                    if(h3) itemCaption = h3.textContent;
                    // Optionally add description:
                    // const p = parentItem.querySelector('p');
                    // if(h3 && p) itemCaption += ` - ${p.textContent}`;
                }
                captionText.innerHTML = itemCaption;
            });
        });

        // Function to close the modal
        const closeModalAction = () => {
            modal.style.display = "none";
            document.body.style.overflow = ''; // Restore background scrolling
        }

        // Close modal via the close button
        closeModalBtn.onclick = closeModalAction;

        // Close modal if clicked on the background overlay
        modal.onclick = function(event) {
            if (event.target === modal) {
                closeModalAction();
            }
        }
        // Close modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === "block") {
                closeModalAction();
            }
        });
    }


    // --- Newly Arrived Slider ---
    const slider = document.getElementById('newArrivalsSlider');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const sliderWrapper = document.querySelector('.slider-wrapper'); // Need the wrapper for width calculation

    if (slider && prevBtn && nextBtn && sliderWrapper) {
        const slides = slider.querySelectorAll('.slide');
        let currentIndex = 0;
        let slideWidth = 0;
        let itemsVisible = 1; // Default to 1

        function calculateSlideWidth() {
            if (slides.length > 0) {
                 // Ensure styles are computed correctly
                 const style = window.getComputedStyle(slides[0]);
                 const marginRight = parseInt(style.marginRight, 10) || 0;
                 const marginLeft = parseInt(style.marginLeft, 10) || 0;
                 // Use offsetWidth which includes padding and border
                 slideWidth = slides[0].offsetWidth + marginLeft + marginRight;
                 itemsVisible = Math.max(1, Math.floor(sliderWrapper.offsetWidth / slideWidth));
            } else {
                slideWidth = 0;
                itemsVisible = 1;
            }
        }

        function updateSliderPosition() {
            calculateSlideWidth(); // Recalculate on update in case of resize or dynamic changes
            if (slideWidth <= 0) return; // Avoid division by zero or incorrect calculations

            const maxIndex = Math.max(0, slides.length - itemsVisible); // Ensure maxIndex is not negative
            currentIndex = Math.max(0, Math.min(currentIndex, maxIndex)); // Clamp index within valid bounds [0, maxIndex]

            const offset = -currentIndex * slideWidth;
            slider.style.transform = `translateX(${offset}px)`;

            // Disable/enable buttons at ends
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= maxIndex; // Use >= because index is 0-based
        }

        nextBtn.addEventListener('click', () => {
            const maxIndex = Math.max(0, slides.length - itemsVisible);
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateSliderPosition();
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateSliderPosition();
            }
        });

        // Debounce function to limit resize event frequency
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Initial setup & recalculate on resize using debounce
        const debouncedUpdate = debounce(updateSliderPosition, 150); // Debounce resize event
        window.addEventListener('resize', debouncedUpdate);

        // Add animation class to slides for observer (if not already added via gallery logic)
        slides.forEach(slide => {
            if (!slide.classList.contains('animate-on-scroll')) {
                 slide.classList.add('animate-on-scroll', 'fade-in');
            }
        });

        // Run initial calculation after slight delay to ensure layout is stable
        setTimeout(updateSliderPosition, 50);
    }


    // --- Intersection Observer for Scroll Animations ---
    let observer; // Define observer in a scope accessible by observeElements

    function observeElements() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll:not(.is-visible)'); // Select only elements not yet visible

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

        // Observe currently non-visible elements that are displayed
        animatedElements.forEach(el => {
            if (window.getComputedStyle(el).display !== 'none') {
                observer.observe(el);
            }
        });
    }

    // Call observeElements initially and potentially after content changes (like filtering)
    observeElements();


    // --- Back to Top Button ---
    const backToTopButton = document.getElementById("back-to-top-btn");

    if (backToTopButton) {
        const scrollThreshold = 300; // Pixels to scroll before showing button

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > scrollThreshold) { // More robust check
                backToTopButton.style.display = "block";
            } else {
                backToTopButton.style.display = "none";
            }
        });

        backToTopButton.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent default anchor behavior if it were an anchor
            window.scrollTo({
                top: 0,
                behavior: 'smooth' // Native smooth scrolling
            });
        });
    }


    // --- Update Footer Year ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        try {
            // Get the current year based on IST timezone (Asia/Kolkata)
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
