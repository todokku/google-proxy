(function($) {
	$(function() {
		$.prettyform({
			id: "query",
			//required
			active: false //任一表单值发生改变，每个表单项都重新检测，使用eq时推荐开启 默认false
		});

		let requestId = null;
		$('#search-box').keyup(function() {
			requestId = new Date().getTime();
			$.ajax({
				url: '/complete/search?q=' + encodeURIComponent($(this).val()),
				type: 'get',
				dataType: 'json',
				requestId: requestId
			}).done(function(data) {
				if (this.requestId !== requestId) {
					return;
				}
				var $autocomplete = $('.auto-complete-box');
				$autocomplete.empty();

				$(data[1]).each(function(i, text) {

					let pureText = $("<span></span>").html(text[0]).text();
					var target = $('<div></div>').attr('class', 'auto-complete-item').text(pureText).click(function() {
						$('#search-box').val($(this).text());
						$('#query').submit();
					});

					$autocomplete.append(target);
				});

				$autocomplete.show();
			});
		});

		$('.auto-complete-box').hide();

		$(document).click(function(e) {
			$('.auto-complete-box').hide();
			$('.auto-complete-box').empty();
		});

		$('.language a').click(function() {
			let hl = $(this).data('hl');

			window.location.href = `/setLanguage?hl=${hl}&redirectUrl=` + encodeURIComponent(window.location.href);

		})

	});
})(window.jQuery);
