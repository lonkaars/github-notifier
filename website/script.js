$(document).ready(() => {
    // preload
    $("body").removeClass("preload");

    // Arrow bobbing
    anime({
        targets: ".downarrow",
        translateY: ['-15px', '15px'],
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
        duration: 1300
    })
})

var arrow = 'show'
var prevarrow = ['show', 'show']


// Navbar scroll effects
$(window).on('scroll', function() {
    if($(window).scrollTop()){
        $('.header').addClass('show')
        $('body').addClass('show')
        $('.downarrow').addClass('show')
        shiftarrow(`hide`);
    }
    else {
        $('body').removeClass('show')
        $('.header').removeClass('show')
        $('.downarrow').removeClass('show')
        shiftarrow(`show`);
    }
    if(prevarrow[0] != prevarrow[1]){
        showHideArrow(prevarrow[0])
    }
})

function shiftarrow(val){
    prevarrow[1] = prevarrow[0]
    prevarrow[0] = val
}

function showHideArrow(showhide){
    anime({
        targets: '.downarrow',
        easing: 'easeInOutSine',
        duration: 300,
        opacity: showhide == 'show' ? [0, 1] : [1, 0]
    })
}