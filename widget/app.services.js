'use strict';

(function (angular, buildfire) {
  angular.module('loyaltyPluginWidget')
    .provider('Buildfire', [function () {
      var Buildfire = this;
      Buildfire.$get = function () {
        return buildfire
      };
      return Buildfire;
    }])
    .factory('Location', [function () {
      var _location = window.location;
      return {
        goTo: function (path) {
          _location.href = path;
        }
      };
    }])
    .factory('ViewStack', ['$rootScope', function ($rootScope) {
      var views = [];
      var viewMap = {};
      return {
        push: function (view) {
          if (viewMap[view.template]) {
            this.pop();
          }
          else {
            viewMap[view.template] = 1;
            views.push(view);
            $rootScope.$broadcast('VIEW_CHANGED', 'PUSH', view);
          }
          return view;
        },
        pop: function () {
          $rootScope.$broadcast('BEFORE_POP', views[views.length - 1]);
          var view = views.pop();
          delete viewMap[view.template];
          $rootScope.$broadcast('VIEW_CHANGED', 'POP', view);
          return view;
        },
        hasViews: function () {
          return !!views.length;
        },
        getCurrentView: function () {
          return views.length && views[views.length - 1] || {};
        }
      };
    }])
    .factory('LoyaltyAPI', ['$q', 'STATUS_CODE', 'STATUS_MESSAGES', 'SERVER', '$http',
      function ($q, STATUS_CODE, STATUS_MESSAGES, SERVER, $http) {
        var addApplication = function (app) {
          var deferred = $q.defer();
          if (!app) {
            deferred.reject(new Error('Undefined app data'));
          }
          $http.post(SERVER.URL + '/api/loyaltyApp', {
            data: app
          }).success(function (response) {
            if (response.statusCode == 200)
              deferred.resolve(response);
            else
              deferred.resolve(null);
          })
            .error(function (error) {
              deferred.reject(error);
            });
          return deferred.promise;
        };

        var getApplication = function (id) {
          var deferred = $q.defer();
          if (!id) {
            deferred.reject(new Error('Undefined app id'));
          }
          $http.get(SERVER.URL + '/api/loyaltyApp/' + id).success(function (response) {
            if (response.statusCode == 200)
              deferred.resolve(response);
            else
              deferred.resolve(null);
          })
            .error(function (error) {
              deferred.reject(error);
            });
          return deferred.promise;
        };


        var getRewards = function (id) {
          var deferred = $q.defer();
          if (!id) {
            deferred.reject(new Error('Undefined app id'));
          }
          $http.get(SERVER.URL + '/api/loyaltyRewards/' + id).success(function (response) {
            if (response)
              deferred.resolve(response);
            else
              deferred.resolve(null);
          })
            .error(function (error) {
              deferred.reject(error);
            });
          return deferred.promise;
        };

        var getLoyaltyPoints = function (userId, userToken, loyaltyUnqiueId) {
          var deferred = $q.defer();
          if (!userId) {
            deferred.reject(new Error('Undefined user Id'));
          }
          $http.get(SERVER.URL + '/api/loyaltyUser/' + userId + '?userToken=' + userToken + '&loyaltyUnqiueId=' + loyaltyUnqiueId).success(function (response) {
            if (response)
              deferred.resolve(response);
            else
              deferred.resolve(null);
          })
            .error(function (error) {
              deferred.reject(error);
            });
          return deferred.promise;
        };

        var addLoyaltyPoints = function (userId, userToken, loyaltyUnqiueId, passcode, amount) {
          var deferred = $q.defer();
          if (!data) {
            deferred.reject(new Error('Undefined data'));
          }
          $http.get(SERVER.URL + '/api/loyaltyUserAddPoint/' + userId + '?userToken=' + userToken + '&loyaltyUnqiueId=' + loyaltyUnqiueId + '&redemptionPasscode=' + passcode + '&purchaseAmount=' + amount)
            .success(function (response) {
              if (response)
                deferred.resolve(response);
              else
                deferred.resolve(null);
            })
            .error(function (error) {
              deferred.reject(error);
            });
          return deferred.promise;
        };

        var validatePasscode = function (userToken, loyaltyUnqiueId, passcode) {
          var deferred = $q.defer();
          if (!data) {
            deferred.reject(new Error('Undefined data'));
          }
          $http.get(SERVER.URL + '/api/loyaltyUserAddPoint/' + loyaltyUnqiueId + '?userToken=' + userToken + '&redemptionPasscode=' + passcode)
            .success(function (response) {
              if (response)
                deferred.resolve(response);
              else
                deferred.resolve(null);
            })
            .error(function (error) {
              deferred.reject(error);
            });
          return deferred.promise;
        };


        return {
          getApplication: getApplication,
          getRewards: getRewards,
          getLoyaltyPoints: getLoyaltyPoints,
          addLoyaltyPoints: addLoyaltyPoints,
          validatePasscode: validatePasscode
        };
      }])
    .factory("DataStore", ['Buildfire', '$q', 'STATUS_CODE', 'STATUS_MESSAGES', function (Buildfire, $q, STATUS_CODE, STATUS_MESSAGES) {
      return {
        get: function (_tagName) {
          var deferred = $q.defer();
          Buildfire.datastore.get(_tagName, function (err, result) {
            if (err) {
              return deferred.reject(err);
            } else if (result) {
              return deferred.resolve(result);
            }
          });
          return deferred.promise;
        },
        save: function (_item, _tagName) {
          var deferred = $q.defer();
          if (typeof _item == 'undefined') {
            return deferred.reject(new Error({
              code: STATUS_CODE.UNDEFINED_DATA,
              message: STATUS_MESSAGES.UNDEFINED_DATA
            }));
          }
          Buildfire.datastore.save(_item, _tagName, function (err, result) {
            if (err) {
              return deferred.reject(err);
            } else if (result) {
              return deferred.resolve(result);
            }
          });
          return deferred.promise;
        },
        onUpdate: function () {
          var deferred = $q.defer();
          var onUpdateFn = Buildfire.datastore.onUpdate(function (event) {
            if (!event) {
              return deferred.notify(new Error({
                code: STATUS_CODE.UNDEFINED_DATA,
                message: STATUS_MESSAGES.UNDEFINED_DATA
              }), true);
            } else {
              return deferred.notify(event);
            }
          }, true);
          return deferred.promise;
        }
      }
    }])
})(window.angular, window.buildfire);