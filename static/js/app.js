angular.module('app.services', ['ngResource', 'ui']).
  factory("Profile", function($resource){
    return $resource("api/v1/profile/", {});
  }).
  filter("defaults", function() {
    return function(input, def) {
      return input || def;
    };
  }).
  directive("uniqueProfile", function($http) {
    return {
      //restrict: 'E',
      require: 'ngModel',
      link: function(scope, elem, attr, ctrl) {
        
        scope.$watch(attr.ngModel, function(value) {
          if (!value) {
            return;
          }
          if (value.length < 5) {
            ctrl.$setValidity('notLongEnough', false);
            return;
          }
          var toId;

          ctrl.$setValidity('notLongEnough', true);
          if(toId) clearTimeout(toId);

          toId = setTimeout(function(){
            toId = false;
            scope.checkingProfileName = true;
            scope.nameChecked = false;
            // call to some API that returns { isValid: true } or { isValid: false }
            $http.get('/api/v1/profile/exists?profile_name='+ value
              ).success(function(data) {
                scope.checkingProfileName = false;
                var res = false;
                if (data.result) {
                  res = true;
                }
                ctrl.$setValidity('notUniqueProfile', !res);
                if (!res) scope.nameChecked = "checked";
                if(!scope.$$phase) {
                  scope.$digest();
                }
            });
          }, 200);
        });
      }
    };
  }).
  directive('supersized', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attr, ctrl) {
        console.log(arguments);
          function resizeNow() {

          }

          scope.$watch(attr.ngModel, function(val) {
            if(!val) {
              $(element).hide();
              return;
            }
            $("img", element).attr("src", val).load(resizeNow);
            $(element).fadeIn("slow");
          });

          $(window).resize(function(){
            resizeNow();
          });

        }
      };
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
  service('appState', function(){

  });

var crowdbetApp = angular.module('app', ["app.services"]).
  config(function($routeProvider) {
     $routeProvider.
       when('/', {controller:"HomeCtrl", templateUrl:'tmpl/home.tmpl'}).
       when('/:profileId', {controller:"ShowProfileCtrl", templateUrl:'tmpl/profile.tmpl'}).
       when('/:profileId/:editKey', {controller:"EditProfileCtrl", templateUrl:'tmpl/edit.tmpl'}).
      otherwise({redirectTo:'/'});
  }).
  controller ("AddCtrl", function($scope, $location) {
    $scope.createProfile = function() {

      $.post("/api/v1/profile/create", {profile_name:$scope.profileName, email:$scope.email},
        function(resp) {
          var profile = resp.result;
          if(profile){
            $location.path("/" + profile.profile_name + "/" + profile.key);
            if(!$scope.$$phase){
              $scope.$digest();
            }
          }
          $scope.dismiss();
        });
    };
  }).
  controller ("EditModalCtrl", function($scope, $rootScope, $route) {

    $scope.unlocked = false;
    $rootScope.$watch("profileID", function(val){
      $scope.profileID = val;
    });

    $scope.checkEditable = function() {
      $.get("/api/v1/profile/can_edit", {profile_name: $scope.profileID,
            key:$scope.key}, function(resp) {
              $scope.unlocked = resp.result;
              if(!$scope.$$phase){
                $scope.$digest();
              }
      });
    };
  }).
  controller ("EditProfileCtrl", function($scope, Profile, $route) {
    $.getJSON("/api/v1/profile/", {profile_name:$route.current.params.profileId},
        function(resp) {
          var profile = resp.result;
          if(profile){
            $scope.profile = profile;
            if(!$scope.$$phase){
              $scope.$digest();
            }
          }
        });
  }).
  controller ("ShowProfileCtrl", function($scope, $rootScope, Profile, $route) {
    
    $.getJSON("/api/v1/profile/", {profile_name:$route.current.params.profileId},
        function(resp) {
          var profile = resp.result;
          if(profile){
            $scope.profile = profile;
            if(!$scope.$$phase){
              $scope.$digest();
            }
            $rootScope.profileID = profile.profile_name;
            $rootScope.background_image = profile.images[0];
            if(!$rootScope.$$phase){
              $rootScope.$digest();
            }
          }
        });

  }).
  controller ("HomeCtrl", function($scope, $rootScope, appState) {
    $scope.app_name = appState.app_name;
  }).
  controller ("MainCtrl", function ($scope, $location, appState, $rootScope, $route) {
    appState.app_name = $scope.app_name = "miHats";

    $scope.$on('$routeChangeSuccess', function() {
      //If this doesn't work, console.log $route.current to see how it's formatted
      if ($route.current.$route.controller == 'ShowProfileCtrl')
        $scope.showEdit = true;
      else {
        $scope.showEdit = false;
        $rootScope.background_image = null;
      }
        
    });
  });