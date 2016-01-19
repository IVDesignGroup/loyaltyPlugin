'use strict';

(function (angular, buildfire) {
  angular
    .module('loyaltyPluginWidget')
    .controller('WidgetHomeCtrl', ['$scope', 'ViewStack', 'LoyaltyAPI', 'STATUS_CODE', 'TAG_NAMES', 'LAYOUTS', 'DataStore', 'RewardCache', '$rootScope', '$sce', 'Context',
      function ($scope, ViewStack, LoyaltyAPI, STATUS_CODE, TAG_NAMES, LAYOUTS, DataStore, RewardCache, $rootScope, $sce, Context) {
        console.error('Loyalty----------WidgetHomeCtrl--------------------------Loaded----------------------------');

        var WidgetHome = this;

        $rootScope.deviceHeight = window.innerHeight;
        $rootScope.deviceWidth = window.innerWidth;
        $rootScope.itemListbackgroundImage = "";
        $rootScope.itemDetailsBackgroundImage = "";

        //create new instance of buildfire carousel viewer
        WidgetHome.view = null;

        WidgetHome.listeners = {};

        /**
         * Initialize current logged in user as null. This field is re-initialized if user is already logged in or user login user auth api.
         */
        WidgetHome.currentLoggedInUser = null;

        /**
         * Method to open a reward details page.
         */
        WidgetHome.openReward = function (reward) {
          RewardCache.setReward(reward);
          ViewStack.push({
            template: 'Item_Details',
            totalPoints: $rootScope.loyaltyPoints
          });
          buildfire.messaging.sendMessageToControl({
            type: 'OpenItem',
            data: reward
          });
        };

        /**
         * Method to fetch logged in user's loyalty points
         */
        WidgetHome.getLoyaltyPoints = function (userId) {
          var success = function (result) {
              console.error('Points>>>>>>>>>>>>>>>.---------------------------------------------------', result);
              $rootScope.loyaltyPoints = result.totalPoints;
            }
            , error = function (err) {
              if (err && err.code !== STATUS_CODE.NOT_FOUND) {
                console.error('Error while getting points data----------------------------------------', err);
              }
            };
          LoyaltyAPI.getLoyaltyPoints(userId, WidgetHome.currentLoggedInUser.userToken, WidgetHome.context.instanceId).then(success, error);
        };

        /**
         * Method to fetch loyalty application and list of rewards
         */
        WidgetHome.getApplicationAndRewards = function () {
          var successLoyaltyRewards = function (result) {
              WidgetHome.loyaltyRewards = result;
              if (!WidgetHome.loyaltyRewards)
                WidgetHome.loyaltyRewards = [];
              console.error('Rewards> got successfully>>>>>>>>>>>>>.:--------------------------------------', result);
            }
            , errorLoyaltyRewards = function (err) {
                console.error('Error while getting data loyaltyRewards--------------------------------------', err);
                if (err && err.code !== STATUS_CODE.NOT_FOUND) {
                console.error('Error while getting data loyaltyRewards--------------------------------------', err);
              }
            };
          var successApplication = function (result) {
            console.error('Successfully got application----------------------------------------------------------------------',result);
            if (result.image)
              WidgetHome.carouselImages = result.image;
            if (result.content && result.content.description)
              WidgetHome.description = result.content.description;
            RewardCache.setApplication(result);
          };

          var errorApplication = function (error) {
            console.error('Error fetching loyalty application---------------------------------------------------',error);
          };

          console.error("$$$$$$$$$$$$$$$$$$$$$$$---------------context----------------------------------------------", WidgetHome.context);
          LoyaltyAPI.getApplication(WidgetHome.context.instanceId).then(successApplication, errorApplication);
          LoyaltyAPI.getRewards(WidgetHome.context.instanceId).then(successLoyaltyRewards, errorLoyaltyRewards);
        };

        /**
         * Method to show amount page where user can fill in the amount they have made purchase of.
         */
        WidgetHome.openGetPoints = function () {
          console.log(">>>>>>>>>>>>>>-----------------------");
          if (WidgetHome.currentLoggedInUser) {
            ViewStack.push({
              template: 'Amount',
              loyaltyPoints: $rootScope.loyaltyPoints

            });
          }
          else {
            WidgetHome.openLogin();
          }
        };

        /**
         * Method to open buildfire auth login pop up and allow user to login using credentials.
         */
        WidgetHome.openLogin = function () {
          buildfire.auth.login({}, function () {

          });
        };

        /**
         * This event listener is bound for "POINTS_REDEEMED" event broadcast
         */
        WidgetHome.listeners['POINTS_REDEEMED'] = $rootScope.$on('POINTS_REDEEMED', function (e, points) {
          if (points)
            $rootScope.loyaltyPoints = $rootScope.loyaltyPoints - points;
        });

        /**
         * This event listener is bound for "POINTS_ADDED" event broadcast
         */
        WidgetHome.listeners['POINTS_ADDED'] = $rootScope.$on('POINTS_ADDED', function (e, points) {
          if (points)
            $rootScope.loyaltyPoints = $rootScope.loyaltyPoints + points;
        });

        /**
         * This event listener is bound for "REWARD_DELETED" event broadcast
         */
        WidgetHome.listeners['REWARD_DELETED'] = $rootScope.$on('REWARD_DELETED', function (e, index) {
          if (index != -1)
            WidgetHome.loyaltyRewards.splice(index, 1);
        });

        /**
         * This event listener is bound for "REWARDS_SORTED" event broadcast
         */
        WidgetHome.listeners['REWARDS_SORTED'] = $rootScope.$on('REWARDS_SORTED', function (e) {
          WidgetHome.getApplicationAndRewards();
        });

        /**
         * This event listener is bound for "Carousel:LOADED" event broadcast
         */
        WidgetHome.listeners['Carousel:LOADED'] = $rootScope.$on("Carousel:LOADED", function () {
          WidgetHome.view = null;
          if (!WidgetHome.view) {
            WidgetHome.view = new buildfire.components.carousel.view("#carousel", [], "WideScreen");
          }
          if (WidgetHome.carouselImages) {
            WidgetHome.view.loadItems(WidgetHome.carouselImages, null, "WideScreen");
          } else {
            WidgetHome.view.loadItems([]);
          }
        });

        /**
         * This event listener is bound for "REWARD_ADDED" event broadcast
         */
        WidgetHome.listeners['REWARD_ADDED'] = $rootScope.$on('REWARD_ADDED', function (e, item) {
          WidgetHome.loyaltyRewards.unshift(item);
        });

        /**
         * This event listener is bound for "GOTO_HOME" event broadcast
         */
        WidgetHome.listeners['GOTO_HOME'] = $rootScope.$on('GOTO_HOME', function (e) {
          WidgetHome.getApplicationAndRewards();
        });

        /**
         * This event listener is bound for "APPLICATION_UPDATED" event broadcast
         */
        WidgetHome.listeners['APPLICATION_UPDATED'] = $rootScope.$on('APPLICATION_UPDATED', function (e, app) {
          if (app.image) {
            WidgetHome.carouselImages = app.image;
            if (WidgetHome.view) {
              WidgetHome.view.loadItems(WidgetHome.carouselImages);
            }
          }
          if (app.content && app.content.description)
            WidgetHome.description = app.content.description;
          RewardCache.setApplication(app);
        });

        /**
         * This event listener is bound for "REFRESH_APP" event broadcast
         */
        WidgetHome.listeners['REFRESH_APP'] = $rootScope.$on('REFRESH_APP', function (e) {
          WidgetHome.getApplicationAndRewards();
        });

        WidgetHome.showDescription = function (description) {
          return !((description == '<p>&nbsp;<br></p>') || (description == '<p><br data-mce-bogus="1"></p>'));
        };

        /**
         * Method to parse and show description in html format
         */
        WidgetHome.safeHtml = function (html) {
          if (html)
            return $sce.trustAsHtml(html);
        };

        /*
         * Fetch user's data from datastore
         */

        var init = function () {
          var success = function (result) {
                console.error('Get Loyalty info -----from datastore--------------------------success---------------------------------------',result);
              WidgetHome.data = result.data;
              if (!WidgetHome.data.design)
                WidgetHome.data.design = {};
              if (!WidgetHome.data.settings)
                WidgetHome.data.settings = {};
              if (!WidgetHome.data.design.listLayout) {
                WidgetHome.data.design.listLayout = LAYOUTS.listLayout[0].name;
              }
              if (!WidgetHome.data.design.itemListbackgroundImage) {
                $rootScope.itemListbackgroundImage = "";
              } else {
                $rootScope.itemListbackgroundImage = WidgetHome.data.design.itemListbackgroundImage;
              }
              if (!WidgetHome.data.design.itemDetailsBackgroundImage) {
                $rootScope.itemDetailsBackgroundImage = "";
              } else {
                $rootScope.itemDetailsBackgroundImage = WidgetHome.data.design.itemDetailsBackgroundImage;
              }
            }
            , error = function (err) {
                WidgetHome.data={design:{listLayout:LAYOUTS.listLayout[0].name}};
              console.error('Error while getting data', err);
                console.error('Get Loyalty info -----from datastore---------Error-----------------------------------------------------------------------------------',err);
              };
          DataStore.get(TAG_NAMES.LOYALTY_INFO).then(success, error);
          WidgetHome.getApplicationAndRewards();
        };

        var loginCallback = function () {
          buildfire.auth.getCurrentUser(function (err, user) {
            console.log("_______________________", user);
            if (user) {
              WidgetHome.currentLoggedInUser = user;
              WidgetHome.getLoyaltyPoints(user._id);
              $scope.$digest();
            }
          });
        };

        var onUpdateCallback = function (event) {
          console.log("++++++++++++++++++++++++++", event);
          setTimeout(function () {
            if (event && event.tag) {
              switch (event.tag) {
                case TAG_NAMES.LOYALTY_INFO:
                  WidgetHome.data = event.data;
                  if (!WidgetHome.data.design)
                    WidgetHome.data.design = {};
                  if (!WidgetHome.data.design.listLayout) {
                    WidgetHome.data.design.listLayout = LAYOUTS.listLayout[0].name;
                  }
                  if (!WidgetHome.data.design.itemListbackgroundImage) {
                    $rootScope.itemListbackgroundImage = "";
                  } else {
                    $rootScope.itemListbackgroundImage = WidgetHome.data.design.itemListbackgroundImage;
                  }
                  if (!WidgetHome.data.design.itemDetailsBackgroundImage) {
                    $rootScope.itemDetailsBackgroundImage = "";
                  } else {
                    $rootScope.itemDetailsBackgroundImage = WidgetHome.data.design.itemDetailsBackgroundImage;
                  }
                  break;
              }
              $scope.$digest();
              $rootScope.$digest();
            }
          }, 0);
        };

        /**
         * DataStore.onUpdate() is bound to listen any changes in datastore
         */
        DataStore.onUpdate().then(null, null, onUpdateCallback);

        /**
         * onLogin() listens when user logins using buildfire.auth api.
         */
        buildfire.auth.onLogin(loginCallback);

        /**
         * Check for current logged in user, if yes fetch its loyalty points
         */
        buildfire.auth.getCurrentUser(function (err, user) {
          console.log("_______________________", user);
          if (user) {
            WidgetHome.currentLoggedInUser = user;
            if (!WidgetHome.context) {
              Context.getContext(function (ctx) {
                console.log('Context     ==============================================================',ctx);
                WidgetHome.context = ctx;
                WidgetHome.getLoyaltyPoints(WidgetHome.currentLoggedInUser._id);
                $scope.$digest();
              });
            } else {
              WidgetHome.getLoyaltyPoints(WidgetHome.currentLoggedInUser._id);
              $scope.$digest();
            }
          }
        });

        $scope.$on("$destroy", function () {
          console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>destroyed");
          for (var i in WidgetHome.listeners) {
            if (WidgetHome.listeners.hasOwnProperty(i)) {
              WidgetHome.listeners[i]();
            }
          }
        });

        Context.getContext(function (ctx) {
          WidgetHome.context = ctx;
          init();
        });

      }]);
})(window.angular, window.buildfire);

