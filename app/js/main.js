/* ===================================================================
 * Gestione 1.0.0 - Main JS
 *
 * ------------------------------------------------------------------- */

(function(html) {

    'use strict';

    const cfg = {
        
        // MailChimp URL
        mailChimpURL : 'https://facebook.us1.list-manage.com/subscribe/post?u=1abf75f6981256963a47d197a&amp;id=37c6d8f4d6' 

    };



   /* reset scroll position on refresh
    * -------------------------------------------------- */
    const ssResetScrollPosition = function() {

        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        const resetToHero = function() {
            if (window.location.hash) {
                history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            window.scrollTo(0, 0);
        };

        resetToHero();
        window.addEventListener('pageshow', function() {
            resetToHero();
            setTimeout(resetToHero, 50);
            setTimeout(resetToHero, 250);
        });
        window.addEventListener('load', function() {
            resetToHero();
            setTimeout(resetToHero, 50);
            setTimeout(resetToHero, 250);
        });

    };

   /* preloader
    * -------------------------------------------------- */
    const ssPreloader = function() {

        const siteBody = document.querySelector('body');
        const preloader = document.querySelector('#preloader');
        if (!preloader) return;

        const showSite = function() {
            siteBody.classList.add('ss-show');
            preloader.style.display = 'none';
        };

        html.classList.add('ss-preload');
        
        const onLoaded = function() {
            html.classList.remove('ss-preload');
            html.classList.add('ss-loaded');

            preloader.addEventListener('transitionend', function afterTransition(e) {
                if (e.target.matches('#preloader'))  {
                    showSite();
                    preloader.removeEventListener(e.type, afterTransition);
                }
            });

            setTimeout(showSite, 900);
        };

        if (document.readyState === 'complete') {
            onLoaded();
        } else {
            window.addEventListener('load', onLoaded);
        }

        window.addEventListener('beforeunload' , function() {
            siteBody.classList.remove('ss-show');
        });

    }; // end ssPreloader


   /* move header
    * -------------------------------------------------- */
    const ssMoveHeader = function () {

        const hdr = document.querySelector('.s-header');
        const hero = document.querySelector('#intro');
        let triggerHeight;

        if (!(hdr && hero)) return;

        setTimeout(function(){
            triggerHeight = hero.offsetHeight - 170;
        }, 300);
        window.addEventListener('scroll', function () {

            let loc = window.scrollY;
            if (loc > triggerHeight) {
                hdr.classList.add('sticky');
            } else {
                hdr.classList.remove('sticky');
            }

            if (loc > triggerHeight + 20) {
                hdr.classList.add('offset');
            } else {
                hdr.classList.remove('offset');
            }

            if (loc > triggerHeight + 150) {
                hdr.classList.add('scrolling');
            } else {
                hdr.classList.remove('scrolling');
            }

        });

    }; // end ssMoveHeader


   /* mobile menu
    * ---------------------------------------------------- */ 
    const ssMobileMenu = function() {

        const toggleButton = document.querySelector('.s-header__menu-toggle');
        const mainNavWrap = document.querySelector('.s-header__nav');
        const siteBody = document.querySelector('body');

        if (!(toggleButton && mainNavWrap)) return;

        const closeMenu = function() {
            toggleButton.classList.remove('is-clicked');
            siteBody.classList.remove('menu-is-open');
        };

        toggleButton.addEventListener('click', function(event) {
            event.preventDefault();
            const isOpen = siteBody.classList.contains('menu-is-open');
            if (isOpen) {
                closeMenu();
            } else {
                toggleButton.classList.add('is-clicked');
                siteBody.classList.add('menu-is-open');
            }
        });

        mainNavWrap.querySelectorAll('.s-header__nav a').forEach(function(link) {

            link.addEventListener("click", function(event) {

                const href = link.getAttribute('href');
                const target = href && href.charAt(0) === '#' ? document.querySelector(href) : null;

                if (target) {
                    event.preventDefault();
                    closeMenu();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.replaceState(null, '', href);
                    return;
                }

                // at 900px and below
                if (window.matchMedia('(max-width: 900px)').matches) {
                    closeMenu();
                }
            });
        });

        window.addEventListener('scroll', function() {
            if (
                window.matchMedia('(max-width: 900px)').matches &&
                siteBody.classList.contains('menu-is-open')
            ) {
                closeMenu();
            }
        }, { passive: true });

        window.addEventListener('resize', function() {

            // above 900px
            if (window.matchMedia('(min-width: 901px)').matches) {
                closeMenu();
            }
        });

    }; // end ssMobileMenu


    /* highlight active menu link on pagescroll
    * ------------------------------------------------------ */
    const ssScrollSpy = function() {

        const sections = document.querySelectorAll('.target-section');

        // Add an event listener listening for scroll
        window.addEventListener('scroll', navHighlight);

        function navHighlight() {
        
            // Get current scroll position
            let scrollY = window.pageYOffset;
        
            // Loop through sections to get height(including padding and border), 
            // top and ID values for each
            sections.forEach(function(current) {
                const sectionHeight = current.offsetHeight;
                const sectionTop = current.offsetTop - 50;
                const sectionId = current.getAttribute('id');
            
               /* If our current scroll position enters the space where current section 
                * on screen is, add .current class to parent element(li) of the thecorresponding 
                * navigation link, else remove it. To know which link is active, we use 
                * sectionId variable we are getting while looping through sections as 
                * an selector
                */
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    document.querySelector('.s-header__nav a[href*=' + sectionId + ']').parentNode.classList.add('current');
                } else {
                    document.querySelector('.s-header__nav a[href*=' + sectionId + ']').parentNode.classList.remove('current');
                }
            });
        }

    }; // end ssScrollSpy


   /* swiper
    * ------------------------------------------------------ */ 
    const ssSwiper = function() {

        const infoSection = document.querySelector('.s-about__info');
        const infoSlider = document.querySelector('.s-about__info-slider');
        const infoTrack = document.querySelector('.s-about__info-slider .swiper-wrapper');

        const updateInfoScroll = function() {
            if (!(infoSection && infoSlider && infoTrack)) return;

            if (window.innerWidth <= 700) {
                infoTrack.style.transform = '';
                return;
            }

            const rect = infoSection.getBoundingClientRect();
            const stickyStart = window.innerHeight * 0.18;
            const scrollRange = infoSection.offsetHeight - window.innerHeight;
            const progress = Math.min(Math.max((stickyStart - rect.top) / scrollRange, 0), 1);
            const maxShift = Math.max(infoTrack.scrollWidth - infoSlider.clientWidth, 0);
            const shift = progress * maxShift * -1;

            infoTrack.style.transform = `translate3d(${shift}px, 0, 0)`;
        };

        updateInfoScroll();
        window.addEventListener('scroll', updateInfoScroll, { passive: true });
        window.addEventListener('resize', updateInfoScroll);

        const testimonialsSwiper = new Swiper('.s-testimonials__slider', {

            slidesPerView: 1,
            effect: 'slide',
            spaceBetween: 160,
            centeredSlides: true,
            speed: 1000,
            pagination: {
                el: '.s-testimonials__slider .swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.testimonial-slider__next',
                prevEl: '.testimonial-slider__prev',
            }
        });

    }; // end ssSwiper


   /* how-to screen sync
    * ------------------------------------------------------ */
    const ssHowtoScreens = function() {

        const steps = document.querySelectorAll('.s-about__howto-process-step');
        const screens = document.querySelectorAll('.s-about__howto-screens img');

        if (!(steps.length && screens.length)) return;

        const setActiveScreen = function(index) {
            steps.forEach(function(step, i) {
                step.classList.toggle('is-active', i === index);
            });

            screens.forEach(function(screen, i) {
                screen.classList.toggle('is-active', i === index);
            });
        };

        const updateActiveScreen = function() {
            setActiveScreen(0);
        };

        steps.forEach(function(step, index) {
            step.addEventListener('click', function() {
                const screenIndex = parseInt(step.dataset.screen || index, 10);
                setActiveScreen(screenIndex);
            });
        });

        updateActiveScreen();

    }; // end ssHowtoScreens


   /* feature cards
    * ------------------------------------------------------ */
    const ssFeatureCards = function() {

        const featureItems = document.querySelectorAll('.s-about__feature-item');

        if (!featureItems.length) return;

        const setActiveFeature = function(activeItem) {
            featureItems.forEach(function(item) {
                item.classList.toggle('is-active', item === activeItem);
            });
        };

        featureItems.forEach(function(item) {
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');

            item.addEventListener('click', function() {
                setActiveFeature(item);
            });

            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveFeature(item);
                }
            });
        });

   }; // end ssFeatureCards


   /* faq accordion
    * ------------------------------------------------------ */
    const ssFaqAccordion = function() {

        const faqItems = document.querySelectorAll('.faq-item');

        if (!faqItems.length) return;

        faqItems.forEach(function(item) {
            const question = item.querySelector('.faq-item__question');

            if (!question) return;

            question.addEventListener('click', function() {
                const isOpen = item.classList.contains('is-open');

                faqItems.forEach(function(otherItem) {
                    const otherQuestion = otherItem.querySelector('.faq-item__question');

                    otherItem.classList.remove('is-open');
                    if (otherQuestion) otherQuestion.setAttribute('aria-expanded', 'false');
                });

                if (!isOpen) {
                    item.classList.add('is-open');
                    question.setAttribute('aria-expanded', 'true');
                }
            });
        });

    }; // end ssFaqAccordion


   /* mailchimp form
    * ---------------------------------------------------- */ 
    const ssMailChimpForm = function() {

        const mcForm = document.querySelector('#mc-form');

        if (!mcForm) return;

        // Add novalidate attribute
        mcForm.setAttribute('novalidate', true);

        // Field validation
        function hasError(field) {

            // Don't validate submits, buttons, file and reset inputs, and disabled fields
            if (field.disabled || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') return;

            // Get validity
            let validity = field.validity;

            // If valid, return null
            if (validity.valid) return;

            // If field is required and empty
            if (validity.valueMissing) return 'Please enter an email address.';

            // If not the right type
            if (validity.typeMismatch) {
                if (field.type === 'email') return 'Please enter a valid email address.';
            }

            // If pattern doesn't match
            if (validity.patternMismatch) {

                // If pattern info is included, return custom error
                if (field.hasAttribute('title')) return field.getAttribute('title');

                // Otherwise, generic error
                return 'Please match the requested format.';
            }

            // If all else fails, return a generic catchall error
            return 'The value you entered for this field is invalid.';

        };

        // Show error message
        function showError(field, error) {

            // Get field id or name
            let id = field.id || field.name;
            if (!id) return;

            let errorMessage = field.form.querySelector('.mc-status');

            // Update error message
            errorMessage.classList.remove('success-message');
            errorMessage.classList.add('error-message');
            errorMessage.innerHTML = error;

        };

        // Display form status (callback function for JSONP)
        window.displayMailChimpStatus = function (data) {

            // Make sure the data is in the right format and that there's a status container
            if (!data.result || !data.msg || !mcStatus ) return;

            // Update our status message
            mcStatus.innerHTML = data.msg;

            // If error, add error class
            if (data.result === 'error') {
                mcStatus.classList.remove('success-message');
                mcStatus.classList.add('error-message');
                return;
            }

            // Otherwise, add success class
            mcStatus.classList.remove('error-message');
            mcStatus.classList.add('success-message');
        };

        // Submit the form 
        function submitMailChimpForm(form) {

            let url = cfg.mailChimpURL;
            let emailField = form.querySelector('#mce-EMAIL');
            let serialize = '&' + encodeURIComponent(emailField.name) + '=' + encodeURIComponent(emailField.value);

            if (url == '') return;

            url = url.replace('/post?u=', '/post-json?u=');
            url += serialize + '&c=displayMailChimpStatus';

            // Create script with url and callback (if specified)
            var ref = window.document.getElementsByTagName( 'script' )[ 0 ];
            var script = window.document.createElement( 'script' );
            script.src = url;

            // Create global variable for the status container
            window.mcStatus = form.querySelector('.mc-status');
            window.mcStatus.classList.remove('error-message', 'success-message')
            window.mcStatus.innerText = 'Submitting...';

            // Insert script tag into the DOM
            ref.parentNode.insertBefore( script, ref );

            // After the script is loaded (and executed), remove it
            script.onload = function () {
                this.remove();
            };

        };

        // Check email field on submit
        mcForm.addEventListener('submit', function (event) {

            event.preventDefault();

            let emailField = event.target.querySelector('#mce-EMAIL');
            let error = hasError(emailField);

            if (error) {
                showError(emailField, error);
                emailField.focus();
                return;
            }

            submitMailChimpForm(this);

        }, false);

    }; // end ssMailChimpForm


   /* video Lightbox
    * ------------------------------------------------------ */
    const ssVideoLightbox = function() {

        const videoLink = document.querySelector('.s-intro__content-video-btn');
        if (!videoLink) return;

        videoLink.addEventListener('click', function(event) {

            const vLink = this.getAttribute('href');
            const iframe = "<iframe src='" + vLink + "' frameborder='0'></iframe>";

            event.preventDefault();

            const instance = basicLightbox.create(iframe);
            instance.show()

        });

    }; // end ssVideoLightbox


   /* alert boxes
    * ------------------------------------------------------ */
    const ssAlertBoxes = function() {

        const boxes = document.querySelectorAll('.alert-box');
  
        boxes.forEach(function(box){

            box.addEventListener('click', function(event) {
                if (event.target.matches('.alert-box__close')) {
                    event.stopPropagation();
                    event.target.parentElement.classList.add('hideit');

                    setTimeout(function(){
                        box.style.display = 'none';
                    }, 500)
                }
            });
        })

    }; // end ssAlertBoxes


    /* Back to Top
    * ------------------------------------------------------ */
    const ssBackToTop = function() {

        const pxShow = 900;
        const goTopButton = document.querySelector(".ss-go-top");

        if (!goTopButton) return;

        // Show or hide the button
        if (window.scrollY >= pxShow) goTopButton.classList.add("link-is-visible");

        window.addEventListener('scroll', function() {
            if (window.scrollY >= pxShow) {
                if(!goTopButton.classList.contains('link-is-visible')) goTopButton.classList.add("link-is-visible")
            } else {
                goTopButton.classList.remove("link-is-visible")
            }
        });

    }; // end ssBackToTop


   /* smoothscroll
    * ------------------------------------------------------ */
    const ssMoveTo = function(){

        const easeFunctions = {
            easeInQuad: function (t, b, c, d) {
                t /= d;
                return c * t * t + b;
            },
            easeOutQuad: function (t, b, c, d) {
                t /= d;
                return -c * t* (t - 2) + b;
            },
            easeInOutQuad: function (t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t + b;
                t--;
                return -c/2 * (t*(t-2) - 1) + b;
            },
            easeInOutCubic: function (t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t*t + b;
                t -= 2;
                return c/2*(t*t*t + 2) + b;
            }
        }

        const triggers = document.querySelectorAll('.smoothscroll');
        
        const moveTo = new MoveTo({
            tolerance: 0,
            duration: 1200,
            easing: 'easeInOutCubic',
            container: window
        }, easeFunctions);

        triggers.forEach(function(trigger) {
            moveTo.registerTrigger(trigger);
        });

    }; // end ssMoveTo


   /* Initialize
    * ------------------------------------------------------ */
    (function ssInit() {

        ssResetScrollPosition();
        ssPreloader();
        ssMoveHeader();
        ssMobileMenu();
        ssScrollSpy();
        ssSwiper();
        ssHowtoScreens();
        ssFeatureCards();
        ssFaqAccordion();
        ssMailChimpForm();
        ssVideoLightbox();
        ssAlertBoxes();
        ssBackToTop();
        ssMoveTo();

    })();

})(document.documentElement);
