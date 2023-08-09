// <!-- Copyright © 2011-2023 bitLogic.systems -->

// ****************************************************************
// hide dropdown menu on the start
// document.addEventListener('DOMContentLoaded', (event) => {
//     var dropdowns = document.querySelectorAll('.dropdown-menu');
//     dropdowns.forEach(function (dropdown) {
//         dropdown.classList.remove('show');
//     });
// });


// ****************************************************************
// Useful functions

// Do things after DOM has fully loaded
const onReady = (callback) => {
    if (document.readyState != 'loading') callback();
    else if (document.addEventListener) document.addEventListener('DOMContentLoaded', callback);
    else document.attachEvent('onreadystatechange', function () {
        if (document.readyState == 'complete') callback();
    });
};


// ****************************************************************
// ****************************************************************
// Drag move windows

// https://github.com/knadh/dragmove.js
// Kailash Nadh (c) 2020.
// MIT License.

let _loaded = false;
let _callbacks = [];
const _isTouch = window.ontouchstart !== undefined;

const dragmove = function (target, handler, onStart, onEnd) {
    // Register a global event to capture mouse moves (once).
    if (!_loaded) {
        document.addEventListener(_isTouch ? "touchmove" : "mousemove", function (e) {
            let c = e;
            if (e.touches) {
                c = e.touches[0];
            }

            // On mouse move, dispatch the coords to all registered callbacks.
            for (var i = 0; i < _callbacks.length; i++) {
                _callbacks[i](c.clientX, c.clientY);
            }
        });
    }

    _loaded = true;
    let isMoving = false, hasStarted = false;
    let startX = 0, startY = 0, lastX = 0, lastY = 0;

    // On the first click and hold, record the offset of the pointer in relation
    // to the point of click inside the element.
    handler.addEventListener(_isTouch ? "touchstart" : "mousedown", function (e) {
        if (['div', 'label', 'p', 'h2'].includes(e.target.tagName.toLowerCase())) {
            e.stopPropagation();
            e.preventDefault();
            if (target.dataset.dragEnabled === "false") {
                return;
            }

            let c = e;
            if (e.touches) {
                c = e.touches[0];
            }

            isMoving = true;
            startX = target.offsetLeft - c.clientX;
            startY = target.offsetTop - c.clientY;
        }
    });


    // On leaving click, stop moving.
    document.addEventListener(_isTouch ? "touchend" : "mouseup", function (e) {
        if (onEnd && hasStarted) {
            onEnd(target, parseInt(target.style.left), parseInt(target.style.top));
        }

        isMoving = false;
        hasStarted = false;
    });

    // Register mouse-move callback to move the element.
    _callbacks.push(function move(x, y) {
        if (!isMoving) {
            return;
        }

        if (!hasStarted) {
            hasStarted = true;
            if (onStart) {
                onStart(target, lastX, lastY);
            }
        }

        lastX = x + startX;
        lastY = y + startY;

        // If boundary checking is on, don't let the element cross the viewport.
        if (target.dataset.dragBoundary === "true") {
            lastX = Math.min(window.innerWidth - target.offsetWidth, Math.max(0, lastX));
            lastY = Math.min(window.innerHeight - target.offsetHeight, Math.max(0, lastY));
        }

        target.style.left = lastX + "px";
        target.style.top = lastY + "px";
    });
}

// export { dragmove as default };

onReady(() => {
    dragmove(document.querySelector("#modal-wheel-setting"), document.querySelector("#modal-wheel-setting .modal-content"));
    // Modal draggable
    // $('#modal-wheel-setting ').find('.modal-dialog:first').draggable({
    //     handle: ".modal-content"
    // });
});


// ****************************************************************
// ****************************************************************
// TOC auto make 

