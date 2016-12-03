angular.module('starter.services', [])

  .factory('Chats', function ($q) {
    var ChatsService = {};
    return ChatsService;
  })

  .factory('UserService', function ($q) {
    var UserService = {};

    UserService.updateUserProfile = function(profileInfo){

      var info = $q.defer();
      firebase.database().ref('users/' + profileInfo.id).update({
        displayName: profileInfo.name,
        photoURL: "http://graph.facebook.com/" + profileInfo.id + "/picture?type=large",
        token: profileInfo.id,
        status: "active"
      });
      info.resolve();
      return info.promise;
    }

    UserService.getUserProfile = function(userId){
      var info = $q.defer();
      firebase.database().ref('users/' + userId).once('value')
        .then(function (userQueryRes) {
          info.resolve(userQueryRes);
        })
      return info.promise;
    }

    return UserService;
  })

  .factory('UserGeoService', function () {

    var UserGeoService = {};

    var firebaseRef = firebase.database().ref();
    var geoFire = new GeoFire(firebaseRef);

    UserGeoService.saveUserLocation = function(userId, lat, long){
      return geoFire.set(userId, [lat, long]);
    }

    return UserGeoService
  })

  .factory('FacebookCtrl', function ($http, $q) {

    var FacebookCtrl = {};

    FacebookCtrl.getFacebookProfileInfo = function (authToken) {
      var info = $q.defer();

      facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authToken, ["public_profile"],
        function (response) {
          console.log(response);
          info.resolve(response);
        },
        function (response) {
          console.log(response);
          info.reject(response);
        }
      );
      return info.promise;
    };


    return FacebookCtrl;
  });
