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
				url: '/autosuggest?q=' + $(this).val(),
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

					var target = $('<div></div>').attr('class', 'auto-complete-item').text(text[0]).click(function() {
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
	});
})(window.jQuery);