onReady(() => {
    window.Toc = {
        helpers: {
            // return all matching elements in the set, or their descendants
            findOrFilter: function (el, selector) {
                var descendants = Array.from(el).flatMap(el => Array.from(el.querySelectorAll(selector)));
                return Array.from(el).filter(el => el.matches(selector))
                    .concat(descendants)
                    .filter(el => !el.hasAttribute('data-toc-skip'));
            },

            generateUniqueIdBase: function (el) {
                var text = el.textContent;
                // Regex for finding the non-safe URL characters (many need escaping): & +$,:;=?@"#{}|^~[`%!'<>]./()*\ (newlines, tabs, backspace, & vertical tabs)
                var nonsafeChars = /[& +$,:;=?@"#{}|^~[`%!'<>\]\.\/\(\)\*\\\n\t\b\v]/g,
                    urlText;
                // Note: we trim hyphens after truncating because truncating can cause dangling hyphens.
                // Example string:                      // " ⚡⚡ Don't forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
                urlText = text
                    .trim() // "⚡⚡ Don't forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
                    .replace(/\'/gi, "") // "⚡⚡ Dont forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
                    .replace(nonsafeChars, "-") // "⚡⚡-Dont-forget--URL-fragments-should-be-i18n-friendly--hyphenated--short--and-clean-"
                    .replace(/-{2,}/g, "-") // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated-short-and-clean-"
                    .substring(0, 64) // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated-"
                    .replace(/^-+|-+$/gm, "") // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated"
                    .toLowerCase(); // "⚡⚡-dont-forget-url-fragments-should-be-i18n-friendly-hyphenated"
                return urlText || el.tagName.toLowerCase();
            },

            generateUniqueId: function (el) {
                var anchorBase = this.generateUniqueIdBase(el);
                for (var i = 0; ; i++) {
                    var anchor = anchorBase;
                    if (i > 0) {
                        // add suffix
                        anchor += "-" + i;
                    }
                    // check if ID already exists
                    if (!document.getElementById(anchor)) {
                        return anchor;
                    }
                }
            },

            generateAnchor: function (el) {
                if (el.id) {
                    return el.id;
                } else {
                    var anchor = this.generateUniqueId(el);
                    let el_save = el;
                    while ((el = el.parentElement) && !((el.matches || el.matchesSelector).call(el, '.row')));
                    el = el || el_save;
                    el.id = anchor;
                    return anchor;
                }
            },

            createNavList: function () {
                let ulElement = document.createElement('ul');
                ulElement.className = 'nav navbar-nav';
                return ulElement;
            },

            createChildNavList: function (parent) {
                var childList = this.createNavList();
                parent.appendChild(childList);
                return childList;
            },

            generateNavEl: function (anchor, text) {
                let a = document.createElement('a');
                a.className = 'nav-link';
                a.setAttribute('href', '#' + anchor);
                a.textContent = text;
                let li = document.createElement('li');
                li.appendChild(a);
                return li;
            },

            generateNavItem: function (headingEl) {
                var anchor = this.generateAnchor(headingEl);
                var text = headingEl.getAttribute("toc-text") || headingEl.textContent;
                return this.generateNavEl(anchor, text);
            },

            // Find the first heading level (`<h1>`, then `<h2>`, etc.) that has more than one element. Defaults to 1 (for `<h1>`).
            getTopLevel: function (scope) {
                for (var i = 1; i <= 6; i++) {
                    var headings = this.findOrFilter(scope, "h" + i);
                    if (headings.length > 1) {
                        return i;
                    }
                }

                return 1;
            },

            // returns the elements for the top level, and the next below it
            getHeadings: function (scope, topLevel) {
                var topSelector = "h" + topLevel;

                var secondaryLevel = topLevel + 1;
                var secondarySelector = "h" + secondaryLevel;

                return this.findOrFilter(scope, topSelector + "," + secondarySelector);
            },

            getNavLevel: function (el) {
                return parseInt(el.tagName.charAt(1), 10);
            },

            populateNav: function (topContext, topLevel, headings) {
                var context = topContext;
                var prevNav;

                var helpers = this;
                headings.forEach(function (el, i) {
                    var newNav = helpers.generateNavItem(el);
                    var navLevel = helpers.getNavLevel(el);

                    // determine the proper context
                    if (navLevel === topLevel) {
                        // use top level
                        context = topContext;
                    } else if (prevNav && context === topContext) {
                        // create a new level of the tree and switch to it
                        context = helpers.createChildNavList(prevNav);
                    } // else use the current context

                    context.appendChild(newNav);

                    prevNav = newNav;
                });
            },

            parseOps: function (arg) {
                var opts = {};
                opts.nav = arg;
                opts.scope = opts.scope || [document.body];
                return opts;
            }
        },

        // accepts a jQuery object, or an options object
        init: function (opts) {
            opts = this.helpers.parseOps(opts);

            // ensure that the data attribute is in place for styling
            opts.nav.setAttribute("data-toggle", "toc");

            var topContext = this.helpers.createChildNavList(opts.nav);
            var topLevel = this.helpers.getTopLevel(opts.scope);
            var headings = this.helpers.getHeadings(opts.scope, topLevel);
            this.helpers.populateNav(topContext, topLevel, headings);
        }
    };

    onReady(() => {
        document.querySelectorAll('nav[data-toggle="toc"]').forEach(function (el, i) {
            Toc.init(el);
        });
        drawPath();
    });
});

// ****************************************************************
// ****************************************************************
// TOC

var toc = document.querySelector('.toc');
var tocPath = document.querySelector('.toc-marker path');
var tocItems;
// Factor of screen size that the element must cross
// before it's considered visible
var TOP_MARGIN = 0.1,
    BOTTOM_MARGIN = 0.2;
var pathLength;
window.addEventListener('resize', drawPath, false);
window.addEventListener('scroll', sync, false);
drawPath();

function drawPath() {
    tocItems = [].slice.call(toc.querySelectorAll('li'));
    // Cache element references and measurements
    tocItems = tocItems.map(function (item) {
        var anchor = item.querySelector('a');
        var target = document.getElementById(anchor.getAttribute('href').slice(1));
        return {
            listItem: item,
            anchor: anchor,
            target: target
        };
    });
    // Remove missing targets
    tocItems = tocItems.filter(function (item) {
        return !!item.target;
    });
    var path = [];
    var pathIndent;
    tocItems.forEach(function (item, i) {
        var x = item.anchor.offsetLeft - 5,
            y = item.anchor.offsetTop,
            height = item.anchor.offsetHeight;
        if (i === 0) {
            path.push('M', x, y, 'L', x, y + height);
            item.pathStart = tocPath.getTotalLength() || 0;
        }
        else {
            // Draw an additional line when there's a change in
            // indent levels
            if (pathIndent !== x) path.push('L', pathIndent, y);
            path.push('L', x, y);

            // Set the current path so that we can measure it
            tocPath.setAttribute('d', path.join(' '));
            item.pathStart = tocPath.getTotalLength() || 0;

            path.push('L', x, y + height);
        }

        pathIndent = x;

        tocPath.setAttribute('d', path.join(' '));
        item.pathEnd = tocPath.getTotalLength();
    });

    pathLength = tocPath.getTotalLength();

    sync();

}

function sync() {

    var windowHeight = window.innerHeight;

    var pathStart = Number.MAX_VALUE,
        pathEnd = 0;

    var visibleItems = 0;

    tocItems.forEach(function (item) {
        var targetBounds = item.target.getBoundingClientRect();

        if (targetBounds.bottom > windowHeight * TOP_MARGIN && targetBounds.top < windowHeight * (1 - BOTTOM_MARGIN)) {
            pathStart = Math.min(item.pathStart, pathStart);
            pathEnd = Math.max(item.pathEnd, pathEnd);

            visibleItems += 1;

            item.listItem.classList.add('visible');
        }
        else {
            item.listItem.classList.remove('visible');
        }

    });

    // Specify the visible path or hide the path altogether
    // if there are no visible items
    if (visibleItems > 0 && pathStart < pathEnd) {
        tocPath.setAttribute('stroke-dashoffset', '1');
        tocPath.setAttribute('stroke-dasharray', '1, ' + pathStart + ', ' + (pathEnd - pathStart) + ', ' + pathLength);
        tocPath.setAttribute('opacity', 1);
    }
    else {
        tocPath.setAttribute('opacity', 0);
    }
}

// ****************************************************************
// ****************************************************************
//

var q_email = document.querySelector('#email');
var email_href = q_email.getAttribute("href");
q_email.setAttribute("href", email_href.substring(0, 7) + "admin" + email_href.substring(14, 15) + "bitlogic.systems" + email_href.substring(24));

