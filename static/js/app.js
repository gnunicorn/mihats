angular.module('app.services', ['ngResource', 'ui']).
  factory("Profile", function($resource){
    return $resource("api/v1/profile/:profileID", {});
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
       when('/:profileId', {controller:"ShowProfile", templateUrl:'tmpl/profile.tmpl'}).
       when('/:profileId/:editKey', {controller:"EditCtrl", templateUrl:'tmpl/edit.tmpl'}).
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
  controller ("ShowProfile", function($scope, Profile, $route) {
    $scope.profile = Profile.get({profileID: $route.current.params.profileId});

  }).
  controller ("HomeCtrl", function($scope, appState) {
    $scope.app_name = appState.app_name;
  }).
  controller ("MainCtrl", function ($scope, $location, appState) {
    appState.app_name = $scope.app_name = "miHats";
  });