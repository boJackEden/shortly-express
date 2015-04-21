Shortly.Router = Backbone.Router.extend({
  initialize: function(options){
    this.$el = options.el;
  },

  routes: {
    '':       'index',
    'create': 'create',
    'signup': 'signup'
  },

  swapView: function(view){
    this.$el.html(view.render().el);
  },

  index: function(){
    console.log('index');
    var links = new Shortly.Links();
    var linksView = new Shortly.LinksView({ collection: links });
    this.swapView(linksView);
  },

  create: function(){
    console.log('create');
    this.swapView(new Shortly.createLinkView());
  },

  signup: function(){
    console.log('signup');
    //this.$el.html()
    // this.swapView(new Shortly.SignupView());
    $.ajax({
      type: 'POST',
      url: 'signup',
    });
  }
});
