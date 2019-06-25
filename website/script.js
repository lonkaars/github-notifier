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


// Navbar scroll effects
$(window).on('scroll', function() {
    if($(window).scrollTop()){
        $('.header').addClass('show')
        $('body').addClass('show')
        $('.downarrow').addClass('show')
    }
    else {
        $('body').removeClass('show')
        $('.header').removeClass('show')
        $('.downarrow').removeClass('show')
    }
})

// Invitelink hover
$('.invitelink').hover(
    () => {
        $(this).addClass('hover');
        console.log('gert')
    },
    () => {
        $(this).removeClass('hover');
    }
)