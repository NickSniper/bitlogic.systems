// <!-- Copyright © 2011-2023 bitLogic.systems -->

$(function () {

    // Modal draggable
    $('.modal').find('.modal-dialog:first').draggable({
        handle: ".modal-content"
    });

});


// ****************************************************************
// TOC auto make 

(function ($) {
    "use strict";
    window.Toc = {
        helpers: {
            // return all matching elements in the set, or their descendants
            findOrFilter: function ($el, selector) {
                // http://danielnouri.org/notes/2011/03/14/a-jquery-find-that-also-finds-the-root-element/
                // http://stackoverflow.com/a/12731439/358804
                var $descendants = $el.find(selector);
                return $el
                    .filter(selector)
                    .add($descendants)
                    .filter(":not([data-toc-skip])");
            },

            generateUniqueIdBase: function (el) {
                var text = $(el).text();

                // adapted from
                // https://github.com/bryanbraun/anchorjs/blob/65fede08d0e4a705f72f1e7e6284f643d5ad3cf3/anchor.js#L237-L257

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
                return $('<ul class="nav navbar-nav"></ul>');
            },

            createChildNavList: function ($parent) {
                var $childList = this.createNavList();
                $parent.append($childList);
                return $childList;
            },

            generateNavEl: function (anchor, text) {
                var $a = $('<a class="nav-link"></a>');
                $a.attr("href", "#" + anchor);
                $a.text(text);
                var $li = $("<li></li>");
                $li.append($a);
                return $li;
            },

            generateNavItem: function (headingEl) {
                var anchor = this.generateAnchor(headingEl);
                var $heading = $(headingEl);
                var text = $heading.data("toc-text") || $heading.text();
                return this.generateNavEl(anchor, text);
            },

            // Find the first heading level (`<h1>`, then `<h2>`, etc.) that has more than one element. Defaults to 1 (for `<h1>`).
            getTopLevel: function ($scope) {
                for (var i = 1; i <= 6; i++) {
                    var $headings = this.findOrFilter($scope, "h" + i);
                    if ($headings.length > 1) {
                        return i;
                    }
                }

                return 1;
            },

            // returns the elements for the top level, and the next below it
            getHeadings: function ($scope, topLevel) {
                var topSelector = "h" + topLevel;

                var secondaryLevel = topLevel + 1;
                var secondarySelector = "h" + secondaryLevel;

                return this.findOrFilter($scope, topSelector + "," + secondarySelector);
            },

            getNavLevel: function (el) {
                return parseInt(el.tagName.charAt(1), 10);
            },

            populateNav: function ($topContext, topLevel, $headings) {
                var $context = $topContext;
                var $prevNav;

                var helpers = this;
                $headings.each(function (i, el) {
                    var $newNav = helpers.generateNavItem(el);
                    var navLevel = helpers.getNavLevel(el);

                    // determine the proper $context
                    if (navLevel === topLevel) {
                        // use top level
                        $context = $topContext;
                    } else if ($prevNav && $context === $topContext) {
                        // create a new level of the tree and switch to it
                        $context = helpers.createChildNavList($prevNav);
                    } // else use the current $context

                    $context.append($newNav);

                    $prevNav = $newNav;
                });
            },

            parseOps: function (arg) {
                var opts;
                if (arg.jquery) {
                    opts = {
                        $nav: arg
                    };
                } else {
                    opts = arg;
                }
                opts.$scope = opts.$scope || $(document.body);
                return opts;
            }
        },

        // accepts a jQuery object, or an options object
        init: function (opts) {
            opts = this.helpers.parseOps(opts);

            // ensure that the data attribute is in place for styling
            opts.$nav.attr("data-toggle", "toc");

            var $topContext = this.helpers.createChildNavList(opts.$nav);
            var topLevel = this.helpers.getTopLevel(opts.$scope);
            var $headings = this.helpers.getHeadings(opts.$scope, topLevel);
            this.helpers.populateNav($topContext, topLevel, $headings);
        }
    };

    $(function () {
        $('nav[data-toggle="toc"]').each(function (i, el) {
            var $nav = $(el);
            Toc.init($nav);
        });
        drawPath();
    });
})(jQuery);

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
//

