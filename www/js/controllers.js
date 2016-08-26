angular.module('starter.controllers', [])

  .controller('DashCtrl', function ($scope, $cordovaGeolocation, $ionicPlatform, $ionicLoading, MapCtrl) {

    var googleMapStyles = [{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#e0efef"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"hue":"#1900ff"},{"color":"#c0e8e8"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"visibility":"on"},{"lightness":700}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#7dcdcd"}]}]

    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring location!'
    });

    var posOptions = {timeout: 10000, enableHighAccuracy: false};

    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
      var lat  = position.coords.latitude;
      var long = position.coords.longitude;
      var myLatlng = new google.maps.LatLng(lat, long);

      var mapOptions = {
        center: myLatlng,
        zoom: 18,
        disableDefaultUI: true,
        styles: googleMapStyles,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      var map = new google.maps.Map(document.getElementById("map"), mapOptions);
      $scope.currentLocation = new google.maps.Marker({
        position: myLatlng,
        map: map
        /*icon: im*/
      });

      var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: ['polygon']
        }
      });
      drawingManager.setMap(map);
      map.setOptions({draggable: false, zoomControl: true});
      $scope.map = map;
      $ionicLoading.hide();

    }, function(err) {
      $ionicLoading.hide();
      console.log(err);
    });

    var watchOptions = {
      timeout : 3000,
      enableHighAccuracy: false // may cause errors if true
    };
    var watch = $cordovaGeolocation.watchPosition(watchOptions);
    watch.then(
      null,
      function(err) {
        // error
        console.log('error in watch');
        console.log('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
      },
      function(position) {
        var lat  = position.coords.latitude
        var long = position.coords.longitude
        var newPosition = new google.maps.LatLng(lat, long)
        $scope.currentLocation.setPosition(newPosition);
        $scope.map.setCenter(newPosition)

        //read map service
        var temp = new google.maps.Marker({
          position: new google.maps.LatLng(36.084319, -86.918210),
          map: $scope.map,
          icon: "img/ben.png",
          size: new google.maps.Size(20, 32)
        });
        MapCtrl.getNearByPeople().success(function(response){
          var temp = new google.maps.Marker({
            position: new google.maps.LatLng(response.location.latitude, response.location.longitude),
            map: $scope.map,
            icon: response.face
          });
          console.log(response.face)
        })

      });

    $cordovaGeolocation.clearWatch(watch)
  })

  .controller('ChatsCtrl', function ($scope, Chats) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
      Chats.remove(chat);
    };
  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
  })

  .controller('AccountCtrl', function ($scope) {
    $scope.settings = {
      enableFriends: true
    };
  });
