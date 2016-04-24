
(function($){
    var PagesSlider = function (slider, options) {  
        this.slider = slider;
        this.content = slider.children().first();
        this.currentIndex = 0;
        this.options = options;
        this.pages = this.content.children();
        
       
        this.mobile = 'ontouchstart' in document.documentElement;
        this.touchstart = this.mobile && 'touchstart' || 'mousedown';
        this.touchend =  this.mobile && 'touchend' || 'mouseup';
        this.touchmove =  this.mobile && 'touchmove' || 'mousemove';
    
        var totalWidth = 0, firstWidth = 0;
        this.pages.each(function (index, page) {
            var width = $(page).width();
            $(page).width(width);//考虑若是百分比 之后设置slider width 会直接影响自身
            totalWidth += width;
            
            if(index == 0){
                firstWidth = width;
            }
        });
        
        this.slider.width(firstWidth);
        this.content.width(totalWidth);
        
    
        this.bindEvents();
        
    };
    $.extend(PagesSlider.prototype, {
        bindEvents: function () {
            this._removeTransition = $.proxy(this.removeTransition, this);
            this._startDrag = $.proxy(this.startDrag, this);
            this._doDrag = $.proxy(this.doDrag, this);
            this._endDrag = $.proxy(this.endDrag, this);
    
            this.content
                .on(this.touchstart, this._startDrag)
                .on('transitionend', this._removeTransition);
            $('body')
                .on(this.touchmove, this._doDrag)
                .on(this.touchend, this._endDrag);
                
        },
        destroy: function () {
            this.content
                .off(this.touchstart, this._startDrag)
                .off('transitionend', this._removeTransition);
            $('body')
                .off(this.touchmove, this._doDrag)
                .off(this.touchend, this._endDrag);
        },
        getClientX: function(event){
             if(this.mobile){
                 return event.originalEvent.changedTouches[0].clientX;
             }
             return event.clientX;
        },
        startDrag: function (event) {
           // console.log("start");
            this.pressed = true;
            this.dragStartX = this.getClientX(event);
            this.dragStartTime = new Date().getTime();
        },
        doDrag: function (event) {
            if(!this.pressed){
                return ;
            }
           // console.log("doDrag");
            var delta = this.getClientX(event) - this.dragStartX;
            var dragTime = new Date().getTime();
            
            if (this.enableDrag) {
                var position = this.pages.eq(this.currentIndex).position();
                this.content.css('transform', 'translate3d(' + (delta - position.left) + 'px, 0, 0)');
                event.preventDefault();
            }
            else if(Math.abs(delta)/(dragTime - this.dragStartTime) >= 0.2){
                this.enableDrag = true;
                this.dragStartX = this.getClientX(event);
                delta = 0;
            }
            
        },
        endDrag: function (event) {
            
            //console.log("endDrag");
            this.pressed =false;
            
            if (this.enableDrag) {
                this.enableDrag = false;
    
                var delta = this.getClientX(event) - this.dragStartX;
                
                if (Math.abs(delta) > this.slider.width() / 5) {
                    if (delta < 0) {
                        this.next();
                    } else {
                        this.prev();
                    }
                } else {
                    this.current();
                }
            }
        },
        removeTransition: function() {
            this.content.css('transition', 'none');
        },
        goToIndex: function (index) {
            var position = this.pages.eq(index).position();
    
            this.content
                .css('transition', 'all 400ms ease')
                .css('transform', 'translate3d(' + (-1 * (position.left)) + 'px, 0, 0)');
    
            this.currentIndex = index;
            
            this.options && this.options.onload && this.options.onload(this.pages.eq(index), index);
        },
        current: function (nullity) {
            if(this.currentIndex == 0 && nullity){
                this.options && this.options.firstalready && this.options.firstalready(this.pages.eq(this.currentIndex));
            }
            else if(this.currentIndex == this.pages.length -1 && nullity){
                this.options && this.options.lastalready && this.options.lastalready(this.pages.eq(this.currentIndex));
            }
            this.goToIndex(this.currentIndex);
        },
        next: function () {
            if (this.currentIndex >= this.pages.length - 1) {
                this.current(true);
            } else {
                this.goToIndex(this.currentIndex + 1);
            }
        },
        prev: function () {
            if (this.currentIndex <= 0) {
                this.current(true);
            } else {
                this.goToIndex(this.currentIndex - 1);
            }
        }
    });
    
    $.fn.pagesSlider = function(options) {
        this.each(function(index, slider) {
            var $this = $(slider);
            var pagesSlider = new PagesSlider($this,options);
            $this.data('pagesSlider', pagesSlider);
        });
        return this;
    };
    
})(jQuery);

$(function() {
    var loading= $("<div style='width:100%;height:100%;left:50%;margin-left:-100px;position:relative;'><img src='/img/loading_spinner.gif'/></div>");
	
	var $links = $('.newschannel a');
	
    var $silder = $('.slider').pagesSlider({
        onload: function(target, index){
            togglehover($links.eq(index));
            if($(target).data('loaded')){
                return;
            }
            $(target).html(loading.clone());
            $(target).load('/rss?c=' + $(target).data('channel'), function(){
                $(target).data('loaded', true);
               
            });
        },
        firstalready: function(){
            $("#tip-msg #text").text("已在新闻首页");
            $("#tip-msg").css("margin-left",-$("#tip-msg").outerWidth()/2).css("margin-top",-$("#tip-msg").outerHeight()/2).show().fadeOut(1600);
        },
        lastalready: function(){
            $("#tip-msg #text").text("没有更多新闻");
            $("#tip-msg").css("margin-left",-$("#tip-msg").outerWidth()/2).css("margin-top",-$("#tip-msg").outerHeight()/2).show().fadeOut(1600);
        }
    });
    
    var togglehover =function(target){
        $links.removeClass("hover");
        $(target).addClass("hover");
    };
    $links.each(function(index){
        
        $(this).click(function(event){
            $silder.data('pagesSlider').goToIndex(index);
        });
    });
    
    $links.eq(0).click();
    
});