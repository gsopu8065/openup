angular.module('starter.controllers', ['firebase'])

  .controller('DashCtrl', function ($scope, $cordovaGeolocation, $ionicPlatform, $ionicLoading, $ionicModal, $ionicSlideBoxDelegate, $filter, MapCtrl, $state) {

    var googleMapStyles = [{
      "featureType": "landscape.natural",
      "elementType": "geometry.fill",
      "stylers": [{"visibility": "on"}, {"color": "#e0efef"}]
    }, {
      "featureType": "poi",
      "elementType": "geometry.fill",
      "stylers": [{"visibility": "on"}, {"hue": "#1900ff"}, {"color": "#c0e8e8"}]
    }, {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{"lightness": 100}, {"visibility": "simplified"}]
    }, {
      "featureType": "road",
      "elementType": "labels",
      "stylers": [{"visibility": "off"}]
    }, {
      "featureType": "transit.line",
      "elementType": "geometry",
      "stylers": [{"visibility": "on"}, {"lightness": 700}]
    }, {"featureType": "water", "elementType": "all", "stylers": [{"color": "#7dcdcd"}]}]

    $ionicLoading.show({
      template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring location!'
    });

    var posOptions = {timeout: 10000, enableHighAccuracy: false};

    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
      var lat = position.coords.latitude;
      var long = position.coords.longitude;
      var myLatlng = new google.maps.LatLng(lat, long);

      var mapOptions = {
        center: myLatlng,
        zoom: 17,
        disableDefaultUI: true,
        styles: googleMapStyles,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      //facebook profile info get start
      $scope.user = firebase.auth().currentUser;
      //facebook profile info get end


      var map = new google.maps.Map(document.getElementById("map"), mapOptions);
      $scope.currentLocation = new google.maps.Marker({
        position: myLatlng,
        map: map,
        icon: {
          url: $scope.user.photoURL,
          scaledSize: new google.maps.Size(38, 38),
          scale: 10
        },
        optimized: false
      });

      $scope.currentLocation.addListener('click', function () {
        $state.go('tab.chat-detail')
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

      //draw circle
      $scope.circle = new google.maps.Circle({
        map: map,
        radius: 150,  // IN METERS.
        fillColor: '#80dfff',
        fillOpacity: 0.3,
        strokeColor: "#FFF",
        strokeWeight: 0,
        center: myLatlng
      });

      //overlay css for marker
      var myoverlay = new google.maps.OverlayView();
      myoverlay.draw = function () {
        this.getPanes().markerLayer.id = 'markerLayer';
      };
      myoverlay.setMap($scope.map);

    }, function (err) {
      $ionicLoading.hide();
      console.log(err);
    });

    var watchOptions = {
      timeout: 10000,
      enableHighAccuracy: false // may cause errors if true
    };


    //commment for a while
    /*var watch = $cordovaGeolocation.watchPosition(watchOptions);
    $scope.nearByPeople = [];
    watch.then(
      null,
      function (err) {
        // error
        console.log('error in watch');
        console.log('code: ' + err.code + '\n' +
          'message: ' + err.message + '\n');
      },
      function (position) {
        var lat = position.coords.latitude
        var long = position.coords.longitude
        var newPosition = new google.maps.LatLng(lat, long)
        if ($scope.currentLocation.getPosition().lat().toFixed(4) != newPosition.lat().toFixed(4) || $scope.currentLocation.getPosition().lng().toFixed(4) != newPosition.lng().toFixed(4)) {
          $scope.currentLocation.setPosition(newPosition);
          $scope.map.setCenter(newPosition)
          $scope.circle.setCenter(newPosition)
        }

        //read map service
        MapCtrl.getNearByPeople().success(function (response) {
          //update nearby people location
          var newList = []
          angular.forEach(response, function (res, index) {
            var result_find = $filter('filter')($scope.nearByPeople, {id: res.id});
            if (result_find.length == 0) {
              newList.push(res)
            }
            else {

              result_find[0].marker.setPosition(new google.maps.LatLng(res.location.latitude, res.location.longitude))
            }
          });

          //delete outside users
          angular.forEach($scope.nearByPeople, function (res, index) {
            var result_find = $filter('filter')(response, {id: res.id});
            if (result_find.length == 0) {
              $scope.nearByPeople[index].marker.setMap(null);
            }
          });

          angular.forEach(newList, function (res, index) {
            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(res.location.latitude, res.location.longitude),
              map: $scope.map,
              icon: {
                url: res.face,
                scaledSize: new google.maps.Size(32, 32),
                scale: 10
              },
              optimized: false
            });

            marker.addListener('click', function () {
              //show images
              $scope.aImages = res.allImages;
              $scope.openModal();
            });
            $scope.nearByPeople.push({id: res.id, marker: marker})
          });
        })

      });*/
    //$cordovaGeolocation.clearWatch(watch)

    //modal open
    $ionicModal.fromTemplateUrl('templates/user-detail.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });
    $scope.openModal = function () {
      $scope.modal.show();
      $ionicSlideBoxDelegate.slide(0);
    };
    $scope.closeModal = function () {
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
    $scope.user = firebase.auth().currentUser;


    var messagesRef = firebase.database().ref('messages');
    // Make sure we remove all previous listeners.
    messagesRef.off();

    // Saves a new message on the Firebase DB.
    $scope.saveMessage = function(message) {
      // Add a new message entry to the Firebase Database.
      console.log(message.text)
       messagesRef.push({
          name: $scope.user.displayName,
          text: message.text,
          photoUrl: $scope.user.photoURL || '/images/profile_placeholder.png'
        }).then(function() {
          // Clear message text field and SEND button state.
          console.log("sent")

        }.bind(this)).catch(function(error) {
          console.error('Error writing new message to Firebase Database', error);
        });

    };

    var messageList = document.getElementById('messages');
    var loadMessages = function() {
      // Loads the last 12 messages and listen for new ones.
      var setMessage = function(data) {
        var val = data.val();
        displayMessage(data.key, val.name, val.text, val.imageUrl);
      }.bind(this);
      messagesRef.limitToLast(12).on('child_added', setMessage);
      messagesRef.limitToLast(12).on('child_changed', setMessage);
    };

    var MESSAGE_TEMPLATE =
      '<div class="message-container">' +
      '<div class="message"></div>' +
      '</div>';

    var displayMessage = function(key, name, text, imageUri) {
      var div = document.getElementById(key);
      // If an element for that message does not exists yet we create it.
      if (!div) {
        var container = document.createElement('div');
        container.innerHTML = MESSAGE_TEMPLATE;
        div = container.firstChild;
        div.setAttribute('id', key);
        messageList.appendChild(div);
      }
      var messageElement = div.querySelector('.message');
      if (text) { // If the message is text.
        messageElement.textContent = text;
        // Replace all line breaks by <br>.
        messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
      } else if (imageUri) { // If the message is an image.
        var image = document.createElement('img');
        image.addEventListener('load', function() {
          messageList.scrollTop = messageList.scrollHeight;
        }.bind(this));
        //this.setImageUrl(imageUri, image);
        messageElement.innerHTML = '';
        messageElement.appendChild(image);
      }
      // Show the card fading-in.
      setTimeout(function() {div.classList.add('visible')}, 1);
      messageList.scrollTop = messageList.scrollHeight;
    };

    //load messages
    loadMessages()

  })

  .controller('LoginCtrl', function ($scope, $stateParams, $firebaseAuth, $state) {

    var provider = new firebase.auth.FacebookAuthProvider();
    var auth = firebase.auth();
    console.log("init donne")

    $scope.login = function () {
      console.log("login called")
      //web
      /*auth.signInWithPopup(provider).then(function(result) {
        var token = result.credential.accessToken;
        var user = result.user;
        console.log(user);
        $state.go('tab.dash')
      }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
      });*/

      //app
      auth.signInWithRedirect(provider);
              console.log("login called2")
      firebase.auth().getRedirectResult().then(function(result) {

                                               console.log("result", result)
        if (result.credential) {
          // This gives you a Facebook Access Token. You can use it to access the Facebook API.
          var token = result.credential.accessToken;
          // ...
        }
        // The signed-in user info.
        var user = result.user;

        $state.go('tab.dash')
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
               console.log("error", error)
      });


    };

    //auto login
    auth.onAuthStateChanged(function(user) {
      if (user) {
        // User signed in!
        var uid = user.uid;
        console.log(user)
        $state.go('tab.dash')
      } else {
        // User logged out
        console.log("User logged out")
      }
    });

  })

  .controller('AccountCtrl', function ($scope, $state) {
    $scope.settings = {
      enableFriends: true
    };

    $scope.logout = function(){
      firebase.auth().signOut().then(function() {
        // Sign-out successful.
        $state.go('login')
      }, function(error) {
        // An error happened.
      });
    }

  });
