angular.module('starter.controllers', ['firebase'])

  .controller('DashCtrl', function ($scope, $cordovaGeolocation, $ionicPlatform, $ionicLoading, $ionicModal, $ionicSlideBoxDelegate, $filter, $state) {

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

    var posOptions = {timeout: 100000, enableHighAccuracy: false};

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


      //update location start
      // Create a Firebase reference where GeoFire will store its information
      var firebaseRef = firebase.database().ref();
      // Create a GeoFire index
      $scope.geoFire = new GeoFire(firebaseRef);
      var map = new google.maps.Map(document.getElementById("map"), mapOptions);
      if ($scope.user) {
        $scope.geoFire.set($scope.user.uid, [lat, long]).then(function () {
          console.log("Provided key has been added to GeoFire");
        }, function (error) {
          console.log("Error: " + error);
        });
      }
      else {
        $state.go('login')
      }
      //update location end

      /*$scope.currentLocation.addListener('click', function () {
       $state.go('firstChat')
       });*/

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

      //read map service 
      var geoQuery = $scope.geoFire.query({center: [lat, long], radius: 0.15})
      var onKeyEnteredRegistration = geoQuery.on("key_entered", function (key, location) {

        //for each near by user
        if($scope.user.uid != key){
          firebase.database().ref('/users/' + key).once('value').then(function (user) {
            var userDetails = user.val();
            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(location[0], location[1]),
              map: map,
              icon: {
                url: userDetails.photoURL,
                scaledSize: new google.maps.Size(38, 38),
                scale: 10
              },
              optimized: false
            })
            marker.addListener('click', function () { 
              $scope.openModal(userDetails); 
            });
          });
        }
      })
      var onReadyRegistration = geoQuery.on("ready", function () {
        geoQuery.cancel();
      })


    }, function (err) {
      $ionicLoading.hide();
      console.log(err);
    });


    //modal open
    $ionicModal.fromTemplateUrl('templates/user-detail.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });
    $scope.openModal = function (userDetails) {
      $scope.aImages = userDetails.photoURL;
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

    //get contacts list start
    var user = firebase.auth().currentUser;
    if (user) {
      firebase.database().ref('/users/' + user.uid).once('value').then(function (user) {
        var userDetails = user.val();
        if (userDetails.contacts) {
          $scope.chats = userDetails.contacts;
        }
        else {
          $scope.chats = [];
        }
      });

    }

    $scope.remove = function (chat) {
      Chats.remove(chat);
    };
  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, $state) {

    //dom start
    var messageList = document.getElementById('messageList');
    var messageText = document.getElementById('messageText');
    //dom end

    $scope.user = firebase.auth().currentUser;

    var messagesRef = firebase.database().ref('messages');
    // Make sure we remove all previous listeners.
    messagesRef.off();

    $scope.gotoChats = function () {
      console.log("called")
      $state.go('tab.chats')
    }

    // Saves a new message on the Firebase DB.
    $scope.saveMessage = function (message) {
      // Add a new message entry to the Firebase Database.
      if (message) {
        console.log(message.text)
        messagesRef.push({
          name: $scope.user.displayName,
          text: message.text,
          timestamp: new Date().getTime()
        }).then(function () {
          // Clear message text field and SEND button state.
          console.log("sent")
          messageText.value = '';
        }.bind(this)).catch(function (error) {
          console.error('Error writing new message to Firebase Database', error);
        });
      }

    };

    var loadMessages = function () {
      // Loads the last 12 messages and listen for new ones.
      var setMessage = function (data) {
        var val = data.val();
        displayMessage(val.text, val.timestamp, val.imageUrl);
      }.bind(this);
      messagesRef.limitToLast(12).on('child_added', setMessage);
      messagesRef.limitToLast(12).on('child_changed', setMessage);
    };

    var MESSAGE_TEMPLATE =
      '<div class="msg">' +
      '<p></p>' +
      '</div>';

    var displayMessage = function (text, timestamp, imageUri) {

      console.log(timestamp)

      var container = document.createElement('li');
      container.innerHTML = MESSAGE_TEMPLATE;
      var pDiv = container.firstChild.firstChild;
      container.setAttribute('class', "self");
      messageList.appendChild(container);

      // If the message is text.
      if (text) {
        pDiv.textContent = text;
        // Replace all line breaks by <br>.
        pDiv.innerHTML = pDiv.innerHTML.replace(/\n/g, '<br>');
      } else if (imageUri) { // If the message is an image.
        var image = document.createElement('img');
        image.addEventListener('load', function () {
          messageList.scrollTop = messageList.scrollHeight;
        }.bind(this));
        //this.setImageUrl(imageUri, image);
        pDiv.innerHTML = '';
        pDiv.appendChild(image);
      }
      //add timestamp
      var timeElement = document.createElement('time');
      var date = new Date(timestamp);
      var hour = date.getHours() - (date.getHours() >= 12 ? 12 : 0);
      var period = date.getHours() >= 12 ? 'PM' : 'AM';

      timeElement.textContent = hour + ':' + date.getMinutes() + ' ' + period
      pDiv.appendChild(timeElement)
      // Show the card fading-in.
      setTimeout(function () {
        container.classList.add('visible')
      }, 1);
      container.scrollTop = container.scrollHeight;
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
      firebase.auth().getRedirectResult().then(function (result) {

        console.log("result", result)
        if (result.credential) {
          // This gives you a Facebook Access Token. You can use it to access the Facebook API.
          var token = result.credential.accessToken;
          // ...
        }
        // The signed-in user info.
        var user = result.user;
        if (user) {
          // User signed in!
          var uid = user.uid;
          console.log(user)
          firebase.database().ref('users/' + user.uid).set({
            displayName: user.displayName,
            photoURL: user.photoURL,
            contacts: [],
            status: "active"
          });

          $state.go('tab.dash')
        } else {
          // User logged out
          console.log("User logged out")
          $state.go('login')
        }
      }).catch(function (error) {
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
    auth.onAuthStateChanged(function (user) {

      if (user) {
        $state.go('tab.dash')
      } else {
        // User logged out
        console.log("User logged out")
        $state.go('login')
      }
    });

  })

  .controller('AccountCtrl', function ($scope, $state) {
    $scope.settings = {
      enableFriends: true
    };

    $scope.logout = function () {
      firebase.auth().signOut().then(function () {
        // Sign-out successful.
        $state.go('login')
      }, function (error) {
        // An error happened.
      });
    }

  });
