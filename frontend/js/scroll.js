(function($){
    
    $(function(){
        var $container = $('.header + .container'),
            $query = $('#query'),
            containerTop = $container.position().top,
            headerHeight = $query.height(),
            headerHidden = false,
            preScrollTop = 0, top = 0, bottom = 0;
        
        $(document).scroll(function(event){
            var scrollTop = $(document).scrollTop();
            var top = $query.position().top;
            
            var detaTop = top - scrollTop + preScrollTop;
            
            if(detaTop < -headerHeight){
                detaTop = -headerHeight;
            }
            
            if(detaTop > 0){
                detaTop = 0;
            }
            
            if(scrollTop < headerHeight){
                if(top != 0){
                    $query.css("top", 0);
                }
            }
            
            //下滑隐藏
            else if(scrollTop - preScrollTop > 0 && top > -headerHeight){
                $query.css("top", detaTop);
            }
            //上拉出现
            else if(scrollTop - preScrollTop < 0 && top < 0){
                $query.css("top", detaTop);
            }
            
            preScrollTop = scrollTop;
            
          /*  clearTimeout($.data(this,"scrollTimer"));
            $.data(this, "scrollTimer",setTimeout(function(){
                scrollend();
            },250));*/
            
            
        });
        
        $(document).on("touchend",function(event){
            var scrollTop = $(document).scrollTop();
            var top = $query.position().top;
           
            if(scrollTop >= headerHeight && top < -headerHeight/2 && top != -headerHeight){
                 $query.css("top",-headerHeight);
            }
            else if(scrollTop < headerHeight || top >= -headerHeight/2 && top != 0){
                 $query.css("top",0);
            }
        });
    });
})(window.jQuery);