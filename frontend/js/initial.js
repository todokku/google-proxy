(function($) {
	$(function() {
		$.prettyform({
			id: "query",
			//required
			active: false //任一表单值发生改变，每个表单项都重新检测，使用eq时推荐开启 默认false
		});

		let requestId = null;

		let processor = function(data){
			if (this.requestId !== requestId) {
				return;
			}
			var $autocomplete = $('.auto-complete-box');
			$autocomplete.empty();

			$(data[1]).each(function(i, text) {

				let pureText = $("<span></span>").html(text[0]).text();
				var target = $('<div></div>').attr('class', 'auto-complete-item').text(pureText).click(function() {
					$('.search-box').val($(this).text());
					$('#query').submit();
				});

				$autocomplete.append(target);
			});

			$autocomplete.show();
		};

		$('.search-box').click(function(e) {
			if($(this).val()){
				return ;
			}
			requestId = new Date().getTime();
			$.ajax({
				url: '/top',
				type: 'get',
				dataType: 'json',
				requestId: requestId
			}).done(processor);
		}).keyup(function() {
			requestId = new Date().getTime();
			$.ajax({
				url: '/complete/search?q=' + encodeURIComponent($(this).val()),
				type: 'get',
				dataType: 'json',
				requestId: requestId
			}).done(processor);

		});

		$('.auto-complete-box').hide();


        $(window).click(function() {
			$('.auto-complete-box').empty().hide();
        });

		$('select').each((index, item) => {
			item = $(item);
			item.hide();
			let value = item.val();
			let selector = $('<div class="selector"></div>');
			let label = $('<div class="label"></div>');
			let dropdownArrow = $('<div class="dropdown-arrow"></div>');
			selector.append(label);
			selector.append(dropdownArrow);
			let optionGroup = $('<div class="option-group"></div>');
			selector.hover((e) =>{
				optionGroup.show();
			}, () =>{
				optionGroup.hide();
			});
			optionGroup.hide();
			item.find('option').each((idx, option) => {
				let text = $(option).text();
				let val = $(option).val();

				let opt = $('<div class="option"></div>').text(text).data('val', val);
				opt.click((e) => {
					e.stopPropagation();
					label.text(text);
					item.val(val);
					selector.find('.option').not(opt).removeClass('selected');
					opt.addClass('selected');
					optionGroup.hide();

					if(value !== val){
						$('.submit-btn').click();
					}
				});
				if(value === val){
					opt.click();
				}
				opt.appendTo(optionGroup);
			});
			selector.append(optionGroup);

			selector.insertBefore(item);
			selector.width(optionGroup.width());


		})








	});
})(window.jQuery);
