/*
var form =$.validateform({
	id:string //requried
	active:boolean //optional
	formReady(form) //optional
	fieldChange() //notify调用 optional
	fieldFocus(field, text) //optional
	fieldEffect(field, text) //optional
	fieldInvalid(field, text) //optional
})

form ={
	notify() //call when form change 
	check(feature) //validate all form fields 
	submit()//check(true) & submit (deprecated input[submit] instead)
}

field 支持input[checkbox text password file] select textarea
	可用限制 req: void 对应提示reg-msg:string[requried{0}]
			eq: string[inputId] 对应提示eq-msg:string[{0}eq{1}]
			min: int 对应提示min-msg:string[{0}min{1}]
			max: int 对应提示max-msg:string[{0}max{1}]
			remote: string[javacript] 对应提示remote-msg:string[remote{0}]
			reg:string[^.*$] 对应提示reg-msg:string[reg{0}]
	
	聚焦提示 tip-msg:string[focuson{0}]
	有效提示 succ-msg:stirng[valid{0}]
	默认提示 msg:string[{0}支持{1}]
	属性名 tip:string[默认name]

	使用须知：支持file checkbox 但默认不提供UI提示
	
*/

$.extend({
			randomUUID:function(){
				var random4 =function(){return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);};
				return (random4() + random4() + "-" + random4() + "-" + random4() + "-" + random4() + "-" + random4() + random4() + random4());
			},
			validateform: function(myform){
				var _f= myform.id && $("form#"+myform.id);
				if(!_f) return ;
				var message={
					req : "{0}不能为空",
					eq : "{0}与{1}不一致",
					remote : "{0}验证失败",
					max : "{0}不能超过{1}位",
					min : "{0}不能小于{1}位",
					reg : "{0}不符合规范",
					tip : "请输入{0}",
					succ : "{0}输入正确"
				};
				var cData={};
				var _form={
					_target:_f,
					_fields:[],
					notify:function(){//表单域发生改变时 通知
						_fields=_f.find(":input").not(":input[type=button],:input[type=submit],:input[type=reset],:input[type=hidden],:input[type=image]");
						var addon = _fields.not(":input[uid]");
						addon.each(function(){
							$(this).attr('uid',$.randomUUID());
							//cData[$(this).attr('uid')]=$(this).val();
						});
						addon.each(function(){
							$(this).focusin(function(){
								//$(this).val(cData[$(this).attr("uid")]);//恢复缓存数据
								if(myform.fieldFocus){
									myform.fieldFocus(this,_form.generateMsg(this,"tip")) 
								}else{
									_form.fieldFocus(this,_form.generateMsg(this,"tip")); 
								}
							}).focusout(function(){
								//cData[$(this).attr("uid")]=$(this).val();//保存缓存数据
								_form.check(myform.active) && myform.formReady && myform.formReady(_f);
								myform.active || _form.fieldCheck(this,true);
							});
						});
						if(myform.fieldChange){
							myform.fieldChange();
						}
					},
					check:function(feature){
						var flag=true;
						_fields.each(function(){
							flag = _form.fieldCheck(this,feature) && flag;
							return true;
						});
						return flag;
					},
					getValue:function(field){
						//return cData[$(field).attr("uid")]||"";
						return $(field).val();
					},
					fieldCheck:function(field,feature){
						var remote = function(code){
							return eval("(function(){" + code + "}).call(this)");//direct eval
						};
						return !!(($(field).attr("req")==undefined || _form.getValue(field) || _form.handler(field,"req",feature)) 
							&& ($(field).attr("eq")==undefined || $("#"+$(field).attr("eq")).val()==_form.getValue(field) || _form.handler(field,"eq",feature))
							&& ($(field).attr("max")==undefined || _form.getValue(field).length <= $(field).attr("max") || _form.handler(field,"max",feature))
							&& ($(field).attr("min")==undefined || _form.getValue(field).length >= $(field).attr("min") || _form.handler(field,"min",feature))
							&& ($(field).attr("reg")==undefined || new RegExp($(field).attr("reg")).test(_form.getValue(field)) || _form.handler(field,"reg",feature)) 
							&& ($(field).attr("remote")==undefined || remote.call(field,$(field).attr("remote")) || _form.handler(field,"remote",feature))
							&& _form.handler(field,"succ",feature)) ;
					},
					handler:function(field,type,feature){
						if(!feature){
							return type=="succ";
						}
						if(type=="succ"){
							if(myform.fieldEffect){
								myform.fieldEffect(field,_form.generateMsg(field,type));
							} else{
								_form.fieldEffect(field,_form.generateMsg(field,type));
							} 
							return true;
						}else{
							if(myform.fieldInvalid){
								myform.fieldInvalid(field,_form.generateMsg(field,type));
							}else{
								_form.fieldInvalid(field,_form.generateMsg(field,type));
							}
							return false;
						}
						
						
					},
					generateMsg:function(field,type){
						var args = [];
						args.push(_form.toString(field));
						var text= $(field).attr(type + "-msg") || $(field).attr("msg") || message[type];
						
						var hasNoArguementType = ["req","remote","reg","tip","succ"];
						for(var i in hasNoArguementType){
							if(hasNoArguementType[i] == type){
								return _form.formatter(text,args);
							}
						}
						if("eq" == type){
							args.push(_form.toString($("#"+ $(field).attr("eq"))));
							return _form.formatter(text,args);
						}
						if("max" == type || "min" == type){
							args.push($(field).attr(type));
							return _form.formatter(text,args);
						}
						return "";
					},
					toString: function(field){
						return $(field).attr("tip") || $(field).attr("name") || ""; 
					},
					formatter:function(text, extras){
						var paramReg = /(\{\d\})+/g;
						var match = paramReg.exec(text);
						for(var index=0; match != null; index++){
							text = text.replace(match[0],extras[index] || "");
							match = paramReg.exec(text);
						}
						return text;
					},
					submit:function(){
						if(!myform.onSubmit || myform.onSubmit()){
							_form.check(true) && _f.submit();
						}
					},
					
					fieldFocus:function(field, text){
						$(field).attr("placeholder",text);
					},
					fieldInvalid:function(field,text){
						var progressId=$(field).attr("uid")+"_busy";
						if(cData[progressId])
							return;
						cData[progressId]=$(field).val();
						$(field).val("");
						var toggleText=function(){
							$(field).attr("placeholder",!$(field).attr("placeholder") && text || "");
						};
						for(var i=0;i<3+($(field).attr("placeholder")&&1||0);i++){
							setTimeout(toggleText,200*i);
						}
						setTimeout(function(){
							$(field).val(cData[progressId]);
							cData[progressId]=undefined;
						},1000);

					},
					fieldEffect:function(field,text){
						$(field).attr("placeholder","").val(_form.getValue(field));
					}
				};
				_f.submit(function(){
					return _form.check(true);
				});
				_form.notify();

				return {
					notify:_form.notify,
					submit:_form.submit,
					check:_form.check
				};
			}
		});