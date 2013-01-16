angular.module('app.services', ['ngResource', 'ui']).
  factory("Profile", function($resource){
    return $resource("api/v1/profile/", {_raw:1});
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
  directive('autofit', function() {
    return {
      require: 'ngModel',
      link: function(scope, element, attr, ctrl) {

          // set up
          $("body").css({height: "100%"});
          $(element).css({position: "fixed", left: 0, top: 0, overflow: "hidden",
               "z-index": -999, height: "100%", width: "100%"});
          var $img = $("<img src=''>").css({width: "auto", height: "auto",
                position: "relative", outline: "none", border: "none"});
          $(element).empty().append($img);

          function resizeNow() {
            var ratio = ($img.data('origHeight')/$img.data('origWidth')).toFixed(2),  // Define image ratio
                browserwidth = $(window).width(),
                browserheight = $(window).height();

          
          /*-----Resize Image-----*/
            if ((browserheight/browserwidth) > ratio){
              $img.height(browserheight);
              $img.width(browserheight / ratio);
            } else {
              $img.width(browserwidth);
              $img.height(browserwidth * ratio);
            }
          }

          scope.$watch(attr.ngModel, function(val) {
            if(!val) {
              $(element).hide();
              return;
            }
            $img.attr("src", val).load(function() {
                var $img = $(this);
                $img.data({'origWidth': $img.width(),
                           'origHeight': $img.height()}).css('visibility','visible');
                resizeNow();
            });
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
      $scope.unlocked = $scope.errored = false;
      $scope.loading = true;
      $.get("/api/v1/profile/can_edit", {profile_name: $scope.profileID,
            key:$scope.key}, function(resp) {
              $scope.loading = false;
              $scope.unlocked = resp.result;
              
              if (!$scope.unlocked) {
                $scope.errored = true;
              }

              if(!$scope.$$phase){
                $scope.$digest();
              }
      });
    };
  }).
  controller ("EditProfileCtrl", function($scope, Profile, $route) {

    var key = $route.current.params.editKey;

    $scope.saveProfile = function saveProfile(){
      // key is removed every time after, so don't forget to transfer it
      $scope.profile.key = key;
      $scope.profile.$save();
    };

    $scope.addImage = function() {
      console.log($scope);
      $scope.profile.images.unshift($scope.newImage);
      $scope.newImage = null;
      $scope.saveProfile();
    };

    $scope.addHat = function(form) {
      $scope.profile[form + 's'].unshift($scope[form]);
      $scope[form] = {};
      $scope.saveProfile();
    };

    $scope.deleteItem = function(list, idx) {
      console.log(arguments);
      $scope.profile[list].splice(idx, 1);
      $scope.saveProfile();
    };
    $scope.switchItems = function(list, first_idx, second_idx) {
      console.log(arguments);
      var first = $scope.profile[list][first_idx];
      $scope.profile[list][first_idx] = $scope.profile[list][second_idx];
      $scope.profile[list][second_idx] = first;
      $scope.saveProfile();
    };

    $scope.profile = Profile.get({profile_name:$route.current.params.profileId},
      function() { $scope.profile.key = key; });
  }).
  controller ("ShowProfileCtrl", function($scope, $rootScope, $route) {
    
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