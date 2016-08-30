angular.module('starter.controllers', [])

  .controller('DashCtrl', function ($scope, $cordovaGeolocation, $ionicPlatform, $ionicLoading, $ionicModal, $ionicSlideBoxDelegate, MapCtrl) {

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
        zoom: 17,
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
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: ['polygon']
        }
      });
      drawingManager.setMap(map);
      map.setOptions({draggable: true, zoomControl: true});
      $scope.map = map;
      $ionicLoading.hide();

    }, function(err) {
      $ionicLoading.hide();
      console.log(err);
    });

    var watchOptions = {
      timeout : 10000,
      enableHighAccuracy: false // may cause errors if true
    };
    var watch = $cordovaGeolocation.watchPosition(watchOptions);
    watch.then(
      null,
      function(err) {
        // error
        console.log('error in watch');
        console.log('code: '    + err.code    + '\n' +
          'message: ' + err.message + '\n');
      },
      function(position) {
        var lat  = position.coords.latitude
        var long = position.coords.longitude
        var newPosition = new google.maps.LatLng(lat, long)
        $scope.currentLocation.setPosition(newPosition);
        $scope.map.setCenter(newPosition)

        // Add circle overlay and bind to marker
        var circle = new google.maps.Circle({
          map: $scope.map,
          radius: 100,    // 10 miles in metres
          fillColor: '#ADD8E6',
          strokeOpacity: 0.3,
          strokeWeight: 1
        });
        circle.bindTo('center', $scope.currentLocation, 'position');

        //read map service
        MapCtrl.getNearByPeople().success(function(response){
          angular.forEach(response, function (res, index) {
            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(res.location.latitude, res.location.longitude),
              map: $scope.map,
              icon: {
                url: res.face,
                scaledSize : new google.maps.Size(32, 32),
                scale: 10
              },
              optimized:false
            });

            marker.addListener('click', function() {
              //show images
              $scope.aImages = res.allImages;
              $scope.openModal();
            });
          });
        })

        var myoverlay = new google.maps.OverlayView();
        myoverlay.draw = function () {
          this.getPanes().markerLayer.id='markerLayer';
        };
        myoverlay.setMap($scope.map);

      });
    $cordovaGeolocation.clearWatch(watch)

    //modal open
    $ionicModal.fromTemplateUrl('templates/user-detail.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
    $scope.openModal = function() {
      $scope.modal.show();
      $ionicSlideBoxDelegate.slide(0);
    };
    $scope.closeModal = function() {
      $scope.modal.hide();
    };

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
