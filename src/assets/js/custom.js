// <!-- Copyright © 2011-2023 bitLogic.systems -->

// var settingsHeaderButton = document.getElementById('settingsButton');
// var contentDiv = document.getElementById('settingsHeader');

// settingsHeaderButton.addEventListener('click', function () {
//     if (contentDiv.style.display === 'none') {
//         contentDiv.style.display = 'block';
//     } else {
//         contentDiv.style.display = 'none';
//     }
// });

// const d = document;

// d.getElementById('settingsButton').addEventListener('click', function () {
//     // var contentDiv = document.getElementById('settingsHeader');
//     // contentDiv.classList.toggle('hidden');
//     // reset modal if it isn't visible
//     if (!($('.modal.in').length)) {
//         $('.settings-wheel-modal-dialog').css({
//             top: 0,
//             left: 0
//         });
//     }
//     $('#settingsWheelModal').modal({
//         backdrop: false,
//         show: true
//     });

//     $('.settings-wheel-modal-dialog').draggable({
//         handle: ".modal-header"
//     });
// });

$(document).ready(function () {
    $('.modal').find('.modal-dialog:first').draggable().css({
        "position": "absolute",
        "top": "25%",
        "left": "37.5%"
    });

    $('.modal').find('.modal-dialog:first').draggable({
        scroll: false,
        //handle: '.modal-header',          
        start: function (e) {
            const draggable = $(this)[0];
            const contentResizable = draggable;

            const paddingHeight = 30;
            const scrollTop = $(window).scrollTop();
            const scrollLeft = $(window).scrollLeft();

            const top = scrollTop - paddingHeight;
            const right = $(window).width() - contentResizable.offsetWidth;
            const bottom = scrollTop + $(window).height() - paddingHeight - contentResizable.offsetHeight;

            $(this).draggable({
                containment: [scrollLeft, top, scrollLeft + right, bottom]
            })
        }
    });
});