 $(function(){
     $.fn.editable.defaults.mode = 'inline';//popup
     $.fn.editable.defaults.ajaxOptions = {type: "PUT"};
     
    Backbone.pubSub = _.extend({}, Backbone.Events);
    
    var Article = Backbone.Model.extend({
        urlRoot: '/articles',
        id : '_id',
        idAttribute: '_id',// url use
        initialize: function(article){
            this.set(article);
        }
    });

    var Articles = Backbone.Collection.extend({
        url:'/articles',
        model: Article,
        parse: function(resp){
           console.log(resp.data);
           return resp.data;
        }
       
    });
    
   var ArticleRow = Backbone.View.extend({
       tagName: 'tr',
       events: {
            "click .modify": "modify",
            "click .remove": "destroy",
            "click .view": "detail"
       },
       initialize: function() {
           var self = this;
           this.bind('editfinished', this.editfinished);
           this.render();
       },
       template: _.template($("#row_template").html()),
       render: function() {
           var self = this;
          // Load the compiled HTML into the Backbone "el"
          this.$el.html( this.template({model: this.model.attributes}) );
          this.$editableboxes = this.$el.find('td[data-type]');
          this.$editableboxes.each(function(){
              $(this).editable({
                  'showbuttons': false,
                  'toggle':'manual',
                  'onblur':'ignore' 
              });
          });
          
          this.$el.on('dblclick',function(){
              self.trigger('editfinished');
              self.$editableboxes.each(function(){
                  $(this).editable('show');
              });
          });
       },
       editfinished: function(event){
           this.$editableboxes.each(function(){
              $(this).editable('hide');
          });
       },
       
       modify: function(event){
           var self = this;
           
           this.model.save({
               'title': this.$title.val(),
               'content': this.$content.val()
           },{
               success: function(err, resp){
                   self.render();
               }
           });
       },
       destroy: function(event){
           var self = this;
           this.model.destroy({success: function(err, resp){
               self.remove();
           }});
       },
       detail: function(event){
           var self = this;
           this.model.fetch({success: function(err, resp){
               alert(JSON.stringify(resp));
           }});
       }
   });
   
   var TableView = Backbone.View.extend({
      el: $('#table'), 
      initialize: function() {
            var self = this;
            this.$tbody = this.$el.find('tbody');
            this.$tfoot =  this.$el.find('tfoot');
            this.$indicate = this.$tfoot.find('.btn-toolbar .btn-group[aria-label="indicate"]');
            this.$nav = this.$tfoot.find('.btn-toolbar .btn-group[aria-label="nav"]');
            this.$record = this.$tfoot.find('.btn-toolbar .btn-group[aria-label="record"]');
            this.$search = this.$tfoot.find('.btn-toolbar .btn-group[aria-label="search"]');
            
            this.collections= new Articles();
            this.collections.fetch({data:{perPage : 2}});
            
            this.collections.on('sync',function(method, resp){
                self.render(method, resp);
            });
       },
       render: function(method, resp) {
           var self = this;
           
            self.$tbody.empty();
            
            if(resp.page){
                var firstPage = resp.page -3 > 0 && resp.page -3 || 1, lastPage = (resp.page + 3 > resp.pages) && resp.pages || resp.page + 3;
                self.$nav.empty();
                for(var i = firstPage; i<= lastPage; i++){
                    self.$nav.append($(_.template($("#btn_template").html())({model: {key: i, page: i, enable: i != resp.page}})).click(function(event){
                        self.collections.fetch({data:{page: $(this).data('page'), perPage: 2}});
                    }));
                }
               
            }
            
            if(resp.total){
                self.$record.text('共' + resp.total + '条记录');
            }
           
           $(resp.data).each(function(index, model){
               var articleView = new ArticleRow({model: new Article(model)});
               articleView.render();
               
               self.$tbody.append(articleView.$el);
           });
           
       },
       events: {
            "click .add": "save",
            "dblclick" : "editfinished"
       },
       save: function(event){
           var self = this;
           
           this.collections.create({
               'title': this.$title.val(),
               'content': this.$content.val()
           }, {
               success: function(err, target){
                   self.collections.fetch();
               }
           });
       },
       editfinished: function(event){
           var self = this;
           $.each(this.collections.models, function(index, item){
                $(this).trigger("editfinished");
           });
       }
       
    });
    
    window.table = new TableView();
    
});