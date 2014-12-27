// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Sharrre
$(document).ready(function() {
  $('#twitter').sharrre({
    share: {
      twitter: true
    },
    template: '<a class="box" href="#"><div class="count" href="#">{total}</div><div class="share"><span></span>Tweet</div></a>',
    enableHover: false,
    enableTracking: true,
    buttons: { twitter: {via: 'bentanweihao'}},
    click: function(api, options){
      api.simulateClick();
      api.openPopup('twitter');
    }
  });
  $('#facebook').sharrre({
    share: {
      facebook: true
    },
    template: '<a class="box" href="#"><div class="count" href="#">{total}</div><div class="share"><span></span>Like</div></a>',
    enableHover: false,
    enableTracking: true,
    click: function(api, options){
      api.simulateClick();
      api.openPopup('facebook');
    }
  });
  $('#googleplus').sharrre({
    share: {
      googlePlus: true
    },
    template: '<a class="box" href="#"><div class="count" href="#">{total}</div><div class="share"><span></span>Google+</div></a>',
    enableHover: false,
    enableTracking: true,
    click: function(api, options){
      api.simulateClick();
      api.openPopup('googlePlus');
    },
    urlCurl: '',
  });
});
