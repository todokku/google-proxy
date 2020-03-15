$.extend({
	prettyform:function(form){
		$(".item-info").not('.info-default').css("display","none");
		var $form =$("form#"+form.id);
		//remean checkox req cause checkbox value is no empty(on/off), in result: remote will disable
		$form.find(":input[type=checkbox]").each(function(){
			if($(this).attr("req") != undefined){
				$(this).removeAttr("req");
				$(this).attr("remote","return this.checked === true");
			}
		});

		//support pretty file upload action
		var fileuploadBtn ="<span tabindex='0' class='file-btn'>文件上传</span>";

		var nextcode ="var p=this.nextSibling; while(p && p.nodeType!=1) p=p.nextSibling; "
		var prevcode ="var p = this.previousSibling; while(p && p.nodeType!=1) p=p.previousSibling; "
		var onclickCode = nextcode + "p.click();";
		var onfocusCode = nextcode + "p.focus();";
		var onchangeCode= prevcode + "p.innerHTML = this.value.substring(this.value.lastIndexOf('\\\\')+1 || this.value.lastIndexOf('/')+1) ||'文件上传';";
		$form.find(":input[type=file]").each(function(){
			$(this).wrap("<span class='file-container'></span>");
			var $fileuploadBtn =$(fileuploadBtn).attr("onfocus",onfocusCode).attr("onclick",onclickCode);
			$(this).before($fileuploadBtn);
			$(this).attr("onchange",onchangeCode);
		});

		return $.validateform(
				$.extend(form,{
					fieldFocus:function(target,text){
						this.update(target,text, 'input-focus');
					},
					fieldInvalid:function(target,text){
						this.update(target,text, 'input-error');
					},
					fieldEffect:function(target,text){
						this.update(target,text);
					},
					update :function(target,text,clazz){
						var $target =$(target);
						if($target.attr("type") == "file"){
							$target = $target.parent();
						}
						
						$target.removeClass('input-focus input-error');
						if(clazz){
							$target.addClass(clazz);
						}
						
						$target.nextAll(".item-info").hide();
						$target.nextAll(text).show();
					}
				})
			);
	}
});