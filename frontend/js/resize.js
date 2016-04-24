(function() {
    var resize = function() {
        var width = $(window).width();
        //$(".content .page").width(width - 20);
        var className = null;
        if (width > 1358) {
            if ($('.container:first').hasClass('container-l')) {
                return;
            }
            className = 'container-l';
        }
        else if (width > 1248) {
            if ($('.container:first').hasClass('container-m')) {
                return;
            }
            className = 'container-m';
        }
        else{
            if ($('.container:first').hasClass('container-s')) {
                return;
            }
            className = 'container-s';
        }

        $('.container').each(function() {
            $(this).removeClass('container-l').removeClass('container-m')
                .removeClass('container-s').addClass(className);
        })
    };

    $(window).resize(resize);

    $(window).ready(resize);
})();