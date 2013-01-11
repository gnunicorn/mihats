angular.module('crowdbet.services', ['ngResource', 'ui']).
  factory('App', function($resource){
    return $resource('/api/v1/my_apps/:appID', {appID: "@key"}, {
      get: {method:'GET', params: {"_raw": 1}, isArray:false},
      query: {method:'GET', params: {"_raw": 1}, isArray:true},
      save: {method:'POST', params: {"_raw": 1}, isArray:false}
    });
  }).
  directive('twModal', function() {
    return {
      scope: true,
      link: function(scope, element, attr, ctrl) {
          scope.show = function() {
            $(element).modal("show");
          };
          scope.dismiss = function() {
            $(element).modal("hide");
          };
          $(element).on("show", function(){
            scope.$emit("modalShow", arguments);
          });
          $(element).on("shown", function(){
            scope.$emit("modalShown", arguments);
          });
          $(element).on("hide", function(){
            scope.$emit("modalHide", arguments);
          });
          $(element).on("hidden", function(){
            scope.$emit("modalHidden", arguments);
          });
        }
      };
  }).
  directive('editable', function() {
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, model) {
        elm.editable(scope.$eval(attrs.editable));
        model.$render = function() {
            elm.editable('setValue', model.$viewValue);
        };
        elm.on('save', function(e, params) {
            model.$setViewValue(params.newValue);
            scope.$apply();
        });
        if (attrs.editableSaved) {
          elm.on('save', function(){
            scope.$eval(attrs.editableSaved);
           });
        }
      }
    };
  }).
  service('appState', function(App, Profile, $rootScope){
    var self = this;
    self.selected_app = null;
    self.profiles = null;

    self.selectApp = function(app) {
      if (!app.profiles) app.profiles = Profile.query({_key:app.key});
      self.selected_app = app;
      self.profiles = app.profiles;
    };

    self.addApp = function(app) {
      self.apps.push(app);
    };

    self.findApp = function(appId) {
      var app;
      $.each(self.apps, function(idx, item) {
        if (item.key == appId) {
          app = item;
          return false;
        }
      });
      return app;
    };

    self.findAndSelectApp = function(appId) {
      var app = self.findApp(appId);
      self.selectApp(app);
      return app;
    };

    self.apps = App.query(function() {
      // preselect first
      self.selectApp(self.apps[0]);
    });

    $rootScope.appState = self;
  });

var crowdbetApp = angular.module('console', ["console.services"]).
  config(function($routeProvider) {
     $routeProvider.
//       when('/', {controller:MainCtrl, templateUrl:'main.html'}).
// //      when('/edit/:projectId', {controller:EditCtrl, templateUrl:'detail.html'}).
// //      when('/new', {controller:CreateCtrl, templateUrl:'detail.html'}).
      otherwise({redirectTo:'/'});
  }).
  controller ("MainCrtl", function ($scope, $location, App, appState) {
    $scope.model = {};

    $scope.saveApp = function() {
      var newApp = new App({name: $scope.model.app_name});
      $scope.model.app_name = null;
      newApp.$save(function() {

        appState.addApp(newApp);
        $scope.dismiss();
        $location.path("/" +  newApp.key + "details/");
      });
    };
  });