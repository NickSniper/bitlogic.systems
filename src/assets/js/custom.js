// <!-- Copyright © 2011-2023 bitLogic.systems -->

$(document).ready(function () {

    // Modal draggable
    $('.modal').find('.modal-dialog:first').draggable({
        handle: ".modal-content"
    });

    // fadeRangeOnInput = function (input, range) {
    //     console.log(input, range);
    //     const fadeRangeOut = document.getElementById('#fadeRangeOut');
    //     fadeRangeOut.textContent = input.value;
    //     const elements = document.querySelectorAll('.image-fade-left');

    //     elements.forEach(function (element) {
    //         const afterElement = window.getComputedStyle(element, '::after');
    //         afterElement.width = '50%';
    //     });
    // }

});

