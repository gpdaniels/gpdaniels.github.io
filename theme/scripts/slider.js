/**
 * Based on fullPage Pure Javascript v.0.0.8 (Alpha) [https://github.com/alvarotrigo/fullPage.js]
 * Copyright (C) 2013 alvarotrigo.com - A project by Alvaro Trigo
 */

// UMD (Universal Module Definition) pattern
// It returns the SliderAPI from the factory, which is the massive function that encases this file.
(function (root, window, document, factory) {
    'use strict';
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(function () {
            root.SliderAPI = factory(window, document);
            return root.SliderAPI;
        });
    } else if (typeof exports === "object") {
        // Node. Does not work with strict CommonJS.
        module.exports = factory(window, document);
    } else {
        // Browser globals.
        root.SliderAPI = factory(window, document);
    }
}(this, window, document, function (window, document) {
    'use strict';

    //-------------------------------------------------------------------------
    // Slider class
    //-------------------------------------------------------------------------
    
    //-------------------------------------------------------------------------
    // Class constants:
    //-------------------------------------------------------------------------
    // Keeping central set of css classnames and selectors.
    var WRAPPER =               'fullpage-wrapper';
    var WRAPPER_SEL =           '.' + WRAPPER;

    // util
    var RESPONSIVE =            'fp-responsive';    // Not used, not in css
    var NO_TRANSITION =         'fp-notransition';  // Used, in css
    var DESTROYED =             'fp-destroyed';     // Used, not in css
    var ENABLED =               'fp-enabled';       // Used, in css
    var VIEWING_PREFIX =        'fp-viewing';       // Used, not in css
    var ACTIVE =                'active';
    var ACTIVE_SEL =            '.' + ACTIVE;

    // Sections, a section is a page that is scrolled vertically.
    var SECTION_DEFAULT_SEL =   '.section';
    var SECTION =               'fp-section';
    var SECTION_SEL =           '.' + SECTION;
    var SECTION_ACTIVE_SEL =    SECTION_SEL + ACTIVE_SEL;

    // Section navigation. Buttons in the top right and their tooltips.
    var SECTION_NAV =           'fp-nav';
    var SECTION_NAV_SEL =       '#' + SECTION_NAV;
    var SECTION_NAV_TOOLTIP =   'fp-tooltip';
    var SHOW_ACTIVE_TOOLTIP =   'fp-show-active';

    // Slides, one or more slides make up a page. A slide slides horizontally.
    var SLIDE_DEFAULT_SEL =     '.slide';
    var SLIDE =                 'fp-slide';
    var SLIDE_SEL =             '.' + SLIDE;
    var SLIDE_ACTIVE_SEL =      SLIDE_SEL + ACTIVE_SEL;
    var SLIDES_WRAPPER =        'fp-slides';
    var SLIDES_WRAPPER_SEL =    '.' + SLIDES_WRAPPER;
    var SLIDES_CONTAINER =      'fp-slidesContainer';
    var SLIDES_CONTAINER_SEL =  '.' + SLIDES_CONTAINER;
    var TABLE =                 'fp-table';

    // Slide navigation. Buttons at bottom center, and arrows at either side.
    var SLIDES_NAV =            'fp-slidesNav';
    var SLIDES_NAV_SEL =        '.' + SLIDES_NAV;
    var SLIDES_NAV_LINK_SEL =   SLIDES_NAV_SEL + ' a';
    var SLIDES_ARROW =          'fp-controlArrow';
    var SLIDES_ARROW_SEL =      '.' + SLIDES_ARROW;
    var SLIDES_PREV =           'fp-prev';
    var SLIDES_PREV_SEL =       '.' + SLIDES_PREV;
    var SLIDES_ARROW_PREV =     SLIDES_ARROW + ' ' + SLIDES_PREV;
    var SLIDES_ARROW_PREV_SEL = SLIDES_ARROW_SEL + SLIDES_PREV_SEL;
    var SLIDES_NEXT =           'fp-next';
    var SLIDES_NEXT_SEL =       '.' + SLIDES_NEXT;
    var SLIDES_ARROW_NEXT =     SLIDES_ARROW + ' ' + SLIDES_NEXT;
    var SLIDES_ARROW_NEXT_SEL = SLIDES_ARROW_SEL + SLIDES_NEXT_SEL;

    //-------------------------------------------------------------------------
    // Global variables
    //-------------------------------------------------------------------------
    var LocalOptions;
    var GlobalOptions;

    var slideMoving = false;
    var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|playbook|silk|BlackBerry|BB10|Windows Phone|Tizen|Bada|webOS|IEMobile|Opera Mini)/);
    //var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints));
    var isTouch = ((typeof (window.ontouchstart) !== "undefined") || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints));
    
    var windowsHeight = 0;// getWindowHeight();
    var isResizing = false;
    var lastScrolledDestiny;
    var lastScrolledSlide;
    var canScroll = true;
    var scrollings = [];
    var nav;
    var activeAnimation;
    var container;

    var scrollId;
    var scrollId2;
    var isScrolling = false;

    var touchStartY = 0;
    var touchStartX = 0;
    var touchEndY = 0;
    var touchEndX = 0;

    var keydownId;

    var previousHeight = windowsHeight;
    var resizeId;

    var prevTime = new Date().getTime();

    //-------------------------------------------------------------------------
    // Begin class functions
    //-------------------------------------------------------------------------
    
    // Initialise function to setup everything.
    function Initialise(Element, Arguments) {

        // Create some defaults, extending them with any LocalOptions that were provided
        var DefaultArguments = {
            // Navigation
            anchors:[],
            slideanchors:[],
            navigation: false,
            navigationPosition: 'right',
            navigationColor: '#000',
            navigationTooltips: [],
            showActiveTooltip: false,
            slidesNavigation: false,
            slidesNavPosition: 'bottom',
            scrollBar: false,

            // Scrolling
            css3: true,
            scrollingSpeed: 700,
            autoScrolling: true,
            fitToSection: true,
            fitToSectionDelay: 1000,
            easingcss3: 'ease',
            loopHorizontal: true,
            touchSensitivity: 5,

            // Accessibility
            keyboardScrolling: true,
            recordHistory: true,

            // Design
            controlArrows: true,

            // Custom selectors
            sectionSelector: SECTION_DEFAULT_SEL,
            slideSelector: SLIDE_DEFAULT_SEL,

            // Events
            afterLoad: null,
            onLeave: null,
            afterRender: null,
            afterResize: null,
            afterReBuild: null,
            afterSlideLoad: null,
            onSlideLeave: null
        };

        LocalOptions = UpdateMatchingKeys(DefaultArguments, Arguments);

        GlobalOptions = clone(LocalOptions); //deep copy
        container = $(Element);

        RemoveClassCSS(container, DESTROYED); //in case it was destroyed before initilizing it again
        CheckDuplicateAnchors();

        //if css3 is not supported
        if (LocalOptions.css3) {
            LocalOptions.css3 = support3d();
        }

        if (container !== null) {
            SetPropertiesCSS(container, {
                'height': '100%',
                'position': 'relative'
            });

            //adding a class to recognize the container internally in the code
            AddClassCSS(container, WRAPPER);
            AddClassCSS($('html'), ENABLED);
        } else {
            // Trying to use slider without a selector.
            Log("error", "Slider needs to be initialised with a selector. For example: SliderAPI.Initialise('#ElementID');");
        }

        // Add handlers
        setMouseWheelScrolling(true);
        addTouchHandler();
        addResizeHandler();
        addScrollHandler();

        //adding internal class names to void problem with common ones
        var originalSections = $$(LocalOptions.sectionSelector);
        for (i = 0; i < originalSections.length; ++i) {
            AddClassCSS(originalSections[i], SECTION);
        }

        var originalSlides = $$(LocalOptions.slideSelector);
        for (i = 0; i < originalSlides.length; ++i) {
            AddClassCSS(originalSlides[i], SLIDE);
        }

        //creating the navigation dots
        if (LocalOptions.navigation) {
            addVerticalNavigation();
        }

        var sections = $$(SECTION_SEL);
        for (var i = 0; i<sections.length; i++) {
            var index = i;
            var section = sections[i];
            var that = section;
            var slides = $$(SLIDE_SEL, section);
            var numSlides = slides.length;

            //if no active section is defined, the 1st one will be the default one
            if (!index && $(SECTION_ACTIVE_SEL) === null) {
                AddClassCSS(section, ACTIVE);
            }

            if (typeof LocalOptions.anchors[index] !== 'undefined') {
                section.setAttribute('data-anchor', LocalOptions.anchors[index]);

                //activating the navigation dots on load
                if (HasClassCSS(section, ACTIVE)) {
                    ActivateNavigationMenu(LocalOptions.anchors[index], index);
                }
            }

            // if there's any slide
            if (numSlides > 0) {
                var sliderWidth =  numSlides * 100 + 10;
                var slideWidth = Math.floor(100 / numSlides);

                for (var j = 0; j < numSlides; ++j) {
                    if (typeof LocalOptions.slideanchors[index][j] !== 'undefined') {
                        slides[j].setAttribute('data-anchor', LocalOptions.slideanchors[index][j]);
                    }
                }
                
                
                //var slidesHTML = section.innerHTML;
                //var newHTML = '<div class="'+ SLIDES_WRAPPER +'"><div class="' + SLIDES_CONTAINER + '">' + slidesHTML + '</div></div>';
                //section.innerHTML = newHTML;

                /////////////// Mod to only get slide html
                var OnlyslidesHTML = "";
                for (var j = 0; j < numSlides; ++j) {
                    OnlyslidesHTML += GetElementOuterHTML(slides[j]);
                }
                for (var j = numSlides-1; j >= 0; --j) {
                    section.removeChild(slides[j]);
                }
                var newHTML = section.innerHTML + '<div class="'+ SLIDES_WRAPPER +'"><div class="' + SLIDES_CONTAINER + '">' + OnlyslidesHTML + '</div></div>';
                section.innerHTML = newHTML;
                ///////////////
                
                //getting again the NEW dom elements after innerHTML
                slides = $$(SLIDE_SEL, section);

                SetStyleCSS($(SLIDES_CONTAINER_SEL, section), 'width',  sliderWidth + '%');

                if (LocalOptions.controlArrows && numSlides > 1) {
                    createSlideArrows(section);
                }

                // Cant restrict this for some reason, is restricted inside function
                if (LocalOptions.slidesNavigation) {
                    addSlidesNavigation(section, numSlides);
                }

                for (var a = 0; a<slides.length; a++) {
                    var currentSlide = slides[a];
                    SetStyleCSS(currentSlide, 'width', slideWidth + '%');
                }

                var startingSlide = $(SLIDE_ACTIVE_SEL, section);

                //if the slide won#t be an starting point, the default will be the first one
                if (typeof startingSlide !== null) {
                    AddClassCSS(slides[0], ACTIVE);
                }

                //is there a starting point for a non-starting section?
                else{
                    silentLandscapeScroll(startingSlide);
                }

            }
        }

        //adding event for horizontal slides arrows navigation
        var slidesArrows = $$(SLIDES_ARROW_SEL);
        for (var i=0; i<slidesArrows.length; i++) {
            addListenerMulti(slidesArrows[i], 'click onclick touchstart', arrowsHandler);
        }

        setAutoScrolling(LocalOptions.autoScrolling, true);

        //the starting point is a slide?
        var activeSection = $(SECTION_ACTIVE_SEL);
        var activeSlide = $(SLIDE_ACTIVE_SEL, activeSection);
        var activeSectionIndex = getNodeIndex($(SECTION_ACTIVE_SEL));

        //the active section isn't the first one? Is not the first slide of the first section? Then we load that section/slide by default.
        if (activeSlide &&  (activeSectionIndex !==0 || (activeSectionIndex === 0 &&  getNodeIndex(activeSlide) !== 0))) {
            silentLandscapeScroll(activeSlide);
        }

        //vertical centered of the navigation + first bullet active
        if (LocalOptions.navigation) {
            SetStyleCSS(nav, 'margin-top', '-' + (nav.offsetHeight/2) + 'px');
            var activeLi = $$('li', nav)[getNodeIndex($(SECTION_ACTIVE_SEL))];
            AddClassCSS($('a', activeLi), ACTIVE);
        }

        // after Render Actions
        var section = $(SECTION_ACTIVE_SEL);
        isFunction(LocalOptions.afterLoad) && LocalOptions.afterLoad.call(section, section.getAttribute('data-anchor'), (getNodeIndex(section) + 1));
        isFunction(LocalOptions.afterRender) && LocalOptions.afterRender.call(container);

        //getting the anchor link in the URL and deleting the `#`
        var value =  window.location.hash.replace('#', '').split('/');
        var destiny = value[0];

        if (destiny.length) {
            var section = $('[data-anchor="' + destiny + '"]');

            if (!LocalOptions.animateAnchor && section.length) {

                if (LocalOptions.autoScrolling) {
                    silentScroll(section.offsetTop);
                }
                else{
                    silentScroll(0);
                    SetBodyCSSClass(destiny);

                    //scrolling the page to the section with no animation
                    var scrollSettings = getScrollSettings(section.offsetTop);
                    scrollTo(scrollSettings.Element, scrollSettings.LocalOptions, 0);
                }

                ActivateNavigationMenu(destiny, null);

                isFunction(LocalOptions.afterLoad) && LocalOptions.afterLoad.call(section, destiny, (getNodeIndex(section) + 1));

                //updating the active class
                RemoveClassCSS(activeSection, ACTIVE);
                AddClassCSS(section, ACTIVE);
            }
        }

        //setting the class for the body Element
        SetBodyCSSClass();

        //support for IE > 8
        addHandler(document, scrollToAnchor, 'DOMContentLoaded', 'DOMContentLoaded', 'DOMContentLoaded');
    }

    //-------------------------------------------------------------------------
    // Javascript helpers
    //-------------------------------------------------------------------------

    function GetElementOuterHTML(Element) {
        if (Element.outerHTML) {
            return Element.outerHTML;
        } else {
            var Attributes = Element.attributes;
            var AttributesString = "";
            for (var i = 0; i < Attributes.length; i++) {
                AttributesString += " " + Attributes[i].name + "=\"" + Attributes[i].value + "\"";
            }
            return "<" + Element.tagName + AttributesString + ">" + Element.innerHTML + "</" + Element.tagName + ">";
        }
    }

    //EaseInOutCubic animation
    function EaseInOutCubic(Time, Start, Change, Duration) {
        if ((Time /= Duration / 2) < 1)
            return Change / 2 * Time * Time * Time + Start;
        return Change / 2 * ((Time -= 2) * Time * Time + 2) + Start;
    }
    
    // Replacement of jQuery extend method.
    function UpdateMatchingKeys(defaultOptions, LocalOptions) {
        //creating the object if it doesnt exist
        if (typeof(LocalOptions) !== 'object') {
            LocalOptions = {};
        }

        for (var key in LocalOptions) {
            if (defaultOptions.hasOwnProperty(key)) {
                defaultOptions[key] = LocalOptions[key];
            }
        }

        return defaultOptions;
    }

    function getById(Element) {
        return document.getElementById(Element);
    }

    function getByTag(Element) {
        return document.getElementsByTagName(Element)[0];
    }

    function $(selector, context) {
        context = context || document;
        return context.querySelector(selector);
    }

    function $$(selector, context) {
        context = context || document;
        return context.querySelectorAll(selector);
    }

    function getNodeIndex(node) {
        var index = 0;
        while ((node = node.previousSibling)) {
            if (node.nodeType != 3 || !/^\s*$/.test(node.data)) {
                index++;
            }
        }
        return index;
    }

    function toggle(Element, display) {
        if (typeof display!== 'undefined') {
            if (display) {
                Element.style.display = 'block';
            }else{
                Element.style.display = 'none';
            }
        }
        else{
            if (Element.style.display == 'block') {
                Element.style.display = 'none';
            } else {
                Element.style.display = 'block';
            }
        }

        return Element;
    }

    //http://stackoverflow.com/questions/22100853/dom-pure-javascript-solution-to-jquery-closest-implementation
    function closest(el, fn) {
        return el && (
            fn(el) ? el : closest(el.parentNode, fn)
      );
    }

    function getWindowWidth() {
        return  'innerWidth' in window ? window.innerWidth : document.documentElement.offsetWidth;
    }

    function getWindowHeight() {
        return  'innerHeight' in window ? window.innerHeight : document.documentElement.offsetHeight;
    }

    function clone(obj) {
        if (null === obj || 'object' !== typeof obj) {
            return obj;
        }
        var copy = obj.constructor();

        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = obj[attr];
            }
        }
        return copy;
    }

    function preventDefault(event) {
        event.preventDefault ? event.preventDefault() : event.returnValue = false;
    }

    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    function addListenerMulti(el, s, fn) {
        var evts = s.split(' ');
        for (var i=0, iLen=evts.length; i<iLen; i++) {
            if (document.addEventListener) {
                el.addEventListener(evts[i], fn, false);
            }else{
                el.attachEvent(evts[i], fn, false); //IE 6/7/8
            }
        }
    }

    /**
    * Simulates the animated scrollTop of jQuery. Used when css3:false or scrollBar:true or autoScrolling:false
    * http://stackoverflow.com/a/16136789/1081396
    */
    function scrollTo(Element, to, duration, callback) {
        var start = getScrolledPosition(Element);
        var change = to - start;
        var currentTime = 0;
        var increment = 20;
        activeAnimation = true;

        var animateScroll = function() {
            if (activeAnimation) { //in order to stope it from other function whenever we want
                var val = to;

                currentTime += increment;
                val = EaseInOutCubic(currentTime, start, change, duration);

                setScrolling(Element, val);

                if (currentTime < duration) {
                    setTimeout(animateScroll, increment);
                }else if (typeof callback !== 'undefined') {
                    callback();
                }
            }else if (currentTime < duration) {
                callback();
            }
        };

        animateScroll();
    }

    //http://stackoverflow.com/questions/3464876/javascript-get-window-x-y-position-for-scroll
    function getScrollTop() {
        var doc = document.documentElement;
        return (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    }

    //http://stackoverflow.com/questions/842336/is-there-a-way-to-select-sibling-nodes
    function getChildren(n, skipMe) {
        var r = [];
        for (; n; n = n.nextSibling)
           if (n.nodeType == 1 && n != skipMe)
              r.push(n);
        return r;
    }

    //Gets siblings
    function getAllSiblings(n) {
        return getChildren(n.parentNode.firstChild, n);
    }

    function next(Element) {
        var nextSibling = Element.nextSibling;

        while(nextSibling && nextSibling.nodeType != 1) {
            nextSibling = nextSibling.nextSibling;
        }

        return nextSibling;
    }

    function prev(Element) {
        var prevSibling = Element.previousSibling;

        while(prevSibling && prevSibling.nodeType != 1) {
            prevSibling = prevSibling.previousSibling;
        }

        return prevSibling;
    }

    //-------------------------------------------------------------------------
    // Animation
    //-------------------------------------------------------------------------

    // Performs the movement (by CSS3 or by jQuery)
    function performMovement(v) {
        // using CSS3 translate functionality
        if (LocalOptions.css3 && LocalOptions.autoScrolling && !LocalOptions.scrollBar) {
            var translate3d = 'translate3d(0px, -' + v.dtop + 'px, 0px)';
            transformContainer(translate3d, true);

            //even when the scrollingSpeed is 0 there's a little delay, which might cause the
            //scrollingSpeed to change in case of using silentMoveTo();
            if (LocalOptions.scrollingSpeed) {
                setTimeout(function () {
                    afterSectionLoads(v);
                }, LocalOptions.scrollingSpeed);
            }else{
                afterSectionLoads(v);
            }
        }

        // using jQuery animate
        else{
            var scrollSettings = getScrollSettings(v.dtop);
            scrollTo(scrollSettings.Element, scrollSettings.LocalOptions, LocalOptions.scrollingSpeed, function() {
                afterSectionLoads(v);
            });
        }
    }

    //* Actions to do once the section is loaded
    function afterSectionLoads (v) {
        //callback (afterLoad) if the site is not just resizing and readjusting the slides
        isFunction(LocalOptions.afterLoad) && !v.localIsResizing && LocalOptions.afterLoad.call(v.Element, v.anchorLink, (v.sectionIndex + 1));
        canScroll = true;

        isFunction(v.callback) && v.callback.call(this);
    }

    // Adds transition animations for the given Element
    function addAnimation(Element) {
        var transition = 'all ' + LocalOptions.scrollingSpeed + 'ms ' + LocalOptions.easingcss3;

        RemoveClassCSS(Element, NO_TRANSITION);

        SetPropertiesCSS(Element,{
            '-webkit-transition': transition,
            'transition': transition
        });

        return Element;
    }

    // Remove transition animations for the given Element
    function removeAnimation(Element) {
        return AddClassCSS(Element, NO_TRANSITION);
    }

    /**
    * Retuns `up` or `down` depending on the scrolling movement to reach its destination
    * from the current section.
    */
    function getYmovement(destiny) {
        var fromIndex = getNodeIndex($(SECTION_ACTIVE_SEL));
        var toIndex = getNodeIndex(destiny);
        if (fromIndex == toIndex) {
            return 'none';
        }
        if (fromIndex > toIndex) {
            return 'up';
        }
        return 'down';
    }

    /**
    * Retuns `right` or `left` depending on the scrolling movement to reach its destination
    * from the current slide.
    */
    function getXmovement(fromIndex, toIndex) {
        if (fromIndex == toIndex) {
            return 'none';
        }
        if (fromIndex > toIndex) {
            return 'left';
        }
        return 'right';
    }

    /**
    * Adds a css3 transform property to the container class with or without animation depending on the animated param.
    */
    function transformContainer(translate3d, animated) {
        if (animated) {
            addAnimation(container);
        }else{
            removeAnimation(container);
        }

        SetTransforms(container, translate3d);

        //syncronously removing the class after the animation has been applied.
        setTimeout(function() {
            RemoveClassCSS(container, NO_TRANSITION);
        },10);
    }


    //-------------------------------------------------------------------------
    // HTML
    //-------------------------------------------------------------------------

    // Creates the control arrows for the given section
    function createSlideArrows(section) {
        var prev = document.createElement('div');
        prev.className = SLIDES_ARROW_PREV;

        var next = document.createElement('div');
        next.className = SLIDES_ARROW_NEXT;

        var slides = $(SLIDES_WRAPPER_SEL, section);

        if (LocalOptions.controlArrowColor != '#FFF') {
            //SetStyleCSS(next, 'border-color', 'transparent transparent transparent '+LocalOptions.controlArrowColor);
            //SetStyleCSS(prev, 'border-color', 'transparent '+ LocalOptions.controlArrowColor + ' transparent transparent');
        }

        slides.parentNode.appendChild(prev);
        slides.parentNode.appendChild(next);

        if (!LocalOptions.loopHorizontal) {
            $(SLIDES_ARROW_PREV_SEL, section).style.display = 'none';
        }
    }

    // Creates a vertical navigation bar.
    function addVerticalNavigation() {
        var div = document.createElement('div');
        div.setAttribute('id', SECTION_NAV);

        var divUl = document.createElement('ul');
        div.appendChild(divUl);

        document.body.appendChild(div);

        nav = $(SECTION_NAV_SEL);

        SetStyleCSS(nav, 'color', LocalOptions.navigationColor);
        AddClassCSS(nav, LocalOptions.navigationPosition);

        if (LocalOptions.showActiveTooltip) {
            AddClassCSS(nav, SHOW_ACTIVE_TOOLTIP);
        }

        var li = '';

        for (var i = 0; i < $$(SECTION_SEL).length; i++) {
            var link = '';
            if (LocalOptions.anchors.length) {
                link = LocalOptions.anchors[i];
            }

            li = li + '<li><a href="#' + link + '"><span></span></a>';

            // Only add tooltip if needed (defined by user)
            var tooltip = LocalOptions.navigationTooltips[i];
            if (typeof tooltip !== undefined && tooltip !== '') {
                li += '<div class="'+ SECTION_NAV_TOOLTIP +' ' + LocalOptions.navigationPosition + '">' + tooltip + '</div>';
            }

            li += '</li>';
        }

        var ul = $('ul', nav);
        ul.innerHTML = ul.innerHTML + li;

        //TODO
        /*
        //creating the event listener
        var links = $$(SLIDES_NAV_LINK_SEL);
        for (var l = 0; l<links.length; l++) {
            addListenerMulti(links[l], 'click onclick touchstart', function(e) {
                e = window.event || e || e.originalEvent;
                preventDefault(e);
                var index = getNodeIndex(this.parentNode);

                scrollPage($$(SECTION_SEL)[index], null, false);
            });
        }
        */
    }

    /**
    * Sets the state of the website depending on the active section/slide.
    * It changes the URL hash when needed and updates the body class.
    */
    function setState(slideIndex, slideAnchor, anchorLink, sectionIndex) {
        // UNUSED: sectionIndex

        var sectionHash = '';

        if (LocalOptions.anchors.length) {

            //isn't it the first slide?
            if (slideIndex) {
                if (typeof anchorLink !== 'undefined') {
                    sectionHash = anchorLink;
                }

                //slide without anchor link? We take the index instead.
                if (typeof slideAnchor === 'undefined') {
                    slideAnchor = slideIndex;
                }

                lastScrolledSlide = slideAnchor;
                setUrlHash(sectionHash + '/' + slideAnchor);

            //first slide won't have slide anchor, just the section one
            }else if (typeof slideIndex !== 'undefined') {
                lastScrolledSlide = slideAnchor;
                setUrlHash(anchorLink);
            }

            //section without slides
            else{
                setUrlHash(anchorLink);
            }

        }
        SetBodyCSSClass();
    }

    /**
    * Creates a landscape navigation bar with dots for horizontal sliders.
    */
    function addSlidesNavigation(section, numSlides) {
        var div = document.createElement('div');
        div.className = SLIDES_NAV;

        var divUl = document.createElement('ul');
        div.appendChild(divUl);

        section.appendChild(div);

        var nav = $(SLIDES_NAV_SEL, section);
        var ul =  $('ul', nav);

        //top or bottom
        AddClassCSS(nav, LocalOptions.slidesNavPosition);

        // Only add elements if there is more than one
        var list = '';
        if (numSlides > 1) {
            for (var i=0; i< numSlides; i++) {
                list = list + '<li><a href="#"><span></span></a></li>';
            }
        }

        ul.innerHTML = ul.innerHTML + list;

        //centering it
        //SetStyleCSS(nav, 'margin-left', '-' + (nav.offsetWidth/2) + 'px');

        var firstLi = $$('li', nav)[0];
        AddClassCSS($('a', firstLi), ACTIVE);
        
        //TODO
        if (numSlides > 1) {
            var links = $$(SLIDES_NAV_LINK_SEL);
            for (var l = 0; l < links.length; ++l) {
                addListenerMulti(links[l], 'click onclick touchstart', function(e) {
                    e = window.event || e || e.originalEvent;
                    preventDefault(e);
                    var slides = $$(SLIDE_SEL, section);
                    var index = getNodeIndex(this.parentNode);
                    for (var i = 0; i < slides.length; ++i) {
                        RemoveClassCSS(slides[i], ACTIVE);
                    }
                    AddClassCSS(slides[index], ACTIVE);
                    var closestslides = closest(slides[index], function (el) {
                        return HasClassCSS(el, SLIDES_WRAPPER);
                    });
                    landscapeScroll(closestslides, slides[index]);
                });
            }
        }
    }

    // Activating the website navigation dots according to the given slide name.
    function ActivateNavigationMenu(Name, SectionIndex) {
        if (LocalOptions.navigation) {
            RemoveClassCSS($(ACTIVE_SEL, nav), ACTIVE);
            if (Name) {
                AddClassCSS($('a[href="#' + Name + '"]', nav) , ACTIVE);
            } else {
                var CurrentListItem = $$('li', nav)[SectionIndex];
                AddClassCSS($('a', CurrentListItem), ACTIVE);
            }
        }
    }

    //-------------------------------------------------------------------------
    // Anchors
    //-------------------------------------------------------------------------

    // Gets a section by its anchor / index
    function getSectionByAnchor(sectionAnchor) {
        //section
        var section = $(SECTION_SEL + '[data-anchor="'+sectionAnchor+'"]');
        if (!section) {
            section = $$(SECTION_SEL)[(sectionAnchor -1)];
        }

        return section;
    }

    // Gets the anchor for the given slide. Its index will be used if there's none.
    function getSlideAnchor(slide) {
        var slideAnchor = slide.getAttribute('data-anchor');
        var slideIndex = getNodeIndex(slide);

        //Slide without anchor link? We take the index instead.
        if (!slideAnchor) {
            slideAnchor = slideIndex;
        }

        return slideAnchor;
    }

    // Gets a slide inside a given section by its anchor / index
    function getSlideByAnchor(slideAnchor, section) {
        var slides = $(SLIDES_WRAPPER_SEL, section);
        var slide =  $(SLIDE_SEL + '[data-anchor="'+slideAnchor+'"]', slides);

        if (slides && !slide) {
            slide = $$(SLIDE_SEL, slides)[slideAnchor];
        }

        return slide;
    }

    //-------------------------------------------------------------------------
    // URL
    //-------------------------------------------------------------------------

    // Sets the URL hash.
    function setUrlHash(url) {
        if (LocalOptions.recordHistory) {
            location.hash = url;
        }else{
            //Mobile Chrome doesn't work the normal way, so... lets use HTML5 for phones :)
            if (isTouchDevice || isTouch) {
                history.replaceState(undefined, undefined, '#' + url);
            }else{
                var baseUrl = window.location.href.split('#')[0];
                window.location.replace(baseUrl + '#' + url);
            }
        }
    }

    //-------------------------------------------------------------------------
    // CSS
    //-------------------------------------------------------------------------

    function HasClassCSS(Element, ClassName) {
        return !!Element.className.match(new RegExp('(\\s|^)' + ClassName + '(\\s|$)'));
    }

    function SetPropertiesCSS(el, props) {
        var key;
        for (key in props) {
            if (props.hasOwnProperty(key)) {
                if (key !== null) {
                    el.style[key] = props[key];
                }
            }
        }
        return el;
    }

    function AddClassCSS(Element, ClassName) {
        if (Element && !HasClassCSS(Element, ClassName)) {
            Element.className += " " + ClassName;
        }
    }

    function RemoveClassCSS(Element, ClassName) {
        if (Element && HasClassCSS(Element, ClassName)) {
            Element.className = Element.className.replace(new RegExp('(\\s|^)' + ClassName + '(\\s|$)'), "");
        }
    }

    function SetStyleCSS(Element, StyleParameter, NewValue) {
        Element.style[StyleParameter] = NewValue;
    }

    // Sets a class for the body of the page depending on the active section / slide
    function SetBodyCSSClass(text) {
        var section = $(SECTION_ACTIVE_SEL);
        var slide = $(SLIDE_ACTIVE_SEL, section);

        var sectionAnchor = section.getAttribute('data-anchor');
        var sectionIndex = getNodeIndex(section);

        var text = String(sectionIndex);

        if (LocalOptions.anchors.length) {
            text = sectionAnchor;
        }

        if (slide) {
            var slideAnchor = getSlideAnchor(slide);
            text = text + '-' + slideAnchor;
        }

        //changing slash for dash to make it a valid CSS style
        text = text.replace('/', '-').replace('#','');

        //removing previous anchor classes
        var classRe = new RegExp('\\b\\s?' + VIEWING_PREFIX + '-[^\\s]+\\b', "g");
        document.body.className = document.body.className.replace(classRe, '');

        //adding the current anchor
        AddClassCSS(document.body, VIEWING_PREFIX + '-' + text);
    }

    // Checks for translate3d support
    // http://stackoverflow.com/questions/5661671/detecting-transform-translate3d-support
    function support3d() {
        var el = document.createElement('p'),
            has3d,
            transforms = {
                'webkitTransform':'-webkit-transform',
                'OTransform':'-o-transform',
                'msTransform':'-ms-transform',
                'MozTransform':'-moz-transform',
                'transform':'transform'
            };

        // Add it to the body to get the computed style.
        document.body.insertBefore(el, null);

        for (var t in transforms) {
            if (el.style[t] !== undefined) {
                el.style[t] = 'translate3d(1px,1px,1px)';
                has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
            }
        }

        document.body.removeChild(el);

        return (has3d !== undefined && has3d.length > 0 && has3d !== 'none');
    }

    function SetTransforms(Element, Translate3D) {
        SetPropertiesCSS(Element, {
            '-webkit-transform': Translate3D,
            '-moz-transform': Translate3D,
            '-ms-transform': Translate3D,
            'transform': Translate3D
        });
    }

    //-------------------------------------------------------------------------
    // Scrolling
    //-------------------------------------------------------------------------

    // Moves the page up one section.
    function moveSectionUp() {
        var section = prev($(SECTION_ACTIVE_SEL));

        if (section) {
            scrollPage(section, null, true);
        }
    }

    // Moves the page down one section.
    function moveSectionDown() {
        var section = next($(SECTION_ACTIVE_SEL));

        if (section) {
            scrollPage(section, null, false);
        }
    }

    /**
    * Moves the page to the given section and slide with no animation.
    * Anchors or index positions can be used as params.
    */
    function silentMoveTo(sectionAnchor, slideAnchor) {
        setScrollingSpeed (0, true);
        moveTo(sectionAnchor, slideAnchor)
        setScrollingSpeed (GlobalOptions.scrollingSpeed, true);
    }

    /**
    * Moves the page to the given section and slide.
    * Anchors or index positions can be used as params.
    */
    function moveTo(sectionAnchor, slideAnchor) {
        var destiny = getSectionByAnchor(sectionAnchor);

        if (typeof slideAnchor !== 'undefined') {
            scrollPageAndSlide(sectionAnchor, slideAnchor);
        }else if (destiny) {
            scrollPage(destiny);
        }
    }

    // Slides a slider to the given direction.
    function moveSlide(direction) {
        var activeSection = $(SECTION_ACTIVE_SEL);
        var slides = $(SLIDES_WRAPPER_SEL, activeSection);

        // more than one slide needed and nothing should be sliding
        if (!slides|| slideMoving) {
            return;
        }

        var currentSlide = $(SLIDE_ACTIVE_SEL, slides);
        var destiny = null;
        if (direction === 'prev') {
            destiny = prev(currentSlide);
        }else{
            destiny = next(currentSlide);
        }

        //isn't there a next slide in the secuence?
        if (!destiny) {
            //respect loopHorizontal settin
            if (!LocalOptions.loopHorizontal) return;

            var siblings = getAllSiblings(currentSlide);
            // Ensure there are siblings
            if (siblings.length == 0) return;

            if (direction === 'prev') {
                destiny = siblings[siblings.length - 1]; //last
            }else{
                destiny = siblings[0]; //first
            }
        }

        slideMoving = true;

        landscapeScroll(slides, destiny);
    }

    // Maintains the active slides in the viewport
    // (Because he "scroll" animation might get lost with some actions)
    function keepSlidesPosition() {
        var activeSlides = $$(SLIDE_ACTIVE_SEL);
        for (var i =0; i<activeSlides.length; i++) {
            silentLandscapeScroll(activeSlides[i], true);
        }
    }

    // Scrolls the site to the given Element and scrolls to the slide if a callback is given.
    function scrollPage(Element, callback, isMovementUp) {
        if (Element === null) { return; } //there's no Element to scroll, leaving the function
        //local variables
        var v = {
            Element: Element,
            callback: callback,
            isMovementUp: isMovementUp,
            dtop: Element.offsetTop,
            yMovement: getYmovement(Element),
            anchorLink: Element.getAttribute('data-anchor'),
            sectionIndex: getNodeIndex(Element),
            activeSlide: $(SLIDE_ACTIVE_SEL, Element),
            activeSection: $(SECTION_ACTIVE_SEL),
            leavingSection: getNodeIndex($(SECTION_ACTIVE_SEL)) + 1,

            //caching the value of isResizing at the momment the function is called
            //because it will be checked later inside a setTimeout and the value might change
            localIsResizing: isResizing
        };

        //quiting when destination scroll is the same as the current one
        if ((getNodeIndex(v.activeSection) == v.sectionIndex && !isResizing) || (LocalOptions.scrollBar && getScrollTop() === v.dtop)) { return; }

        if (v.activeSlide) {
            var slideAnchorLink = v.activeSlide.getAttribute('data-anchor');
            var slideIndex = getNodeIndex(v.activeSlide);
        }

        var siblings = $$(SECTION_SEL);
        for (var s=0; s<siblings.length; s++) {
            RemoveClassCSS(siblings[s], ACTIVE);
        }

        AddClassCSS(Element, ACTIVE);

        //preventing from activating the MouseWheelHandler event
        //more than once if the page is scrolling
        canScroll = false;

        setState(slideIndex, slideAnchorLink, v.anchorLink, v.sectionIndex);

        //callback (onLeave) if the site is not just resizing and readjusting the slides
        isFunction(LocalOptions.onLeave) && !v.localIsResizing && LocalOptions.onLeave.call(v.activeSection, v.leavingSection, (v.sectionIndex + 1), v.yMovement);


        performMovement(v);

        //flag to avoid callingn `scrollPage()` twice in case of using anchor links
        lastScrolledDestiny = v.anchorLink;


        ActivateNavigationMenu(v.anchorLink, v.sectionIndex);
    }

    // Scrolls to the anchor in the URL when loading the site
    function scrollToAnchor() {
        //getting the anchor link in the URL and deleting the `#`
        var value =  window.location.hash.replace('#', '').split('/');
        var section = value[0];
        var slide = value[1];

        if (section) {  //if theres any #
            scrollPageAndSlide(section, slide);
        }
    }

    // Scrolls to the given section and slide
    function scrollPageAndSlide(destiny, slide) {
        var section = getSectionByAnchor(destiny);

        if (typeof slide === 'undefined') {
            slide = 0;
        }

        //we need to scroll to the section and then to the slide
        if (destiny !== lastScrolledDestiny && !HasClassCSS(section, ACTIVE)) {
            scrollPage(section, function() {
                scrollSlider(section, slide);
            });
        }
        //if we were already in the section
        else{
            scrollSlider(section, slide);
        }
    }

    // Scrolls the slider to the given slide destination for the given section
    function scrollSlider(section, slideAnchor) {
        if (typeof slideAnchor !== 'undefined') {
            var slides = $(SLIDES_WRAPPER_SEL, section);
            var destiny =  getSlideByAnchor(slideAnchor, section);

            if (destiny) {
                landscapeScroll(slides, destiny);
            }
        }
    }

    function silentLandscapeScroll(activeSlide, noCallbacks) {
        setScrollingSpeed (0, true);

        if (typeof noCallbacks !== 'undefined') {
            //preventing firing callbacks afterSlideLoad etc.
            isResizing = true;
        }

        //equivalent to:   activeSlide.closest(SLIDES_WRAPPER_SEL)
        var slides = closest(activeSlide, function (el) {
            return HasClassCSS(el, SLIDES_WRAPPER);
        });

        landscapeScroll(slides, activeSlide);

        if (typeof noCallbacks !== 'undefined') {
            isResizing = false;
        }

        setScrollingSpeed(GlobalOptions.scrollingSpeed, true);
    }

    // Scrolls horizontal sliders.
    function landscapeScroll(slides, destiny) {
        var slideIndex = getNodeIndex(destiny);

        //equivalent to slides.closest(SECTION_SEL)
        var section = closest(slides, function(e1) {
            return HasClassCSS(e1, SECTION);
        });

        var sectionIndex = getNodeIndex(section);
        var anchorLink = section.getAttribute('data-anchor');
        var slidesNav = $(SLIDES_NAV_SEL, section);
        var slideAnchor = getSlideAnchor(destiny);

        //caching the value of isResizing at the momment the function is called
        //because it will be checked later inside a setTimeout and the value might change
        var localIsResizing = isResizing;

        if (LocalOptions.onSlideLeave) {
            var prevSlide = $(SLIDE_ACTIVE_SEL, section);
            var prevSlideIndex = getNodeIndex(prevSlide);
            var xMovement = getXmovement(prevSlideIndex, slideIndex);

            //if the site is not just resizing and readjusting the slides
            if (!localIsResizing && xMovement!=='none') {
                isFunction(LocalOptions.onSlideLeave) && LocalOptions.onSlideLeave.call(prevSlide, anchorLink, (sectionIndex + 1), prevSlideIndex, xMovement);
            }
        }

        var siblings = $$(SLIDE_SEL, section);

        for (var s=0; s<siblings.length; s++) {
            RemoveClassCSS(siblings[s], ACTIVE);
        }

        AddClassCSS(destiny, ACTIVE);

        if ((siblings.length > 1) && !LocalOptions.loopHorizontal && LocalOptions.controlArrows) {
            //hidding it for the fist slide, showing for the rest
            toggle($(SLIDES_ARROW_PREV_SEL, section), slideIndex!==0);

            //hidding it for the last slide, showing for the rest
            toggle($(SLIDES_ARROW_NEXT_SEL, section), slideIndex!==(siblings.length-1));
        }

        //only changing the URL if the slides are in the current section (not for resize re-adjusting)
        if (HasClassCSS(section, ACTIVE)) {
            setState(slideIndex, slideAnchor, anchorLink, sectionIndex);
        }

        var afterSlideLoads = function() {
            //if the site is not just resizing and readjusting the slides
            if (!localIsResizing) {
                isFunction(LocalOptions.afterSlideLoad) && LocalOptions.afterSlideLoad.call(destiny, anchorLink, (sectionIndex + 1), slideAnchor, slideIndex);
            }
            //letting them slide again
            slideMoving = false;
        };

        if (LocalOptions.css3) {
            var translate3d = 'translate3d(-' + Math.round(destiny.offsetLeft) + 'px, 0px, 0px)';
            var slidesContainer = $(SLIDES_CONTAINER_SEL, slides);

            addAnimation(slidesContainer, LocalOptions.scrollingSpeed>0);
            SetTransforms(slidesContainer, translate3d);

            setTimeout(function() {
                afterSlideLoads();
            }, LocalOptions.scrollingSpeed, LocalOptions.easing);
        }else{
            scrollTo(slides, Math.round(destiny.offsetLeft), LocalOptions.scrollingSpeed, function() {
                afterSlideLoads();
            });
        }

        if (LocalOptions.slidesNavigation) {
            RemoveClassCSS($(ACTIVE_SEL, slidesNav), ACTIVE);
            var activeNavLi = $$('li', slidesNav)[slideIndex];
            var activeLink = $('a', activeNavLi);
            AddClassCSS(activeLink, ACTIVE);
        }
    }

    function silentScroll(top) {
        if (LocalOptions.scrollBar) {
            var scrollSettings = getScrollSettings(top);
            setScrolling(scrollSettings.Element, scrollSettings.LocalOptions, 0);
        }
        else if (LocalOptions.css3) {
            var translate3d = 'translate3d(0px, -' + top + 'px, 0px)';
            transformContainer(translate3d, false);
        }
        else {
            SetStyleCSS(container, 'top', -top + 'px');
        }
    }

    //-------------------------------------------------------------------------
    // Events
    //-------------------------------------------------------------------------

    // Detecting any change on the URL to scroll to the given anchor link
    // (a way to detect back history button as we play with the hashes on the URL)
    if (document.addEventListener) {
        //IE9, Chrome, Safari, Opera
        window.addEventListener('hashchange', hashChangeHandler, false);
    } else {
        //IE 6/7/8
        window.attachEvent('onhashchange', hashChangeHandler);
    }

    // Sliding with arrow keys, both, vertical and horizontal
    document.onkeydown = function(e) {
        clearTimeout(keydownId);

        var activeElement = document.activeElement;
        var tagName = activeElement.tagName;

        if (tagName !== 'SELECT' && tagName !== 'INPUT' && tagName !== 'TEXTAREA' && LocalOptions.keyboardScrolling && LocalOptions.autoScrolling) {

            e = window.event || e || e.originalEvent;
            var charCode = e.charCode || e.keyCode;

            //preventing the scroll with arrow keys & spacebar & Page Up & Down keys
            var keyControls = [40, 38, 32, 33, 34];
            for (var i=0; i<keyControls.length; i++) {
                if (keyControls[i] == charCode) {
                    preventDefault(e);
                }
            }

            var shiftPressed = e.shiftKey;
            keydownId = setTimeout(function() {
                onkeydown(shiftPressed, charCode);
            },150);
        }
    };

    // When scrolling
    function scrollHandler() {
        var currentSection;

        if (!LocalOptions.autoScrolling || LocalOptions.scrollBar) {
            var currentScroll = getScrollTop();
            var visibleSectionIndex = 0;
            var initial = Math.abs(currentScroll - $$(SECTION_SEL)[0].offsetTop);

            //taking the section which is showing more content in the viewport
            var sections = $$(SECTION_SEL);
            for (var i = 0; i < sections.length; ++i) {
                var section = sections[i];

                var current = Math.abs(currentScroll - section.offsetTop);

                if (current < initial) {
                    visibleSectionIndex = i;
                    initial = current;
                }
            }

            //geting the last one, the current one on the screen
            currentSection = $$(SECTION_SEL)[visibleSectionIndex];

        }

        if (!LocalOptions.autoScrolling || LocalOptions.scrollBar) {
            //executing it only once the first time we reach the section
            if (!HasClassCSS(currentSection, ACTIVE)) {

                isScrolling = true;
                var leavingSection = $(SECTION_ACTIVE_SEL);
                var leavingSectionIndex = getNodeIndex(leavingSection) + 1;
                var yMovement = getYmovement(currentSection);
                var anchorLink  = currentSection.getAttribute('data-anchor');
                var sectionIndex = getNodeIndex(currentSection) + 1;
                var activeSlide = $(SLIDE_ACTIVE_SEL, currentSection);

                if (activeSlide) {
                    var slideAnchorLink = activeSlide.getAttribute('data-anchor');
                    var slideIndex = getNodeIndex(activeSlide);
                }

                if (canScroll) {
                    //removing siblings active class
                    RemoveClassCSS(leavingSection, ACTIVE);

                    //adding the active class to the current active section
                    AddClassCSS(currentSection, ACTIVE);

                    isFunction(LocalOptions.onLeave) && LocalOptions.onLeave.call(leavingSection, leavingSectionIndex, sectionIndex, yMovement);
                    isFunction(LocalOptions.afterLoad) && LocalOptions.afterLoad.call(currentSection, anchorLink, sectionIndex);

                    ActivateNavigationMenu(anchorLink, 0);

                    if (LocalOptions.anchors.length) {
                        //needed to enter in hashChange event when using the menu with anchor links
                        lastScrolledDestiny = anchorLink;

                        setState(slideIndex, slideAnchorLink, anchorLink, sectionIndex);
                    }
                }

                //small timeout in order to avoid entering in hashChange event when scrolling is not finished yet
                clearTimeout(scrollId);
                scrollId = setTimeout(function() {
                    isScrolling = false;
                }, 100);
            }

            if (LocalOptions.fitToSection) {
                //for the auto adjust of the viewport to fit a whole section
                clearTimeout(scrollId2);

                scrollId2 = setTimeout(function() {
                    if (canScroll && !LocalOptions.autoScrolling || LocalOptions.scrollBar) {
                        //allows to scroll to an active section and
                        //if the section is already active, we prevent firing callbacks
                        if (getNodeIndex($(SECTION_ACTIVE_SEL)) == getNodeIndex(currentSection)) {
                            isResizing = true;
                        }

                        scrollPage(currentSection);
                        isResizing = false;
                    }
                }, LocalOptions.fitToSectionDelay);
            }
        }
    }

    /* Detecting touch events:
    * As we are changing the top property of the page on scrolling, we can not use the traditional way to detect it.
    * This way, the touchstart and the touch moves shows an small difference between them which is the
    * used one to determine the direction.
    */
    function touchMoveHandler(event) {

        var e = window.event || e || e.originalEvent;

        if (isReallyTouch(e)) {
            if (LocalOptions.autoScrolling) {
                //preventing the easing on iOS devices
                preventDefault(event);
            }

            var activeSection = $(SECTION_ACTIVE_SEL);
            var slides = $$(SLIDES_WRAPPER_SEL, activeSection);

            if (canScroll && !slideMoving) { //if theres any #
                var touchEvents = getEventsPage(e);

                touchEndY = touchEvents.y;
                touchEndX = touchEvents.x;

                //if movement in the X axys is greater than in the Y and the currect section has slides...
                if (slides && Math.abs(touchStartX - touchEndX) > (Math.abs(touchStartY - touchEndY))) {

                    //is the movement greater than the minimum resistance to scroll?
                    if (Math.abs(touchStartX - touchEndX) > (getWindowWidth() / 100 * LocalOptions.touchSensitivity)) {
                        if (touchStartX > touchEndX) {
                            moveSlide('next'); //next
                        } else {
                            moveSlide('prev'); //prev
                        }
                    }
                }

                //vertical scrolling (only when autoScrolling is enabled)
                else if (LocalOptions.autoScrolling) {

                    //is the movement greater than the minimum resistance to scroll?
                    if (Math.abs(touchStartY - touchEndY) > (getWindowHeight()/ 100 * LocalOptions.touchSensitivity)) {
                        if (touchStartY > touchEndY) {
                            moveSectionDown();
                        } else if (touchEndY > touchStartY) {
                            moveSectionUp();
                        }
                    }
                }
            }
        }
    }

    /**
    * As IE >= 10 fires both touch and mouse events when using a mouse in a touchscreen
    * this way we make sure that is really a touch event what IE is detecting.
    */
    function isReallyTouch(e) {
        //if is not IE   ||  IE is detecting `touch` or `pen`
        return typeof e.pointerType === 'undefined' || e.pointerType != 'mouse';
    }

    // Handler for the touch start event.
    function touchStartHandler(event) {
        var e = window.event || e || e.originalEvent;

        //stopping the auto scroll to adjust to a section
        if (LocalOptions.fitToSection) {
            activeAnimation = false;
        }

        if (isReallyTouch(e)) {
            var touchEvents = getEventsPage(e);
            touchStartY = touchEvents.y;
            touchStartX = touchEvents.x;
        }
    }

    // Gets the average of the last `number` elements of the given array.
    function getAverage(elements, number) {
        var sum = 0;

        //taking `number` elements from the end to make the average, if there are not enought, 1
        var lastElements = elements.slice(Math.max(elements.length - number, 1));

        for (var i = 0; i < lastElements.length; i++) {
            sum = sum + lastElements[i];
        }
        return Math.ceil(sum/number);
    }

    /**
     * Detecting mousewheel scrolling
     *
     * http://blogs.sitepointstatic.com/examples/tech/mouse-wheel/index.html
     * http://www.sitepoint.com/html5-javascript-mouse-wheel/
     */
    function MouseWheelHandler(e) {
        var curTime = new Date().getTime();

        if (LocalOptions.autoScrolling) {
            // cross-browser wheel delta
            e = window.event || e || e.originalEvent;

            var value = e.wheelDelta || -e.deltaY || -e.detail;
            var delta = Math.max(-1, Math.min(1, value));

            //Limiting the array to 150 (lets not waist memory!)
            if (scrollings.length > 149) {
                scrollings.shift();
            }

            //keeping record of the previous scrollings
            scrollings.push(Math.abs(value));

            //preventing to scroll the site on mouse wheel when scrollbar is present
            if (LocalOptions.scrollBar) {
                preventDefault(e);
            }

            var timeDiff = curTime-prevTime;
            prevTime = curTime;

            //haven't they scrolled in a while?
            //(enough to be consider a different scrolling action to scroll another section)
            if (timeDiff > 200) {
                //emptying the array, we dont care about old scrollings for our averages
                scrollings = [];
            }

            if (canScroll) {//if theres any #

                var averageEnd = getAverage(scrollings, 10);
                var averageMiddle = getAverage(scrollings, 70);
                var isAccelerating = averageEnd >= averageMiddle;

                if (isAccelerating) {
                    //scrolling down?
                    if (delta < 0) {
                        moveSectionDown();

                    //scrolling up?
                    }else {
                        moveSectionUp();
                    }
                }
            }

            return false;
        }

        if (LocalOptions.fitToSection) {
            //stopping the auto scroll to adjust to a section
            activeAnimation = false;
        }
    }

    function arrowsHandler(event) {
        var Element = this;

        //IE 8 (using attach event...)
        //http://stackoverflow.com/a/4590231/1081396
        if (Element.self == window) {
            Element = event.target || event.srcElement;
        }

        if (HasClassCSS(Element, SLIDES_PREV)) {
            moveSlide('prev');
        } else {
            moveSlide('next');
        }
    }

    function hashChangeHandler() {
        if (!isScrolling) {
            var value =  window.location.hash.replace('#', '').split('/');
            var section = value[0];
            var slide = value[1];

            if (section.length) {
                //when moving to a slide in the first section for the first time (first time to add an anchor to the URL)
                var isFirstSlideMove =  (typeof lastScrolledDestiny === 'undefined');
                var isFirstScrollMove = (typeof lastScrolledDestiny === 'undefined' && typeof slide === 'undefined' && !slideMoving);

                /*in order to call scrollpage() only once for each destination at a time
                It is called twice for each scroll otherwise, as in case of using anchorlinks `hashChange`
                event is fired on every scroll too.*/
                if ((section && section !== lastScrolledDestiny) && !isFirstSlideMove || isFirstScrollMove || (!slideMoving && lastScrolledSlide != slide))  {
                    scrollPageAndSlide(section, slide);
                }
            }
        }
    }

    function onkeydown(shiftPressed, KeyCode) {
        switch (KeyCode) {
            // Up
            case 38: case 33: moveSectionUp(); break;
            // Spacebar (Down, or shift up)
            case 32: if (shiftPressed) { moveSectionUp(); break; }
            // Down
            case 40: case 34: moveSectionDown(); break;
            // Home
            case 36: moveTo(1); break;
            // End
            case 35: moveTo($$(SECTION_SEL).length); break;
            // Left
            case 37: moveSlide('prev'); break;
            // Right
            case 39: moveSlide('next'); break;
            // Exit this handler for other keys
            default: return;
        }
    }

    // When resizing the site, we adjust the heights of the sections
    function resizeHandler() {
        // rebuild immediately on touch devices
        if (isTouchDevice) {

            //if the keyboard is visible
            if (document.activeElement.getAttribute('type') !== 'text') {
                var currentHeight = getWindowHeight();

                //making sure the change in the viewport size is enough to force a rebuild. (20 % of the window to avoid problems when hidding scroll bars)
                if (Math.abs(currentHeight - previousHeight) > (20 * Math.max(previousHeight, currentHeight) / 100)) {
                    reBuild(true);
                    previousHeight = currentHeight;
                }
            }
        }else{
            //in order to call the functions only when the resize is finished
            //http://stackoverflow.com/questions/4298612/jquery-how-to-call-resize-event-only-once-its-finished-resizing
            clearTimeout(resizeId);

            resizeId = setTimeout(function() {
                reBuild(true);
            }, 350);
        }
    }
    /**
     * When resizing is finished, we adjust the slides sizes and positions
     */
    function reBuild(resizing) {
        if (HasClassCSS(container, DESTROYED)) { return; }

        isResizing = true;

        windowsHeight = getWindowHeight();

        var sections = $$(SECTION_SEL);
        for (var i = 0; i < sections.length; ++i) {
            var section = sections[i];
            var slidesWrap = $(SLIDES_WRAPPER_SEL, section);
            var slides = $$(SLIDE_SEL, section);

            //adjusting the position fo the FULL WIDTH slides...
            if (slidesWrap && slides.length > 1) {
                landscapeScroll(slidesWrap, $(SLIDE_ACTIVE_SEL, slidesWrap));
            }
        }


        var activeSection = $(SECTION_ACTIVE_SEL);

        //isn't it the first section?
        if (getNodeIndex(activeSection)) {
            //adjusting the position for the current section
            silentScroll(activeSection.offsetTop);
        }

        isResizing = false;
        isFunction(LocalOptions.afterResize) && resizing && LocalOptions.afterResize.call(container);
        isFunction(LocalOptions.afterReBuild) && !resizing && LocalOptions.afterReBuild.call(container);
    }

    /**
    * Adds the auto scrolling action for the mouse wheel and trackpad.
    * After this function is called, the mousewheel and trackpad movements will scroll through sections
    */
    function addMouseWheelHandler() {
        addHandler($(WRAPPER_SEL), MouseWheelHandler, 'mousewheel', 'onmousewheel', 'wheel');
    }

    /**
    * Removes the auto scrolling action fired by the mouse wheel and trackpad.
    * After this function is called, the mousewheel and trackpad movements won't scroll through sections.
    */
    function removeMouseWheelHandler() {
        var wrapper = $(WRAPPER_SEL);

        if (document.addEventListener) {
            wrapper.removeEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
            wrapper.removeEventListener('wheel', MouseWheelHandler, false); //Firefox
        } else {
            wrapper.detachEvent('onmousewheel', MouseWheelHandler); //IE 6/7/8
        }
    }

    function addResizeHandler() {
        addHandler(window, resizeHandler, 'resize', 'onresize');
    }

    function addScrollHandler() {
        addHandler(window, scrollHandler, 'scroll', 'onscroll', 'onscroll');
    }

    function addHandler(Element, method, normal, oldIE, firefox) {
        if (Element.addEventListener) {
            Element.addEventListener(normal, method, false); //IE9, Chrome, Safari, Oper

            if (typeof firefox !== 'undefined') {
                Element.addEventListener(firefox, method, false); //Firefox
            }
        }else{
            Element.attachEvent(oldIE, method);  //IE 6/7/8
        }
    }

    /**
    * Adds the possibility to auto scroll through sections on touch devices.
    */
    function addTouchHandler() {
        if (isTouchDevice || isTouch) {
            var wrapper = $(WRAPPER_SEL);
            if (document.addEventListener) {
                //Microsoft pointers
                var MSPointer = getMSPointer();

                wrapper.removeEventListener('touchstart', touchStartHandler);
                wrapper.removeEventListener(MSPointer.down, touchStartHandler);

                wrapper.removeEventListener('touchmove', touchMoveHandler);
                wrapper.removeEventListener(MSPointer.move, touchMoveHandler);

                addListenerMulti(wrapper, 'touchstart ' + MSPointer.down, touchStartHandler);
                addListenerMulti(wrapper, 'touchmove ' + MSPointer.move, touchMoveHandler);
            }
        }
    }

    /**
    * Removes the auto scrolling for touch devices.
    */
    function removeTouchHandler() {
        if (isTouchDevice || isTouch) {
            var wrapper = $(WRAPPER_SEL);

            if (wrapper.addEventListener) {
                //Microsoft pointers
                var MSPointer = getMSPointer();

                wrapper.removeEventListener('touchstart', touchStartHandler);
                wrapper.removeEventListener(MSPointer.down, touchStartHandler);

                wrapper.removeEventListener('touchmove', touchMoveHandler);
                wrapper.removeEventListener(MSPointer.move, touchMoveHandler);
            }
        }
    }

    /*
    * Returns and object with Microsoft pointers (for IE<11 and for IE >= 11)
    * http://msdn.microsoft.com/en-us/library/ie/dn304886(v=vs.85).aspx
    */
    function getMSPointer() {
        var pointer;

        //IE >= 11 & rest of browsers
        if (window.PointerEvent) {
            pointer = { down: 'pointerdown', move: 'pointermove'};
        }

        //IE < 11
        else{
            pointer = { down: 'MSPointerDown', move: 'MSPointerMove'};
        }

        return pointer;
    }

    /**
    * Gets the pageX and pageY properties depending on the browser.
    * https://github.com/alvarotrigo/fullPage.js/issues/194#issuecomment-34069854
    */
    function getEventsPage(e) {
        var events = [];

        events.y = (typeof e.pageY !== 'undefined' && (e.pageY || e.pageX) ? e.pageY : e.touches[0].pageY);
        events.x = (typeof e.pageX !== 'undefined' && (e.pageY || e.pageX) ? e.pageX : e.touches[0].pageX);

        //in touch devices with scrollBar:true, e.pageY is detected, but we have to deal with touch events. #1008
        if (isTouch && isReallyTouch(e)) {
            events.y = e.touches[0].pageY;
            events.x = e.touches[0].pageX;
        }

        return events;
    }


    //-------------------------------------------------------------------------
    // Variable management
    //-------------------------------------------------------------------------

    // Sets the state for a variable with multiple states.
    // Some variables such as "autoScrolling" or "recordHistory" might change states automatically.
    // This function is used to keep track of both states, the original and the temporal one.
    function SetVariableState(Variable, NewValue, LocalOnly) {
        LocalOptions[Variable] = NewValue;
        if (LocalOnly !== true) {
            GlobalOptions[Variable] = NewValue;
        }
    }

    // Gets the scrolling settings depending on the plugin autoScrolling option
    function getScrollSettings(top) {
        var scroll = {};
        // top property animation
        if (LocalOptions.autoScrolling && !LocalOptions.scrollBar) {
            scroll.LocalOptions = -top;
            scroll.Element = $('.' + WRAPPER);
        }
        // window real scrolling
        else{
            scroll.LocalOptions = top;
            scroll.Element = window;
        }
        return scroll;
    }

    /**
    * Getting the position of the Element to scroll when using jQuery animations
    */
    function getScrolledPosition(Element) {
        var position;

        //is not the window Element and is a slide?
        if (Element.self != window && HasClassCSS(Element, SLIDES_WRAPPER)) {
            position = Element.scrollLeft;
        }
        else if (!LocalOptions.autoScrolling  || LocalOptions.scrollBar) {
            position = getScrollTop();
        }
        else{
            position = Element.offsetTop;
        }

        //gets the top property of the wrapper
        return position;
    }

    function setScrolling(Element, val) {
        if (!LocalOptions.autoScrolling || LocalOptions.scrollBar || (Element.self != window && HasClassCSS(Element, SLIDES_WRAPPER))) {

            //scrolling horizontally through the slides?
            if (Element.self != window  && HasClassCSS(Element, SLIDES_WRAPPER)) {
                Element.scrollLeft = val;
            }
            //vertical scroll
            else{
                Element.scrollTo(0, val);
            }
        }else{
             Element.style.top = val + 'px';
        }
    }

    function setAutoScrolling(value, type) {
        SetVariableState('autoScrolling', value, type);

        var Element = $(SECTION_ACTIVE_SEL);

        if (LocalOptions.autoScrolling && !LocalOptions.scrollBar) {

            SetPropertiesCSS(document.body, {
                'overflow': 'hidden',
                'height': '100%'
            });

            SetPropertiesCSS(getByTag('html'),{
                'overflow': 'hidden',
                'height': '100%'
            });

            setRecordHistory(LocalOptions.recordHistory, true);

            //for IE touch devices
            SetPropertiesCSS(container, {
                '-ms-touch-action': 'none',
                'touch-action': 'none'
            });

            if (Element) {
                //moving the container up
                silentScroll(Element.offsetTop);
            }

        }else{
            SetPropertiesCSS(document.body, {
                'overflow': 'visible',
                'height': '100%'
            });

            SetPropertiesCSS(getByTag('html'),{
                'overflow': 'visible',
                'height': '100%'
            });

            setRecordHistory(false, true);

            //for IE touch devices
            SetPropertiesCSS(container, {
                '-ms-touch-action': '',
                'touch-action': ''
            });

            silentScroll(0);

            //scrolling the page to the section with no animation
            var scrollSettings = getScrollSettings(Element.offsetTop);
            scrollSettings.Element.scrollTo(0, scrollSettings.LocalOptions);
        }

    }

    // Adds or removes the possiblity of scrolling through sections by using the mouse wheel or the trackpad.
    function setMouseWheelScrolling(value) {
        if (value) {
            addMouseWheelHandler();
        }else{
            removeMouseWheelHandler();
        }
    }

    // Adds or removes the possiblity of scrolling through sections by using the keyboard arrow keys
    function setKeyboardScrolling(value) {
        LocalOptions.keyboardScrolling = value;
    }

    // Defines wheter to record the history for each hash change in the URL.
    function setRecordHistory(NewValue, LocalOnly) {
        SetVariableState('recordHistory', NewValue, LocalOnly);
    }

    // Defines the scrolling speed
    function setScrollingSpeed(NewValue, LocalOnly) {
        SetVariableState('scrollingSpeed', NewValue, LocalOnly);
    }

    // Sets fitToSection
    function setFitToSection(NewValue, LocalOnly) {
        SetVariableState('fitToSection', NewValue, LocalOnly);
    }

    //-------------------------------------------------------------------------
    // Debugging / Error checking
    //-------------------------------------------------------------------------

    // Check for duplicate anchors
    function CheckDuplicateAnchors() {
        // Anchors can not have the same value as any Element ID or NAME
        for (var i = 0; i < LocalOptions.anchors.length; ++i) {
            var AnchorName = LocalOptions.anchors[i];
            var IDExists = getById("#" + AnchorName);
            if (IDExists || $$("[name = '" + AnchorName + "']").length) {
                Log("error", "data-anchor tags can not have the same value as any 'id' Element on the site (or 'name' Element for IE). " + AnchorName + "' is duplicated.");
            }
        }
    }

    // Shows a message in the console of the given type.
    function Log(Type, Message) {
        console && console[Type] && console[Type]('Slider error: ' + Message);
    }

    //-------------------------------------------------------------------------
    // Return the API
    //-------------------------------------------------------------------------

    return {
        Initialise: Initialise,
        moveSectionUp: moveSectionUp,
        moveSectionDown: moveSectionDown,
        moveTo: moveTo,
        silentMoveTo: silentMoveTo,
        moveSlide: moveSlide,
        setAutoScrolling: setAutoScrolling,
        setFitToSection: setFitToSection,
        setKeyboardScrolling: setKeyboardScrolling,
        setRecordHistory: setRecordHistory,
        setScrollingSpeed: setScrollingSpeed
    };
}));
