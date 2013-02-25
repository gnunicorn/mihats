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
    function make_image() {
      return $("<img src=''>").css({width: "auto", height: "auto",
                display: "none",
                position: "relative", outline: "none", border: "none"});
    }

    return {
      require: 'ngModel',
      link: function(scope, element, attr, ctrl) {
          // set up
          var $formerImg, $img, timer = false;

          $("body").css({height: "100%"});
          $(element).css({position: "fixed", left: 0, top: 0,
                overflow: "hidden", display: "block",
                "background-color": "#333333",
               "z-index": -999, height: "100%", width: "100%"});
          $(element).empty();

          function resizeNow() {
            if (!$img) return;
            var ratio = ($img.data('origHeight') / $img.data('origWidth')).toFixed(2),  // Define image ratio
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

          function load_image(val) {
            $img = make_image();
            $img.attr("src", val).load(function() {
                var $img = $(this);
                $img.data({'origWidth': $img.width(),
                           'origHeight': $img.height()});
                if($formerImg) {
                  var old = $formerImg;
                  old.fadeOut("fast", function() {
                    old.remove();
                  });
                }
                $img.fadeIn("slow", function() {
                  $formerImg = $img;
                });
                resizeNow();
            });
            $(element).prepend($img);
          }

          scope.$watch(attr.ngModel, function(val) {
            if (timer !== false) {
              clearInterval(timer);
              timer = false;
            }
            if (angular.isArray(val)) {
              if (val.length > 1){
                var idx = 1;
                console.log(attr.timeout);
                timer = setInterval(function() {
                  load_image(val[idx]);
                  idx += 1;
                  if (idx >= val.length) {
                    idx = 0;
                  }
                }, Number(attr.timeout || 5000));
                load_image(val[0]);
              } else {
                load_image(val[0]);
              }
            } else {
              load_image(val);
            }
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
        elm.editable($.extend({
          emptytext: "(empty)",
          "emptyclass": "",
          "unsavedclass": ""
        }, scope.$eval(attrs.editable)));
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
  service ('appState', function() {

  }).
  service('randomPicture', function(){
    var pictures = ["admirals.jpg", "catdog.jpg", "flickr-hats.jpg",
      "lucas.jpg", "nice_hat.jpg", "panama.jpg", "notafish.jpg",
      "notafish2.jpg"];

    return {
      shuffledPictures: function() {
        var res = $.map(pictures, function(item, idx) {
          return "/img/content/" + item;
        });

      for (var i = res.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = res[i];
          res[i] = res[j];
          res[j] = tmp;
        }
      return res;
      },
      getRandom: function() {
        return "/img/content/" +  pictures[Math.floor(Math.random()*pictures.length)];
      }
    };
  });

var crowdbetApp = angular.module('app', ["app.services"]).
  config(function($routeProvider) {
     $routeProvider.
       when('/', {controller:"HomeCtrl", templateUrl:'tmpl/home.tmpl'}).
       when('/changelog', {controller:"ChangesCtrl", templateUrl:'tmpl/changelog.tmpl'}).
       when('/:profileId', {controller:"ShowProfileCtrl", templateUrl:'tmpl/profile.tmpl'}).
       when('/:profileId/:editKey', {controller:"EditProfileCtrl", templateUrl:'tmpl/edit.tmpl'}).
      otherwise({redirectTo:'/'});
  }).
  controller ("AddCtrl", function($scope, $location) {
    $scope.createProfile = function() {

      $.post("/api/v1/profile/create", {profile_name:$scope.profileName, email:$scope.email},
        function(resp) {
          var profile = resp.result;
          if(profile)
            $scope.$apply(function () {
              $location.path("/" + profile.profile_name + "/" + profile.key);
            });
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

    var key = $route.current.params.editKey,
        ju = jerry.init("", "/api/v1/").signin($route.current.params.profileId);
    $scope.userCan = {};
    function updateCan() {
        $scope.userCan = ju.getCans(["customize_access", "edit_theme"]);
        if ($scope.profile.images) {
          $scope.userCan.add_image = ju.can("add_image", $scope.profile.images.length);
          $scope.userCan.add_hat = ju.can("add_hat", $scope.profile.current_hats.length + $scope.profile.former_hats.length);
        }
        console.log($scope.userCan);
    }
    ju.promise.then(function() {$scope.$apply(updateCan);});

    $scope.saveProfile = function saveProfile(){
      // key is removed every time after, so don't forget to transfer it
      $scope.profile.key = key;
      $scope.profile.$save();
      updateCan();
    };

    $scope.addItem = function(item, list) {
      if (!$scope[item]) return;
      $scope.profile[list].unshift($scope[item]);
      $scope[item] = null;
      $scope.saveProfile();
    };

    $scope.addHat = function(form) {
      $scope.profile[form + 's'].unshift($scope[form]);
      $scope[form] = {};
      $scope.saveProfile();
    };

    $scope.deleteItem = function(list, idx) {
      $scope.profile[list].splice(idx, 1);
      $scope.saveProfile();
    };
    $scope.switchItems = function(list, first_idx, second_idx) {
      var first = $scope.profile[list][first_idx];
      $scope.profile[list][first_idx] = $scope.profile[list][second_idx];
      $scope.profile[list][second_idx] = first;
      $scope.saveProfile();
    };

    $scope.profile = Profile.get({profile_name:$route.current.params.profileId},
      function() {
        $scope.profile.key = key;
        updateCan();
      });
  }).
  controller ("ShowProfileCtrl", function($scope, $rootScope, $route, randomPicture) {
    
    $.getJSON("/api/v1/profile/", {profile_name:$route.current.params.profileId},
        function(resp) {
          var profile = resp.result;
          if(profile){
            $scope.profile = profile;

            $rootScope.profileID = profile.profile_name;
            if(profile.images.length)
              $rootScope.background_image = profile.images;
            else
              $rootScope.background_image = randomPicture.getRandom();

            if(!$scope.$$phase){
              $scope.$digest();
            }
            if(!$rootScope.$$phase){
              $rootScope.$digest();
            }
          }
        });

  }).
  controller ("ChangesCtrl", function($scope, $rootScope, appState, randomPicture) {
      $rootScope.background_image = randomPicture.getRandom();
  }).
  controller ("HomeCtrl", function($scope, $rootScope, appState, randomPicture) {
    $scope.app_name = appState.app_name;
    $rootScope.background_image = randomPicture.shuffledPictures();
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